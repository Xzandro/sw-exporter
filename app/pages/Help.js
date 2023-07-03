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
        <p>
          Your computer and mobile device must be connected to the same network and be able to communicate. This is normally as simple as connecting
          to the same Wi-Fi network or router. In some situations, like a college campus Wi-Fi connection, it might not work.
        </p>
        <p>
          In the dropdown menu in the top left of this program, there is a list of IP addresses and a port number. If there is more than 1 IP address,
          you must determine which one is the IP address that talks on the same network as your phone.
        </p>

        <h3>Obtaining the HTTPS certificate</h3>
        <ol>
          <li>Press "Start Proxy" button</li>
          <li>Press "Get cert" button</li>
          <li>A file called "ca.pem" should appear in the folder listed as "files path" ins settings.</li>
          <li>
            This certificate is valid for at least 1 year after that you may get Error H:2000 in-game, which indicates your Certificate has expired.
            SWEX will also warn you.
          </li>
        </ol>

        <h2>Setup Instructions step by step</h2>
        <Accordion>
          <Accordion.Title active={activeIndex === 0} index={0} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            Limitations [READ THIS FIRST]
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 0}>
            SWEX won't work for unrooted Android 7+. The reason is that in Android 7+, apps don't accept user signed certs by default. App devs would
            need to allow them specifically. For people that use Android 7+, you need to use Emulators like Mumu or Nox which usually run older
            Android versions. Devices with Android 6 or lower also work. iOS does not have this limitation and works fine in all versions if you do
            the additional steps. Using BlueStacks is not recommended but may be possible, although the last confirmed working versions for this is
            0.0.29 which doesn't support the needed HTTPS functionality. This also requires root access. We are not liable for any form of damage
            caused by using any BlueStacks setup guide.
          </Accordion.Content>

          <Accordion.Title active={activeIndex === 1} index={1} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            Documents & programs
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 1}>
            <ul>
              <li>
                <a href="https://www.mumuglobal.com/" target="_blank">
                  Mumu for Windows{' '}
                </a>
                , make sure to download the 64 bit version under the colored button.
              </li>
              <li>
                <a href="https://adl.netease.com/d/g/a11/c/mac" target="_blank">
                  Mumu for Mac OS{' '}
                </a>
                (Not yet compatible with M1).
              </li>
              <li>
                <a href="https://www.bignox.com/en/download/fullPackage/win_64?beta" target="_blank">
                  Nox app player (64-bit) Windows.{' '}
                </a>
              </li>
              <li>
                <a href="https://www.bignox.com/en/download/fullPackage/mac_fullzip?beta" target="_blank">
                  Nox app player (64-bit) MacOS.{' '}
                </a>
              </li>
              <li>
                <a href="https://drive.google.com/file/d/1mQuivBo2lpRvPI4Obapvcb9NYDcaSUoh/view" target="_blank">
                  Mumu setup guide{' '}
                </a>
              </li>
            </ul>
          </Accordion.Content>

          <Accordion.Title active={activeIndex === 2} index={2} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            Mumu Setup
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 2}>
            <a href="https://drive.google.com/file/d/1mQuivBo2lpRvPI4Obapvcb9NYDcaSUoh/view" target="_blank">
              Mumu setup guide
            </a>
            <ol>
              <li> SWEX get cert </li>
              <li> Open mumu shared folder</li>
              <li> Copy cert from SWEX in shared folder.</li>
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
          </Accordion.Content>

          <Accordion.Title active={activeIndex === 3} index={3} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            Nox Setup
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 3}>
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
                  <li>Drag certificate to Nox home screen</li>
                </ul>
              </li>
              <li>
                In Nox
                <ul>
                  <li>Tools → Settings → Security → Screen lock: Create a pin</li>

                  <li>Tools → Settings → Security → Install from SD Card</li>

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
          </Accordion.Content>

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
            MacOS M1
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 6}>
            <ol>
              <li>Obtain the certificate (see at the top)</li>
              <li>
                Open the certificate, install it for both <kbd>system</kbd> and <kbd>Local items</kbd>
              </li>
              <li>Open the application "keychain access"</li>
              <li>
                On the left side go to <kbd>Local items</kbd>
              </li>
              <li>On the top search for: "NodeMITMProxyCA"</li>
              <li>
                Open it with double clicking then go to <kbd> &gt; Trust</kbd>
              </li>
              <li>
                Change the value after <kbd>When using this certificate</kbd> to <kbd>Always trust</kbd>
              </li>
              <li>
                Repeat this for <kbd>Local items</kbd>
              </li>
              <li>
                Go to <kbd>System Preferences</kbd> → <kbd>Network</kbd> → Select current network connection → <kbd>Advanced</kbd>
              </li>
              <li>
                In here go to <kbd>Proxies</kbd> → check <kbd>Secure Web Proxy (HTTPS)</kbd> → fill out the IP and Port as listed in the top SWEX →
                press <kbd>OK</kbd> and <kbd>Apply</kbd> in the bottom of the screen
              </li>
              <li>Start the game.</li>

              <li>If you have Antivirus or a Firewall on your iOS, disable it</li>
              <li>If you have a Firewall on your PC, disable it. Or allow SWEX trough by port.</li>
              <li>Only if you use a VPN on your PC: Disable it. </li>
            </ol>
            <ul>
              Post setup:
              <li>Leave the exporter in mounted state after installation otherwise the exporter will crash after startup.</li>
              <li>
                Want to have internet (on the network previously used for this setup) without running SWEX? → Uncheck{' '}
                <kbd>Secure Web Proxy (HTTPS)</kbd> press <kbd>OK</kbd> and <kbd>Apply</kbd> in the bottom of the screen. Summoners war will still
                work.
              </li>
            </ul>
          </Accordion.Content>

          <Accordion.Title active={activeIndex === 93} index={93} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            Troubleshooting
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 93}>
            Try those steps if you have issues with SWEX. Finding the issue :
            <ol>
              <li>Disable https mode in SWEX settings</li>
              <li>Start proxy</li>
              <li>Set proxy in phone / emulator</li>
              <li>Start the game</li>
              <li>Can you play it ?</li>
              <li>Enable https mode</li>
              <li>Start proxy</li>
              <li>Set proxy in phone / emulator</li>
              <li>
                Start the game:
                <ul>
                  <li>
                    I can play the game with https mode disabled:
                    <ul>
                      <li>
                        I've got an error with https mode enabled:
                        <ul>
                          <li>Something is wrong with the certificate, open SWEX settings → regenerate cert → redo cert installation</li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                  <li>
                    I can play the game with https enabled but i don't get any json:
                    <ul>
                      <li>Start SWEX as administrator</li>
                      <li>Make sure the profile exporter is enabled in SWEX settings</li>
                    </ul>
                  </li>
                  <li>
                    I can't play the game with HTTPS mode disabled:
                    <ul>
                      <li>Are you connected to a network? → Does that network have access to the internet?</li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ol>
          </Accordion.Content>

          <Accordion.Title active={activeIndex === 94} index={94} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            Common issues in setting up SWEX
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 94}>
            <ol>
              <li>
                Firewall & VPN
                <ul>
                  <li>
                    Check if SWEX is allow by your default firewall{' '}
                    <a href="https://drive.google.com/file/d/1o3ar804O27j3E_VyDpn4MtAl6R_JjeY-/view?usp=sharing" target="_blank">
                      [Link to PDF Guide (windows 10)]{' '}
                    </a>
                    If you can't find SWEX in the firewall, Add another app → add SWEX.
                  </li>
                  <li>If you use extra firewall (like McAfee) disable it</li>
                  <li>If you have extra firewall on your phone disable it</li>
                </ul>
              </li>
              <li>
                WiFi
                <ul>
                  <li>If you use any VPN disable it</li>
                  <li>Check if you are on same wi-fi (not public)</li>
                  <li>Check your phone / emulator wifi Settings, if you saved proxy settings</li>
                </ul>
              </li>
              <li>
                Other
                <ul>
                  <li>Try to run SWEX as administrator</li>
                  <li>
                    Clear cert folder (you need to clear 2 folders, both file path and setting path){' '}
                    <a href="https://drive.google.com/file/d/1B5mA-wbDWhyCjJvWOh4fTzEAcC9CKa96/view" target="_blank">
                      {' '}
                      [Windows Manual]
                    </a>
                  </li>
                </ul>
              </li>
            </ol>
          </Accordion.Content>

          <Accordion.Title active={activeIndex === 95} index={95} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            Errors by OS
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 95}>
            <ol>
              <li>
                All
                <ul>
                  <li>(S:9) Error → this mean that you've messed up cert install, try to clear cert and install it again</li>
                  <li>
                    Blank hive screen, with only back to game option → this means that you didn't start the proxy, or didn't enable https, or you are
                    not on the same Wi-fi.
                  </li>
                  <li>
                    I can log-in to the game but i don't get my JSON → this mean that you didn't enable HTTPS (or didn't setup proxy)
                    <ol>
                      <li>
                        In Windows this can also happen if the Desktop folder is located under Onedrive → In SWEX settings, change the file path to
                        somewhere not under Onedrive.
                      </li>
                      <li>
                        In Windows this can also happen if folder has write protection from apps (common if Onedrive is a parent folder of the save
                        location) → In SWEX settings, change the file path to somewhere not under Onedrive.
                      </li>
                    </ol>
                  </li>
                  <li>
                    Error screen with blanked out text:
                    <ol type="1">
                      <li>Remove the proxy settings in the device/emulator's wifi settings.</li>
                      <li>Delete the game data and redownload the gamefiles/data</li>
                      <li>reapply the proxy settings in mumu's wifi settings</li>
                    </ol>
                  </li>
                  <li>
                    I can log-in to the game but i don't get my JSON → this mean that you didn't enable HTTPS (or didn't setup proxy)
                    <ol>
                      <li>
                        In Windows this can also happen if the Desktop folder is located under Onedrive → In SWEX settings, change the file path to
                        somewhere not under Onedrive.
                      </li>
                      <li>
                        In Windows this can also happen if folder has write protection from apps (common if Onedrive is a parent folder of the save
                        location) → In SWEX settings, change the file path to somewhere not under Onedrive.
                      </li>
                    </ol>
                  </li>
                </ul>
              </li>
              <li>
                Mumu (multi instance only)
                <ul>
                  Sometimes Mumu forgets the proxy settings you've set in the WiFi menu when starting multiple instance simultaneously. When that
                  happens re-enter the proxy settings in this order: start proxy → set proxy settings in mumu → start game
                </ul>
              </li>
              <li>
                iOS
                <ul>
                  <li>There are multiple steps to install and trust cert, make sure to do them all</li>
                  <li>Error Code "H:2000" → it seem that you need to clear all cert on PC and all Cert on your IOS, and get a new one.</li>
                </ul>
              </li>
              <li>Android</li>
              <ul>
                <li>If you use android 7+ phone you won't be able to use SWEX unless you root your phone.</li>
                <li>
                  Error Code "H:2000" → This happen if you use Android 7+ and try to make SWEX work, you might want to install an emulator to export
                  your JSON, so you don't root your main phone.
                </li>
              </ul>
              <li>
                Nox
                <ul>
                  <li>Make sure you are on android 5.</li>
                </ul>
              </li>
            </ol>
          </Accordion.Content>
        </Accordion>

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
              report it on Github <Icon name="github square" />
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
