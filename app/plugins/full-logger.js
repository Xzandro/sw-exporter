const fs = require('fs');
const eol = require('os').EOL;

module.exports = {
  defaultConfig: {
    enabled: true
  },
  pluginName: 'FullLogger',
  init(proxy) {
    proxy.on('apiCommand', (req, resp) => {
      this.logCommand(req, resp);
    });
  },
  logCommand(req, resp) {
    const {command} = req;

    var logfile = fs.createWriteStream(
      'full_log.txt', {
        flags: 'a',
        autoClose: true
      }
    );

    logfile.write(
      `API Command: ${command}`.concat(' - ', Date(), eol,
      'Request: ', eol,
      JSON.stringify(req), eol,
      'Response: ', eol,
      JSON.stringify(resp), eol, eol
    ));

    logfile.end();
  }
}