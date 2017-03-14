const { ipcRenderer, remote } = require('electron');
let config = remote.getGlobal('config');

import React from 'react';

import { Menu, Button, Input, Select } from 'semantic-ui-react';

class Head extends React.Component {
  constructor() {
    super();
    this.state = { 'proxyRunning': ipcRenderer.sendSync('proxyIsRunning') };
  }

  toggleProxy(e) {
    if(ipcRenderer.sendSync('proxyIsRunning')) {
      this.setState({ 'proxyRunning': false });
      ipcRenderer.send('proxyStop');
    } else {
      this.setState({ 'proxyRunning': true });
      ipcRenderer.send('proxyStart');
    }
  }

  changePort(e) {
    const port = Number(e.target.value);
    config.Proxy.port = port;
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
          <Input label='Port' defaultValue={config.Proxy.port} onChange={this.changePort.bind(this)} />
        </Menu.Item>
        <Menu.Item position='right'>
          <Button content={this.state.proxyRunning ? 'Stop Proxy' : 'Start Proxy'} icon={this.state.proxyRunning ? 'stop' : 'play'} labelPosition='right' onClick={this.toggleProxy.bind(this)} />
        </Menu.Item>
      </Menu>
    )
  }
}

module.exports = Head;