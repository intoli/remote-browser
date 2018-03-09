import portfinder from 'portfinder';
import WebSocketServer from 'simple-websocket/server';

import ConnectionBase from './base';


export default class Server extends ConnectionBase {
  close = async () => (new Promise((resolve, revoke) => {
    if (this.ws) {
      this.ws.destroy();
    }
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
      this.attachWebSocket(ws);
    });
  });
}
