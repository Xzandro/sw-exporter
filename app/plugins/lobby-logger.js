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
    pluginDescription: 'Creates local json file and saves data of any visited lobby.',
    temp: {},
    wizardId: false,
    pagesRead: [],
    init(proxy, config) {
        proxy.on('apiCommand', (req, resp) => {
            try {
                if (config.Config.Plugins[this.pluginName].enabled) {
                    const {
                        command
                    } = req;

                    if (command === 'GetLobbyInfo') {
                        this.log_lobby(proxy, req, resp);
                    }

                    if (command === 'GetLobbyWizardLog') {
                        this.log_lobby_pages(proxy, req, resp);
                    }
                }
            } catch (e) {
                proxy.log({
                    type: 'error',
                    source: 'plugin',
                    name: this.pluginName,
                    message: `An unexpected error occured: ${e.message}`
                });
            }
        });
    },

    saveToFile(entry, filename, headers, proxy) {
        var obj;
        if (fs.existsSync(config.Config.App.filesPath + "\\" + filename)) {
            var obj = fs.readFileSync(config.Config.App.filesPath + "\\" + filename, 'utf8');
            obj = JSON.parse(obj);
            obj.push(entry);

            let outFile = fs.createWriteStream(
                path.join(config.Config.App.filesPath, filename), {
                    flags: 'w',
                    autoClose: true
                }
            );

            outFile.write(JSON.stringify(obj, true, 2));
            outFile.end();
        } else {
            obj = [];
            obj.push(entry);

            let outFile = fs.createWriteStream(
                path.join(config.Config.App.filesPath, filename), {
                    flags: 'w',
                    autoClose: true
                }
            );

            outFile.write(JSON.stringify(obj, true, 2));
            outFile.end();
        }
    },

    log_lobby(proxy, req, resp) {
        console.log("lobby");
        const {
            command
        } = req;
        const {
            lobby_info: Lobby
        } = resp;

        if (this.wizardId !== Lobby.chat_wizard_uid) {
            this.reset();
            this.wizardId = Lobby.chat_wizard_uid;
        }

        this.pagesRead.push(0);
        this.temp = Object.assign(this.temp, Lobby);
    },

    log_lobby_pages(proxy, req, resp) {
        const {
            command
        } = req;
        const {
            lobby_wizard_log: Log
        } = resp;
        const {
            page_no: pageNumber,
            wizard_id: wizardId
        } = Log;
        let entry = {};

        if (this.pagesRead.length === 0) {
            this.pagesRead.push(0);
            const entrySelf = {
                name: Log.wizard_name,
                wizard_id: Log.wizard_id
            };
            this.temp = Object.assign(this.temp, entrySelf);
        }

        if (pageNumber === 1) {
            entry["page_1"] = Log;
        }

        if (pageNumber === 2) {
            entry["page_2"] = Log;
        }

        if (pageNumber === 3) {
            entry["page_3"] = Log;
        }

        if (this.pagesRead.indexOf(pageNumber) === -1) {
            this.temp = Object.assign(this.temp, entry);
            this.pagesRead.push(pageNumber);
        }

        if (this.pagesRead.length === 4) {
            console.log(this.temp);
            proxy.log({
                type: 'success',
                source: 'plugin',
                name: this.pluginName,
                message: `Data logged for: ${this.wizardId}`
            });

            const filename = sanitize('lobby.json');
            this.saveToFile(this.temp, filename, proxy);
            this.reset();
        }
    },

    reset() {
        this.temp = {};
        this.pagesRead = [];
        this.wizardId = false;
    }
};