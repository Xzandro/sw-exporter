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
    let runes_info = [];

    // Extract the rune and display it's efficiency stats.
    switch (command) {
      case 'BattleDungeonResult':
      case 'BattleScenarioResult':
        if (resp.win_lose == 1) {
          const reward = resp.reward ? resp.reward : {};

          if (reward.crate && reward.crate.rune) {
            runes_info.push(this.logRuneDrop(reward.crate.rune));
          }
        }
        break;
        
      case 'UpgradeRune':
        const original_level = req.upgrade_curr;
        const new_level = resp.rune.upgrade_curr;

        // Only log if we hit a substat upgrade level and it was successful
        if (new_level > original_level && new_level % 3 == 0 && new_level <= 12){
          runes_info.push(this.logRuneDrop(resp.rune));
        }
        break;

      case 'AmplifyRune':
      case 'ConfirmRune':
        runes_info.push(this.logRuneDrop(resp.rune));
        break;

      case 'BuyBlackMarketItem':
        if (resp.runes && resp.runes.length === 1)
          runes_info.push(this.logRuneDrop(resp.runes[0]));
        break;

      case 'BuyShopItem':
        if (resp.reward && resp.reward.crate && resp.reward.crate.runes)
          runes_info.push(this.logRuneDrop(resp.reward.crate.runes[0]));
        break;

      case 'GetBlackMarketList':
        resp.market_list.forEach((item, i) => {
          if (item.item_master_type == 8 && item.runes) {
            runes_info.push(this.logRuneDrop(item.runes[0]));
          }
        });
        break;

      case 'BattleWorldBossResult':
        const reward = resp.reward ? resp.reward : {};

        if (reward.crate && reward.crate.runes) {
          reward.crate.runes.forEach((rune, i) => {
            runes_info.push(this.logRuneDrop(rune));
          });
        }
        break;

      case 'BattleRiftDungeonResult':
        resp.item_list.forEach((item, i) => {
          if (item.type == 8) {
            runes_info.push(this.logRuneDrop(item.info));
          }
        });
        break;
        
      default:
        break;
    }

    if (runes_info.length > 0) {
      proxy.log({
        type: 'info',
        source: 'plugin',
        name: this.pluginName,
        message: this.mountRuneListHtml(runes_info)
      });
    }
  },

  logRuneDrop(rune) {
    const efficiency = gMapping.getRuneEfficiency(rune);
    const rune_quality = gMapping.rune.quality[rune.rank];
    const color_table = {
      "Common": "grey",
      "Magic": "green",
      "Rare": "blue",
      "Hero": "purple",
      "Legend": "orange"
    };

    let color = color_table[rune_quality];
    let star_html = this.mountStarsHtml(rune);

    return `<div class="rune item">
              <div class="ui image ${color} label">
                <img src="../assets/runes/${gMapping.rune.sets[rune.set_id]}.png" />
                <span class="upgrade">+${rune.upgrade_curr}</span>  
              </div>

              <div class="content">
                ${star_html}
                <div class="header">${gMapping.rune.sets[rune.set_id]} Rune (${rune.slot_no}) ${gMapping.rune.effectTypes[rune.pri_eff[0]]}</div>
                <div class="description">Efficiency: ${efficiency.current}%. ${rune.upgrade_curr < 12 ? 'Max: ' + efficiency.max + '%': ''}</div>
              </div>
            </div>`;
  },

  mountStarsHtml(rune) {
    let count = 0;
    let html = '<div class="star-line">';

    while (count < rune.class) {
      html = html.concat('<span class="star"><img src="../assets/icons/star-unawakened.png" /></span>');
      count++;
    }

    return html.concat('</div>');
  },

  mountRuneListHtml(runes) {
    let message = '<div class="runes ui list relaxed">';

    runes.forEach((rune, i) => {
      message = message.concat(rune);   
    });

    return message.concat('</div>');
  }
}
