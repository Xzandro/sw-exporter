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
const proxy = Proxy();

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
    proxy.onError(function(ctx, err, errorKind) {
      // ctx may be null
      var url = ctx && ctx.clientToProxyRequest ? ctx.clientToProxyRequest.url : '';
      console.error(errorKind + ' on ' + url + ':', err);
    });

    proxy.onRequest(function(ctx, callback) {
      if (ctx.clientToProxyRequest.headers.host == 'www.google.com' && ctx.clientToProxyRequest.url.indexOf('/search') == 0) {
        ctx.use(Proxy.gunzip);

        ctx.onResponseData(function(ctx, chunk, callback) {
          chunk = new Buffer(chunk.toString().replace(/<a.*?<\/a>/g, '<a>Pwned!</a>'));
          return callback(null, chunk);
        });
      }
      return callback();
    });

    proxy.listen({ port})

    
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
