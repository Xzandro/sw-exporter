import React from 'react';
import { Checkbox, Form, Input } from 'semantic-ui-react';
import SettingsItem from './SettingsItem';

const { remote } = require('electron');

let config = remote.getGlobal('config');

class SettingsPlugin extends React.Component {
  constructor() {
    super();
    this.components = {
      checkbox: Checkbox,
      input: Input
    };
  }

  render() {
    const pluginConfig = Object.keys(config.Config.Plugins[this.props.pluginName]).map((key, i) => {
      let inputType = 'checkbox';
      const configDetails = config.ConfigDetails.Plugins[this.props.pluginName];
      if (configDetails && configDetails[key] && configDetails[key].type) {
        inputType = configDetails[key].type;
      }
      const InputComponent = this.components[inputType];
      return (
        <Form.Field key={i}>
          <SettingsItem
            section="Plugins"
            pluginName={this.props.pluginName}
            setting={key}
            Input={<InputComponent />}
          />
        </Form.Field>
      );
    });
    return <Form>{pluginConfig}</Form>;
  }
}

module.exports = SettingsPlugin;
