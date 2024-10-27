const { app, BrowserWindow, dialog, ipcMain, Menu, shell, Tray } = require('electron');
require('@electron/remote/main').initialize();
const { createHash } = require('crypto');
const { EOL } = require('os');
const fs = require('fs-extra');
const storage = require('electron-json-storage');
const windowStateKeeper = require('electron-window-state');
const _ = require('lodash');
const axios = require('axios');
const { object, string, number, date } = require('yup');
const { parse } = require('yaml');
const { validate, compare } = require('compare-versions');
const SWProxy = require('./proxy/SWProxy');
const transparentProxy = require('./steamproxy/transparent_proxy');
const proxy = new SWProxy(transparentProxy);

const path = require('path');
const url = require('url');

const iconPath = path.join(process.resourcesPath, 'icon.ico');

let pluginVersionSchema = object({
  version: string().required(),
  file: string().required(),
  url: string().url().required(),
  sha512: string().required(),
  size: number().required().positive().integer(),
  releaseDate: date().required(),
});

global.gMapping = require('./mapping');
global.appVersion = app.getVersion();

let defaultFilePath = path.join(app.getPath('desktop'), `${app.name} Files`);
let defaultConfig = {
  Config: {
    App: {
      filesPath: defaultFilePath,
      debug: false,
      clearLogOnLogin: false,
      maxLogEntries: 100,
      httpsMode: true,
      minimizeToTray: false,
      autoUpdatePlugins: true,
    },
    Proxy: { port: 8080, autoStart: false, steamMode: false },
    Plugins: {},
  },
};
let defaultConfigDetails = {
  ConfigDetails: {
    App: {
      debug: { label: 'Show Debug Messages' },
      clearLogOnLogin: { label: 'Clear Log on every login' },
      maxLogEntries: { label: 'Maximum amount of log entries.' },
      httpsMode: { label: 'HTTPS mode' },
      minimizeToTray: { label: 'Minimize to System Tray' },
      autoUpdatePlugins: { label: 'Auto update plugins (if supported)' },
    },
    Proxy: { autoStart: { label: 'Start proxy automatically' }, steamMode: { label: 'Steam Mode' } },
    Plugins: {},
  },
};

const updatedPluginsFolder = path.join(app.getPath('temp'), 'SWEX', 'plugins');

let quitting = false;

function createWindow() {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 800,
    defaultHeight: 600,
  });

  global.win = new BrowserWindow({
    minWidth: 800,
    minHeight: 600,
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    acceptFirstMouse: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      // TODO: remote will be removed with electron 13, so this should be migrated to ipcRenderer.invoke at some point
      enableRemoteModule: true,
      contextIsolation: false,
    },
  });

  global.mainWindowId = win.id;

  function restoreWindowFromSystemTray() {
    global.win.show();
    if (bounds) {
      global.win.setBounds(bounds);
      bounds = undefined;
    }
  }

  let appIcon = null;
  let bounds = undefined;
  app.whenReady().then(() => {
    const iconExists = fs.existsSync(iconPath);
    appIcon = new Tray(iconExists ? iconPath : './build/icon.ico');
    appIcon.on('double-click', restoreWindowFromSystemTray);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show',
        click: restoreWindowFromSystemTray,
      },
      {
        label: 'Quit',
        click: function () {
          app.quit();
        },
      },
    ]);

    appIcon.setContextMenu(contextMenu);
  });

  global.win.on('minimize', function (event) {
    if (!config.Config.App.minimizeToTray) return;

    event.preventDefault();
    bounds = global.win.getBounds();
    global.win.hide();
  });

  win.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true,
    })
  );

  mainWindowState.manage(win);

  require('@electron/remote/main').enable(win.webContents);

  win.webContents.on('new-window', (e, link) => {
    e.preventDefault();
    shell.openExternal(link);
  });
}

proxy.on('error', () => {});

ipcMain.on('proxyIsRunning', (event) => {
  event.returnValue = proxy.isRunning();
});

ipcMain.on('proxyGetInterfaces', (event) => {
  event.returnValue = proxy.getInterfaces();
});

ipcMain.on('proxyStart', (event, steamMode) => {
  proxy.start(config.Config.Proxy.port, steamMode);
  if (steamMode !== config.Config.Proxy.steamMode) {
    config.Config.Proxy.steamMode = steamMode;
    storage.set('Config', config.Config, (error) => {
      if (error) throw error;

      win.webContents.send('steamModeChanged', steamMode);
    });
  }
});

