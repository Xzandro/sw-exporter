const fs = require('fs-extra');
const path = require('path');

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
    const { command } = req;

    switch (command) {
      case 'BattleRiftOfWorldsRaidResult':
        this.logRaid(proxy, req, resp);
        break;
      case 'SellRuneCraftItem':
        this.logSellCraft(proxy, req, resp);
        break;
      case 'BattleDungeonResult':
      case 'BattleScenarioResult':
      case 'BattleDimensionHoleDungeonResult':
        this.logDungeon(proxy, req, resp);
        break;
      case 'BattleDungeonResult_V2':
        this.logDungeonV2(proxy, req, resp);
        break;
      case 'SellRune':
        this.logSellRune(proxy, req, resp);
        break;
      case 'UpgradeRune':
        this.logUpgradeRune(proxy, req, resp);
        break;
      case 'EquipRune':
        this.logEquipRune(proxy, req, resp);
        break;
      case 'UnequipRune':
        this.logUnequipRune(proxy, req, resp);
        break;
      case 'AmplifyRune':
      case 'AmplifyRune_v2':
        this.logAmplifyRune(proxy, req, resp);
        break;
      case 'ConvertRune':
      case 'ConvertRune_v2':
        this.logConvertRune(proxy, req, resp);
        break;
      case 'BuyBlackMarketItem':
        this.logBuyRune(proxy, req, resp);
        break;
      case 'BuyShopItem':
        this.logCraftRune(proxy, req, resp);
        break;
      case 'ConfirmRune':
        this.logReappraiseRune(proxy, req, resp);
        break;
      case 'EquipRuneList':
        this.logEquipRuneList(proxy, req, resp);
        break;
      default:
        break;
    }
  },

  saveAction(proxy, wizardId, timestamp, action, content) {
    let result = { wizard_id: wizardId, timestamp, action, type: 'raw' };
    result = Object.assign(result, content);

    const filename = `${wizardId}-live-${timestamp}`.concat('.json');
    fs.ensureDirSync(path.join(config.Config.App.filesPath, 'live'));

    const outFile = fs.createWriteStream(path.join(config.Config.App.filesPath, 'live', filename), {
      flags: 'w',
      autoClose: true
    });

    outFile.write(JSON.stringify(result, true, 2));
    outFile.end();
    proxy.log({ type: 'success', source: 'plugin', name: this.pluginName, message: `File ${filename} created.` });
  },

  logDungeon(proxy, req, resp) {
    const winOrLost = resp.win_lose === 1 ? 'Win' : 'Lost';

    if (winOrLost === 'Win') {
      const reward = resp.reward ? resp.reward : {};

      if (reward.crate && reward.crate.rune) {
        this.saveAction(proxy, req.wizard_id, resp.tvalue, 'new_rune', { rune: reward.crate.rune });
      }
    }
  },

  logDungeonV2(proxy, req, resp) {
    const winOrLost = resp.win_lose === 1 ? 'Win' : 'Lost';

    if (winOrLost === 'Win') {
      const rewards = resp.changed_item_list ? resp.changed_item_list : [];

      if (rewards) {
        rewards.forEach(reward => {
          if (reward.type === 8) {
            this.saveAction(proxy, req.wizard_id, resp.tvalue, 'new_rune', { rune: reward.info });
          }
        });
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

  logConvertRune(proxy, req, resp) {
    this.saveAction(proxy, req.wizard_id, resp.tvalue, 'convert_rune', { rune_id: req.rune_id, craft_id: req.craft_item_id, rune: resp.rune });
  },

  logEquipRune(proxy, req, resp) {
    this.saveAction(proxy, req.wizard_id, resp.tvalue, 'equip_rune', { rune_id: req.rune_id, mob_id: req.unit_id });
  },

  logUnequipRune(proxy, req, resp) {
    this.saveAction(proxy, req.wizard_id, resp.tvalue, 'unequip_rune', { rune_id: req.rune_id });
  },

  logEquipRuneList(proxy, req, resp) {
    this.saveAction(proxy, req.wizard_id, resp.tvalue, 'equip_rune_list', {
      equip_rune_id_list: resp.equip_rune_id_list,
      unequip_rune_id_list: resp.unequip_rune_id_list,
      unit_info: resp.unit_info
    });
  },

  logUpgradeRune(proxy, req, resp) {
    const originalLevel = req.upgrade_curr;
    const newLevel = resp.rune.upgrade_curr;

    if (newLevel > originalLevel) {
      this.saveAction(proxy, req.wizard_id, resp.tvalue, 'upgrade_rune', { rune: resp.rune });
    }
  },

  logSellRune(proxy, req, resp) {
    this.saveAction(proxy, req.wizard_id, resp.tvalue, 'sell_rune', { rune_id_list: req.rune_id_list });
  },

  logSellCraft(proxy, req, resp) {
    this.saveAction(proxy, req.wizard_id, resp.tvalue, 'sell_craft', { craft_id_list: req.craft_item_id_list });
  },

  logRaid(proxy, req, resp) {
    const wizardId = resp.wizard_info.wizard_id;
    const winOrLost = resp.win_lose === 1 ? 'Win' : 'Lost';

    if (winOrLost === 'Win') {
      for (const rewardID in resp.battle_reward_list) {
        if (wizardId === resp.battle_reward_list[rewardID].wizard_id) {
          const reward = resp.battle_reward_list[rewardID].reward_list[0] || {};

          if (reward.item_master_type === 27) {
            const changestone = resp.reward.crate.changestones[0] || {};
            this.saveAction(proxy, wizardId, resp.tvalue, 'new_craft', { craft: changestone });
            break;
          }
        }
      }
    }
  }
};
