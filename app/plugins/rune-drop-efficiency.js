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
    const { command }  = req;
    var runes_info = [];

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
          if (item.item_master_type == 8) {
            runes_info.push(this.logRuneDrop(item.runes[0]));
          }
        });
        break;
        
      default:
        break;
    }

    if (runes_info) {
      var message = '';
      
      runes_info.forEach((rune, i) => {
        message = message.concat(rune);   
      });

      if (message) {
        proxy.log({
          type: 'info',
          source: 'plugin',
          name: this.pluginName,
          message: message
        });
      }
    }
  },

  logRuneDrop(rune) {
    const efficiency = gMapping.getRuneEfficiency(rune);
    let color;
    
    switch(gMapping.rune.quality[rune.rank]) {
      case 'Magic':
        color = 'green';
        break;
      case 'Rare':
        color = 'blue';
        break;
      case 'Hero':
        color = 'purple';
        break;
      case 'Legend':
        color = 'orange';
        break;
      default:
        break;
    }

    var starCount = 0;
    var starType = rune.upgrade_curr == rune.upgrade_limit ? 'awakened' : 'unawakened';
    var starLine = '<div class="star-line">';

    while (starCount < rune.class) {
      starLine = starLine.concat('<span class="star"><img src="../assets/icons/star-'+ starType +'.png" /></span>');
      starCount++;
    }

    starLine = starLine.concat('</div>');

    return `<div class="rune">
              ${starLine}

              <div class="ui image ${color ? color : '' } label">
                <img src="../assets/runes/${gMapping.rune.sets[rune.set_id]}.png" />+${rune.upgrade_curr} ${gMapping.rune.sets[rune.set_id]} Rune (${rune.slot_no}) ${gMapping.rune.effectTypes[rune.pri_eff[0]]}
              </div>

              <div class="efficiency">Efficiency: ${efficiency.current}%. ${rune.upgrade_curr < 12 ? 'Max: ' + efficiency.max + '%': ''}</div>
            </div>`;
  }
}
