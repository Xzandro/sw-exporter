const request = require('request');

module.exports = {
  defaultConfig: {
    enabled: true
  },
  pluginName: 'SwagLogger',
  log_url: 'https://gw.swop.one/data/upload/',
  init(proxy, config) {
    proxy.on('GetGuildWarBattleLogByGuildId', (req, resp) => {
      if (config.enabled)
        this.log(proxy, req, resp);
    });
    proxy.on('GetGuildWarBattleLogByWizardId', (req, resp) => {
      if (config.enabled)
        this.log(proxy, req, resp);
    });
  },

  log(proxy, req, resp) {
    const {command} = req;

    let options = {
      method: 'post',
      uri: this.log_url,
      json: true,
      body: resp
    }

    request(options, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        proxy.log({ type: 'success', source: 'plugin', name: this.pluginName, message: `${command} logged successfully` });
      } else {
        proxy.log({ type: 'error', source: 'plugin', name: this.pluginName, message: `Error: ${error.message}` });
      }
    });
  }
}