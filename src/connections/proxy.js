import EventEmitter from 'events';

import portfinder from 'portfinder';
import WebSocket from 'ws';


export default class ConnectionProxy extends EventEmitter {
  constructor() {
    super();

    // We'll send messages between
    this.clientTypes = ['extension', 'user'];
    this.webSockets = { extension: {}, user: {} };
  }

  close = async () => {
    // Terminate all of the existing connections.
    this.clientTypes.forEach((clientType) => {
      Object.values(this.webSockets[clientType]).forEach((ws) => {
        if (ws.isAlive === 1) {
          ws.close();
        }
        ws.terminate();
      });
    });

    // Close the actual server.
    return new Promise(resolve => this.server.close(resolve));
  };

  listen = async (port) => {
    const connectionPort = port || await portfinder.getPortPromise();
    this.server = new WebSocket.Server({
      clientTracking: true,
      host: 'localhost',
      port: connectionPort,
    });
    return new Promise((resolve) => {
      this.server.once('listening', () => resolve(connectionPort));
      this.server.on('connection', (ws) => {
        ws.once('message', (initialData) => {
          const { clientType, sessionId } = JSON.parse(initialData);
          if (sessionId && this.clientTypes.includes(clientType)) {
            // Clean up any existing websockets and store the new one.
            const existingWebSocket = this.webSockets[clientType][sessionId];
            if (existingWebSocket && existingWebSocket !== ws) {
              if (existingWebSocket.isAlive) {
                existingWebSocket.close();
              }
              existingWebSocket.terminate();
            }
            this.webSockets[clientType][sessionId] = ws;

            // Proxy messages between the pairs of clients with the same session ID.
            const otherClientType = clientType === this.clientTypes[0] ?
              this.clientTypes[1] : this.clientTypes[0];
            ws.on('message', (data) => {
              const otherWebSocket = this.webSockets[otherClientType][sessionId];
              if (otherWebSocket && otherWebSocket.readyState === 1) {
                otherWebSocket.send(data);
              }
            });

            // Clean up if the connection is lost.
            ws.on('close', () => {
              ws.terminate();
              if (this.webSockets[clientType][sessionId] === ws) {
                delete this.webSockets[clientType][sessionId];
              }
            });

            // Report success.
            ws.send(JSON.stringify({ success: true }));
          } else {
            // Report failure.
            ws.send(JSON.stringify({ success: false }), () => {
              ws.terminate();
            });
          }
        });
      });
    });
  };
}
