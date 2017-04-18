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
    var rune_info;

    // Extract the rune and display it's efficiency stats.
    switch (command) {
      case 'BattleDungeonResult':
      case 'BattleScenarioResult':
        if (resp.win_lose == 1) {
          const reward = resp.reward ? resp.reward : {};

          if (reward.crate && reward.crate.rune) {
            rune_info = this.logRuneDrop(reward.crate.rune);
          }
        }
        break;
        
      case 'UpgradeRune':
        const original_level = req.upgrade_curr;
        const new_level = resp.rune.upgrade_curr;

        // Only log if we hit a substat upgrade level and it was successful
        if (new_level > original_level && new_level % 3 == 0 && new_level <= 12){
          rune_info = this.logRuneDrop(resp.rune);
        }
        break;
      case 'AmplifyRune':
      case 'ConfirmRune':
        rune_info = this.logRuneDrop(resp.rune);
        break;

      case 'BuyBlackMarketItem':
        rune_info = this.logRuneDrop(resp.runes[0]);
        break;

      case 'BuyShopItem':
        rune_info = this.logRuneDrop(resp.reward.crate.runes[0]);
        break;

      default:
        break;
    }

    if (rune_info !== undefined) {
      proxy.log({
        type: 'info',
        source: 'plugin',
        name: this.pluginName,
        message: rune_info
      });
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

    return `<div class="ui image ${color !== undefined ? color : '' } label">
              <img src="../assets/runes/${gMapping.rune.sets[rune.set_id]}.png" />
              + ${rune.upgrade_curr} ${gMapping.rune.sets[rune.set_id]} Rune
            </div>
            Efficiency: ${efficiency.current}%. ${rune.upgrade_curr < 12 ? 'Max: ' + efficiency.max + '%': ''}
            `;
  }
}
