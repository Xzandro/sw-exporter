const { ipcRenderer } = require('electron');

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
          <Input label='Settings' defaultValue={folderLocations.settings} fluid readOnly />
          <Divider hidden />
          <Input label='Plugins' defaultValue={folderLocations.plugins} fluid readOnly />
        </Segment>
      </div>
    )
  }
}

module.exports = Information;