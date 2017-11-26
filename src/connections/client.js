// Use the native browser WebSocket outside of node.
if (typeof(window) === 'undefined') {
  var WebSocket = require('ws');
}


export class Client {
  close = async () => {
    this.ws.close();
  };

  connect = async port => (new Promise((resolve, revoke) => {
    this.port = port;
    this.ws = new WebSocket(`ws://localhost:${port}/`);
    let connected = false;
    this.ws.on('open', () => {
      connected = true;
      resolve();
    });
    this.ws.on('error', (error) => {
      if (!connected) {
        revoke(error);
      }
    });
    this.ws.on('message', (message) => {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.type === 'echo') {
        this.ws.send(message);
      }
    });
  }));
}
