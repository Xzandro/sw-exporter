const EventEmitter = require('events');
const http = require('http');
const httpProxy = require('http-proxy');
const os = require('os');
const net = require('net');
const url = require('url');
const uuidv4 = require('uuid/v4');

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
    const self = this; // so event callbacks can access this SWProxy class

    if (port === undefined) {
      port = 8080;
    }

    let parsedRequests = [];

    this.proxy = httpProxy.createProxyServer({}).on('proxyRes', (proxyResp, req) => {
      let respChunks = [];

      if (req.url.indexOf('qpyou.cn/api/gateway_c2.php') >= 0) {
        proxyResp.on('data', chunk => {
          respChunks.push(chunk);
        });

        proxyResp.on('end', () => {
          let respData;
          try {
            respData = decrypt_response(respChunks.join());
          } catch (e) {
            // Error decrypting the data, log and do not fire an event
            self.log({ type: 'debug', source: 'proxy', message: `Error decrypting response data - ignoring. ${e}` });
            return;
          }

          const { command } = respData;

          if (parsedRequests[command]) {
            // We have a complete request/response pair
            const reqData = parsedRequests[command];

            if (config.Config.App.clearLogOnLogin && (command === 'HubUserLogin' || command === 'GuestLogin')) {
              self.clearLogs();
            }

            // Emit events, one for the specific API command and one for all commands
            self.emit(command, reqData, respData);
            self.emit('apiCommand', reqData, respData);
            delete parsedRequests[command];
          }
        });
      }
    });

    this.proxy.on('error', (error, req, resp) => {
      resp.writeHead(500, {
        'Content-Type': 'text/plain'
      });

      resp.end('Something went wrong.');
    });

    this.httpServer = http
      .createServer((req, resp) => {
        // Request has been intercepted from game client
        let reqChunks = [];
        if (req.url.indexOf('qpyou.cn/api/gateway_c2.php') >= 0) {
          req.on('data', chunk => {
            reqChunks.push(chunk);
          });
          req.on('end', () => {
            // Parse the request
            let reqData;
            try {
              reqData = decrypt_request(reqChunks.join());
            } catch (e) {
              // Error decrypting the data, log and do not fire an event
              self.log({ type: 'debug', source: 'proxy', message: `Error decrypting request data - ignoring. ${e}` });
              return;
            }

            const { command } = reqData;

            // Add command request to an object so we can handle multiple requests at a time
            parsedRequests[command] = reqData;
          });
        }

        this.proxy.web(req, resp, { target: req.url, prependPath: false });
      })
      .listen(port, () => {
        this.log({ type: 'info', source: 'proxy', message: `Now listening on port ${port}` });
        if (process.env.autostart) {
          console.log(`SW Exporter Proxy is listening on port ${port}`);
        }
        win.webContents.send('proxyStarted');
      });

    this.httpServer.on('error', e => {
      if (e.code === 'EADDRINUSE') {
        self.log({ type: 'warning', source: 'proxy', message: 'Port is in use from another process. Try another port.' });
      }
    });

    this.httpServer.on('connect', (req, socket) => {
      const serverUrl = url.parse(`https://${req.url}`);

      const srvSocket = net.connect(serverUrl.port, serverUrl.hostname, () => {
        socket.write('HTTP/1.1 200 Connection Established\r\n' + 'Proxy-agent: Node-Proxy\r\n' + '\r\n');
        srvSocket.pipe(socket);
        socket.pipe(srvSocket);
      });

      srvSocket.on('error', () => {});

      socket.on('error', () => {});
    });
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