ipcMain.on('proxyStop', () => {
  proxy.stop();
});

ipcMain.on('getCert', async () => {
  await proxy.copyPemCertToPublic();
});

ipcMain.on('getAndInstallCertSteam', async () => {
  const certPath = await proxy.copyPkcs12CertToPublic();
  await shell.openPath(certPath);
});

ipcMain.on('reGenCert', async () => {
  await proxy.reGenCert();
});

ipcMain.on('logGetEntries', (event) => {
  event.returnValue = proxy.getLogEntries();
});

ipcMain.on('updateConfig', () => {
  storage.set('Config', config.Config, (error) => {
    if (error) throw error;
  });
});

ipcMain.on('getFolderLocations', (event) => {
  event.returnValue = {
    settings: app.getPath('userData'),
  };
});

global.plugins = [];

function loadPlugins() {
  // Initialize Plugins
  let plugins = [];

  const pluginDirs = [path.join(__dirname, 'plugins'), path.join(global.config.Config.App.filesPath, 'plugins')];

  // Load each plugin module in the folder
  pluginDirs.forEach((dir) => {
    const filteredPlugins = fs.readdirSync(dir).filter((item) => !/(^|\/)\.[^\/\.]/g.test(item));
    filteredPlugins.forEach((file) => {
      const plug = require(path.join(dir, file));

      // Check plugin for correct shape
      if (plug.defaultConfig && plug.pluginName && plug.pluginDescription && typeof plug.init === 'function') {
        plugins.push(plug);
      } else {
        proxy.log({
          type: 'error',
          source: 'proxy',
          message: `Invalid plugin ${file}. Missing one or more required module exports.`,
        });
      }
    });
  });

  // Initialize plugins
  plugins.forEach((plug) => {
    // try to parse JSON for textareas
    config.Config.Plugins[plug.pluginName] = _.merge(plug.defaultConfig, config.Config.Plugins[plug.pluginName]);
    Object.entries(config.Config.Plugins[plug.pluginName]).forEach(([key, value]) => {
      if (
        plug.defaultConfigDetails &&
        plug.defaultConfigDetails[key] &&
        plug.defaultConfigDetails[key].type &&
        plug.defaultConfigDetails[key].type === 'textarea'
      ) {
        try {
          const parsedValue = JSON.parse(value);
          config.Config.Plugins[plug.pluginName][key] = parsedValue;
        } catch (error) {
          // JSON parsing didn't work, do nothing
        }
      }
    });
    config.ConfigDetails.Plugins[plug.pluginName] = plug.defaultConfigDetails || {};
    try {
      plug.init(proxy, config);
    } catch (error) {
      proxy.log({
        type: 'error',
        source: 'proxy',
        message: `Error initializing ${plug.pluginName}: ${error.message}`,
      });
    }
  });

  return plugins;
}

