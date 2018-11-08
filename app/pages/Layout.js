import React from 'react';
import { withRouter } from 'react-router-dom';

import { Segment, Menu, Icon, Button } from 'semantic-ui-react';
import Mousetrap from 'mousetrap';

import Head from '../components/Head';

const appVersion = require('electron').remote.app.getVersion();

class Layout extends React.Component {
  constructor() {
    super();
    this.state = { activeItem: 'logs', compactMode: false };
    this.toggleCompactMode = this.toggleCompactMode.bind(this);

    Mousetrap.bind(['command+1', 'alt+1'], () => {
      this.navigate('/', 'logs');
    });

    Mousetrap.bind(['command+2', 'alt+2'], () => {
      this.navigate('settings', 'settings');
    });

    Mousetrap.bind(['command+3', 'alt+3'], () => {
      this.navigate('help', 'help');
    });

    Mousetrap.bind(['command+b', 'ctrl+b'], () => {
      this.toggleCompactMode();
    });
  }

  navigate(path, name) {
    this.props.history.push(path);
    this.setState({ activeItem: name });
  }

  navigateFromElement(e, element) {
    this.navigate(element['data-path'], element.name);
  }

  toggleCompactMode() {
    this.setState({ compactMode: !this.state.compactMode });
  }

  render() {
    return (
      <div>
        {this.state.compactMode ? null : <Head />}
        {this.state.compactMode ? null : (
          <Menu fixed="left" vertical inverted width="thin" className="side-menu">
            <Menu.Item name="logs" link active={this.state.activeItem === 'logs'} data-path="/" onClick={this.navigateFromElement.bind(this)}>
              <Icon name="home" />
              Logs
            </Menu.Item>
            <Menu.Item
              name="settings"
              link
              active={this.state.activeItem === 'settings'}
              data-path="settings"
              onClick={this.navigateFromElement.bind(this)}
            >
              <Icon name="settings" />
              Settings
            </Menu.Item>
            <Menu.Item name="help" link active={this.state.activeItem === 'help'} data-path="help" onClick={this.navigateFromElement.bind(this)}>
              <Icon name="help circle" />
              Help
            </Menu.Item>
            <span id="version">v{appVersion}</span>
          </Menu>
        )}

        <Segment basic className={this.state.compactMode ? 'compacted main-content' : 'main-content'}>
          <Button compact floated="right" icon={this.state.compactMode ? 'expand' : 'compress'} onClick={this.toggleCompactMode} />
          {this.props.children}
        </Segment>
      </div>
    );
  }
}

module.exports = withRouter(Layout);
