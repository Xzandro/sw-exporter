const fs = require('fs');
const path = require('path');
const sanitize = require('sanitize-filename');

module.exports = {
  defaultConfig: {
    enabled: false
  },
  pluginName: 'SiegeMatchExport',
  pluginDescription: 'Exports siege match info.',
  data: {},
  init(proxy, config) {
    proxy.on('GetGuildSiegeMatchupInfo', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        this.data['wizard_id'] = req.wizard_id;
        this.data['matchup_info'] = resp;
        this.writeSiegeMatchToFile(proxy, req, this.data);
      }
    });
    proxy.on('GetGuildSiegeBattleLog', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        req.log_type === 1 ? (this.data['attack_log'] = resp) : (this.data['defense_log'] = resp);
        this.writeSiegeMatchToFile(proxy, req, this.data);
      }
    });
  },
  writeSiegeMatchToFile(proxy, req, data) {
    const matchID = data.matchup_info.match_info.match_id;
    const filename = sanitize(`SiegeMatch-${matchID}`).concat('.json');

    const outFile = fs.createWriteStream(path.join(config.Config.App.filesPath, filename), {
      flags: 'w',
      autoClose: true
    });

    outFile.write(JSON.stringify(data, true, 2));
    outFile.end();
    proxy.log({ type: 'success', source: 'plugin', name: this.pluginName, message: `Saved siege match data to file ${filename}` });
  }
};
