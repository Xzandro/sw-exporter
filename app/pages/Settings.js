const { ipcRenderer, remote } = require('electron');
const dialog = remote.dialog;
const plugins = remote.getGlobal('plugins');
let config = remote.getGlobal('config');


import React from 'react';

import { Button, Grid, Header, Form, Input, Segment, Checkbox, Select } from 'semantic-ui-react';

class Settings extends React.Component {
  constructor() {
    super();
    this.state = {
      'filesPath': config.App.filesPath
    };
  }

  openDialog() {
    self = this;
    dialog.showOpenDialog({ 
      properties: [ 'openDirectory' ] }, function (dirName) {
        if (dirName) {
          self.setState({ 'filesPath': dirName.toString()  });
          config.App.filesPath = dirName.toString();
          ipcRenderer.send('updateConfig');
        }
      }
    );
  }

  render () {
    const pluginSettings = plugins.map((plugin, i) => {
      return <Grid.Column key={i}>
        <Header as='h5'>{plugin.pluginName}</Header>
        <SettingsPlugins pluginConfig={config.Plugins[plugin.pluginName]} />
      </Grid.Column>
    });
    return (
      <div>
        <Header as='h1'>Settings</Header>
        <Header as='h4' attached='top'>
          App
        </Header>
        <Segment attached>
          <Form>
            <Form.Field>
              <Input label='Files Path' action={<Button content='Change' onClick={this.openDialog.bind(this)} />} value={this.state.filesPath} readOnly fluid />
            </Form.Field>
            <Form.Field>
              <SettingsItem
                section='App'
                setting='debug'
                Input={<Checkbox label='Show Debug Messages' />}
              />
            </Form.Field>
          </Form>
        </Segment>
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

class SettingsPlugins extends React.Component {
  changeSetting(e, element) {
    this.props.pluginConfig[element['label']] = element.checked;
    ipcRenderer.send('updateConfig');
  }

  render () {
    const pluginConfig = Object.keys(this.props.pluginConfig).map((key, i) => {
      return <Checkbox key={i} label={key} defaultChecked={this.props.pluginConfig[key]} onChange={this.changeSetting.bind(this)}/>;
    });
    return (
      <div className="setting">
        {pluginConfig}
      </div>
    )
  }
}

class SettingsItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value : config[this.props.section][this.props.setting]};
    this.Input = this.props.Input;
  }

  changeSetting(e, element) {
    config[this.props.section][this.props.setting] = element.checked;
    this.setState({'value': element.checked});
    ipcRenderer.send('updateConfig');
  }

  setInput() {
    switch (this.Input.type.name) {
      case 'Checkbox':
        return <Checkbox {...this.Input.props} checked={this.state.value} onChange={this.changeSetting.bind(this)} />
      case 'Select':
        return <Select {...this.Input.props} value={this.state.value} onChange={this.changeSetting.bind(this)} />
      default:
        return <Input {...this.Input.props} value={this.state.value} onChange={this.changeSetting.bind(this)} />
    }
  }

  render () {
    return (
      <div>
        {this.setInput()}
      </div>
    )
  }
}