const electron = require('electron');
const {
    app,
    BrowserWindow,
    ipcMain, 
    Menu, 
    shell
} = electron;
const fs = require('fs-extra');
const storage = require('electron-json-storage');
const _ = require('lodash');
const SWProxy = require('./proxy/SWProxy');
const path = require('path');
const url = require('url');
global.gMapping = require('./mapping');
global.win;
let defaultFilePath = path.join(app.getPath('desktop'), app.getName() + ' Files');
let template = [{
  label: 'Window',
  role: 'window',
  submenu: [{
    label: 'Minimize',
    accelerator: 'CmdOrCtrl+M',
    role: 'minimize'
  }]
}, {
  label: 'Help',
  role: 'help',
  submenu: [{
    label: "Summoner's War Exporter GitHub",
    click: function () {
      shell.openExternal('https://github.com/Xzandro/sw-exporter')
    }
  }]
}]

function findReopenMenuItem () {
  const menu = Menu.getApplicationMenu()
  if (!menu) return

  let reopenMenuItem
  menu.items.forEach(function (item) {
    if (item.submenu) {
      item.submenu.items.forEach(function (item) {
        if (item.key === 'reopenMenuItem') {
          reopenMenuItem = item
        }
      })
    }
  })
  return reopenMenuItem
}

if (process.platform === 'darwin') {
  const name = app.getName()
  template.unshift({
    label: name,
    submenu: [{
      label: `About ${name}`,
      role: 'about'
    }, {
      type: 'separator'
    }, {
      label: `Hide ${name}`,
      accelerator: 'Command+H',
      role: 'hide'
    }, {
      label: 'Hide Others',
      accelerator: 'Command+Alt+H',
      role: 'hideothers'
    }, {
      label: 'Show All',
      role: 'unhide'
    }, {
      type: 'separator'
    }, {
      label: 'Quit',
      accelerator: 'Command+Q',
      click: function () {
        app.quit();
      }
    }]
  });

}

let defaultConfig = {
    Config: {
        App: {
            filesPath: defaultFilePath,
            debug: false,
            clearLogOnLogin: false
        },
        Proxy: {
            port: 8080,
            autoStart: false
        },
        Plugins: {}
    }
}
let defaultConfigDetails = {
    ConfigDetails: {
        App: {
            debug: {
                label: 'Show Debug Messages'
            },
            clearLogOnLogin: {
                label: 'Clear Log on every login'
            }
        },
        Proxy: {
            autoStart: {
                label: 'Start proxy automatically'
            }
        },
        Plugins: {}
    }
}
global.plugins = [];
app.on('ready', () => {
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
    createWindow();
    storage.getAll(function(error, data) {
        if (error) throw error;
        global.config = _.merge(defaultConfig, data);
        global.config.ConfigDetails = defaultConfigDetails.ConfigDetails;
        fs.ensureDirSync(global.config.Config.App.filesPath);
        global.plugins = loadPlugins();
        if (global.config.Config.Proxy.autoStart) {
            proxy.start(config.Config.Proxy.port);
        }
    });
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
function createWindow() {
    win = new BrowserWindow({
        minWidth: 800,
        minHeight: 600,
        acceptFirstMouse: true,
        autoHideMenuBar: true
    });
    global.mainWindowId = win.id;
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));
    win.webContents.on('new-window', (e, url) => {
        e.preventDefault();
        app.shell.openExternal(url);
    })
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
    fs.readdirSync(pluginDir).forEach(function(file) {
        plugins.push(require(path.join(pluginDir, file)));
    });
    // Initialize plugins
    plugins.forEach(function(plug) {
        config.Config.Plugins[plug.pluginName] = _.merge(plug.defaultConfig, config.Config.Plugins[plug.pluginName]);
        config.ConfigDetails.Plugins[plug.pluginName] = plug.defaultConfigDetails || {};
        plug.init(proxy, config);
    })
    return plugins;
}


