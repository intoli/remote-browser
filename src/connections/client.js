import WebSocket from 'simple-websocket';

import ConnectionBase from './base';


export default class Client extends ConnectionBase {
  close = async () => {
    if (this.ws) {
      this.ws.destroy();
    }
  };

  connect = async port => (new Promise((resolve, revoke) => {
    this.port = port;
    const ws = this.attachWebSocket(new WebSocket(`ws://localhost:${port}/`));
    let connected = false;
    ws.on('connect', () => {
      this.emit('connection');
      connected = true;
      resolve();
    });
    ws.on('error', (error) => {
      if (!connected) {
        revoke(error);
      }
    });
  }));
}
