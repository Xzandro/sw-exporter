const EventEmitter = require('events');
const { app } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const net = require('net');
const url = require('url');
const uuidv4 = require('uuid/v4');
const Proxy = require('http-mitm-proxy');

const { decrypt_request, decrypt_response } = require('./smon_decryptor');

class SWProxy extends EventEmitter {
  constructor() {
    super();
    this.httpServer = null;
    this.proxy = null;
    this.logEntries = [];
    this.addresses = [];
  }
  start(port) {
    const self = this;
    this.proxy = Proxy();

    this.proxy.onError(function (ctx, e, errorKind) {
      if (e.code === 'EADDRINUSE') {
        self.log({ type: 'warning', source: 'proxy', message: 'Port is in use from another process. Try another port.' });
      }
    });

    this.proxy.onRequest(function (ctx, callback) {
      if (ctx.clientToProxyRequest.url.includes('/api/gateway_c2.php')) {
        ctx.use(Proxy.gunzip);
        ctx.SWRequestChunks = [];
        ctx.SWResponseChunks = [];
        ctx.onRequestData(function (ctx, chunk, callback) {
          ctx.SWRequestChunks.push(chunk);
          return callback(null, chunk);
        });

        ctx.onResponseData(function (ctx, chunk, callback) {
          ctx.SWResponseChunks.push(chunk);
          return callback(null, chunk);
        });
        ctx.onResponseEnd(function (ctx, callback) {
          let reqData;
          let respData;

          try {
            reqData = decrypt_request(Buffer.concat(ctx.SWRequestChunks).toString());
            respData = decrypt_response(Buffer.concat(ctx.SWResponseChunks).toString());
          } catch (e) {
            // Error decrypting the data, log and do not fire an event
            self.log({ type: 'debug', source: 'proxy', message: `Error decrypting request data - ignoring. ${e}` });
            return callback();
          }

          const { command } = respData;
          if (config.Config.App.clearLogOnLogin && (command === 'HubUserLogin' || command === 'GuestLogin')) {
            self.clearLogs();
          }

          // Emit events, one for the specific API command and one for all commands
          self.emit(command, reqData, respData);
          self.emit('apiCommand', reqData, respData);
          return callback();
        });
      }
      return callback();
    });
    this.proxy.onConnect(function (req, socket, head, callback) {
      const serverUrl = url.parse(`https://${req.url}`);
      if (req.url.includes('qpyou.cn') && config.Config.App.httpsMode) {
        return callback();
      } else {
        const srvSocket = net.connect(serverUrl.port, serverUrl.hostname, () => {
          socket.write('HTTP/1.1 200 Connection Established\r\n' + 'Proxy-agent: Node-Proxy\r\n' + '\r\n');
          srvSocket.pipe(socket);
          socket.pipe(srvSocket);
        });
        srvSocket.on('error', () => {});

        socket.on('error', () => {});
      }
    });
    this.proxy.listen({ port, sslCaDir: path.join(app.getPath('userData'), 'swcerts') }, (e) => {
      this.log({ type: 'info', source: 'proxy', message: `Now listening on port ${port}` });
    });

    if (process.env.autostart) {
      console.log(`SW Exporter Proxy is listening on port ${port}`);
    }
    win.webContents.send('proxyStarted');
  }

  stop() {
    this.proxy.close();
    this.proxy = null;
    win.webContents.send('proxyStopped');
    this.log({ type: 'info', source: 'proxy', message: 'Proxy stopped' });
  }

  getInterfaces() {
    this.addresses = [];
    const interfaces = os.networkInterfaces();
    for (const k in interfaces) {
      for (const k2 in interfaces[k]) {
        const address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
          this.addresses.push(address.address);
        }
      }
    }
    return this.addresses;
  }

  isRunning() {
    if (this.proxy) {
      return true;
    }
    return false;
  }

  log(entry) {
    if (!entry) {
      return;
    }

    // add unique id for performance reasons
    entry.id = uuidv4();

    entry.date = new Date().toLocaleTimeString();
    this.logEntries = [entry, ...this.logEntries];

    const maxLogEntries = parseInt(config.Config.App.maxLogEntries) || 0;
    if (this.logEntries.length > maxLogEntries && maxLogEntries !== 0) {
      this.logEntries.pop();
    }

    win.webContents.send('logupdated', this.logEntries);
  }

  getLogEntries() {
    return this.logEntries;
  }

  clearLogs() {
    this.logEntries = [];
    win.webContents.send('logupdated', this.logEntries);
  }
}

module.exports = SWProxy;
