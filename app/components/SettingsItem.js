import React from 'react';
import { Form } from 'semantic-ui-react';
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
  }

  getLabel() {
    let customLabel = null;
    if (this.props.section === 'Plugins') {
      customLabel =
        config.ConfigDetails[this.props.section][this.props.pluginName][this.props.setting] &&
        config.ConfigDetails[this.props.section][this.props.pluginName][this.props.setting].label;
    } else {
      customLabel =
        config.ConfigDetails[this.props.section][this.props.setting] && config.ConfigDetails[this.props.section][this.props.setting].label;
    }

    return customLabel || capitalize(this.props.setting);
  }

  changeSetting(e, element) {
    let value = element.type === 'checkbox' ? element.checked : element.value;

    if (element.as === 'textarea') {
      // try to parse the new value
      try {
        value = JSON.parse(value);
      } catch (error) {
        // JSON.parse didn't work, do nothing
      }
    }

    if (this.props.section === 'Plugins') {
      config.Config[this.props.section][this.props.pluginName][this.props.setting] = value;
    } else {
      config.Config[this.props.section][this.props.setting] = value;
    }

    this.setState({ value });
    ipcRenderer.send('updateConfig');
  }

  getInputElement() {
    switch (this.props.type) {
      case 'checkbox':
        return <Form.Checkbox label={this.getLabel()} checked={this.state.value} onChange={this.changeSetting.bind(this)} />;
      case 'select':
        return <Form.Select label={this.getLabel()} value={this.state.value} onChange={this.changeSetting.bind(this)} />;
      case 'textarea':
        // check if this data is JSON and stringify it if that's the case
        let realValue;
        try {
          realValue = JSON.stringify(JSON.parse(this.state.value));
        } catch (error) {
          // JSON.parse didn't work, probably no valid JSON or already parsed
          realValue = this.state.value instanceof Object ? JSON.stringify(this.state.value) : this.state.value;
        }
        return <Form.TextArea label={this.getLabel()} value={realValue} onChange={this.changeSetting.bind(this)} />;
      default:
        return <Form.Input label={this.getLabel()} value={this.state.value} onChange={this.changeSetting.bind(this)} />;
    }
  }

  render() {
    const element = this.getInputElement();
    return element;
  }
}

module.exports = SettingsItem;
