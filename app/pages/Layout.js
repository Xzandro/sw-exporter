const appVersion = require('electron').remote.app.getVersion();

import React from 'react';
import { Link } from 'react-router';

import { Segment, Menu, Icon, Grid } from 'semantic-ui-react';

import Head from '../components/Head';
import Footer from '../components/Footer';

class Layout extends React.Component {
  constructor() {
    super();
    this.state = { 'activeItem': 'logs' };
  }

  navigate(e, element) {
    this.props.router.push(element['data-path']);
    this.setState({ activeItem: element.name });
  }

  render () {
    return (
      <div>
        <Head />
        <Menu fixed="left" vertical inverted width='thin' className="side-menu">
          <Menu.Item name='logs' link={true} active={this.state.activeItem === 'logs'} data-path="/" onClick={this.navigate.bind(this)}>
            <Icon name='home' />
            Logs
          </Menu.Item>
          <Menu.Item name='settings' link={true} active={this.state.activeItem === 'settings'} data-path="settings" onClick={this.navigate.bind(this)}>
            <Icon name='settings' />
            Settings
          </Menu.Item>
          <Menu.Item name='help' link={true} active={this.state.activeItem === 'help'} data-path="help" onClick={this.navigate.bind(this)}>
            <Icon name='help circle' />
            Help
          </Menu.Item>
          <span id="version">v{appVersion}</span>
        </Menu>
        <Segment basic className="main-content">
          {this.props.children} 
        </Segment>
      </div>
    )
  }
}

module.exports = Layout;