module.exports = {
  defaultConfig: {
    enabled: false,
  },
  // plugin meta data to better describe your plugin
  pluginName: 'ExamplePlugin',
  pluginDescription: 'This plugin shows you all API events in the log.',
  init(proxy, config) {
    // Subscribe to api command events from the proxy here.
    // You can subscribe to specifc API commands. Event name is the same as the command string
    proxy.on('HubUserLogin', () => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        proxy.log({ type: 'info', source: 'plugin', name: this.pluginName, message: 'You just logged into the game.' });
      }
    });

    // or all API commands with the 'apiCommand' event
    proxy.on('apiCommand', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        this.processEveryCommand(proxy, req, resp);
      }
    });
  },
  processEveryCommand(proxy, req) {
    proxy.log({ type: 'info', source: 'plugin', name: this.pluginName, message: `Found API Command ${req.command}` });
  },
};
