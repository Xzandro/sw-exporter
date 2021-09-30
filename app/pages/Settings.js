import React from 'react';

import { Button, Confirm, Grid, Header, Form, Icon, Popup, Segment } from 'semantic-ui-react';
import SettingsPlugin from '../components/SettingsPlugin';
import SettingsItem from '../components/SettingsItem';

const { ipcRenderer } = require('electron');
const remote = require('@electron/remote');

const { dialog } = remote;
const plugins = remote.getGlobal('plugins');
let config = remote.getGlobal('config');

class Settings extends React.Component {
  constructor() {
    super();
    this.state = {
      filesPath: config.Config.App.filesPath,
      confirmCertDialog: false,
    };
  }

  openDialog(e) {
    e.preventDefault();
    dialog
      .showOpenDialog({
        properties: ['openDirectory'],
      })
      .then((result) => {
        if (!result.canceled) {
          this.setState({ filesPath: result.filePaths.toString() });
          config.Config.App.filesPath = result.filePaths.toString();
          ipcRenderer.send('updateConfig');
        }
      });
  }

  openCertCinfirmDialog() {
    this.setState({ confirmCertDialog: true });
  }

  handleCertConfirm() {
    ipcRenderer.send('reGenCert');
    this.setState({ confirmCertDialog: false });
  }

  handleCertCancel() {
    this.setState({ confirmCertDialog: false });
  }

  render() {
    const folderLocations = ipcRenderer.sendSync('getFolderLocations');
    const pluginSettings = plugins.map((plugin, i) => {
      let description = plugin.pluginDescription ? (
        <Popup trigger={<Icon name="info circle" />} content={plugin.pluginDescription} size="small" />
      ) : (
        ''
      );

      return (
        <Grid.Column key={i}>
          <Header as="h5">
            {plugin.pluginName}
            {description}
          </Header>
          <SettingsPlugin pluginName={plugin.pluginName} />
        </Grid.Column>
      );
    });
    return (
      <div>
        <Confirm
          content="Are you sure you want to regenerate the certificate? Devices which use the current cert will not be able to connect anymore. This can not be reverted!"
          open={this.state.confirmCertDialog}
          onCancel={this.handleCertCancel.bind(this)}
          onConfirm={this.handleCertConfirm.bind(this)}
        />
        <Header as="h1">Settings</Header>
        <Header as="h4" attached="top">
          App
        </Header>
        <Segment attached>
          <Form>
            <Form.Input
              label="Files Path"
              action={<Button content="Change" onClick={this.openDialog.bind(this)} />}
              value={this.state.filesPath}
              readOnly
              fluid
            />
            <Form.Input label="Settings Path" defaultValue={folderLocations.settings} fluid readOnly />
            <Form.Group widths={2}>
              <SettingsItem section="Proxy" setting="autoStart" type="checkbox" />
              <SettingsItem section="App" setting="debug" type="checkbox" />
            </Form.Group>
            <Form.Group widths={2}>
              <SettingsItem section="App" setting="clearLogOnLogin" type="checkbox" />
              <SettingsItem section="App" setting="maxLogEntries" type="input" />
            </Form.Group>
            <Form.Group widths={2}>
              <SettingsItem section="App" setting="httpsMode" type="checkbox" />
              <SettingsItem section="App" setting="minimizeToTray" type="checkbox" />
            </Form.Group>
            <Form.Group widths={2}>
              <Button content="Regenerate Cert" icon="refresh" size="small" labelPosition="left" onClick={this.openCertCinfirmDialog.bind(this)} />
            </Form.Group>
          </Form>
        </Segment>

        <Header as="h4" attached="top">
          Plugins
        </Header>
        <Segment className="settings-plugins" attached>
          <Grid divided columns={2}>
            {pluginSettings}
          </Grid>
        </Segment>
      </div>
    );
  }
}

module.exports = Settings;
