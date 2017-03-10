const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const ncp = require('ncp').ncp;
const path = require('path');
const SWProxy = require('./proxy/SWProxy');

let win;
const proxy = new SWProxy();

app.on('ready', () => {
  createWindow();
  win.webContents.openDevTools();
  var plugins = loadPlugins();
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

proxy.on('error', (e) => {
  console.log(e);
})

proxy.on('logupdated', (entry) => {
  win.webContents.send('logupdated', entry)
})

ipcMain.on('proxyIsRunning', (event, arg) => {
  event.returnValue = proxy.isRunning();
})

ipcMain.on('proxyStart', (event, arg) => {
  proxy.start();
})

ipcMain.on('proxyStop', (event, arg) => {
  proxy.stop();
})

function createWindow () {
  win = new BrowserWindow({
    minWidth: 640,
    minHeight: 480,
    acceptFirstMouse: true,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden-inset'
  });
  win.loadURL(`file://${__dirname}/index.html`);
}

function loadPlugins() {
  // Initialize Plugins
  let plugins = [];
  const pluginDir = path.join(path.dirname(app.getPath('exe')), 'plugins');

  // Check plugin folder existence
  try {
    fs.readdirSync(pluginDir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Create the folder by copying default plugins
      ncp(path.join(__dirname, 'plugins'), pluginDir, err => {
        console.error(err);
      });
    } else {
      throw(err);
    }
  }

  // Load each plugin module in the folder
  fs.readdirSync(pluginDir).forEach(function (file) {
    plugins.push(require(path.join(pluginDir, file)));
  });

  // Initialize plugins
  plugins.forEach(function(plug) {
    plug.init(proxy);
  })
}
