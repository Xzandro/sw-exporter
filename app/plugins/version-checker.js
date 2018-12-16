const request = require('request');
const RELEASES_URL = 'https://api.github.com/repos/Xzandro/sw-exporter/releases/latest';

module.exports = {
  defaultConfig: {
    enabled: false
  },
  pluginName: 'VersionChecker',
  pluginDescription: 'This plugin checks to make sure you are using the latest version of the exporter app.',
  init(proxy, config) {
    if (config.Config.Plugins[this.pluginName].enabled) {
      this.proxy = proxy;
      let options = {
        method: 'get',
        uri: `${RELEASES_URL}`,
        headers: {
          'User-Agent': 'SW Exporter'
        }
      };
      proxy.log({
        type: 'debug',
        source: 'plugin',
        name: this.pluginName,
        message: `You have app version ${global.appVersion}.  Checking against latest release version...`
      });
      var latestDownloadUrl = 'https://github.com/Xzandro/sw-exporter/releases/latest';
      var errorMessage = `Unable to check for the latest version automatically.  You can manually check by going to ${latestDownloadUrl} and checking against your version number.`;
      try {
        request(options, (error, response, body) => {
          if (!error && response.statusCode === 200) {
            var json_body = JSON.parse(body);
            if (json_body.name === global.appVersion) {
              var message = 'You have the latest version!';
            } else {
              var message = `You have ${global.appVersion} and ${json_body.name} is the latest version..  Go to ${latestDownloadUrl} to download the latest version of the app.`;
            }
            proxy.log({
              type: 'success',
              source: 'plugin',
              name: this.pluginName,
              message: `${message}`
            });
          } else {
            proxy.log({
              type: 'error',
              source: 'plugin',
              name: this.pluginName,
              message: `${errorMessage}`
            });
          }
          config.Config.Plugins[this.pluginName].enabled = false;
        });
      } catch (error) {
        proxy.log({
          type: 'error',
          source: 'plugin',
          name: this.pluginName,
          message: `Got this error: ${error.message}`
        });
        config.Config.Plugins[this.pluginName].enabled = false;
      }
    }
  }
};
