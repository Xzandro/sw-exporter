const { ipcRenderer, remote } = require('electron');
let config = remote.getGlobal('config');

import React from 'react';

import { Menu, Button, Input, Select } from 'semantic-ui-react';

class Head extends React.Component {
  constructor() {
    super();
    this.state = { 'proxyRunning': ipcRenderer.sendSync('proxyIsRunning') };

    Mousetrap.bind(['command+s', 'ctrl+s'], () => {
      this.toggleProxy();
    })
  }

  componentDidMount() {
    ipcRenderer.on('proxyStarted', (event, message) => {
      this.setState({ 'proxyRunning': true });
    });

    ipcRenderer.on('proxyStopped', (event, message) => {
      this.setState({ 'proxyRunning': false });
    });
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners('proxyStarted');
    ipcRenderer.removeAllListeners('proxyStopped');
  }

  toggleProxy(e) {
    if(ipcRenderer.sendSync('proxyIsRunning')) {
      ipcRenderer.send('proxyStop');
    } else {
      ipcRenderer.send('proxyStart');
    }
  }

  changePort(e) {
    const port = Number(e.target.value);
    config.Config.Proxy.port = port;
    ipcRenderer.send('updateConfig');
  }

  render () {
    const interfaces = ipcRenderer.sendSync('proxyGetInterfaces').map((interfaceEntry, i) => {
      return { "key": i, "text": interfaceEntry, "value": i }
    }) 
    return (
      <Menu className="main-menu" fixed="top">
        <Menu.Item>
          <Select label='Interfaces' options={interfaces} defaultValue={0} />
        </Menu.Item>
        <Menu.Item>
          <Input label='Port' defaultValue={config.Config.Proxy.port} onChange={this.changePort.bind(this)} />
        </Menu.Item>
        <Menu.Item position='right'>
          <Button content={this.state.proxyRunning ? 'Stop Proxy' : 'Start Proxy'} icon={this.state.proxyRunning ? 'stop' : 'play'} labelPosition='right' onClick={this.toggleProxy.bind(this)} />
        </Menu.Item>
      </Menu>
    )
  }
}

module.exports = Head;