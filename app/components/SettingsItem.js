import React from 'react';
import { Checkbox, Input, Select } from 'semantic-ui-react';
import { capitalize } from 'lodash/string';

const { ipcRenderer, remote } = require('electron');

let config = remote.getGlobal('config');

class SettingsItem extends React.Component {
  constructor(props) {
    super(props);
    if (this.props.section === 'Plugins') {
      this.state = { value: config.Config[this.props.section][this.props.pluginName][this.props.setting] };
    } else {
      this.state = { value: config.Config[this.props.section][this.props.setting] };
    }

    this.Input = this.props.Input;
  }

  getLabel() {
    let customLabel = null;
    if (this.props.section === 'Plugins') {
      customLabel = (config.ConfigDetails[this.props.section][this.props.pluginName][this.props.setting] && config.ConfigDetails[this.props.section][this.props.pluginName][this.props.setting].label);
    } else {
      customLabel = (config.ConfigDetails[this.props.section][this.props.setting] && config.ConfigDetails[this.props.section][this.props.setting].label);
    }

    return (customLabel) || capitalize(this.props.setting);
  }

  changeSetting(e, element) {
    const value = element.type === 'checkbox' ? element.checked : element.value;
    if (this.props.section === 'Plugins') {
      config.Config[this.props.section][this.props.pluginName][this.props.setting] = value;
    } else {
      config.Config[this.props.section][this.props.setting] = value;
    }

    this.setState({ value });
    ipcRenderer.send('updateConfig');
  }

  getInputElement() {
    switch (this.Input.type.name) {
      case 'Checkbox':
        return <Checkbox {...this.Input.props} label={this.getLabel()} checked={this.state.value} onChange={this.changeSetting.bind(this)} />;
      case 'Select':
        return <Select {...this.Input.props} label={this.getLabel()} value={this.state.value} onChange={this.changeSetting.bind(this)} />;
      default:
        return <Input {...this.Input.props} label={this.getLabel()} value={this.state.value} onChange={this.changeSetting.bind(this)} />;
    }
  }

  render() {
    const element = this.getInputElement();
    return (
      element
    );
  }
}

module.exports = SettingsItem;