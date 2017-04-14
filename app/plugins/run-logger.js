const fs = require('fs-extra');
const csv = require('fast-csv');
const dateFormat = require('dateformat');
const path = require('path');
const eol = require('os').EOL;
const sanitize = require('sanitize-filename');

module.exports = {
  defaultConfig: {
    enabled: false,
    logWipes: false
  },
  pluginName: 'RunLogger',
  pluginDescription: 'Creates a local csv file and saves data of every dungeon and scenario run in there.',
  temp: {},
  init(proxy, config) {
    proxy.on('apiCommand', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        const { command, wizard_id } = req;

        if (!this.temp[wizard_id])
          this.temp[wizard_id] = {};

        if (command === 'BattleScenarioStart')
          this.temp[wizard_id].stage = gMapping.scenario[req.region_id] ? `${gMapping.scenario[req.region_id]} ${gMapping.difficulty[req.difficulty]} - ${req.stage_no}` : 'Unknown';

        if (command === 'BattleScenarioResult' || command === 'BattleDungeonResult')
          this.log(req, resp);
      }
    });
  },
  getItem(crate) {
    if (crate.random_scroll && crate.random_scroll.item_master_id === 1)
      return `Unknown Scroll x${crate.random_scroll.item_quantity}`;
    if (crate.random_scroll && crate.random_scroll.item_master_id === 8)
      return `Summoning Stones x${crate.random_scroll.item_quantity}`;
    if (crate.random_scroll && crate.random_scroll.item_master_id === 2)
      return 'Mystical Scroll';
    if (crate.costume_point)
      return `Shapeshifting Stone x${crate.costume_point}`;
    if (crate.rune_upgrade_stone)
      return `Power Stone x${crate.rune_upgrade_stone.item_quantity}`;
    if (crate.unit_info)
      return `${gMapping.getMonsterName(crate.unit_info.unit_master_id)} ${crate.unit_info.class}`;
    if (crate.material) {
      let id = crate.material.item_master_id.toString();
      let attribute = Number(id.slice(-1));
      let grade = Number(id.slice(0, -4));
      return `Essence of ${gMapping.essence.attribute[attribute]}(${gMapping.essence.grade[grade]}) x${crate.material.item_quantity}`;
    }
    if (crate.summon_pieces)
      return `Summoning Piece ${gMapping.getMonsterName(crate.summon_pieces.item_master_id)} x${crate.summon_pieces.item_quantity}`;

    return 'Unknown Drop';
  },
  getEfficiency(rune) {
    let ratio = 0.0;

    // main stat
    ratio += gMapping.rune.mainstat[rune.pri_eff[0]].max[rune.class] / gMapping.rune.mainstat[rune.pri_eff[0]].max[6];

    // sub stats
    rune.sec_eff.forEach(stat => {
      let value = (stat[3] && stat[3] > 0) ? stat[1] + stat[3] : stat[1];
      ratio += value / gMapping.rune.substat[stat[0]].max[6];
    });

    // innate stat
    if (rune.prefix_eff && rune.prefix_eff[0] > 0) {
      ratio += rune.prefix_eff[1] / gMapping.rune.substat[rune.prefix_eff[0]].max[6]
    }

    return (ratio / 2.8 * 100).toFixed(2);
  },
  log(req, resp) {
    const { command } = req;
    const { wizard_id, wizard_name } = resp.wizard_info;

    let entry = {};

    if (command === 'BattleDungeonResult') {
      if (gMapping.dungeon[req.dungeon_id]) {
        entry.dungeon = `${gMapping.dungeon[req.dungeon_id]} B${req.stage_id}`;
      } else {
        entry.dungeon = req.dungeon_id > 10000 ? 'Hall of Heroes' : 'Unknown';
      }
    }

    if (command === 'BattleScenarioResult')
      entry.dungeon = this.temp[wizard_id].stage ? this.temp[wizard_id].stage : 'Unknown';

    let winLost = resp.win_lose == 1 ? 'Win' : 'Lost';
    if (winLost === 'Lost' && !config.Config.Plugins[this.pluginName].logWipes)
      return;

    entry.date = dateFormat(new Date(), 'yyyy-mm-dd HH:MM');
    entry.result = winLost;

    let reward = resp.reward ? resp.reward : {};
    entry.mana = reward.mana ? reward.mana : 0;
    entry.energy = reward.energy ? reward.energy : 0;
    entry.crystal = reward.crystal ? reward.crystal : 0;

    let time = [Math.floor(req.clear_time / 1000 / 60), Math.floor(req.clear_time / 1000 % 60)];
    entry.time = `${time[0]}:${time[1]}`;

    if (reward.crate) {
      entry.mana = reward.crate.mana ? entry.mana + reward.crate.mana : entry.mana;
      entry.energy = reward.crate.energy ? entry.energy + reward.crate.energy : entry.energy;
      entry.crystal = reward.crate.crystal ? entry.crystal + reward.crate.crystal : entry.crystal;

      if (reward.crate.rune) {
        let rune = reward.crate.rune;
        entry.drop = 'Rune';
        entry.grade = `${rune.class}*`;
        entry.sell_value = rune.sell_value;
        entry.set = gMapping.rune.sets[rune.set_id];
        entry.slot = rune.slot_no;
        entry.efficiency = this.getEfficiency(rune);
        entry.rarity = gMapping.rune.class[rune.sec_eff.length];
        entry.main_stat = gMapping.getRuneEffect(rune.pri_eff);
        entry.prefix_stat = gMapping.getRuneEffect(rune.prefix_eff);

        rune.sec_eff.forEach((substat, i) => {
          entry['sub' + (i + 1)] = gMapping.getRuneEffect(substat);
        });
      } else {
        entry.drop = this.getItem(reward.crate);
      }
    }

    if (resp.unit_list && resp.unit_list.length > 0) {
      resp.unit_list.forEach((unit, i) => {
        entry['team' + (i + 1)] = gMapping.getMonsterName(unit.unit_master_id);
      });
    }

    if (resp.instance_info)
      entry.drop = 'Secret Dungeon';

    let csvData = [];
    const headers = ['date', 'dungeon', 'result', 'time', 'mana', 'crystal', 'energy', 'drop', 'grade', 'sell_value',
      'set', 'efficiency', 'slot', 'rarity', 'main_stat', 'prefix_stat', 'sub1', 'sub2', 'sub3', 'sub4', 'team1', 'team2', 'team3', 'team4', 'team5'];

    const filename = sanitize(`${wizard_name}-${wizard_id}-runs.csv`);

    fs.ensureFile(path.join(config.Config.App.filesPath, filename), err => {
      csv.fromPath(path.join(config.Config.App.filesPath, filename), { ignoreEmpty: true, headers: headers, renameHeaders: true }).on('data', function (data) {
        csvData.push(data);
      }).on('end', function () {
        csvData.push(entry);
        csv.writeToPath(path.join(config.Config.App.filesPath, filename), csvData, { headers: headers }).on("finish", function () {

        });
      });
    })
    
  }
}
