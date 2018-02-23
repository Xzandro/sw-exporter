module.exports = {
  defaultConfig: {
    enabled: true
  },
  pluginName: 'SiegeDefenders',
  pluginDescription: 'Logs units defending a siege tower.',
  init(proxy) {
    proxy.on('GetGuildSiegeBaseDefenseUnitList', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        this.processCommand(proxy, req, resp);
      }
    });
  },
  processCommand(proxy, req, resp) {
    const { command } = req;
    let message = '<div class="defender">';
    if (!resp.defense_deck_assign_list || resp.defense_deck_assign_list.length === 0) {
      message = message.concat('<div class="title">Tower ' + req.base_number + ' has no defending units</div>');
    } else {
      message = message.concat('<div class="title">Tower ' + resp.defense_deck_assign_list[0].base_number + ' defenders:</div>');
      resp.defense_deck_assign_list.forEach((deck) => {
        message = message.concat('<div class="deck">');
        resp.defense_unit_list.forEach((unit) => {
          if (unit.deck_id === deck.deck_id) {
            message = message.concat(this.logUnit(unit.unit_info));
          }
        });
        message = message.concat('</div>');
      });
    }
    message = message.concat('</div>');
    proxy.log({
      type: 'info',
      source: 'plugin',
      name: this.pluginName,
      message: message
    });
  },

  logUnit(unit) {
    const starHtml = this.mountStarsHtml(unit);
    return `<div>
              <span class="name">${gMapping.getMonsterName(unit.unit_master_id)}</span>
              ${starHtml}
              <span class="level">${unit.unit_level}</span></div>`;
  },

  mountStarsHtml(unit) {
    let count = 0;
    let html = '';
    const un = gMapping.monster.names[unit.unit_master_id] ? '' : 'un';

    while (count < unit.class) {
      html = html.concat('<span class="star"><img src="../assets/icons/star-' + un + 'awakened.png" /></span>');
      count += 1;
    }

    return html;
  }

};
