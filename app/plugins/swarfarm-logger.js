const request = require('request');

module.exports = {
  defaultConfig: {
    enabled: true
  },
  pluginName: 'SwarfarmLogger',
  pluginDescription: 'Transfers your Dungeon Run data to swarfarm.com automatically.',
  commands_url: 'https://swarfarm.com/data/log/accepted_commands/',
  log_url: 'https://swarfarm.com/data/log/upload/',
  accepted_commands: false,
  init(proxy, config) {
    if (config.Config.Plugins[this.pluginName].enabled) {
      this.proxy = proxy;
      let options = {
        method: 'get',
        uri: this.commands_url,
      };
      proxy.log({ type: 'debug', source: 'plugin', name: this.pluginName, message: 'Retrieving list of accepted log types from SWARFARM...' });
      request(options, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          this.accepted_commands = JSON.parse(body);
          proxy.log({ type: 'success', source: 'plugin', name: this.pluginName, message: `Looking for the following commands to log: ${Object.keys(this.accepted_commands).join(', ')}` });
        } else {
          proxy.log({ type: 'error', source: 'plugin', name: this.pluginName, message: 'Unable to retrieve accepted log types. SWARFARM logging is disabled.' });
          config.Config.Plugins[this.pluginName].enabled = false;
        }
      });
      proxy.on('apiCommand', (req, resp) => {
        if (config.Config.Plugins[this.pluginName].enabled) {
          this.log(proxy, req, resp);
        }
      });
    }
  },

  log(proxy, req, resp) {
    const { command } = req;

    if (!this.accepted_commands || !this.accepted_commands[command]) { return; }

    let acceptedData = this.accepted_commands[command];
    let resultData = { request: {}, response: {} };

    acceptedData.request.forEach((prop) => {
      resultData.request[prop] = req[prop] || null;
    });

    acceptedData.response.forEach((prop) => {
      resultData.response[prop] = resp[prop] || null;
    });

    request.post({ url: this.log_url, form: { data: JSON.stringify(resultData) } }, (error, response) => {
      if (error) {
        proxy.log({ type: 'error', source: 'plugin', name: this.pluginName, message: `Error: ${error.message}` });
        return;
      }

      if (response.statusCode === 200) {
        proxy.log({ type: 'success', source: 'plugin', name: this.pluginName, message: `${command} logged successfully` });
      } else {
        proxy.log({ type: 'error', source: 'plugin', name: this.pluginName, message: `Request failed: Server responded with code: ${response.statusCode}` });
      }
    });
  }
};