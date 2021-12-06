import React from 'react';
import { Image, Accordion, Icon, Table } from 'semantic-ui-react';

class Help extends React.Component {
  constructor() {
    super();
    this.state = { activeIndex: 0 };
  }

  handleAccordionClick(e, titleProps) {
    const { index } = titleProps;
    const newIndex = this.state.activeIndex === index ? -1 : index;

    this.setState({ activeIndex: newIndex });
  }
  render() {
    const { activeIndex } = this.state;

    return (
      <div>
        <h1>Setup Instructions</h1>
        <p>You've gotten this far - that means you have successfully downloaded and started the program. The remaining steps are:</p>
        <ol>
          <li>Start the proxy running</li>
          <li>Set up your mobile device to connect to the proxy server</li>
          <li>Start up Summoner's War</li>
        </ol>
        <p>Click Start Proxy now.</p>
        <h2>Configuring your mobile device</h2>
        <p>
          Your computer and mobile device must be connected to the same network and be able to communicate. This is normally as simple as connecting
          to the same Wi-Fi network or router. Some situations, like a college campus Wi-Fi connection, might not work.
        </p>
        <p>
          In the top bar of this program, there is a list of IP addresses and a port number. If there is more than IP address, you must determine
          which one is the IP address that talks on the same network as your phone. These numbers are what you will be entering into your phone (these
          numbers are only an example, yours may be different).
        </p>
        <Image src="../assets/help_network_settings.png" bordered />
        <h3>Android</h3>
        <p>
          <ul>
            <li>
              <a href="https://www.reddit.com/r/summonerswar/comments/cxwkav/summoners_war_exporter_swex_everything_you_need/" target="_blank">
                SWEX on Android - Everything you need to know.
              </a>
            </li>
            <li>TL;DR: SWEX only works with Android versions lower than 7</li>
            <li>
              <a href="https://a11.gdl.netease.com/MuMuInstaller_1.3.0.3_overseas-v2.5.25.0x64_all_1637585687.exe">Mumu for Windows</a> is a stable
              alternative for this.
            </li>
            <li>
              <a href="https://adl.netease.com/d/g/a11/c/mac">Mumu for Mac OS </a>(Not yet compatible with M1).
            </li>
            <li>
              <a href="https://drive.google.com/file/d/1mQuivBo2lpRvPI4Obapvcb9NYDcaSUoh/view" target="_blank">
                Mumu setup guide
              </a>
            </li>
          </ul>
        </p>
        <ol>
          <li>Transfer the cert file to your device.</li>
          <li>Follow the Mumu setup guide from page 6</li>
        </ol>
        <h3>iOS</h3>
        <ol>
          <li>Send cert to yourself in a way where you can open it on your device. (Mail, drive, Discord).</li>
          <li>Open/download the certificate in Safari, Allow it.</li>
          <li>
            Open <kbd>settings</kbd> → <kbd>General</kbd> → <kbd>profile</kbd> → <kbd>Certname</kbd> → <kbd>install.</kbd>
          </li>
          <li>
            Open <kbd>settings</kbd> → <kbd>General</kbd> → <kbd>About</kbd> → <kbd>Certificate Trust Settings</kbd> → Toggle on.
          </li>
          <li>Open Settings and select Wi-Fi</li>
          <li>Tap the Wi-Fi network you are currently connected to.</li>
          <li>
            Scroll down to <kbd>HTTP Proxy</kbd> and click Manual.
          </li>
          <li>
            Enter your computer's IP address in the <kbd>Server</kbd> field.
          </li>
          <li>
            Enter the port number in the <kbd>Port</kbd> field.
          </li>
          <li>
            Leave Authentication <kbd>OFF</kbd>
          </li>
          <li>Save changes and exit settings</li>
          <li>If you have Antivirus or a Firewall on your iOS, disable it</li>
          <li>If you have a Firewall on your PC, disable it. Or allow SWEX trough by port.</li>
          <li>Only if you use a VPN on your PC: Disable it. </li>
        </ol>
        <p>Start the game! You should see messages start to appear as the game loads.</p>
        <Image src="../assets/help_success.png" bordered />
        <p>Success!</p>

        <h1>What do I do with this stuff?</h1>
        <ul>
          <li>
            Use the{' '}
            <a href="https://tool.swop.one" target="_blank">
              SWOP Rune Optimizer
            </a>
          </li>
          <li>
            Upload your profile to{' '}
            <a href="https://swarfarm.com" target="_blank">
              SWARFARM
            </a>{' '}
            to share your monsters, runes, and teams
          </li>
          <li>
            Log your runs, summons, and more to{' '}
            <a href="https://swarfarm.com" target="_blank">
              SWARFARM
            </a>{' '}
            just by playing the game while connected to the proxy.
          </li>
          <li>
            Log your guild war battles to{' '}
            <a href="https://gw.swop.one" target="_blank">
              SWOP Guild War logs
            </a>
          </li>
        </ul>

        <h1>Keyboard Shortcuts</h1>
        <Table celled inverted selectable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell colSpan="2">Shortcut</Table.HeaderCell>
              <Table.HeaderCell rowSpan="2">Description</Table.HeaderCell>
            </Table.Row>
            <Table.Row>
              <Table.HeaderCell>Windows / Linux</Table.HeaderCell>
              <Table.HeaderCell>MacOS</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>Ctrl + S</Table.Cell>
              <Table.Cell>Command + S</Table.Cell>
              <Table.Cell>Toggle proxy service.</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Ctrl + B</Table.Cell>
              <Table.Cell>Command + B</Table.Cell>
              <Table.Cell>Toggle compact mode.</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Alt + 1</Table.Cell>
              <Table.Cell>Command + 1</Table.Cell>
              <Table.Cell>Navigate to Logs view.</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Alt + 2</Table.Cell>
              <Table.Cell>Command + 2</Table.Cell>
              <Table.Cell>Navigate to Settings view.</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Alt + 3</Table.Cell>
              <Table.Cell>Command + 3</Table.Cell>
              <Table.Cell>Navigate to Help view.</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>

        <h1>FAQ</h1>
        <Accordion>
          <Accordion.Title active={activeIndex === 0} index={0} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            Can I get banned for using this?
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 0}>
            The proxy method of intercepting communication between your device and Com2US is largely undetectable. No reports of bans due to using a
            proxy have been reported.
          </Accordion.Content>

          <Accordion.Title active={activeIndex === 1} index={1} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            What about SWProxy?
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 1}>
            SWProxy suffered from a few issues - difficulty releasing on mac and linux, proxy causing broken event pages, etc. SW Exporter was
            developed on a new code platform trying to address these issues from the start.
          </Accordion.Content>

          <Accordion.Title active={activeIndex === 2} index={2} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            What if I find an issue?
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 2}>
            Please{' '}
            <a href="https://github.com/Xzandro/sw-exporter" target="_blank">
              report it on <Icon name="github square" />
              Github
            </a>
            .
          </Accordion.Content>

          <Accordion.Title active={activeIndex === 3} index={3} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            How can I contribute?
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 3}>
            <p>
              If you can code, check out the repository on{' '}
              <a href="https://github.com/Xzandro/sw-exporter" target="_blank">
                <Icon name="github square" />
                Github
              </a>{' '}
              and submit a pull request! Or you can buy{' '}
              <a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=HCGNZJSHCJWF2" target="_blank">
                Xzandro
              </a>{' '}
              or{' '}
              <a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=8BEPKLJMLJ2YS" target="_blank">
                Porksmash
              </a>{' '}
              a beer to support continued development.
            </p>
          </Accordion.Content>
        </Accordion>
      </div>
    );
  }
}

module.exports = Help;
