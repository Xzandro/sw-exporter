'use strict';

const net = require('net');
const sockUtil = require('./sock_util');

class TransparentProxy {
  constructor(proxiedHostname, proxiedPort, proxyHost, proxyPort, logger = console) {
    this.proxiedHostname = proxiedHostname;
    this.proxiedPort = proxiedPort;
    this.proxyHost = proxyHost;
    this.proxyPort = proxyPort;
    this.server = net.createServer((connection) => {
      this.onConnect(connection);
    });
    this.logger = logger;
  }

  /**
   *
   * @param {net.Socket} connection
   */
  async onConnect(connection) {
    const upstreamConnection = net.connect(this.proxyPort, this.proxyHost, () => {
      this.httpProxyConnect(connection, upstreamConnection);
    });
    const onSocketError = (err) => {
      connection.destroy();
      upstreamConnection.destroy();
      this.logger.log({ type: 'error', source: 'Transparent proxy', message: `Socket error: ${err}` });
    };
    const onSocketClose = () => {
      connection.destroy();
      upstreamConnection.destroy();
    };
    connection.on('error', onSocketError);
    upstreamConnection.on('error', onSocketError);
    connection.on('close', onSocketClose);
    upstreamConnection.on('close', onSocketClose);
    // Add timeout?
  }

  /**
   *
   * @param {net.Socket} downstream
   * @param {net.Socket} upstream
   */
  async httpProxyConnect(downstream, upstream) {
    try {
      // Add keep-alive header?
      upstream.write(`CONNECT ${this.proxiedHostname}:${this.proxiedPort} HTTP/0.9\r\n\r\n`);
      const statusLine = await sockUtil.readUntil(upstream, '\n');
      const statusCode = Number.parseInt(statusLine.split(' ')[1]);
      if (statusCode < 200 || statusCode > 299) {
        throw Error(`Server returned non-200 status code: ${statusCode}`);
      }
      while ((await sockUtil.readUntil(upstream, '\n')).trim().length !== 0) {} // read headers
      downstream.pipe(upstream);
      upstream.pipe(downstream);
    } catch (error) {
      upstream.destroy(); // downstream is destroyed in onSocketClose function
      this.logger.log({ type: 'error', source: 'Transparent proxy', message: `Error while connecting to http proxy: ${error}` });
    }
  }

  run(hostname, port) {
    this.server.listen(port, hostname);
  }
}

module.exports = { TransparentProxy: TransparentProxy };
