const { app } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const eol = require('os').EOL;
const csv = require('fast-csv');
const _ = require('lodash');

const baseFileName = 'siege-swords.csv';

const headers = ['siege_id',
'guild_id',
'match_id',
'rating_id',
'pos_id',
'match_score',
'match_score_increment',
'match_rank',
'disqualified',
'play_member_count',
'attack_count',
'attack_unit_count',
'match_score_last_update_time',
'guild_name'];

const saveToFile = (entry, siegeId, proxy) => {
    const csvData = [];
    const self = this;
    const filename = `${siegeId}-${entry.guild_name}-${baseFileName}`;
    console.log(siegeId);
    const filePath = path.join(config.Config.App.filesPath, `${siegeId}`, filename);
    console.log(filePath);
    fs.ensureFile(filePath, (err) => {
      if (err) { return; }
      csv.fromPath(filePath, { ignoreEmpty: true, headers, renameHeaders: true }).on('data', (data) => {
        csvData.push(data);
      }).on('end', () => {
        csvData.push(entry);
        csv.writeToPath(filePath, csvData, { headers }).on('finish', () => {
          proxy.log({ type: 'success', source: 'plugin', name: self.pluginName, message: `Saved siege sword data to ${filePath}` });
        });
      });
    });
  };

module.exports = {
  defaultConfig: {
    enabled: true,
    deleteFileOnQuit: false
  },
  defaultConfigDetails: {
    deleteFileOnQuit: { label: 'Delete log file before quitting app' }
  },
  pluginName: 'SiegeSwordTracking',
  pluginDescription: 'Saves data on sword usage throughout siege',
  init(proxy, config) {
    proxy.on('GetGuildSiegeMatchupInfo', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        this.log(proxy, req, resp);
      }
    });
  },
  log(proxy, req, resp) {
    const { siege_id: siegeId } = resp.match_info;
    _.forEach(resp.guild_list, guildData => saveToFile(guildData, siegeId, proxy));
  }
};
