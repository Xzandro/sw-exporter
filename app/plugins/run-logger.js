const fs = require('fs-extra');
const csv = require('fast-csv');
const dateFormat = require('dateformat');
const path = require('path');
const sanitize = require('sanitize-filename');

module.exports = {
  defaultConfig: {
    enabled: false,
    logWipes: false
  },
  defaultConfigDetails: {
    logWipes: { label: 'Log Wipes' }
  },
  pluginName: 'RunLogger',
  pluginDescription: 'Creates a local csv file and saves data of every dungeon and scenario run in there.',
  temp: {},
  init(proxy, config) {
    proxy.on('apiCommand', (req, resp) => {
      try {
        if (config.Config.Plugins[this.pluginName].enabled) {
          const { command, wizard_id: wizardID } = req;

          if (!this.temp[wizardID]) {
            this.temp[wizardID] = {};
          }

          if (command === 'BattleScenarioStart') {
            this.temp[wizardID].stage = gMapping.scenario[req.region_id]
              ? `${gMapping.scenario[req.region_id]} ${gMapping.difficulty[req.difficulty]} - ${req.stage_no}`
              : 'Unknown';
          }

          if (
            command === 'BattleScenarioResult' ||
            command === 'BattleDungeonResult' ||
            command === 'BattleDungeonResult_V2' ||
            command === 'BattleDimensionHoleDungeonResult'
          ) {
            this.log(proxy, req, resp);
          }

          if (command === 'BattleRiftOfWorldsRaidResult') {
            this.log_raid_rift(proxy, req, resp);
          }

          if (command === 'BattleRiftDungeonResult') {
            this.log_elemental_rift(proxy, req, resp);
          }
        }
      } catch (e) {
        proxy.log({ type: 'error', source: 'plugin', name: this.pluginName, message: `An unexpected error occured: ${e.message}` });
      }
    });
  },

  getRuneData(rune) {
    const runeDrop = {
      drop: 'Rune',
      grade: `${rune.class}*`,
      sell_value: rune.sell_value,
      set: gMapping.rune.sets[rune.set_id],
      slot: rune.slot_no,
      efficiency: gMapping.getRuneEfficiency(rune).current,
      rarity: gMapping.rune.class[rune.sec_eff.length],
      main_stat: gMapping.getRuneEffect(rune.pri_eff),
      prefix_stat: gMapping.getRuneEffect(rune.prefix_eff)
    };

    rune.sec_eff.forEach((substat, i) => {
      runeDrop[`sub${i + 1}`] = gMapping.getRuneEffect(substat);
    });

    return runeDrop;
  },

  getItem(crate) {
    if (crate.random_scroll && crate.random_scroll.item_master_id === 1) {
      return { drop: `Unknown Scroll x${crate.random_scroll.item_quantity}` };
    }
    if (crate.random_scroll && crate.random_scroll.item_master_id === 8) {
      return { drop: `Summoning Stones x${crate.random_scroll.item_quantity}` };
    }
    if (crate.random_scroll && crate.random_scroll.item_master_id === 2) {
      return { drop: 'Mystical Scroll' };
    }
    if (crate.costume_point) {
      return { drop: `Shapeshifting Stone x${crate.costume_point}` };
    }
    if (crate.rune_upgrade_stone) {
      return { drop: `Power Stone x${crate.rune_upgrade_stone.item_quantity}` };
    }
    if (crate.unit_info) {
      return { drop: `${gMapping.getMonsterName(crate.unit_info.unit_master_id)} ${crate.unit_info.class}` };
    }
    if (crate.material) {
      const id = crate.material.item_master_id.toString();
      const attribute = Number(id.slice(-1));
      const grade = Number(id.slice(1, -3));
      return { drop: `Essence of ${gMapping.essence.attribute[attribute]}(${gMapping.essence.grade[grade]}) x${crate.material.item_quantity}` };
    }
    if (crate.craft_stuff && gMapping.craftMaterial[crate.craft_stuff.item_master_id]) {
      return { drop: `${gMapping.craftMaterial[crate.craft_stuff.item_master_id]} x${crate.craft_stuff.item_quantity}` };
    }
    if (crate.summon_pieces) {
      return { drop: `Summoning Piece ${gMapping.getMonsterName(crate.summon_pieces.item_master_id)} x${crate.summon_pieces.item_quantity}` };
    }
    if (crate.rune) {
      return this.getRuneData(crate.rune);
    }

    return { drop: 'Unknown Drop' };
  },

  getItemV2(rewards) {
    // currently only supports the first item of the rewards list
    const reward = rewards[0];
    if (reward.view.item_master_id === 1) {
      return { drop: `Unknown Scroll x${reward.view.item_quantity}` };
    }
    if (reward.view.item_master_id === 8) {
      return { drop: `Summoning Stones x${reward.view.item_quantity}` };
    }
    if (reward.view.item_master_id === 2) {
      return { drop: 'Mystical Scroll' };
    }
    if (reward.type === 1) {
      return { drop: `${gMapping.getMonsterName(reward.info.unit_master_id)} ${reward.info.class}` };
    }
    if (reward.type === 11) {
      const id = reward.info.item_master_id.toString();
      const attribute = Number(id.slice(-1));
      const grade = Number(id.slice(1, -3));
      return { drop: `Essence of ${gMapping.essence.attribute[attribute]}(${gMapping.essence.grade[grade]}) x${reward.view.item_quantity}` };
    }
    if (reward.type === 29 && gMapping.craftMaterial[reward.info.item_master_id]) {
      return { drop: `${gMapping.craftMaterial[reward.info.item_master_id]} x${reward.view.item_quantity}` };
    }
    if (reward.type === 8) {
      return this.getRuneData(reward.info);
    }

    return { drop: 'Unknown Drop' };
  },

  getItemRift(item, entry) {
    if (item.type === 8) {
      const rune = item.info;
      entry.drop = 'Rune';
      entry.grade = `${rune.class}*`;
      entry.sell_value = rune.sell_value;
      entry.set = gMapping.rune.sets[rune.set_id];
      entry.slot = rune.slot_no;
      entry.efficiency = gMapping.getRuneEfficiency(rune).current;
      entry.rarity = gMapping.rune.class[rune.sec_eff.length];
      entry.main_stat = gMapping.getRuneEffect(rune.pri_eff);
      entry.prefix_stat = gMapping.getRuneEffect(rune.prefix_eff);

      rune.sec_eff.forEach((substat, i) => {
        entry[`sub${i + 1}`] = gMapping.getRuneEffect(substat);
      });
    }
    if (item.info.craft_type_id) {
      enhancement = this.getEnchantVals(item.info.craft_type_id, item.info.craft_type);
      entry.drop = enhancement.drop;
      entry.sell_value = item.sell_value;
      entry.set = enhancement.set;
      entry.main_stat = enhancement.type;
      entry.sub1 = enhancement.min;
      entry.sub2 = enhancement.max;
    }
    return entry;
  },

  saveToFile(entry, filename, headers, proxy) {
    const csvData = [];
    const self = this;
    fs.ensureFile(path.join(config.Config.App.filesPath, filename), err => {
      if (err) {
        return;
      }
      csv
        .fromPath(path.join(config.Config.App.filesPath, filename), { ignoreEmpty: true, headers, renameHeaders: true })
        .on('data', data => {
          csvData.push(data);
        })
        .on('end', () => {
          csvData.push(entry);
          csv.writeToPath(path.join(config.Config.App.filesPath, filename), csvData, { headers }).on('finish', () => {
            proxy.log({ type: 'success', source: 'plugin', name: self.pluginName, message: `Saved run data to ${filename}` });
          });
        });
    });
  },

  log(proxy, req, resp) {
    const { command } = req;
    const { wizard_id: wizardID, wizard_name: wizardName } = resp.wizard_info;

    let entry = {};

    if (command === 'BattleDungeonResult' || command === 'BattleDungeonResult_V2') {
      if (gMapping.dungeon[req.dungeon_id]) {
        entry.dungeon = `${gMapping.dungeon[req.dungeon_id]} B${req.stage_id}`;
      } else {
        entry.dungeon = req.dungeon_id > 10000 ? 'Hall of Heroes' : 'Unknown';
      }
    }

    if (command === 'BattleScenarioResult') {
      entry.dungeon = this.temp[wizardID].stage ? this.temp[wizardID].stage : 'Unknown';
    }

    if (command === 'BattleDimensionHoleDungeonResult') {
      if (gMapping.dungeon[resp.dungeon_id]) {
        entry.dungeon = `${gMapping.dungeon[resp.dungeon_id]} Level ${resp.difficulty}`;
      }
    }

    const winLost = resp.win_lose === 1 ? 'Win' : 'Lost';
    if (winLost === 'Lost' && !config.Config.Plugins[this.pluginName].logWipes) {
      return;
    }

    entry.date = dateFormat(new Date(), 'yyyy-mm-dd HH:MM');
    entry.result = winLost;

    const reward = resp.reward ? resp.reward : {};
    entry.mana = reward.mana ? reward.mana : 0;
    entry.energy = reward.energy ? reward.energy : 0;
    entry.crystal = reward.crystal ? reward.crystal : 0;

    if (req.clear_time) {
      const seconds =
        Math.floor((req.clear_time / 1000) % 60) < 10 ? `0${Math.floor((req.clear_time / 1000) % 60)}` : Math.floor((req.clear_time / 1000) % 60);
      const time = [Math.floor(req.clear_time / 1000 / 60), seconds];
      entry.time = `${time[0]}:${time[1]}`;
    }
    if (command === 'BattleDungeonResult_V2') {
      entry.mana = reward.mana ? entry.mana + reward.mana : entry.mana;
      entry.energy = reward.energy ? entry.energy + reward.energy : entry.energy;
      entry.crystal = reward.crystal ? entry.crystal + reward.crystal : entry.crystal;
    } else {
      if (reward.crate) {
        entry.mana = reward.crate.mana ? entry.mana + reward.crate.mana : entry.mana;
        entry.energy = reward.crate.energy ? entry.energy + reward.crate.energy : entry.energy;
        entry.crystal = reward.crate.crystal ? entry.crystal + reward.crate.crystal : entry.crystal;
      }
    }
    if (winLost === 'Win') {
      entry =
        command === 'BattleDungeonResult_V2' && resp.changed_item_list
          ? Object.assign({}, entry, this.getItemV2(resp.changed_item_list || []))
          : Object.assign({}, entry, this.getItem(reward.crate || null));
    }

    if (resp.unit_list && resp.unit_list.length > 0) {
      resp.unit_list.forEach((unit, i) => {
        entry[`team${i + 1}`] = gMapping.getMonsterName(unit.unit_master_id);
      });
    }

    if (resp.instance_info) {
      entry.drop = 'Secret Dungeon';
    }

    const headers = [
      'date',
      'dungeon',
      'result',
      'time',
      'mana',
      'crystal',
      'energy',
      'drop',
      'grade',
      'sell_value',
      'set',
      'efficiency',
      'slot',
      'rarity',
      'main_stat',
      'prefix_stat',
      'sub1',
      'sub2',
      'sub3',
      'sub4',
      'team1',
      'team2',
      'team3',
      'team4',
      'team5'
    ];

    const filename = sanitize(`${wizardName}-${wizardID}-runs.csv`);
    this.saveToFile(entry, filename, headers, proxy);
  },

  log_raid_rift(proxy, req, resp) {
    const { wizard_id: wizardID, wizard_name: wizardName } = resp.wizard_info;

    let entry = {};
    if (gMapping.dungeon[req.dungeon_id]) {
      entry.dungeon = `${gMapping.elemental_rift_dungeon[req.dungeon_id]}`;
      isElemental = true;
    }

    const winLost = resp.win_lose === 1 ? 'Win' : 'Did not kill';

    entry.date = dateFormat(new Date(), 'yyyy-mm-dd HH:MM');
    entry.result = winLost;

    if (resp.clear_time) {
      const seconds =
        Math.floor((resp.clear_time.current_time / 1000) % 60) < 10
          ? `0${Math.floor((resp.clear_time.current_time / 1000) % 60)}`
          : Math.floor((resp.clear_time.current_time / 1000) % 60);
      const time = [Math.floor(resp.clear_time.current_time / 1000 / 60), seconds];
      entry.time = `${time[0]}:${time[1]}`;
    }

    const reward = resp.reward ? resp.reward : {};

    if (resp.win_lose === 1) {
      if (!reward.crate) {
        const reward = resp.battle_reward_list.find(value => value.wizard_id === resp.wizard_info.wizard_id).reward_list[0];
        if (reward.item_master_id === 6) {
          entry.drop = `Shapeshifting stones x${reward.item_quantity}`;
        } else {
          entry.drop = `${reward.item_quantity} Mana`;
        }
      } else if (reward.crate.changestones) {
        const item = {
          info: {
            craft_type: reward.crate.changestones[0].craft_type,
            craft_type_id: reward.crate.changestones[0].craft_type_id
          },
          sell_value: reward.crate.changestones[0].sell_value
        };
        entry = this.getItemRift(item, entry);
      } else if (reward.crate.rune) {
        entry = this.getItemRift(reward.crate.rune, entry);
      } else if (reward.crate.unit_info && reward.crate.unit_info.unit_master_id > 0) {
        entry.drop = `${gMapping.getMonsterName(reward.crate.unit_info.unit_master_id)} ${reward.crate.unit_info.class}`;
      } else if (!entry.drop && resp.reward.crate) {
        entry.drop = this.getItem(reward.crate);
      } else {
        entry.drop = 'unknown';
      }
    } else {
      entry.drop = 'none';
    }

    if (resp.unit_list && resp.unit_list.length > 0) {
      resp.unit_list.forEach((unit, i) => {
        entry[`team${i + 1}`] = gMapping.getMonsterName(unit.unit_master_id);
      });
    }

    const headers = [
      'date',
      'dungeon',
      'result',
      'time',
      'item1',
      'item2',
      'item3',
      'drop',
      'grade',
      'sell_value',
      'set',
      'efficiency',
      'slot',
      'rarity',
      'main_stat',
      'prefix_stat',
      'sub1',
      'sub2',
      'sub3',
      'sub4',
      'team1',
      'team2',
      'team3',
      'team4',
      'team5',
      'team6'
    ];

    const filename = sanitize(`${wizardName}-${wizardID}-raid-runs.csv`);
    this.saveToFile(entry, filename, headers, proxy);
  },

  log_elemental_rift(proxy, req, resp) {
    const { wizard_id: wizardID, wizard_name: wizardName } = resp.wizard_info;

    let entry = {};
    if (gMapping.dungeon[req.dungeon_id]) {
      entry.dungeon = `${gMapping.elemental_rift_dungeon[req.dungeon_id]}`;
      isElemental = true;
    }

    const winLost = req.battle_result === 1 ? 'Win' : 'Did not kill';

    entry.date = dateFormat(new Date(), 'yyyy-mm-dd HH:MM');
    entry.result = winLost;

    if (resp.item_list && resp.item_list.length > 0) {
      resp.item_list.forEach((item, i) => {
        if (item.is_boxing !== 1 || item.id === 2001) {
          entry[`item${i + 1}`] = `${gMapping.craftMaterial[item.id]} x${item.quantity}`;
        } else {
          if (item.id === 2) {
            entry.drop = 'Mystical Scroll';
          }
          if (item.id === 8) {
            entry.drop = `Summoning Stones x${item.item_quantity}`;
          }
          if (item.info && item.info.unit_master_id > 0) {
            entry.drop = `${gMapping.getMonsterName(item.info.unit_master_id)} ${item.class}`;
          }
          if ((item.info && item.info.craft_type_id) || item.type === 8) {
            entry = this.getItemRift(item, entry);
          }
        }
      });
    }

    if (resp.unit_list && resp.unit_list.length > 0) {
      resp.unit_list.forEach((unit, i) => {
        entry[`team${i + 1}`] = gMapping.getMonsterName(unit.unit_master_id);
      });
    }
    const headers = [
      'date',
      'dungeon',
      'result',
      'time',
      'item1',
      'item2',
      'item3',
      'drop',
      'grade',
      'sell_value',
      'set',
      'efficiency',
      'slot',
      'rarity',
      'main_stat',
      'prefix_stat',
      'sub1',
      'sub2',
      'sub3',
      'sub4',
      'team1',
      'team2',
      'team3',
      'team4',
      'team5',
      'team6'
    ];

    const filename = sanitize(`${wizardName}-${wizardID}-raid-runs.csv`);
    this.saveToFile(entry, filename, headers, proxy);
  },

  getEnchantVals(craftID, craftType) {
    const map = {};
    const typeNumber = Number(craftID.toString().slice(-4, -2));
    map.set = gMapping.rune.sets[Number(craftID.toString().slice(0, -4))];
    map.grade = gMapping.rune.quality[Number(craftID.toString().slice(-1))];
    map.type = gMapping.rune.effectTypes[typeNumber];

    if (craftType === 2) {
      map.min = gMapping.grindstone[typeNumber].range[Number(craftID.toString().slice(-1))].min;
      map.max = gMapping.grindstone[typeNumber].range[Number(craftID.toString().slice(-1))].max;
      map.drop = 'Grindstone';
    } else {
      map.min = gMapping.enchanted_gem[typeNumber].range[Number(craftID.toString().slice(-1))].min;
      map.max = gMapping.enchanted_gem[typeNumber].range[Number(craftID.toString().slice(-1))].max;
      map.drop = 'Enchanted Gem';
    }
    return map;
  }
};
