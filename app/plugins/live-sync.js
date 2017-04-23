const fs = require('fs-extra');
const path = require('path');
const eol = require('os').EOL;

module.exports = {
  defaultConfig: {
    enabled: false
  },
  pluginName: 'LiveSync',
  pluginDescription: 'Keep SWOP synched with SW.',
  init(proxy) {
    proxy.on('apiCommand', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        this.processCommand(proxy, req, resp);
      }
    });
  },
  processCommand(proxy, req, resp) {
    const { command }  = req;

    switch (command) {
      case 'BattleRiftOfWorldsRaidResult':
        this.logRaid(proxy, req, resp)
        break;
      case 'SellRuneCraftItem':
        this.logSellCraft(proxy, req, resp)
        break;
      case 'BattleDungeonResult':
      case 'BattleScenarioResult':
        this.logDungeon(proxy, req, resp)
        break;
      case 'SellRune':
        this.logSellRune(proxy, req, resp)
        break;
      case 'UpgradeRune':
        this.logUpgradeRune(proxy, req, resp)
        break;
      case 'EquipRune':
        this.logEquipRune(proxy, req, resp)
        break;
      case 'UnequipRune':
        this.logUnequipRune(proxy, req, resp)
        break;
      case 'AmplifyRune':
        this.logAmplifyRune(proxy, req, resp)
        break;
      case 'BuyBlackMarketItem':
        this.logBuyRune(proxy, req, resp)
        break;
      case 'BuyShopItem':
        this.logCraftRune(proxy, req, resp)
        break;
      case 'ConfirmRune':
        this.logReappraiseRune(proxy, req, resp)
        break;
      default:
        break;
    }
  },

  saveAction(proxy, wizard_id, timestamp, action, content) {
    let result = { wizard_id: wizard_id, timestamp: timestamp, action: action, type: 'raw' };
    result = Object.assign(result, content);

    const filename = `${wizard_id}-live-${timestamp}`.concat('.json');
    fs.ensureDirSync(path.join(config.Config.App.filesPath, 'live'));

    var outFile = fs.createWriteStream(
      path.join(config.Config.App.filesPath, 'live', filename), {
        flags: 'w',
        autoClose: true
      }
    );

    outFile.write(JSON.stringify(result, true, 2));
    outFile.end();
    proxy.log({ type: 'success', source: 'plugin', name: this.pluginName, message: `File ${filename} created.` });
  },

  logDungeon(proxy, req, resp) {
    const winOrLost = resp.win_lose == 1 ? 'Win' : 'Lost';

    if (winOrLost === 'Win') {
      const reward = resp.reward ? resp.reward : {};

      if (reward.crate && reward.crate.rune) {
        this.saveAction(proxy, req.wizard_id, resp.tvalue, 'new_rune', { rune: reward.crate.rune });
      }
    }
  },

  logBuyRune(proxy, req, resp) {
    if (resp.runes && resp.runes.length === 1) {
      this.saveAction(proxy, req.wizard_id, resp.tvalue, 'new_rune', { rune: resp.runes[0] });
    }
  },

  logCraftRune(proxy, req, resp) {
    if (resp.reward && resp.reward.crate && resp.reward.crate.runes) {
      this.saveAction(proxy, req.wizard_id, resp.tvalue, 'new_rune', { rune: resp.reward.crate.runes[0] });
    }
  },

  logReappraiseRune(proxy, req, resp) {
    this.saveAction(proxy, req.wizard_id, resp.tvalue, 'reappraise_rune', { rune: resp.rune });
  },

  logAmplifyRune(proxy, req, resp) {
    this.saveAction(proxy, req.wizard_id, resp.tvalue, 'amplify_rune', { rune_id: req.rune_id, craft_id: req.craft_item_id, rune: resp.rune });
  },

  logEquipRune(proxy, req, resp) {
    this.saveAction(proxy, req.wizard_id, resp.tvalue, 'equip_rune', { rune_id: req.rune_id, mob_id: req.unit_id });
  },

  logUnequipRune(proxy, req, resp) {
    this.saveAction(proxy, req.wizard_id, resp.tvalue, 'unequip_rune', { rune_id: req.rune_id });
  },

  logUpgradeRune(proxy, req, resp) {
    const original_level = req.upgrade_curr;
    const new_level = resp.rune.upgrade_curr;

    if (new_level > original_level)
      this.saveAction(proxy, req.wizard_id, resp.tvalue, 'upgrade_rune', { rune: resp.rune });
  },

  logSellRune(proxy, req, resp) {
    this.saveAction(proxy, req.wizard_id, resp.tvalue, 'sell_rune', { rune_id_list: req.rune_id_list });
  },

  logSellCraft(proxy, req, resp) {
    this.saveAction(proxy, req.wizard_id, resp.tvalue, 'sell_craft', { craft_id_list: req.craft_item_id_list });
  },

  logRaid(proxy, req, resp) {
    const wizard_id = resp.wizard_info.wizard_id;
    const winOrLost = resp.win_lose == 1 ? 'Win' : 'Lost';

    if (winOrLost === 'Win') {
      for (let reward_id in resp.battle_reward_list) {
        if (wizard_id == resp.battle_reward_list[reward_id].wizard_id) {
          let reward = resp.battle_reward_list[reward_id].reward_list[0] || {};
          
          if (reward.item_master_type == 27) {
            const craft_info = resp.reward.crate.runecraft_info;
            this.saveAction(proxy, wizard_id, resp.tvalue, 'new_craft', { craft: craft_info });
            break;
          }
        }
      }
    }
  }
}