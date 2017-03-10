module.exports = {
  init(proxy) {
    // Subscribe to api command events from the proxy here.
    // You can subscribe to specifc API commands. Event name is the same as the command string
    proxy.on('HubUserLogin', (req, resp) => {
      proxy.log({ type: 'info', source: 'plugin', name: 'ExamplePlugin', message: 'You just logged into the game.' });
    })

    // or all API commands with the 'apiCommand' event
    proxy.on('apiCommand', (req, resp) => {
      this.processEveryCommand(proxy, req, resp);
    });
  },
  processEveryCommand(proxy, req, resp) {
    proxy.log({ type: 'info', source: 'plugin', name: 'ExamplePlugin', message: `Found API Command ${req.command}` });
  }
}
