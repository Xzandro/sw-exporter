const fs = require('fs-extra');
const csv = require('fast-csv');
const dateFormat = require('dateformat');
const path = require('path');
const sanitize = require('sanitize-filename');

module.exports = {
  defaultConfig: {
    enabled: false,
  },
  defaultConfigDetails: {},
  pluginName: 'LobbyLogger',
  pluginDescription: 'Creates local csv file and saves data of any visited lobby.',
  temp: {},
  wizardId: false,
  pagesRead: [],
  init(proxy, config) {
    proxy.on('apiCommand', (req, resp) => {
      try {
        if (config.Config.Plugins[this.pluginName].enabled) {
          const { command } = req;

          if (command === 'GetLobbyInfo') {
            this.log_lobby(proxy, req, resp);
          }

          if (command === 'GetLobbyWizardLog') {
            this.log_lobby_pages(proxy, req, resp);
          }
        }
      } catch (e) {
        proxy.log({
          type: 'error', source: 'plugin', name: this.pluginName, message: `An unexpected error occured: ${e.message}`
        });
      }
    });
  },

  saveToFile(entry, filename, headers, proxy) {
    const csvData = [];
    const self = this;
    fs.ensureFile(path.join(config.Config.App.filesPath, filename), (err) => {
      if (err) { return; }
      csv.fromPath(path.join(config.Config.App.filesPath, filename), { ignoreEmpty: true, headers, renameHeaders: true }).on('data', (data) => {
        csvData.push(data);
      }).on('end', () => {
        csvData.push(entry);
        csv.writeToPath(path.join(config.Config.App.filesPath, filename), csvData, { headers }).on('finish', () => {
          proxy.log({
            type: 'success', source: 'plugin', name: self.pluginName, message: `Saved lobby data to ${filename}`
          });
        });
      });
    });
  },

  log_lobby(proxy, req, resp) {
    const { command } = req;
    const { lobby_info: Lobby } = resp;

    if (this.wizardId !== Lobby.chat_wizard_uid) {
      this.reset();
      this.wizardId = Lobby.chat_wizard_uid;
    }

    const entry = {
      name: Lobby.chat_wizard_name,
      level: Lobby.chat_wizard_level,
      guild: Lobby.guild_name,
      arena_rating: gMapping.arenaRatings[Lobby.chat_wizard_rating_id],
    };

    if (Lobby.rep_unit && Object.keys(Lobby.rep_unit).length > 0) {
      const monsterName = gMapping.getMonsterName(Lobby.rep_unit.unit_master_id);

      entry.rep = `${monsterName} - ${Lobby.rep_unit.unit_class} ★`;
    }

    if (Lobby.arena_defense_unit_list && Lobby.arena_defense_unit_list.length > 0) {
      entry.arena_defense = 'Team';

      Lobby.arena_defense_unit_list.forEach((ad, i) => {
        const monsterName = gMapping.getMonsterName(ad.unit_info.unit_master_id);

        entry.arena_defense += `\n ${monsterName} - ${ad.unit_info.unit_class} ★`;
      });
    }

    if (Lobby.lobby_proud_unit_list && Lobby.lobby_proud_unit_list.length > 0) {
      Lobby.lobby_proud_unit_list.forEach((proud, i) => {
        const monsterName = gMapping.getMonsterName(proud.unit_info.unit_master_id);

        entry.proud = `${monsterName} - ${proud.unit_info.unit_class} ★`;
      });
    }

    this.pagesRead.push(0);
    this.temp = Object.assign(this.temp, entry);
  },

  log_lobby_pages(proxy, req, resp) {
    const { command } = req;
    const { lobby_wizard_log: Log } = resp;
    const { page_no: pageNumber, wizard_id: wizardId } = Log;
    let entry = {};

    if (pageNumber === 1) {
      entry = {
        account_created_at: dateFormat(new Date(Log.account_create_timestamp * 1000), 'yyyy-mm-dd HH:MM'),
        started_play_at: dateFormat(new Date(Log.account_create_timestamp * 1000), 'yyyy-mm-dd HH:MM'),
        arena_best_rating: gMapping.arenaRatings[Log.pvp_best_rating_id],
        // guildwar_best_rating: gMapping.guildWarRating[Lobby.chat_wizard_rating_id],
        // guildsiege_best_rating: gMapping.guildSiegeRating[Lobby.chat_wizard_rating_id],
        world_boss_best_rating: gMapping.ratings[Log.world_boss_best_rank_id],
        toa_normal_best_floor: Log.trial_tower_normal_best_floor,
        toa_hard_best_floor: Log.trial_tower_hard_best_floor
      };

      if (Log.rift_dungeon_clear_info_list && Log.rift_dungeon_clear_info_list.length > 0) {
        Log.rift_dungeon_clear_info_list.forEach((er, i) => {
          const elementalRaid = gMapping.elemental_rift_dungeon[er.rift_dungeon_id];
          entry[elementalRaid] = gMapping.ratings[er.best_rating];
        });
      }
    }

    if (pageNumber === 2) {
      if (Log.dungeon_best_clear_info_list && Log.dungeon_best_clear_info_list.length > 0) {
        Log.dungeon_best_clear_info_list.forEach((dg, i) => {
          const dungeonName = gMapping.dungeon[dg.dungeon_id];
          let bestTime = new Date(0);
          bestTime = dateFormat(bestTime.setSeconds(Math.floor(dg.best_clear_time / 1000)), 'MM:ss');

          entry[dungeonName] = `Stage ${dg.stage_no} - ${bestTime}`;

          if (dg.deck && Object.keys(dg.deck).length > 0) {
            const leaderIndex = dg.deck.leader_index;

            dg.deck.units.forEach((unit, i) => {
              const monsterName = gMapping.getMonsterName(unit.unit_master_id);
              entry[dungeonName] += `\n ${monsterName} - ${unit.unit_class} ★`;
              if (leaderIndex === unit.slot_index) {
                entry[dungeonName] += ' (Leader)';
              }
            });
          }
        });
      }
    }

    if (pageNumber === 3) {
      if (Log.raid_best_clear_info_list && Log.raid_best_clear_info_list.length > 0) {
        const raid = Log.raid_best_clear_info_list[0];
        let bestTime = new Date(0);
        bestTime = dateFormat(bestTime.setSeconds(Math.floor(raid.best_clear_time / 1000)), 'MM:ss');

        entry['Rift of Worlds'] = `Stage ${raid.stage_no} - ${bestTime}`;

        if (raid.deck && Object.keys(raid.deck).length > 0) {
          const leaderIndex = raid.deck.leader_index;

          raid.deck.units.forEach((unit, i) => {
            const monsterName = gMapping.getMonsterName(unit.unit_master_id);
            entry['Rift of Worlds'] += `\n ${monsterName} - ${unit.unit_class} ★`;
            if (leaderIndex === unit.slot_index) {
              entry['Rift of Worlds'] += ' (Leader)';
            }
          });
        }
      }

      if (Log.rift_dungeon_best_clear_info_list && Log.rift_dungeon_best_clear_info_list.length > 0) {
        Log.rift_dungeon_best_clear_info_list.forEach((rd, i) => {
          const dungeonName = gMapping.elemental_rift_dungeon[rd.rift_dungeon_id];
          const dungeonRating = gMapping.ratings[rd.best_rating];
          const totalDamage = rd.best_damage;
          let bestTime = new Date(0);
          bestTime = dateFormat(bestTime.setSeconds(Math.floor(rd.best_clear_time / 1000)), 'MM:ss');

          entry[dungeonName] = `${dungeonRating} - ${bestTime}\nTotal Damage: ${totalDamage}`;

          if (rd.deck && Object.keys(rd.deck).length > 0) {
            const leaderIndex = rd.deck.leader_index;

            rd.deck.my_unit_list.forEach((unit, i) => {
              const monsterName = gMapping.getMonsterName(unit[2]);
              entry[dungeonName] += `\n ${monsterName} - ${unit[3]} ★`;
              if (leaderIndex === unit[0]) {
                entry[dungeonName] += ' (Leader)';
              }
            });
          }
        });
      }
    }

    if (this.pagesRead.indexOf(pageNumber) === -1) {
      this.temp = Object.assign(this.temp, entry);
      this.pagesRead.push(pageNumber);
    }

    if (this.pagesRead.length === 4) {
      const headers = [
        'name', 'level', 'guild', 'arena_rating',
        'account_created_at', 'started_play_at',
        'arena_best_rating', 'world_boss_best_rating',
        'rep', 'arena_defense', 'proud',
        'toa_normal_best_floor', 'toa_hard_best_floor',
        'Hall of Dark', 'Hall of Fire',
        'Hall of Water', 'Hall of Wind',
        'Hall of Magic', 'Hall of Light',
        'Giant\'s Keep', 'Dragon\'s Lair',
        'Necropolis', 'Rift of Worlds',
        'Rift Dungeon - Ice Beast', 'Rift Dungeon - Fire Beast',
        'Rift Dungeon - Wind Beast', 'Rift Dungeon - Light Beast',
        'Rift Dungeon - Dark Beast'
      ];

      const filename = sanitize('lobby.csv');
      this.saveToFile(this.temp, filename, headers, proxy);
      this.reset();
    }
  },

  reset() {
    this.temp = {};
    this.pagesRead = [];
    this.wizardId = false;
  }
};
