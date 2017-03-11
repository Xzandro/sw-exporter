module.exports = {
  defaultConfig: {
    enabled: true
  },
  pluginName: 'SwarfarmLogger',
  commands_url: 'https://swarfarm.com/data/log/accepted_commands/',
  log_url: 'https://swarfarm.com/data/log/upload/',
  accepted_commands: false,
  init(proxy, config, request) {
    this.proxy = proxy;
    let options = {
      method: 'get',
      uri: this.commands_url,
    };
    proxy.log({ type: 'info', source: 'plugin', name: this.pluginName, message: 'Retrieving list of accepted log types from SWARFARM...' });
    request(options, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        this.accepted_commands = JSON.parse(body);
        proxy.log({ type: 'info', source: 'plugin', name: this.pluginName, message: `Looking for the following commands to log: ${Object.keys(this.accepted_commands).join(', ')}` });
      } else {
        proxy.log({ type: 'error', source: 'plugin', name: this.pluginName, message: 'Unable to retrieve accepted log types. SWARFARM logging is disabled.' });
      }
    });
    proxy.on('apiCommand', (req, resp) => {
      if (config.enabled)
        this.log(proxy, req, resp, request);
    });
  },

  log(proxy, req, resp, request) {
    const {command} = req;

    if (!this.accepted_commands || !this.accepted_commands[command])
      return;

    let accepted_data = this.accepted_commands[command];
    let result_data = { 'request': {}, 'response': {} };

    accepted_data.request.forEach(prop => {
      result_data.request[prop] = req[prop] || null;
    });

    accepted_data.response.forEach(prop => {
      result_data.response[prop] = resp[prop] || null;
    });

    request.post({url: this.log_url, form: { data: JSON.stringify(result_data)} },  (error, response, body) => {
      if (!error && response.statusCode == 200) {
        proxy.log({ type: 'Success', source: 'plugin', name: this.pluginName, message: `${command} logged successfully` });
      } else {
        proxy.log({ type: 'error', source: 'plugin', name: this.pluginName, message: `Error: ${error.message}` });
      }
    });
  }
}