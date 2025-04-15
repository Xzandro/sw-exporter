import React from 'react';

import {
  Divider,
  Grid,
  GridColumn,
  GridRow,
  Header,
  Icon,
  Menu,
  Modal,
  ModalContent,
  ModalHeader,
  Button,
  Input,
  Segment,
  Select,
} from 'semantic-ui-react';

const { ipcRenderer } = require('electron');
const remote = require('@electron/remote');

let config = remote.getGlobal('config');

class Head extends React.Component {
  constructor() {
    super();
    this.state = { proxyRunning: ipcRenderer.sendSync('proxyIsRunning'), modal: false };

    Mousetrap.bind(['command+s', 'ctrl+s'], () => {
      this.toggleProxy();
    });
  }

  componentDidMount() {
    ipcRenderer.on('proxyStarted', () => {
      this.setState({ proxyRunning: true });
    });

    ipcRenderer.on('proxyStopped', () => {
      this.setState({ proxyRunning: false });
    });
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners('proxyStarted');
    ipcRenderer.removeAllListeners('proxyStopped');
  }

  toggleProxy() {
    if (ipcRenderer.sendSync('proxyIsRunning')) {
      ipcRenderer.send('proxyStop');
    } else {
      ipcRenderer.send('proxyStart');
    }
  }

  startProxy(state) {
    ipcRenderer.send('proxyStart', state);
    this.setState({ modal: false });
  }

  getCert() {
    ipcRenderer.send('getCert');
  }

  getAndInstallCertSteam() {
    ipcRenderer.send('getAndInstallCertSteam');
  }

  changePort(e) {
    const port = Number(e.target.value);
    config.Config.Proxy.port = port;
    ipcRenderer.send('updateConfig');
  }

  toggleTheme() {
    ipcRenderer.invoke('dark-mode:toggle');
  }
  isSteamMode() {
    return this.isWindows() && config.Config.Proxy.steamMode;
  }

  isWindows() {
    return remote.process.platform === 'win32';
  }

  changeSteamMode(state) {
    ipcRenderer.send('changeSteamMode', state);
  }

  modalSetOpen(state) {
    this.setState({ modal: state });
  }

  render() {
    const interfaces = ipcRenderer.sendSync('proxyGetInterfaces').map((interfaceEntry, i) => ({ key: i, text: interfaceEntry, value: i }));
    return (
      <Menu className="main-menu" fixed="top">
        {!this.isSteamMode() && (
          <Menu.Item>
            <Select label="Interfaces" options={interfaces} defaultValue={0} />
          </Menu.Item>
        )}
        <Menu.Item>
          <Input label="Port" defaultValue={config.Config.Proxy.port} onChange={this.changePort.bind(this)} />
        </Menu.Item>

        <Menu.Item position="right">
          {this.isSteamMode() && (
            <Button content="Get & Install Cert (Steam)" icon="share" labelPosition="right" onClick={this.getAndInstallCertSteam.bind(this)} />
          )}
          <Button content="Get Cert" icon="share" labelPosition="right" onClick={this.getCert.bind(this)} />

          <Button onClick={this.toggleTheme.bind(this)} icon={'adjust'} />

          {this.state.proxyRunning ? (
            <Button content="Stop Proxy" icon="stop" labelPosition="right" onClick={this.toggleProxy.bind(this)} />
          ) : this.isWindows() ? (
            <Modal
              onClose={() => this.modalSetOpen(false)}
              onOpen={() => this.modalSetOpen(true)}
              open={this.state.modal}
              size="small"
              trigger={<Button content="Start Proxy" icon="play" labelPosition="right" />}
            >
              <ModalHeader>Select a proxy mode</ModalHeader>
              <ModalContent>
                <Segment placeholder>
                  <Grid columns={2} stackable textAlign="center">
                    <Divider vertical>Or</Divider>

                    <GridRow verticalAlign="middle">
                      <GridColumn>
                        <Header icon>
                          <Icon name="game" />
                          Steam Mode
                        </Header>
                        <p>Best mode if you plan to use with the Steam version of Summoners War.</p>
                        <Button primary onClick={() => this.startProxy(true)}>
                          Start
                        </Button>
                      </GridColumn>

                      <GridColumn>
                        <Header icon>
                          <Icon name="world" />
                          Remote Mode
                        </Header>
                        <p>Default mode for anything else than the Steam version of SW, like your phone or emulators.</p>
                        <Button primary onClick={() => this.startProxy(false)}>
                          Start
                        </Button>
                      </GridColumn>
                    </GridRow>
                    <GridRow verticalAlign="middle">
                      <GridColumn></GridColumn>
                    </GridRow>
                  </Grid>
                </Segment>
                <p>For further instructions, please go to the Help section.</p>
              </ModalContent>
            </Modal>
          ) : (
            <Button content="Start Proxy" icon="play" labelPosition="right" onClick={() => this.startProxy(false)} />
          )}
        </Menu.Item>
      </Menu>
    );
  }
}

module.exports = Head;
