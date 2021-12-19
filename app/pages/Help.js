import { th } from 'date-fns/locale';
import React from 'react';
import { Image, Accordion, Icon, Table, AccordionTitle, AccordionContent } from 'semantic-ui-react';

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
        <h3>Setup Instructions</h3>
        <Accordion>
          <Accordion.Title active={activeIndex === 0} index={0} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            Limitations [READ THIS FIRST]
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 0}>
            SWEX won't work for unrooted Android 7+. The reason is that in Android 7+, apps don't accept user signed certs by default. App devs would
            need to allow them specifically. For people that use Android 7+, you need to use Emulators like Mumu or Nox which usually run older
            Android versions. Device with Android 6 or lower also work. iOS does not have this limitation and works fine in all versions if you do the
            additional steps. Using BlueStacks is not reconmended but may be possible, although the last confirmed working verions for this is 0.0.29
            which doesn't support the needed HTTPS functionality{' '}
            <a href="https://www.reddit.com/r/summonerswar/comments/cwzrk0/using_swex_v0029_with_bluestacks_to_get_json_file/" target="_blank">
              [Reddit guide]
            </a>
            . This also requires root access.
          </Accordion.Content>

          {/* Documents & programs */}
          <Accordion.Title active={activeIndex === 1} index={1} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            Documents & programs
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 1}>
            <p>
              <ul>
                <li>
                  <a href="https://www.reddit.com/r/summonerswar/comments/l43ueg/making_swex_work_in_2021/" target="_blank">
                    Making Swex work in 2021
                  </a>
                </li>
                <li>TL;DR: SWEX only works with Android versions lower than 7.</li>
                <li>
                  <a href="https://www.mumuglobal.com/">Mumu for Windows</a>, make sure to download the 64 bit verision under the colored button.
                </li>
                <li>
                  <a href="https://adl.netease.com/d/g/a11/c/mac">Mumu for Mac OS </a>(Not yet compatible with M1).
                </li>
                <li>
                  <a href="https://www.bignox.com/en/download/fullPackage/win_64?beta">Nox app player (64-bit) Windows.</a>
                </li>
                <li>
                  <a href="https://www.bignox.com/en/download/fullPackage/mac_fullzip?beta">Nox app player (64-bit) MacOS.</a>
                </li>
                <li>
                  <a href="https://drive.google.com/file/d/1mQuivBo2lpRvPI4Obapvcb9NYDcaSUoh/view" target="_blank">
                    Mumu setup guide
                  </a>
                </li>
              </ul>
            </p>
          </Accordion.Content>

          {/* mumu setup */}
          <Accordion.Title active={activeIndex === 2} index={2} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            Mumu Setup
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 2}>
            <p>
              <a href="https://drive.google.com/file/d/1mQuivBo2lpRvPI4Obapvcb9NYDcaSUoh/view" target="_blank">
                Mumu setup guide
                {/* install  cert > start proxy > set proxy settings in mumu > start game */}
              </a>
              <ol>
                <li> SWEX get cert </li>
                <li> Open mumu shared folder</li>
                <li> Copy cert from swex in shared folder.</li>
                <li> Navigate to: Settings → Security → Install from SD card → $MuMuSharedFolder</li>
                <li>
                  Select the generated cert (ca.pem), name it whatever you like and set Credential use to VPN & apps. Tap okay.
                  <ul>
                    <li>If the cert file is greyed out for some reason try to rename the extension from .pem to .cer</li>
                  </ul>
                </li>
                <li> Start the proxy in SWEX</li>
                <li> Navigate to: Settings → WiFi</li>
                <li> Long press listed network → modify network</li>
                <li> Change "Proxy" to "Manual"</li>
                <li> server: ip listed in SWEX, usually 192.168.x.x; Port: Port listed in SWEX, default = 8080</li>
                <li> Press Save</li>
                <li> In SWEX: confirm HTTPS is turned on</li>
                <li> In SWEX: Start proxy</li>
              </ol>
            </p>
          </Accordion.Content>

          {/* Nox setup */}
          <Accordion.Title active={activeIndex === 3} index={3} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            Nox Setup
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 3}>
            <p>
              <ol>
                <li>
                  Open Nox
                  <ul>
                    <li>Open Multi-Instance Manager (icon on the right toolbar of nox)</li>
                    <li>Create new Android 5 Instance (Name this so you remember)</li>
                    <li>Close existing instance and open Android 5 Instance</li>
                    <li>Install Summoners War: Open once for downloading and to sign, in then close Summoners War</li>
                    <li>Open Settings (top right) and enable root (restart nox)</li>
                  </ul>
                </li>
                <li>
                  Open SWEX
                  <ul>
                    <li>Press "Get Cert" (top right)</li>
                    <li>Copy file path for certificate (don't include filename)</li>
                    <li>Navigate to folder with certificate</li>
                    <li>Drag certificate to Nox homescreen</li>
                  </ul>
                </li>
                <li>
                  In Nox
                  <ul>
                    <li>Tools → Settings → Security → Screen lock: Create a pin</li>

                    <li>Tools → Settings → Security → Insall from SD Card</li>

                    <li>Navigate to: Internal storage → Pictures</li>

                    <li>Click on ca.pem and name it ca.pem</li>

                    <li>Return to home screen</li>

                    <li>Tools → Open file manager and navigate to: /data/misc/keystore/user0 and select certificate (checkbox to the left)</li>

                    <li>With file selected navigate to: /system/etc/security/cacerts</li>

                    <li>Press triple dots in top right (sometimes its bottom left) and select "move selection here"</li>

                    <li>Remove pin (Tools - Tools → Settings → Security → Screen lock)</li>

                    <li>Disable Root (restart Nox)</li>
                  </ul>
                </li>
                <li>
                  In Nox
                  <ul>
                    <li>Tools → Settings → Wi-Fi then long press on network, select "modify network" and then open Advanced options.</li>
                    <li>Change Proxy to Manual and enter proxy hostname (ip address) and proxy port from SWEX.</li>
                    <li>Open Summoners War and pray you didn't fuck anything up!</li>
                  </ul>
                </li>
              </ol>
            </p>
          </Accordion.Content>

          {/* iOS setup */}
          <Accordion.Title active={activeIndex === 5} index={5} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            iOS
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 5}>
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
          </Accordion.Content>
          <Accordion.Title active={activeIndex === 6} index={6} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            Troubleshooting
          </Accordion.Title>
          <AccordionContent active={activeIndex === 6}>
            Try those steps if you have issues with swex. Finding the issue :
            <ol>
              <li>Disable https mode in swex settings</li>
              <li>Start proxy</li>
              <li>Set proxy in phone / emulator</li>
              <li>Start the game</li>
              <li>Can you play it ?</li>
              <li>Enable https mode</li>
              <li>Start proxy</li>
              <li>Set proxy in phone / emulator</li>
              <li>
                Start the game?
                <ul>
                  <li>
                    I can play the game with https mode disabled:
                    <ul>
                      <li>
                        I've got an error with https mode enabled:
                        <ul>
                          <li>
                            Something is wrong with the certificate, regenerate a new one in settings → regenerate cert → redo cert installation
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                  <li>
                    I can play the game with https enabled but i don't get any json:
                    <ul>
                      <li>Start SWEX as administrator</li>
                      <li>Make sure profil exporter is enabled in swex settings</li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ol>
          </AccordionContent>
        </Accordion>

        <p></p>
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
          <Accordion.Title active={activeIndex === 96} index={96} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            Can I get banned for using this?
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 96}>
            The proxy method of intercepting communication between your device and Com2US is largely undetectable. No reports of bans due to using a
            proxy have been reported.
          </Accordion.Content>

          <Accordion.Title active={activeIndex === 97} index={97} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            What about SWProxy?
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 97}>
            SWProxy suffered from a few issues - difficulty releasing on mac and linux, proxy causing broken event pages, etc. SW Exporter was
            developed on a new code platform trying to address these issues from the start.
          </Accordion.Content>

          <Accordion.Title active={activeIndex === 98} index={98} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            What if I find an issue?
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 98}>
            Please{' '}
            <a href="https://github.com/Xzandro/sw-exporter" target="_blank">
              report it on <Icon name="github square" />
              Github
            </a>
            .
          </Accordion.Content>

          <Accordion.Title active={activeIndex === 99} index={99} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            How can I contribute?
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 99}>
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
