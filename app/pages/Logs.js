const { ipcRenderer, remote } = require('electron')
let config = remote.getGlobal('config');

import React from 'react';
import { Header, Feed, Divider, Label } from 'semantic-ui-react';
import { capitalize, toLower } from 'lodash/string';

class Logs extends React.Component {
  constructor() {
    super();
    this.state = { 'entries': []  };
  }

  componentDidMount() {
    ipcRenderer.on('logupdated', (event, message) => {
      this.update(message);
    })
    this.setState({ 'entries': ipcRenderer.sendSync('logGetEntries') });
  }

  componentWillUnmount () {
    ipcRenderer.removeAllListeners('logupdated');
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.entries.length === nextState.entries.length)
      return false;

    return true;
  }

  update(entries) {
    this.setState({ 'entries': entries });
  }

  labelColor(log_type) {
    switch (toLower(log_type)) {
      case 'info':
        return 'blue';
      case 'success':
        return 'green';
      case 'warning':
        return 'yellow';
      case 'error':
        return 'red';
      case 'debug':
        return 'black'
      default:
        return 'grey';
    }
  }
  
  render () {
    const Logs = this.state.entries.map((entry, i) => {
      if (entry.type !== 'debug' || config.Config.App.debug) {
        return <Feed key={i} className='log' size="small">
        <Feed.Event>
          <Feed.Content>
            <Feed.Summary>
              <Label size="mini" color={this.labelColor(entry.type)}>{capitalize(entry.type)}</Label> 
              {capitalize(entry.source)} {entry.name ? ' - ' + entry.name : ''} <Feed.Date>{entry.date}</Feed.Date>
            </Feed.Summary>
            <Feed.Extra>
              <div dangerouslySetInnerHTML={{__html: entry.message}} />
            </Feed.Extra>
          </Feed.Content>
        </Feed.Event>
        <Divider />
        </Feed>;
      }
    });

    return (
      <div>
        <Header as='h1'>Logs</Header>
        {Logs}
      </div>
    )
  }
}

module.exports = Logs;