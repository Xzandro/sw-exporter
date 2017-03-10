const { ipcRenderer } = require('electron')

import React from 'react';

import { Header, Segment, Feed, Divider } from 'semantic-ui-react';

class Logs extends React.Component {
  constructor() {
    super();
    this.state = { 'entries': [] };
    ipcRenderer.on('logupdated', (event, message) => {
      this.update(message);
    })
  }

  update(entry) {
    this.setState({ 'entries': this.state.entries.concat([entry]) });
  }
  
  render () {
    const Logs = this.state.entries.slice(0).reverse().map((entry, i) => {
      return <Feed key={i} className='log'>
      <Feed.Event>
        <Feed.Content>
          <Feed.Date>{entry.date}</Feed.Date>
          <Feed.Summary content={`${entry.source}${entry.name ? ' - ' + entry.name : ''}`} className="capitalize" />
          <Feed.Extra>
            <span className="capitalize">{entry.type}:</span> {entry.message}
          </Feed.Extra>
        </Feed.Content>
      </Feed.Event>
      <Divider />
      </Feed>;
    });

    return (
      <div>
        <Segment basic>
          <Header as='h1'>Logs</Header>
          {Logs}
        </Segment>
      </div>
    )
  }
}

module.exports = Logs;