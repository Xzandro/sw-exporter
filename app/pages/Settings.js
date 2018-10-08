import React from 'react';

import {
  Button,
  Checkbox,
  Grid,
  Header,
  Form,
  Input,
  Icon,
  Popup,
  Segment
} from 'semantic-ui-react';
import SettingsPlugin from '../components/SettingsPlugin';
import SettingsItem from '../components/SettingsItem';

const { ipcRenderer, remote } = require('electron');

const { dialog } = remote;
const plugins = remote.getGlobal('plugins');
let config = remote.getGlobal('config');

class Settings extends React.Component {
  constructor() {
    super();
    this.state = {
      filesPath: config.Config.App.filesPath
    };
  }

  openDialog(e) {
    e.preventDefault();
    dialog.showOpenDialog(
      {
        properties: ['openDirectory']
      },
      (dirName) => {
        if (dirName) {
          this.setState({ filesPath: dirName.toString() });
          config.Config.App.filesPath = dirName.toString();
          ipcRenderer.send('updateConfig');
        }
      }
    );
  }

  render() {
    const folderLocations = ipcRenderer.sendSync('getFolderLocations');
    const pluginSettings = plugins.map((plugin, i) => {
      let description = plugin.pluginDescription ? (
        <Popup
          trigger={<Icon name="info circle" />}
          content={plugin.pluginDescription}
          size="small"
        />
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
        <Header as="h1">Settings</Header>
        <Header as="h4" attached="top">
          App
        </Header>
        <Segment attached>
          <Form>
            <Form.Field>
              <Input
                label="Files Path"
                action={
                  <Button
                    content="Change"
                    onClick={this.openDialog.bind(this)}
                  />
                }
                value={this.state.filesPath}
                readOnly
                fluid
              />
            </Form.Field>
            <Form.Field>
              <Input
                label="Settings Path"
                defaultValue={folderLocations.settings}
                fluid
                readOnly
              />
            </Form.Field>
            <Form.Group widths={2}>
              <Form.Field>
                <SettingsItem
                  section="Proxy"
                  setting="autoStart"
                  Input={<Checkbox />}
                />
              </Form.Field>
              <Form.Field>
                <SettingsItem
                  section="App"
                  setting="debug"
                  Input={<Checkbox />}
                />
              </Form.Field>
            </Form.Group>
            <Form.Group widths={2}>
              <Form.Field>
                <SettingsItem
                  section="App"
                  setting="clearLogOnLogin"
                  Input={<Checkbox />}
                />
              </Form.Field>
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
