const EventEmitter = require('events');
const https = require('https');
const fs = require('fs');
const path = require('path');
const httpProxy = require('http-proxy');
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
    this.proxy = Proxy();
    this.logEntries = [];
    this.addresses = [];
  }
  start(port) {
    const self = this;

    this.proxy.onError(function(ctx, err, errorKind) {
      // ctx may be null
      var url = ctx && ctx.clientToProxyRequest ? ctx.clientToProxyRequest.url : '';
      console.error(errorKind + ' on ' + url + ':', err);
    });

    this.proxy.onRequest(function(ctx, callback) {
      if (ctx.clientToProxyRequest.url.includes('/api/gateway_c2.php')) {
        ctx.chunks = [];
        ctx.onResponseData(function(ctx, chunk, callback) {
          console.log(chunk.toString());
          ctx.chunks.push(chunk.toString());
          return callback(null, chunk);
        });
        ctx.onResponseEnd(function(ctx, callback) {
          let reqData;

          try {
            reqData = decrypt_request(ctx.chunks.join());
          } catch (e) {
            // Error decrypting the data, log and do not fire an event
            //console.log(e)
            self.log({ type: 'debug', source: 'proxy', message: `Error decrypting request data - ignoring. ${e}` });
            return callback();
          }

          const { command } = reqData;
          console.log(command);
          return callback();
        });
      }
      return callback();
    });
    this.proxy.onConnect(function(req, socket, head, callback) {
      const serverUrl = url.parse(`https://${req.url}`);
      if (req.url.includes('qpyou.cn')) {
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
    this.proxy.listen({ port });
  }

  stop() {
    this.proxy.close();
    this.httpServer.close();

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
    if (this.httpServer && this.httpServer.address()) {
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
