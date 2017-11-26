import EventEmitter from 'events';

import express from 'express';
import expressWs from 'express-ws';
import portfinder from 'portfinder';


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

  listen = async () => {
    this.app = express();
    expressWs(this.app);
    this.app.ws('/', (ws) => {
      this.emit('connect');
      this.ws = ws;
      ws.on('message', this.receiveMessage);
    });
    this.port = await portfinder.getPortPromise();
    this.server = await new Promise((resolve, revoke) => {
      const server = this.app.listen(this.port, 'localhost', (error) => {
        if (error) {
          revoke(error);
        } else {
          resolve(server);
        }
      });
    });
    return this.port;
  };

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
      this.ws.on('message', listener);
      this.ws.send(JSON.stringify(packedMessage));
    });
  };

  receiveMessage = message => (
    message
  );
}