async function updatePlugins(plugins) {
  if (!global.config.Config.App.autoUpdatePlugins) {
    return;
  }

  const updatedPlugins = [];
  const validPlugins = plugins.filter((plugin) => plugin.version && plugin.autoUpdate?.versionURL);
  for (const plugin of validPlugins) {
    if (!validate(plugin.version)) {
      proxy.log({
        type: 'debug',
        source: 'proxy',
        message: `Update failed: ${plugin.pluginName}: version string is not valid.`,
      });
      continue;
    }
    if (!plugin.autoUpdate.versionURL.startsWith('https') || !plugin.autoUpdate.versionURL.endsWith('.yml')) {
      proxy.log({
        type: 'debug',
        source: 'proxy',
        message: `Update failed: ${plugin.pluginName}: version url is not valid.`,
      });
      continue;
    }

    let versionData;
    try {
      const versionText = await axios.get(plugin.autoUpdate.versionURL);
      versionData = parse(versionText.data);
    } catch (error) {
      proxy.log({
        type: 'debug',
        source: 'proxy',
        message: `Update failed: ${plugin.pluginName}: could not get version yml file.`,
      });
      continue;
    }

    try {
      await pluginVersionSchema.validate(versionData);
    } catch (error) {
      proxy.log({
        type: 'debug',
        source: 'proxy',
        message: `Update failed: ${plugin.pluginName}: yml schema did not match.`,
      });
      continue;
    }

    // check if version is actually newer
    if (compare(versionData.version, plugin.version, '<=')) {
      proxy.log({
        type: 'debug',
        source: 'proxy',
        message: `Update failed: ${plugin.pluginName}: remote version is equal or lower than local version.`,
      });
      continue;
    }

    if (!versionData.url.startsWith('https') || !versionData.url.endsWith('.asar')) {
      proxy.log({
        type: 'debug',
        source: 'proxy',
        message: `Update failed: ${plugin.pluginName}: file url is not valid.`,
      });
      continue;
    }

    // download file and check for hashes
    let file;
    try {
      fileBuff = await axios.get(versionData.url, {
        responseType: 'arraybuffer',
        decompress: true,
      });

      file = fileBuff.data;
    } catch (error) {
      proxy.log({
        type: 'debug',
        source: 'proxy',
        message: `Update failed: ${plugin.pluginName}: could not get remote plugin file.`,
      });
      continue;
    }

    if (versionData.sha512 !== createHash('sha512').update(file).digest('hex')) {
      proxy.log({
        type: 'debug',
        source: 'proxy',
        message: `Update failed: ${plugin.pluginName}: file hash does not match.`,
      });
      continue;
    }

    // replace it with the old one
    const filePath = path.join(updatedPluginsFolder, versionData.file.replace('.asar', ''));
    fs.writeFileSync(filePath, Buffer.from(file));

    updatedPlugins.push({
      name: plugin.pluginName,
      oldVersion: plugin.version,
      newVersion: versionData.version,
    });
  }

  if (updatedPlugins.length > 0) {
    const dialogMessage = updatedPlugins.map((plugin) => `${plugin.name}: ${plugin.oldVersion} -> ${plugin.newVersion}`).join(EOL);
    dialog
      .showMessageBox(global.win, {
        title: 'Plugins can be updated!',
        message: dialogMessage,
        buttons: ['Later', 'Restart SWEX'],
      })
      .then((result) => {
        if (result.response > 0) {
          app.relaunch();
          app.exit();
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
}

async function applyPluginUpdates() {
  const pluginsFolderPath = path.join(global.config.Config.App.filesPath, 'plugins');
  const updatablePlugins = await fs.readdir(updatedPluginsFolder);
  for await (const plugin of updatablePlugins) {
    await fs.unlink(path.join(global.config.Config.App.filesPath, 'plugins', `${plugin}.asar`));
    await fs.move(path.join(updatedPluginsFolder, plugin), path.join(pluginsFolderPath, plugin), {
      overwrite: true,
    });
    await fs.rename(path.join(pluginsFolderPath, plugin), path.join(pluginsFolderPath, `${plugin}.asar`));
  }
}

app.on('ready', async () => {
  app.setAppUserModelId(process.execPath);
  createWindow();

  const isMac = process.platform === 'darwin';

  const template = [
    // { role: 'appMenu' }
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' },
              { role: 'delete' },
              { role: 'selectAll' },
              { type: 'separator' },
              {
                label: 'Speech',
                submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }],
              },
            ]
          : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
      ],
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [{ type: 'separator' }, { role: 'front' }, { type: 'separator' }, { role: 'window' }] : [{ role: 'close' }]),
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://github.com/Xzandro/sw-exporter');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  storage.getAll(async (error, data) => {
    if (error) throw error;

    global.config = _.merge(defaultConfig, data);
    global.config.ConfigDetails = defaultConfigDetails.ConfigDetails;

    fs.ensureDirSync(global.config.Config.App.filesPath);
    fs.ensureDirSync(path.join(global.config.Config.App.filesPath, 'plugins'));
    fs.ensureDirSync(updatedPluginsFolder);

    await applyPluginUpdates();

    global.plugins = loadPlugins();
    updatePlugins(global.plugins);

    if (process.env.autostart || global.config.Config.Proxy.autoStart) {
      proxy.start(process.env.port || config.Config.Proxy.port, config.Config.Proxy.steamMode);
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

app.on('before-quit', async (event) => {
  if (config.Config.Proxy.steamMode && process.platform == 'win32' && !quitting) {
    event.preventDefault();
    quitting = true;
    await proxy.removeHostsModifications();
    app.quit();
  }
});
