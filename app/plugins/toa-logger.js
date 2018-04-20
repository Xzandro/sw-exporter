const fs = require('fs-extra');
const csv = require('fast-csv');
const dateFormat = require('dateformat');
const path = require('path');
const sanitize = require('sanitize-filename');

module.exports = {
  defaultConfig: {
    enabled: false,
    logWipes: false,
  },
  defaultConfigDetails: {
    logWipes: { label: 'Log Wipes' },
  },
  pluginName: 'TOALogger',
  pluginDescription: 'Creates a local csv file and saves data of TOA runs in there.',
  temp: {},
  init(proxy, config) {
    proxy.on('apiCommand', (req, resp) => {
      try {
        if (config.Config.Plugins[this.pluginName].enabled) {
          const { command, wizard_id: wizardID } = req;

          if (!this.temp[wizardID]) {
            this.temp[wizardID] = {};
          }

          if (command === 'BattleTrialTowerResult_v2') {
            this.log_elemental_rift(proxy, req, resp);
          }
        }
      } catch (e) {
        proxy.log({ type: 'error', source: 'plugin', name: this.pluginName, message: `An unexpected error occured: ${e.message}` });
      }
    });
  },
  getItem(crate) {
    if (crate.random_scroll && crate.random_scroll.item_master_id === 1) {
      return `Unknown Scroll x${crate.random_scroll.item_quantity}`;
    }
    if (crate.random_scroll && crate.random_scroll.item_master_id === 8) {
      return `Summoning Stones x${crate.random_scroll.item_quantity}`;
    }
    if (crate.random_scroll && crate.random_scroll.item_master_id === 2) {
      return 'Mystical Scroll';
    }
    if (crate.costume_point) {
      return `Shapeshifting Stone x${crate.costume_point}`;
    }
    if (crate.rune_upgrade_stone) {
      return `Power Stone x${crate.rune_upgrade_stone.item_quantity}`;
    }
    if (crate.unit_info) {
      return `${gMapping.getMonsterName(crate.unit_info.unit_master_id)} ${crate.unit_info.class}`;
    }
    if (crate.material) {
      const id = crate.material.item_master_id.toString();
      const attribute = Number(id.slice(-1));
      const grade = Number(id.slice(1, -3));
      return `Essence of ${gMapping.essence.attribute[attribute]}(${gMapping.essence.grade[grade]}) x${crate.material.item_quantity}`;
    }
    if (crate.craft_stuff && gMapping.craftMaterial[crate.craft_stuff.item_master_id]) {
      return `${gMapping.craftMaterial[crate.craft_stuff.item_master_id]} x${crate.craft_stuff.item_quantity}`;
    }
    if (crate.summon_pieces) {
      return `Summoning Piece ${gMapping.getMonsterName(crate.summon_pieces.item_master_id)} x${crate.summon_pieces.item_quantity}`;
    }

    return 'Unknown Drop';
  },

  saveToFile(entry, filename, headers, proxy) {
    const csvData = [];
    const self = this;
    fs.ensureFile(path.join(config.Config.App.filesPath, filename), (err) => {
      if (err) { return; }
      csv.fromPath(path.join(config.Config.App.filesPath, filename), { ignoreEmpty: true, headers, renameHeaders: true }).on('data', (data) => {
        csvData.push(data);
      }).on('end', () => {
        csvData.push(entry);
        csv.writeToPath(path.join(config.Config.App.filesPath, filename), csvData, { headers }).on('finish', () => {
          proxy.log({ type: 'success', source: 'plugin', name: self.pluginName, message: `Saved run data to ${filename}` });
        });
      });
    });
  },

  log_trial_tower(proxy, req, resp) {
    const { command } = req;
    const { wizard_id: wizardID, wizard_name: wizardName } = resp.wizard_info;

    const entry = {};

    const winLost = resp.win_lose === 1 ? 'Win' : 'Lost';
    if (winLost === 'Lost' && !config.Config.Plugins[this.pluginName].logWipes) { return; }

    entry.date = dateFormat(new Date(), 'yyyy-mm-dd HH:MM');
    entry.result = winLost;

    const reward = resp.reward ? resp.reward : {};
    entry.mana = reward.mana ? reward.mana : 0;
    entry.energy = reward.energy ? reward.energy : 0;
    entry.crystal = reward.crystal ? reward.crystal : 0;

    if (reward.crate) {
      entry.mana = reward.crate.mana ? entry.mana + reward.crate.mana : entry.mana;
      entry.energy = reward.crate.energy ? entry.energy + reward.crate.energy : entry.energy;
      entry.crystal = reward.crate.crystal ? entry.crystal + reward.crate.crystal : entry.crystal;
      entry.drop = this.getItem(reward.crate);
    }

    if (resp.unit_list && resp.unit_list.length > 0) {
      resp.unit_list.forEach((unit, i) => {
        entry[`team${i + 1}`] = gMapping.getMonsterName(unit.unit_master_id);
      });
    }

    entry.tower = resp.trial_tower_info.difficulty === 1 ? 'Normal' : 'Hard';
    entry.floor = resp.floor_id;

    const headers = ['date', 'tower', 'floor', 'result', 'mana', 'crystal', 'energy', 'drop', 'team1', 'team2', 'team3', 'team4', 'team5'];

    const filename = sanitize(`${wizardName}-${wizardID}-toa-runs.csv`);
    this.saveToFile(entry, filename, headers, proxy);
  },
};
