import React from 'react';
import { Checkbox, Form } from 'semantic-ui-react';
import SettingsItem from './SettingsItem';

const { remote } = require('electron');

let config = remote.getGlobal('config');

class SettingsPlugin extends React.Component {
  render() {
    const pluginConfig = Object.keys(config.Config.Plugins[this.props.pluginName]).map((key, i) => (
      <Form.Field key={i}>
        <SettingsItem
          section="Plugins"
          pluginName={this.props.pluginName}
          setting={key}
          Input={<Checkbox />}
        />
      </Form.Field>
    ));
    return <Form>{pluginConfig}</Form>;
  }
}

module.exports = SettingsPlugin;
