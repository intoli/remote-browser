import EventEmitter from 'events';

import { TimeoutError } from '../errors';


export default class ConnectionBase extends EventEmitter {
  constructor() {
    super();
    this.messageIndex = 0;
    this.messageTimeout = 30000;
    this.pendingMessageResolves = {};
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

  onData = async (data) => {
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

    const message = JSON.parse(data);

    // Handle responses to messages that we originated.
    if (message.response) {
      if (this.pendingMessageResolves[message.messageIndex]) {
        this.pendingMessageResolves[message.messageIndex](message.data);
        delete this.pendingMessageResolves[message.messageIndex];
      }
      return;
    }

    // Handle messages that we did not originate.
    const responseData = await this.subscriptions[message.channel](message.data);
    this.ws.send(JSON.stringify({
      ...message,
      data: responseData,
      response: true,
    }));
  };

  ping = async () => (
    new Promise((resolve, revoke) => {
      this.pendingPingResolves.push(resolve);
      this.ws.send('ping');
      setTimeout(() => {
        const index = this.pendingPingResolves.indexOf(resolve);
        if (index > -1) {
          this.pendingPingResolves.splice(index);
          revoke();
        }
      }, this.pingTimeout);
    })
  );

  send = async (data, { channel, timeout } = {}) => {
    this.messageIndex += 1;
    const message = {
      data,
      channel,
      messageIndex: this.messageIndex,
      response: false,
    };

    const { messageIndex } = this;
    return new Promise((resolve, revoke) => {
      this.pendingMessageResolves[messageIndex] = resolve;
      this.ws.send(JSON.stringify(message));
      setTimeout(() => {
        if (this.pendingMessageResolves[messageIndex]) {
          revoke(new TimeoutError('No websocket response was received within the timeout.'));
          delete this.pendingMessageResolves[messageIndex];
        }
      }, timeout || this.messageTimeout);
    });
  };

  subscribe = (callback, { channel } = {}) => {
    this.subscriptions[channel] = callback;
  };

  unsubscribe = (callback, { channel } = {}) => {
    delete this.subscripions[channel];
  };
}
