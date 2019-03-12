const fs = require('fs');
const path = require('path');
const sanitize = require('sanitize-filename');

module.exports = {
  defaultConfig: {
    enabled: false
  },
  pluginName: 'SiegeInsightsPlugin',
  pluginDescription: 'Exports siege matchup info and logs for Siege Insights.',
  data: {},
  init(proxy, config) {
    proxy.on('GetGuildSiegeMatchupInfo', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        this.data['wizard_id'] = req.wizard_id;
        this.data['matchup_info'] = resp;
        this.writeSiegeMatchToFile(proxy, this.data, 'matchup info');
      }
    });
    proxy.on('GetGuildSiegeBattleLog', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        let log_msg;
        if (req.log_type === 1) {
          this.data['attack_log'] = resp;
          log_msg = 'attack log';
        } else {
          this.data['defense_log'] = resp;
          log_msg = 'defense log';
        }
        if (this.data.matchup_info) {
          this.writeSiegeMatchToFile(proxy, this.data, log_msg);
        }
      }
    });
  },
  writeSiegeMatchToFile(proxy, data, log_msg) {
    const matchID = data.matchup_info.match_info.match_id;
    const filename = sanitize(`SiegeMatch-${matchID}`).concat('.json');

    const outFile = fs.createWriteStream(path.join(config.Config.App.filesPath, filename), {
      flags: 'w',
      autoClose: true
    });

    outFile.write(JSON.stringify(data, true, 2));
    outFile.end();
    proxy.log({ type: 'success', source: 'plugin', name: this.pluginName, message: `Saved ${log_msg} data to file ${filename}` });
  }
};
