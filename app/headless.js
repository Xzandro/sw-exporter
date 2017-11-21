const fs = require('fs-extra');
const SWProxy = require('./proxy/SWProxy');
const _ = require('lodash');
const path = require('path');

let global = {};

global.gMapping = require('./mapping');

global.plugins = [];

let defaultConfig = {
    Config: {
        App: { filesPath: './', debug: false, clearLogOnLogin: false },
        Proxy: { port: 9080, autoStart: true },
        Plugins: {}
    }
};
let defaultConfigDetails = {
    ConfigDetails: {
        App: { debug: { label: 'Show Debug Messages' }, clearLogOnLogin: { label: 'Clear Log on every login' } },
        Proxy: { autoStart: { label: 'Start proxy automatically' } },
        Plugins: {}
    }
};

global.config = _.merge(defaultConfig, []);
global.config.ConfigDetails = defaultConfigDetails.ConfigDetails;


const proxy = new SWProxy();

function loadPlugins() {
    // Initialize Plugins
    let plugins = [];

    const pluginDir = path.join(__dirname, 'plugins');

    // Load each plugin module in the folder
    fs.readdirSync(pluginDir).forEach((file) => {
        plugins.push(require(path.join(pluginDir, file)));
    });

    // Initialize plugins
    plugins.forEach((plug) => {
        global.config.Config.Plugins[plug.pluginName] = _.merge(plug.defaultConfig, global.config.Config.Plugins[plug.pluginName]);
        global.config.ConfigDetails.Plugins[plug.pluginName] = plug.defaultConfigDetails || {};
        plug.init(proxy, global.config);
    });

    return plugins;
}

fs.ensureDirSync(global.config.Config.App.filesPath);
global.plugins = loadPlugins(global);

proxy.start(global.config.Config.Proxy.port);
