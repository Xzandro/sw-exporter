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
      if (config.Config.Plugins[this.pluginName].enabled) {
        const { command, wizard_id } = req;

        if (!this.temp[wizard_id])
          this.temp[wizard_id] = {};

        if (command === 'BattleScenarioStart')
          this.temp[wizard_id].stage = gMapping.scenario[req.region_id] ? `${gMapping.scenario[req.region_id]} ${gMapping.difficulty[req.difficulty]} - ${req.stage_no}` : 'Unknown';

        if (command === 'BattleScenarioResult' || command === 'BattleDungeonResult')
          this.log(proxy, req, resp);

        if (command === 'BattleRiftOfWorldsRaidResult')
          this.log_raid_rift(proxy, req, resp);

        if (command === 'BattleRiftDungeonResult'){
          this.log_elemental_rift(proxy, req, resp);
        }
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
      let grade = Number(id.slice(1, -3));
      return `Essence of ${gMapping.essence.attribute[attribute]}(${gMapping.essence.grade[grade]}) x${crate.material.item_quantity}`;
    }
    if (crate.craft_stuff && gMapping.craftMaterial[crate.craft_stuff.item_master_id])
      return `${gMapping.craftMaterial[crate.craft_stuff.item_master_id]} x${crate.craft_stuff.item_quantity}`;
    if (crate.summon_pieces)
      return `Summoning Piece ${gMapping.getMonsterName(crate.summon_pieces.item_master_id)} x${crate.summon_pieces.item_quantity}`;
    
    return 'Unknown Drop';
  },

  getItemRift(item, entry){
    if (item.type === 8){
      let rune = item.info;
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
        entry['sub' + (i + 1)] = gMapping.getRuneEffect(substat);
      });
    }
    if (item.info.craft_type_id){
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

  saveToFile(entry, filename, headers, proxy){
    let csvData = [];
    const self = this;
    fs.ensureFile(path.join(config.Config.App.filesPath, filename), err => {
      csv.fromPath(path.join(config.Config.App.filesPath, filename), { ignoreEmpty: true, headers: headers, renameHeaders: true }).on('data', function (data) {
        csvData.push(data);
      }).on('end', function () {
        csvData.push(entry);
        csv.writeToPath(path.join(config.Config.App.filesPath, filename), csvData, { headers: headers }).on("finish", function () {
          proxy.log({ type: 'success', source: 'plugin', name: self.pluginName, message: `Saved run data to ${filename}` });
        });
      });
    })
  },

  log(proxy ,req, resp) {
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

    if (req.clear_time) {
      let seconds = Math.floor(req.clear_time / 1000 % 60) < 10 ? '0' + Math.floor(req.clear_time / 1000 % 60) : Math.floor(req.clear_time / 1000 % 60);
      let time = [Math.floor(req.clear_time / 1000 / 60), seconds];
      entry.time = `${time[0]}:${time[1]}`;
    }

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
        entry.efficiency = gMapping.getRuneEfficiency(rune).current;
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

    const headers = ['date', 'dungeon', 'result', 'time', 'mana', 'crystal', 'energy', 'drop', 'grade', 'sell_value',
      'set', 'efficiency', 'slot', 'rarity', 'main_stat', 'prefix_stat', 'sub1', 'sub2', 'sub3', 'sub4', 'team1', 'team2', 'team3', 'team4', 'team5'];

    const filename = sanitize(`${wizard_name}-${wizard_id}-runs.csv`);
    this.saveToFile(entry, filename, headers, proxy);
  },

  log_raid_rift(proxy, req, resp){
    const { command } = req;
    const { wizard_id, wizard_name } = resp.wizard_info;

    let entry = {};
    if (gMapping.dungeon[req.dungeon_id]) {
      entry.dungeon = `${gMapping.elemental_rift_dungeon[req.dungeon_id]}`;
      isElemental = true;
    }

    let winLost = resp.win_lose === 1 ? 'Win' : 'Did not kill';

    entry.date = dateFormat(new Date(), 'yyyy-mm-dd HH:MM');
    entry.result = winLost;

    let reward = resp.reward ? resp.reward : {};
    
    if (winLost < 1 && resp.reward.crate === 'undefined'){
        entry.drop = "Mana"
    }
    if (reward.crate.runecraft_info){
      let item = {};
      item["info"] = {};
      item.info["craft_type"] = reward.crate.runecraft_info.craft_type;
      item.info["craft_type_id"] = reward.crate.runecraft_info.craft_type_id;
      entry = this.getItemRift(item, entry);
    }
    if (reward.crate.rune){
      entry = this.getItemRift(reward.crate.rune, entry);
    }
    if (reward.crate.unit_info.unit_master_id > 0 ){
      entry.drop = `${gMapping.getMonsterName(reward.crate.unit_info.unit_master_id)} ${reward.crate.unit_info.class}`;
    }
    else{
      entry.drop = this.getItem(reward.crate);
    }

  if (resp.unit_list && resp.unit_list.length > 0) {
    resp.unit_list.forEach((unit, i) => {
      entry['team' + (i + 1)] = gMapping.getMonsterName(unit.unit_master_id);
    });
  }
    const headers = ['date', 'dungeon', 'result', 'time', 'item1', 'item2', 'item3', 'drop', 'grade', 'sell_value',
      'set', 'efficiency', 'slot', 'rarity', 'main_stat', 'prefix_stat', 'sub1', 'sub2', 'sub3', 'sub4', 'team1', 'team2', 'team3', 'team4', 'team5', 'team6'];

    const filename = sanitize(`${wizard_name}-${wizard_id}-raid-runs.csv`);
    this.saveToFile(entry, filename, headers, proxy);
  },

  log_elemental_rift(proxy ,req, resp) {
    const { command } = req;
    const { wizard_id, wizard_name } = resp.wizard_info;

    let entry = {};
    if (gMapping.dungeon[req.dungeon_id]) {
      entry.dungeon = `${gMapping.elemental_rift_dungeon[req.dungeon_id]}`;
      isElemental = true;
    }

    let winLost = req.battle_result == 1 ? 'Win' : 'Did not kill';

    entry.date = dateFormat(new Date(), 'yyyy-mm-dd HH:MM');
    entry.result = winLost;


    if (resp.item_list && resp.item_list.length >0){
      resp.item_list.forEach((item, i) => {
        if ( item.is_boxing !== 1 || item.id === 2001){
          entry['item' + (i+1)] = `${gMapping.craftMaterial[item.id]}` + 'x ' + item.quantity; 
        }
        else{
          if (item.id === 2){
            entry.drop = "Mystical Scroll";
          }
          if (item.id === 8){
            entry.drop = `Summoning Stones x${item.item_quantity}`;
          }
          if (item.info.unit_master_id > 0){
            entry.drop = `${gMapping.getMonsterName(item.info.unit_master_id)} ${item.class}`;
          }
          if (item.info.craft_type_id || item.type === 8){
            entry = this.getItemRift(item, entry); 
          }
        }
      })
  }

  if (resp.unit_list && resp.unit_list.length > 0) {
    resp.unit_list.forEach((unit, i) => {
      entry['team' + (i + 1)] = gMapping.getMonsterName(unit.unit_master_id);
    });
  }
    const headers = ['date', 'dungeon', 'result', 'time', 'item1', 'item2', 'item3', 'drop', 'grade', 'sell_value',
      'set', 'efficiency', 'slot', 'rarity', 'main_stat', 'prefix_stat', 'sub1', 'sub2', 'sub3', 'sub4', 'team1', 'team2', 'team3', 'team4', 'team5', 'team6'];

    const filename = sanitize(`${wizard_name}-${wizard_id}-raid-runs.csv`);
    this.saveToFile(entry, filename, headers, proxy);
  },

  getEnchantVals(craft_id, craft_type) {
    var map = {};
    var enhance = this.rune;
    var typeNumber = Number(craft_id.toString().slice(-4, -2))
    map.set =  gmapping.enhance.sets[Number(craft_id.toString().slice(0, -4))];
    map.grade = gmapping.enhance.quality[Number(craft_id.toString().slice(-1))];
    map.type = gmapping.enhance.effectTypes [typeNumber];
    if(craft_type == 2){
      map.min = gmapping.grindstone[typeNumber].range[Number(craft_id.toString().slice(-1))].min;
      map.max = gmapping.grindstone[typeNumber].range[Number(craft_id.toString().slice(-1))].max;
      map.drop = "Grindstone";
    }
    else{
      map.min = gmapping.enchanted_gem[typeNumber].range[Number(craft_id.toString().slice(-1))].min;
      map.max = gmapping.enchanted_gem[typeNumber].range[Number(craft_id.toString().slice(-1))].max;
      map.drop = "Enchanted Gem";
    }
    return map;
  }
}
