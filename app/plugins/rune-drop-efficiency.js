module.exports = {
  defaultConfig: {
    enabled: true
  },
  pluginName: 'RuneDropEfficiency',
  pluginDescription: 'Logs the maximum possible efficiency for runes as they drop.',
  init(proxy) {
    proxy.on('apiCommand', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        this.processCommand(proxy, req, resp);
      }
    });
  },
  processCommand(proxy, req, resp) {
    const { command } = req;
    let runesInfo = [];

    // Extract the rune and display it's efficiency stats.
    switch (command) {
      case 'BattleDungeonResult':
      case 'BattleScenarioResult':
      case 'BattleDimensionHoleDungeonResult':
        if (resp.win_lose === 1) {
          const reward = resp.reward ? resp.reward : {};

          if (reward.crate && reward.crate.rune) {
            runesInfo.push(this.logRuneDrop(reward.crate.rune));
          }
        }
        break;
      case 'BattleDungeonResult_V2':
        if (resp.win_lose === 1) {
          const rewards = resp.changed_item_list ? resp.changed_item_list : [];

          if (rewards) {
            rewards.forEach(reward => {
              if (reward.type === 8) {
                runesInfo.push(this.logRuneDrop(reward.info));
              }
            });
          }
        }
        break;
      case 'UpgradeRune': {
        const originalLevel = req.upgrade_curr;
        const newLevel = resp.rune.upgrade_curr;

        if (newLevel > originalLevel && newLevel % 3 === 0 && newLevel <= 12) {
          runesInfo.push(this.logRuneDrop(resp.rune));
        }
        break;
      }
      case 'AmplifyRune':
      case 'AmplifyRune_v2':
      case 'ConvertRune':
      case 'ConvertRune_v2':
      case 'ConfirmRune':
        runesInfo.push(this.logRuneDrop(resp.rune));
        break;

      case 'BuyBlackMarketItem':
        if (resp.runes && resp.runes.length === 1) {
          runesInfo.push(this.logRuneDrop(resp.runes[0]));
        }
        break;

      case 'BuyGuildBlackMarketItem':
        if (resp.runes && resp.runes.length === 1) {
          runesInfo.push(this.logRuneDrop(resp.runes[0]));
        }
        break;

      case 'BuyShopItem':
        if (resp.reward && resp.reward.crate && resp.reward.crate.runes) {
          runesInfo.push(this.logRuneDrop(resp.reward.crate.runes[0]));
        }
        break;

      case 'GetBlackMarketList':
        resp.market_list.forEach(item => {
          if (item.item_master_type === 8 && item.runes) {
            runesInfo.push(this.logRuneDrop(item.runes[0]));
          }
        });
        break;

      case 'GetGuildBlackMarketList':
        resp.market_list.forEach(item => {
          if (item.item_master_type === 8 && item.runes) {
            runesInfo.push(this.logRuneDrop(item.runes[0]));
          }
        });
        break;

      case 'BattleWorldBossResult': {
        const reward = resp.reward ? resp.reward : {};

        if (reward.crate && reward.crate.runes) {
          reward.crate.runes.forEach(rune => {
            runesInfo.push(this.logRuneDrop(rune));
          });
        }
        break;
      }
      case 'BattleRiftDungeonResult':
        if (resp.item_list) {
          resp.item_list.forEach(item => {
            if (item.type === 8) {
              runesInfo.push(this.logRuneDrop(item.info));
            }
          });
        }
        break;

      default:
        break;
    }

    if (runesInfo.length > 0) {
      proxy.log({
        type: 'info',
        source: 'plugin',
        name: this.pluginName,
        message: this.mountRuneListHtml(runesInfo)
      });
    }
  },

  logRuneDrop(rune) {
    const efficiency = gMapping.getRuneEfficiency(rune);
    const runeQuality = gMapping.rune.quality[rune.rank];
    const colorTable = {
      Common: 'grey',
      Magic: 'green',
      Rare: 'blue',
      Hero: 'purple',
      Legend: 'orange'
    };

    let color = colorTable[runeQuality];
    let starHtml = this.mountStarsHtml(rune);

    return `<div class="rune item">
              <div class="ui image ${color} label">
                <img src="../assets/runes/${gMapping.rune.sets[rune.set_id]}.png" />
                <span class="upgrade">+${rune.upgrade_curr}</span>  
              </div>

              <div class="content">
                ${starHtml}
                <div class="header">${gMapping.isAncient(rune) ? 'Ancient ' : ''}${gMapping.rune.sets[rune.set_id]} Rune (${rune.slot_no}) ${
      gMapping.rune.effectTypes[rune.pri_eff[0]]
    }</div>
                <div class="description">Efficiency: ${efficiency.current}%. ${rune.upgrade_curr < 12 ? `Max: ${efficiency.max}%` : ''}</div>
              </div>
            </div>`;
  },

  mountStarsHtml(rune) {
    let count = 0;
    let html = '<div class="star-line">';
    let runeClass = gMapping.isAncient(rune) ? rune.class - 10 : rune.class;
    while (count < runeClass) {
      html = html.concat('<span class="star"><img src="../assets/icons/star-unawakened.png" /></span>');
      count += 1;
    }

    return html.concat('</div>');
  },

  mountRuneListHtml(runes) {
    let message = '<div class="runes ui list relaxed">';

    runes.forEach(rune => {
      message = message.concat(rune);
    });

    return message.concat('</div>');
  }
};
