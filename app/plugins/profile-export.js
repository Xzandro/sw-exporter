const fs = require('fs');
const path = require('path');
const eol = require('os').EOL;

module.exports = {
  defaultConfig: {
    enabled: true
  },
  pluginName: 'ProfileExport',
  init(proxy, config) {
    proxy.on('HubUserLogin', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled)
        this.writeProfileToFile(proxy, req, resp);
    });
  },
  writeProfileToFile(proxy, req, resp) {
    const wizard_id = resp.wizard_info.wizard_id;
    const filename = wizard_id.toString().concat('.json');

    var outFile = fs.createWriteStream(
      path.join(config.Config.App.filesPath, filename), {
        flags: 'w',
        autoClose: true
      }
    );

    outFile.write(JSON.stringify(resp, true, 2));
    outFile.end();
    proxy.log({ type: 'success', source: 'plugin', name: this.pluginName, message: 'Saved profile data to '.concat(filename) });
  }
}