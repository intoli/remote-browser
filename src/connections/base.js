import EventEmitter from 'events';


export default class ConnectionBase extends EventEmitter {
  constructor() {
    super();
    this.messageIndex = 0;
    this.pendingMessages = {};
    this.pendingPingResolves = [];
    this.pingTimeout = 30000;
    this.subscriptions = {};
    this.ws = null;
  }

  attachWebSocket = (ws) => {
    if (this.ws) {
      this.ws.removeAllListeners();
    }
    this.ws = ws;
    this.ws.on('data', this.onData);
    return ws;
  };

  onData = (data) => {
    // Handle ping/pong keep alives.
    if (data.length === 4) {
      const text = data.toString ? data.toString() : data;
      if (text === 'ping') {
        this.ws.send('pong');
        return;
      } else if (text === 'pong') {
        if (this.pendingPingResolves.length) {
          this.pendingPingResolves.shift()(text);
        }
        return;
      }
    }
  };

  ping = async () => {
    return new Promise((resolve, revoke) => {
      this.pendingPingResolves.push(resolve);
      this.ws.send('ping');
      setTimeout(() => {
        const index = this.pendingPingResolves.indexOf(resolve);
        if (index > -1) {
          this.pendingPingResolves.splice(index);
          revoke();
        }
      }, this.pingTimeout);
    });
  };

  send = async (data, channel) => {
    this.messageIndex += 1;
    const message = JSON.stringify({
      data,
      messageIndex: this.messageIndex,
      messageStage: 0,
    });

    return new Promise((resolve, revoke) => {
      this.ws.send(message);
    });
  };

  subscribe = (callback, channel) => {
    this.subscripions[channel] = this.subscriptions[channel] || [];
    this.subscriptions[channel].push(callback);
  };

  unsubscribe = (callback, channel) => {
    this.subscriptions[channel] = ([] || this.subscriptions[channel])
      .filter(existingCallback => existingCallback !== callback);
  };
}
