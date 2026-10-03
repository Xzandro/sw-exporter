const axios = require('axios');

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
    const options = {
      validateStatus: (status) => status === 200,
      maxRedirects: 0,
    };

    axios
      .post(this.log_url, resp, options)
      .then(() => {
        proxy.log({ type: 'success', source: 'plugin', name: this.pluginName, message: `${command} logged successfully` });
      })
      .catch((error) => {
        proxy.log({ type: 'error', source: 'plugin', name: this.pluginName, message: `Error: ${error.message}` });
      });
  },
};
