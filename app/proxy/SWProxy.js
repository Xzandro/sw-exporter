const EventEmitter = require('events');
const { app } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const net = require('net');
const url = require('url');
const uuidv4 = require('uuid/v4');
const Proxy = require('http-mitm-proxy');
const { differenceInMonths } = require('date-fns');
const storage = require('electron-json-storage');

const { decrypt_request, decrypt_response } = require('./smon_decryptor');

const { promisify } = require('util');
const sleep = promisify(setTimeout);

const CERT_MAX_LIFETIME_IN_MONTHS = 12;

class SWProxy extends EventEmitter {
  constructor() {
    super();
    this.httpServer = null;
    this.proxy = null;
    this.logEntries = [];
    this.addresses = [];
    this.endpoints = new Map();
    const restoredEndpoints = storage.getSync('Endpoints');
    this.restoredEndpoints = Object.keys(restoredEndpoints).length > 0 ? new Map(restoredEndpoints) : new Map();

    this.sensitiveCommands = ['BattleRTPvPStart', 'getRtpvpReplayData'];
    this.sensitiveProperties = ['runes', 'artifacts', 'skills', 'replay_data'];
  }
  async start(port) {
    const self = this;
    this.proxy = Proxy();

    this.proxy.onError(function (ctx, e, errorKind) {
      if (e.code === 'EADDRINUSE') {
        self.log({ type: 'warning', source: 'proxy', message: 'Port is in use from another process. Try another port.' });
      }
      // we do not show further errors here, since they are mostly meaningless regarding the proxy itself
    });

    this.proxy.onRequest(function (ctx, callback) {
      const locationEndpoint = '/api/location_c2.php';
      if (locationEndpoint.includes(ctx.clientToProxyRequest.url)) {
        ctx.use(Proxy.gunzip);
        ctx.SWResponseChunksLocation = [];

        ctx.onResponseData(function (ctx, chunk, callback) {
          ctx.SWResponseChunksLocation.push(chunk);
          return callback(null, chunk);
        });

        ctx.onResponseEnd(function (ctx, callback) {
          let respData;

          try {
            respData = decrypt_response(Buffer.concat(ctx.SWResponseChunksLocation).toString());
            // map the server endpoints by their gateway subdomain
            if (respData.server_url_list) {
              self.mapEndpoints(respData.server_url_list);
              self.log({
                type: 'debug',
                source: 'proxy',
                message: `Mapping server gateways: ${JSON.stringify(
                  [...self.endpoints].reduce((acc, val) => {
                    acc[val[0]] = val[1];
                    return acc;
                  }, {})
                )}`,
              });
            }
          } catch (e) {
            console.log(e);
            return callback();
          }
          return callback();
        });
      }

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

          // get endpoiont and server info
          const endpoint = self.getEndpointInfo(ctx.clientToProxyRequest.socket.servername);

          // populate req and resp with the server data if available
          try {
            respData = self.checkSensitiveCommands(respData);
            if (endpoint) {
              self.log({
                type: 'debug',
                source: 'proxy',
                message: `Endpoint found for ${ctx.clientToProxyRequest.socket.servername}. Event: ${command} ID: ${endpoint.server_id} Endpoint: ${endpoint.server_endpoint}`,
              });
              reqData = { ...reqData, ...endpoint };
              respData = { ...respData, ...endpoint };
            } else {
              self.log({ type: 'debug', source: 'proxy', message: `No Endpoint found for ${ctx.clientToProxyRequest.socket.servername}` });
            }
            reqData = { ...reqData, swex_version: app.getVersion() };
            respData = { ...respData, swex_version: app.getVersion() };
          } catch (error) {
            // in some cases this might actually would not work if the data is not JSON
            // thats why we need to catch it
            console.error(e);
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
    this.proxy.listen({ host: '::', port, sslCaDir: path.join(app.getPath('userData'), 'swcerts') }, async (e) => {
      this.log({ type: 'info', source: 'proxy', message: `Now listening on port ${port}` });
      const expired = await this.checkCertExpiration();

      if (expired) {
        this.log({
          type: 'warning',
          source: 'proxy',
          message: `Your certificate is older than ${CERT_MAX_LIFETIME_IN_MONTHS} months. If you experience connection issues, please regenerate a new one via the Settings.`,
        });
      }
    });

    if (process.env.autostart) {
      console.log(`SW Exporter Proxy is listening on port ${port}`);
    }
    win.webContents.send('proxyStarted');
  }

  async stop() {
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

  async checkCertExpiration() {
    const certPath = path.join(app.getPath('userData'), 'swcerts', 'certs', 'ca.pem');
    const certExists = await fs.pathExists(certPath);
    if (certExists) {
      const certInfo = await fs.stat(certPath);

      return differenceInMonths(new Date(), certInfo.ctime) >= CERT_MAX_LIFETIME_IN_MONTHS;
    } else {
      return false;
    }
  }

  async copyCertToPublic() {
    const fileExists = await fs.pathExists(path.join(app.getPath('userData'), 'swcerts', 'certs', 'ca.pem'));

    if (fileExists) {
      const copyPath = path.join(global.config.Config.App.filesPath, 'cert', 'ca.pem');
      await fs.copy(path.join(app.getPath('userData'), 'swcerts', 'certs', 'ca.pem'), copyPath);
      this.log({
        type: 'success',
        source: 'proxy',
        message: `Certificate copied to ${copyPath}.`,
      });
    } else {
      this.log({
        type: 'info',
        source: 'proxy',
        message: 'No certificate available yet. You might have to start the proxy once and then try again.',
      });
    }
  }

  async reGenCert() {
    await fs.emptyDir(path.join(app.getPath('userData'), 'swcerts'));
    if (this.isRunning()) {
      await this.stop();
    }

    await this.start(process.env.port || config.Config.Proxy.port);
    // make sure the root cert was generated
    await sleep(1000);
    await this.copyCertToPublic();
  }

  mapEndpoints(serverList) {
    serverList.forEach((endpoint) => {
      const parsedGateway = url.parse(endpoint.gateway);
      if (parsedGateway.host) {
        this.endpoints.set(parsedGateway.host.split('.').shift(), endpoint);
      }
    });

    storage.set('Endpoints', Array.from(this.endpoints.entries()));
  }

  getEndpointInfo(serverName) {
    if (!serverName) {
      return null;
    }
    const parsedserverName = serverName.split('.').shift();
    const endpoint = this.endpoints.get(parsedserverName) || this.restoredEndpoints.get(parsedserverName);
    return endpoint ? { server_id: endpoint.server_id, server_endpoint: parsedserverName } : null;
  }

  checkSensitiveCommands(respData) {
    return respData.command && this.sensitiveCommands.includes(respData.command) ? this.removeProperties(respData) : respData;
  }

  removeProperties(data) {
    if (!(data instanceof Object)) return data;
    Object.keys(data).forEach((property) => {
      if (this.sensitiveProperties.includes(property)) {
        delete data[property];
      } else if (data[property] instanceof Object) {
        this.removeProperties(data[property]);
      }
    });

    return data;
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
