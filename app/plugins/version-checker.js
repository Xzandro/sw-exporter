const axios = require('axios');
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
      const options = {
        headers: {
          'User-Agent': 'SW Exporter',
        },
        validateStatus: (status) => status === 200,
      };
      proxy.log({
        type: 'debug',
        source: 'plugin',
        name: this.pluginName,
        message: `You have app version ${global.appVersion}.  Checking against latest release version...`,
      });
      let errorMessage = `Unable to check for the latest version automatically.  You can manually check by going to ${LATEST_DOWNLOAD_URL} and checking against your version number.`;
      axios
        .get(RELEASES_URL, options)
        .then(({ data: json_body }) => {
          let message;
          if (json_body.tag_name.substring(1) === global.appVersion) {
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
        })
        .catch((error) => {
          proxy.log({
            type: 'error',
            source: 'plugin',
            name: this.pluginName,
            message: `${errorMessage} (${error.message})`,
          });
        })
        .finally(() => {
          config.Config.Plugins[this.pluginName].enabled = false;
        });
    }
  },
};
