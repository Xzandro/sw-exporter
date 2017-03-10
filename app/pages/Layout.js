import React from 'react';
import { Link } from 'react-router';

import { Sidebar, Segment, Button, Menu, Image, Icon, Header, Grid } from 'semantic-ui-react';

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
      <div className="app-wrapper">
        <Head />
        <Grid className="main-grid">
          <Grid.Row>
            <Grid.Column width={3}>
              <Menu width='thin' className="side-menu" vertical inverted fluid>
                <Menu.Item name='logs' link={true} active={this.state.activeItem === 'logs'} data-path="/" onClick={this.navigate.bind(this)}>
                  <Icon name='home' />
                  Logs
                </Menu.Item>
                <Menu.Item name='settings' link={true} active={this.state.activeItem === 'settings'} data-path="settings" onClick={this.navigate.bind(this)}>
                  <Icon name='settings' />
                  Settings
                </Menu.Item>
                <Menu.Item name='information' link={true} active={this.state.activeItem === 'information'} data-path="information" onClick={this.navigate.bind(this)}>
                  <Icon name='info' />
                  Information
                </Menu.Item>
              </Menu>
            </Grid.Column>
            <Grid.Column width={13}>
              <Segment basic className="main-content">
                {this.props.children} 
              </Segment>
              </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    )
  }
}

module.exports = Layout;