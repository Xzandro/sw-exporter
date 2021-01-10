const request = require('request');

module.exports = {
  defaultConfig: {
    enabled: true,
  },
  pluginName: 'SwagLogger',
  pluginDescription: 'Transfers your Guild War data to gw.swop.one automatically.',
  log_url: 'https://gw.swop.one/data/upload/',
  init(proxy, config) {
    proxy.on('GetGuildWarBattleLogByGuildId', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        this.log(proxy, req, resp);
      }
    });
    proxy.on('GetGuildWarBattleLogByWizardId', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        this.log(proxy, req, resp);
      }
    });
  },

  log(proxy, req, resp) {
    const { command } = req;

    let options = {
      method: 'post',
      uri: this.log_url,
      json: true,
      body: resp,
    };

    request(options, (error, response) => {
      if (error) {
        proxy.log({ type: 'error', source: 'plugin', name: this.pluginName, message: `Error: ${error.message}` });
        return;
      }

      if (response.statusCode === 200) {
        proxy.log({ type: 'success', source: 'plugin', name: this.pluginName, message: `${command} logged successfully` });
      } else {
        proxy.log({
          type: 'error',
          source: 'plugin',
          name: this.pluginName,
          message: `Request failed: Server responded with code: ${response.statusCode}`,
        });
      }
    });
  },
};
