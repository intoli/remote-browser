import WebSocket from 'simple-websocket';

import ConnectionBase from './base';


export default class Client extends ConnectionBase {
  close = async () => {
    if (this.ws) {
      this.ws.destroy();
    }
    Object.keys(this.pendingMessageResolves)
      .forEach((messageId) => {
        this.pendingMessageResolves[messageId]({});
        delete this.pendingMessageResolves[messageId];
      });
  };

  connect = async (url, clientType, sessionId = 'default') => (
    new Promise((resolve, revoke) => {
      this.sessionId = sessionId;
      const ws = new WebSocket(url);
      let connected = false;
      ws.once('connect', () => {
        ws.once('data', (data) => {
          connected = true;
          const { success } = JSON.parse(data);
          if (success) {
            this.emit('connection');
            this.attachWebSocket(ws);
            resolve();
          } else {
            revoke();
          }
        });
        ws.send(JSON.stringify({ clientType, sessionId }));
      });
      ws.once('error', (error) => {
        if (!connected) {
          revoke(error);
        }
      });
    })
  );
}
