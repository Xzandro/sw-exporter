const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const ncp = require('ncp').ncp;
const request = require('request');
const storage = require('electron-json-storage');
const _ = require('lodash');
const SWProxy = require('./proxy/SWProxy');

const path = require('path');
const url = require('url');

let win;
let defaultConfig = {
  Config: {
    App: {},
    Proxy: { port: 8080 },
    Plugins: {}
  }
}
global.plugins = [];

storage.getAll(function(error, data) {
  if (error) throw error;

  let merged = _.merge(defaultConfig, data);
  global.config = merged.Config;
  initPlugins();
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
  proxy.start(config.Proxy.port);
})

ipcMain.on('proxyStop', (event, arg) => {
  proxy.stop();
})

ipcMain.on('logGetEntries', (event, arg) => {
  event.returnValue = proxy.getLogEntries();
})

ipcMain.on('updateConfig', (event, arg) => {
  storage.set('Config', config, function(error) {
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
    autoHideMenuBar: true,
    titleBarStyle: 'hidden-inset'
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
      ncp(path.join(__dirname, 'plugins'), pluginDir, err => {
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

  const pluginDir = path.join(path.dirname(app.getPath('exe')), 'plugins');

  // Load each plugin module in the folder
  fs.readdirSync(pluginDir).forEach(function (file) {
    plugins.push(require(path.join(pluginDir, file)));
  });

  // Initialize plugins
  plugins.forEach(function(plug) {
    config.Plugins[plug.pluginName] = _.merge(plug.defaultConfig, config.Plugins[plug.pluginName]);
    plug.init(proxy, config.Plugins[plug.pluginName], request);
  })

  return plugins;
}
