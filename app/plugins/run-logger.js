const fs = require('fs-extra');
const csv = require('fast-csv');
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

    entry.date = new Date().toLocaleString();
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
        entry.value = rune.sell_value;
        entry.set = gMapping.rune.sets[rune.set_id];
        entry.slot = rune.slot_no;
        entry.eff = 0;
        entry.rarity = gMapping.rune.class[rune.sec_eff.length];
        entry.main_stat = gMapping.getRuneEffect(rune.pri_eff);
        entry.prefix_stat = gMapping.getRuneEffect(rune.prefix_eff);

        rune.sec_eff.forEach((substat, i) => {
          entry['sub' + (i + 1)] = gMapping.getRuneEffect(substat);
        });
      }
    }

    if (resp.unit_list && resp.unit_list.length > 0) {
      resp.unit_list.forEach((unit, i) => {
        entry['team' + (i + 1)] = gMapping.getMonsterName(unit.unit_master_id);
      });
    }

    let csvData = [];
    const headers = ['date', 'dungeon', 'result', 'time', 'mana', 'crystal', 'energy', 'drop', 'grade', 'value',
      'set', 'eff', 'slot', 'rarity', 'main_stat', 'prefix_stat', 'sub1', 'sub2', 'sub3', 'sub4', 'team1', 'team2', 'team3', 'team4', 'team5'];

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
