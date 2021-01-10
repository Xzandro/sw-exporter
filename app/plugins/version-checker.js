const request = require('request');
const RELEASES_URL = 'https://api.github.com/repos/Xzandro/sw-exporter/releases/latest';
const LATEST_DOWNLOAD_URL = '<a href="https://github.com/Xzandro/sw-exporter/releases/latest" target=_blank>Github</a>';

module.exports = {
  defaultConfig: {
    enabled: true,
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
          'User-Agent': 'SW Exporter',
        },
      };
      proxy.log({
        type: 'debug',
        source: 'plugin',
        name: this.pluginName,
        message: `You have app version ${global.appVersion}.  Checking against latest release version...`,
      });
      let errorMessage = `Unable to check for the latest version automatically.  You can manually check by going to ${LATEST_DOWNLOAD_URL} and checking against your version number.`;
      try {
        request(options, (error, response, body) => {
          if (!error && response.statusCode === 200) {
            let json_body = JSON.parse(body);
            let message;
            if (json_body.tag_name === global.appVersion) {
              message = 'You have the latest version!';
            } else {
              message = `You have ${global.appVersion} and ${json_body.tag_name} is the latest version.  Go to ${LATEST_DOWNLOAD_URL} to download the latest version of the app.`;
            }
            proxy.log({
              type: 'success',
              source: 'plugin',
              name: this.pluginName,
              message: `${message}`,
            });
          } else {
            proxy.log({
              type: 'error',
              source: 'plugin',
              name: this.pluginName,
              message: `${errorMessage}`,
            });
          }
          config.Config.Plugins[this.pluginName].enabled = false;
        });
      } catch (error) {
        proxy.log({
          type: 'error',
          source: 'plugin',
          name: this.pluginName,
          message: `Got this error: ${error.message}`,
        });
        config.Config.Plugins[this.pluginName].enabled = false;
      }
    }
  },
};
