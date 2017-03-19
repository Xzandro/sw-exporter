const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs-extra');
const request = require('request');
const storage = require('electron-json-storage');
const _ = require('lodash');
const SWProxy = require('./proxy/SWProxy');

const path = require('path');
const url = require('url');

let win;
let defaultFilePath = path.join(app.getPath('desktop'), app.getName() + ' Files');
let defaultConfig = {
  Config: {
    App: { filesPath: defaultFilePath, debug: false },
    Proxy: { port: 8080 },
    Plugins: {}
  }
}
let defaultConfigDetails = {
  ConfigDetails: {
    App: { debug: { label: 'Show Debug Messages' } },
    Proxy: {},
    Plugins: {}
  }
}
global.plugins = [];

storage.getAll(function(error, data) {
  if (error) throw error;

  global.config = _.merge(defaultConfig, data);
  global.config.ConfigDetails = defaultConfigDetails.ConfigDetails;

  fs.ensureDirSync(global.config.Config.App.filesPath);

  global.plugins = loadPlugins();
});

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

const proxy = new SWProxy();

proxy.on('error', (e) => {
  console.log(e);
})

proxy.on('logupdated', (entry) => {
  win.webContents.send('logupdated', entry)
})

ipcMain.on('proxyIsRunning', (event, arg) => {
  event.returnValue = proxy.isRunning();
})

ipcMain.on('proxyGetInterfaces', (event, arg) => {
  event.returnValue = proxy.getInterfaces();
})

ipcMain.on('proxyStart', (event, arg) => {
  proxy.start(config.Config.Proxy.port);
})

ipcMain.on('proxyStop', (event, arg) => {
  proxy.stop();
})

ipcMain.on('logGetEntries', (event, arg) => {
  event.returnValue = proxy.getLogEntries();
})

ipcMain.on('updateConfig', (event, arg) => {
  storage.set('Config', config.Config, function(error) {
    if (error) throw error;
  });
})

ipcMain.on('getFolderLocations', (event, arg) => {
  event.returnValue = {
    settings: app.getPath('userData'),
    plugins: path.join(path.dirname(app.getPath('exe')), 'plugins') 
  };
})

function createWindow () {
  win = new BrowserWindow({
    minWidth: 800,
    minHeight: 600,
    acceptFirstMouse: true,
    autoHideMenuBar: true
  });
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
}

function initPlugins() {
  const pluginDir = path.join(path.dirname(app.getPath('exe')), 'plugins');

  // Check plugin folder existence
  fs.readdir(pluginDir, (error, files) => {
    if (error && error.code === 'ENOENT') {
      console.log(error)
      // Create the folder by copying default plugins
      fs.copy(path.join(__dirname, 'plugins'), pluginDir, err => {
        global.plugins = loadPlugins();
      });
    } else {
      global.plugins = loadPlugins();
    }
  });
}

function loadPlugins() {
  // Initialize Plugins
  let plugins = [];

  const pluginDir = path.join(__dirname, 'plugins');

  // Load each plugin module in the folder
  fs.readdirSync(pluginDir).forEach(function (file) {
    plugins.push(require(path.join(pluginDir, file)));
  });

  // Initialize plugins
  plugins.forEach(function(plug) {
    config.Config.Plugins[plug.pluginName] = _.merge(plug.defaultConfig, config.Config.Plugins[plug.pluginName]);
    config.ConfigDetails.Plugins[plug.pluginName] = plug.defaultConfigDetails || {};
    plug.init(proxy, config, request);
  })

  return plugins;
}
