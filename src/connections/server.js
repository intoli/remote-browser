import EventEmitter from 'events';

import portfinder from 'portfinder';
import WebSocketServer from 'simple-websocket/server';


export default class Server extends EventEmitter {
  constructor() {
    super();
    this.messageIndex = 0;
    this.pendingMessages = {};
  }

  close = async () => (new Promise((resolve, revoke) => {
    this.server.close((error) => {
      if (error) {
        revoke(error);
      } else {
        resolve();
      }
    });
  }));

  listen = async () => new Promise(async (resolve, revoke) => {
    this.port = await portfinder.getPortPromise();
    this.server = new WebSocketServer({
      host: 'localhost',
      port: this.port,
    });

    // eslint-disable-next-line no-underscore-dangle
    this.server._server.once('listening', (error) => {
      if (error) {
        revoke(error);
      } else {
        resolve(this.port);
      }
    });

    this.server.on('connection', (ws) => {
      this.emit('connection');
      this.ws = ws;
      ws.on('data', this.receiveMessage);
    });
  });

  send = async (message, type = 'default') => {
    this.messageIndex += 1;
    const { messageIndex } = this;
    const packedMessage = {
      index: messageIndex,
      message,
      type,
    };

    return new Promise((resolve) => {
      const listener = (response) => {
        const parsedResponse = JSON.parse(response);
        if (parsedResponse.index === messageIndex) {
          resolve(parsedResponse.message);
          this.ws.removeListener('message', listener);
        }
      };
      this.ws.on('data', listener);
      this.ws.send(JSON.stringify(packedMessage));
    });
  };

  receiveMessage = message => (
    message
  );
}
