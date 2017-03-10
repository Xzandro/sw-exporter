const { ipcRenderer } = require('electron')

import React from 'react';

import { Menu, Button, Input } from 'semantic-ui-react';

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

  render () {
    return (
      <Menu>
        <Menu.Item>
          <Input label='Interface' />
        </Menu.Item>
        <Menu.Item>
          <Input label='Port' defaultValue='8080' />
        </Menu.Item>
        <Menu.Item position='right'>
          <Button content={this.state.proxyRunning ? 'Stop Proxy' : 'Start Proxy'} icon={this.state.proxyRunning ? 'stop' : 'play'} labelPosition='right' onClick={this.toggleProxy.bind(this)} />
        </Menu.Item>
      </Menu>
    )
  }
}

module.exports = Head;