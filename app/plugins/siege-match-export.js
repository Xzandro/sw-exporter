const fs = require('fs');
const path = require('path');
const sanitize = require('sanitize-filename');

module.exports = {
  defaultConfig: {
    enabled: false
  },
  pluginName: 'SiegeMatchExport',
  pluginDescription: 'Exports siege match info.',
  data: { match: {}, attack: {} },
  init(proxy, config) {
    proxy.on('GetGuildSiegeMatchupInfo', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        this.data.match = resp;
        this.writeSiegeMatchToFile(proxy, req, this.data);
      }
    });
    proxy.on('GetGuildSiegeBattleLog', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        this.data.attack = resp;
        this.writeSiegeMatchToFile(proxy, req, this.data);
      }
    });
  },
  writeSiegeMatchToFile(proxy, req, resp) {
    const wizardID = req.wizard_id;
    const siegeID = req.siege_id;
    const filename = sanitize(`SiegeMatch-${wizardID}-${siegeID}`).concat('.json');

    const outFile = fs.createWriteStream(path.join(config.Config.App.filesPath, filename), {
      flags: 'w',
      autoClose: true
    });

    outFile.write(JSON.stringify(resp, true, 2));
    outFile.end();
    proxy.log({ type: 'success', source: 'plugin', name: this.pluginName, message: `Saved siege match data to file ${filename}` });
  }
};
