const fs = require('fs');
const path = require('path');
const sanitize = require('sanitize-filename');

module.exports = {
  defaultConfig: {
    enabled: false,
    sortData: true,
  },
  defaultConfigDetails: {
    sortData: { label: 'Sort data like ingame' },
  },
  pluginName: 'FriendExport',
  pluginDescription: 'Exports monster and rune data from a friend you visited. Not all data is available (ex.: runes in the inventory)!',
  init(proxy, config) {
    proxy.on('VisitFriend', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        if (config.Config.Plugins[this.pluginName].sortData) {
          resp.friend = this.sortUserData(resp.friend);
        }
        this.writeProfileToFile(proxy, req, resp);
      }
    });
  },
  writeProfileToFile(proxy, req, resp) {
    const wizardID = resp.friend.wizard_id;
    const wizardName = resp.friend.wizard_name;
    const filename = sanitize(`${wizardName}-${wizardID}`).concat('-visit.json');

    const outFile = fs.createWriteStream(path.join(config.Config.App.filesPath, filename), {
      flags: 'w',
      autoClose: true,
    });

    outFile.write(JSON.stringify(resp, true, 2));
    outFile.end();
    proxy.log({ type: 'success', source: 'plugin', name: this.pluginName, message: `Saved profile data of friend to file ${filename}` });
  },
  sortUserData(data) {
    // get storage building id
    let storageID;
    for (const building of data.building_list) {
      data.wizard_id = building.wizard_id;
      if (building.building_master_id === 25) {
        storageID = building.building_id;
      }
    }
    // generic sort function
    cmp = function (x, y) {
      return x > y ? 1 : x < y ? -1 : 0;
    };

    // sort monsters
    data.unit_list = data.unit_list.sort((a, b) =>
      cmp(
        [
          cmp(a.building_id === storageID ? 1 : 0, b.building_id === storageID ? 1 : 0),
          -cmp(a.class, b.class),
          -cmp(a.unit_level, b.unit_level),
          cmp(a.attribute, b.attribute),
          cmp(a.unit_id, b.unit_id),
        ],
        [
          cmp(b.building_id === storageID ? 1 : 0, a.building_id === storageID ? 1 : 0),
          -cmp(b.class, a.class),
          -cmp(b.unit_level, a.unit_level),
          cmp(b.attribute, a.attribute),
          cmp(b.unit_id, a.unit_id),
        ]
      )
    );

    // sort runes on monsters
    for (const monster of data.unit_list) {
      // make sure that runes is actually an array (thanks com2us)
      if (monster.runes === Object(monster.runes)) {
        monster.runes = Object.values(monster.runes);
      }

      monster.runes = monster.runes.sort((a, b) => cmp([cmp(a.slot_no, b.slot_no)], [cmp(b.slot_no, a.slot_no)]));
    }

    return data;
  },
};
