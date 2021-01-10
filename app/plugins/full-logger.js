const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const eol = require('os').EOL;

module.exports = {
  defaultConfig: {
    enabled: false,
    deleteFileOnQuit: false,
  },
  defaultConfigDetails: {
    deleteFileOnQuit: { label: 'Delete log file before quitting app' },
  },
  pluginName: 'FullLogger',
  pluginDescription: 'Dumps data for every API event into a file.',
  init(proxy, config) {
    proxy.on('apiCommand', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        this.logCommand(req, resp);
      }
    });
    app.on('will-quit', () => {
      if (config.Config.Plugins[this.pluginName].deleteFileOnQuit) {
        fs.unlinkSync(path.join(config.Config.App.filesPath, 'full_log.txt'));
      }
    });
  },
  logCommand(req, resp) {
    const { command } = req;

    let logfile = fs.createWriteStream(path.join(config.Config.App.filesPath, 'full_log.txt'), {
      flags: 'a',
      autoClose: true,
    });

    logfile.write(
      `API Command: ${command}`.concat(
        ' - ',
        Date(),
        eol,
        'Request: ',
        eol,
        JSON.stringify(req),
        eol,
        'Response: ',
        eol,
        JSON.stringify(resp),
        eol,
        eol
      )
    );

    logfile.end();
  },
};
