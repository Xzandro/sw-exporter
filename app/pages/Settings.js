const { ipcRenderer, remote } = require('electron');

import React from 'react';

import { Grid, Header, Form, Segment } from 'semantic-ui-react';

class Settings extends React.Component {
  constructor() {
    super();
    this.config = remote.getGlobal('config');
    this.plugins = remote.getGlobal('plugins');
  }

  render () {
    const pluginSettings = this.plugins.map((plugin, i) => {
      return <Grid.Column key={i}>
        <Header as='h5'>{plugin.pluginName}</Header>
        <SettingsGenerator pluginConfig={this.config.Plugins[plugin.pluginName]} />
      </Grid.Column>
    });
    return (
      <div>
        <Header as='h1'>Settings</Header>
        <Header as='h4' attached='top'>
          Plugins
        </Header>
        <Segment attached>
          <Grid divided columns={2}>{pluginSettings}</Grid>
        </Segment>
      </div>
    )
  }
}

module.exports = Settings;

class SettingsGenerator extends React.Component {
  changeSetting(e, element) {
    this.props.pluginConfig[element['label']] = element.checked;
    ipcRenderer.send('updateConfig');
  }

  render () {
    const pluginConfig = Object.keys(this.props.pluginConfig).map((key, i) => {
      return <Form.Checkbox key={i} label={key} defaultChecked={this.props.pluginConfig[key]} onChange={this.changeSetting.bind(this)}/>;
    });
    return (
      <div className="setting">
        {pluginConfig}
      </div>
    )
  }
}