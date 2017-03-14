const { ipcRenderer, remote } = require('electron');
let config = remote.getGlobal('config');

import React from 'react';

import { Divider, Header, Input, Segment } from 'semantic-ui-react';

class Information extends React.Component {
  render () {
    const folderLocations = ipcRenderer.sendSync('getFolderLocations');
    return (
      <div>
        <h1>Information</h1>
        <Header as='h4' attached='top'>
          Locations
        </Header>
        <Segment attached>
          <Input label='Files' defaultValue={config.App.filesPath} fluid readOnly />
          <Divider hidden />
          <Input label='Settings' defaultValue={folderLocations.settings} fluid readOnly />
        </Segment>
      </div>
    )
  }
}

module.exports = Information;