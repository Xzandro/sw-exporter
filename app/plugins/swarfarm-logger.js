const request = require('request');

const SWARFARM_URL = 'https://swarfarm.com';

module.exports = {
  defaultConfig: {
    enabled: true,
    profileSync: false,
    username: '',
    apiKey: ''
  },
  defaultConfigDetails: {
    profileSync: { label: 'Automatically upload profile to SWARFARM' },
    username: { label: 'SWARFARM Username', type: 'input' },
    apiKey: { label: 'SWARFARM API key', type: 'input' }
  },
  pluginName: 'SwarfarmLogger',
  pluginDescription: 'Transfers your Dungeon Run data to swarfarm.com automatically.',
  commands_url: `${SWARFARM_URL}/data/log/accepted_commands/`,
  log_url: `${SWARFARM_URL}/data/log/upload/`,
  accepted_commands: false,
  init(proxy, config) {
    if (config.Config.Plugins[this.pluginName].enabled) {
      this.proxy = proxy;
      let options = {
        method: 'get',
        uri: this.commands_url
      };
      proxy.log({
        type: 'debug',
        source: 'plugin',
        name: this.pluginName,
        message: 'Retrieving list of accepted log types from SWARFARM...'
      });
      request(options, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          this.accepted_commands = JSON.parse(body);
          proxy.log({
            type: 'success',
            source: 'plugin',
            name: this.pluginName,
            message: `Looking for the following commands to log: ${Object.keys(this.accepted_commands).join(', ')}`
          });
        } else {
          proxy.log({
            type: 'error',
            source: 'plugin',
            name: this.pluginName,
            message: 'Unable to retrieve accepted log types. SWARFARM logging is disabled.'
          });
          config.Config.Plugins[this.pluginName].enabled = false;
        }
      });
      proxy.on('apiCommand', (req, resp) => {
        const myConfig = config.Config.Plugins[this.pluginName];

        // Send log event to data logs
        if (myConfig.enabled) {
          this.log(proxy, req, resp);
        }

        // Profile sync if enabled
        if (myConfig.profileSync) {
          // Check that API key and username are filled in
          if (!myConfig.username || !myConfig.apiKey) {
            proxy.log({
              type: 'error',
              source: 'plugin',
              name: this.pluginName,
              message: `Profile upload is enabled, but missing API key and/or username. Check ${
                this.pluginName
              } settings.`
            });
          } else {
            this.upload_profile(proxy, req, resp, myConfig.username, myConfig.apiKey);
          }
        }
      });
    }
  },
  log(proxy, req, resp) {
    const { command } = req;

    if (!this.accepted_commands || !this.accepted_commands[command]) {
      return;
    }

    let acceptedData = this.accepted_commands[command];
    let resultData = { request: {}, response: {} };

    acceptedData.request.forEach((prop) => {
      resultData.request[prop] = req[prop] || null;
    });

    acceptedData.response.forEach((prop) => {
      resultData.response[prop] = resp[prop] || null;
    });

    request.post({ url: this.log_url, form: { data: JSON.stringify(resultData) } }, (error, response) => {
      if (error) {
        proxy.log({
          type: 'error',
          source: 'plugin',
          name: this.pluginName,
          message: `Error: ${error.message}`
        });
        return;
      }

      if (response.statusCode === 200) {
        proxy.log({
          type: 'success',
          source: 'plugin',
          name: this.pluginName,
          message: `${command} logged successfully`
        });
      } else {
        proxy.log({
          type: 'error',
          source: 'plugin',
          name: this.pluginName,
          message: `Request failed: Server responded with code: ${response.statusCode}`
        });
      }
    });
  },
  upload_profile(proxy, req, resp, username, apiKey) {
    const { command } = req;
    const options = {
      url: `${SWARFARM_URL}/api/v2/profiles/${username}/upload/`,
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`
      },
      body: resp,
      json: true
    };

    if (command === 'HubUserLogin') {
      proxy.log({
        type: 'info',
        source: 'plugin',
        name: this.pluginName,
        message: 'Uploading profile to SWARFARM...'
      });

      request(options, (error, response, body) => {
        if (response.statusCode === 200) {
          proxy.log({
            type: 'debug',
            source: 'plugin',
            name: this.pluginName,
            message: 'SWARFARM profile successfully uploaded - awaiting import queue.'
          });

          const jobId = body.job_id;
          let resultCheckTimer;

          // 5 minute failsafe to stop checking job status
          const failsafeCheckTimer = setTimeout(() => {
            proxy.log({
              type: 'error',
              source: 'plugin',
              name: this.pluginName,
              message: 'Timed out retrieving import status.'
            });
            clearInterval(resultCheckTimer);
          }, 300000);

          resultCheckTimer = setInterval(() => {
            request(
              {
                url: `${SWARFARM_URL}/api/v2/profiles/${username}/upload/${jobId}/`,
                headers: {
                  Authorization: `Token ${apiKey}`
                },
                json: true
              },
              (resultError, resultResponse, resultBody) => {
                console.log('error:', resultError); // Print the error if one occurred
                console.log('statusCode:', resultResponse && resultResponse.statusCode); // Print the response status code if a response was received
                console.log('body:', resultBody); // Print the HTML for the Google homepage.

                if (resultBody && resultBody.status === 'SUCCESS') {
                  clearTimeout(failsafeCheckTimer);
                  clearInterval(resultCheckTimer);

                  proxy.log({
                    type: 'success',
                    source: 'plugin',
                    name: this.pluginName,
                    message: 'SWARFARM profile import complete!'
                  });
                }
              }
            );
          }, 2500);
        } else if (response.statusCode === 400) {
          // HTTP 400 Bad Request - malformed upload data or request
          proxy.log({
            type: 'error',
            source: 'plugin',
            name: this.pluginName,
            message:
              'Unable to authenticate to SWARFARM. Check your API key and username in settings. Profile import aborted.'
          });
        } else if (response.statusCode === 401) {
          // HTTP 401 Unauthorized - Failed to authenticate
          proxy.log({
            type: 'error',
            source: 'plugin',
            name: this.pluginName,
            message: `There were errors importing your SWARFARM profile: ${body.detail}`
          });
        } else if (response.statusCode === 409) {
          // HTTP 409 Conflict - Validation checks failed
          proxy.log({
            type: 'error',
            source: 'plugin',
            name: this.pluginName,
            message: `${body.validation_error} You must manually upload your profile on SWARFARM to resolve this.`
          });
        }
      });
    }
  }
};
