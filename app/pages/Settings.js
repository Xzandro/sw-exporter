const { ipcRenderer, remote } = require('electron');

import React from 'react';

import { Header } from 'semantic-ui-react';

class Settings extends React.Component {
  constructor() {
    super();
    this.config = remote.getGlobal('config');
    this.plugins = remote.getGlobal('plugins');
  }

  render () {
    return (
      <div>
        <Header as='h1'>Settings</Header>
      </div>
    )
  }
}

module.exports = Settings;