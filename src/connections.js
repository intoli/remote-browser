import express from 'express';
import expressWs from 'express-ws';
import portfinder from 'portfinder';
import WebSocket from 'ws';


export class Server {
  constructor() {
    this.messageIndex = 0;
    this.pendingMessages;
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
    this.app.ws('/', (ws, request) => {
      this.ws = ws;
      ws.on('message', this._receiveMessage);
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

  send = async (message, type='default') => {
    const messageIndex = this.messageIndex++;
    const packedMessage = {
      index: messageIndex,
      message,
      type,
    };

    return new Promise((resolve, revoke) => {
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

  _receiveMessage = (message) => {

  };
}


export class Client {
  close = async () => {
    this.ws.close();
  };

  connect = async (port) => (new Promise((resolve, revoke) => {
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
