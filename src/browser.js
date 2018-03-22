import assert from 'assert';

import fetch from 'isomorphic-fetch';

import { Client, ConnectionProxy } from './connections';
import { RemoteError } from './errors';
import { launchChrome, launchFirefox } from './launchers';


class CallableProxy extends Function {
  constructor(handler) {
    super();
    return new Proxy(this, handler);
  }
}


export default class Browser extends CallableProxy {
  constructor(options) {
    super({
      apply: (target, thisArg, argumentsList) => (
        this.evaluateInBackground(...argumentsList)
      ),
      get: (target, name) => (
        name && name.match && name.match(/^\d+$/) ?
          (...args) => this.evaluateInContent(parseInt(name, 10), ...args) :
          Reflect.get(target, name)
      ),
    });
    Object.defineProperty(this, 'name', { value: 'Browser' });
    this.options = options;
  }

  evaluateInBackground = async (asyncFunction, ...args) => {
    const { error, result } = await this.client.send({
      args,
      asyncFunction: asyncFunction.toString(),
    }, { channel: 'evaluateInBackground' });

    if (error) {
      throw new RemoteError(error.remoteError);
    }

    return result;
  };

  evaluateInContent = async (tabId, asyncFunction, ...args) => {
    const { error, result } = await this.client.send({
      args,
      asyncFunction: asyncFunction.toString(),
      tabId,
    }, { channel: 'evaluateInContent' });

    if (error) {
      throw new RemoteError(error.remoteError);
    }

    return result;
  };

  launch = async (browser = 'chrome') => {
    assert(
      ['chrome', 'firefox', 'remote'].includes(browser),
      'Only Chrome, Firefox, and Remote are supported right now.',
    );

    // Handle launching remotely.
    const webBuild = typeof window !== 'undefined';
    if (browser === 'remote' || webBuild) {
      await this.launchRemote();
      return;
    }

    const launch = (browser === 'chrome' ? launchChrome : launchFirefox);
    const sessionId = 'default';

    // Prepare the client and the proxy.
    await this.listen(sessionId);

    // Launch the browser with the correct arguments.
    this.driver = await launch(this.connectionUrl, this.sessionId);

    await this.connection;
  };

  launchRemote = async () => {
    const secure = typeof window === 'undefined' || window.location.protocol.startsWith('https');
    const initializationUrl = `http${secure ? 's' : ''}://tour-backend.intoli.com` +
      '/api/initialize-session';
    const response = await (await fetch(initializationUrl)).json();
    this.connectionUrl = response.url;
    if (!response.url || !response.sessionId) {
      throw new Error('Invalid initialization response from the tour backend');
    }
    if (secure && response.url.startsWith('ws:')) {
      this.connectionUrl = `wss:${response.url.slice(3)}`;
    } else if (!secure && response.url.startsWith('wss:')) {
      this.connectionUrl = `ws:${response.url.slice(4)}`;
    }
    this.sessionId = response.sessionId;

    await this.negotiateConnection();
  };

  listen = async (sessionId = 'default') => {
    // Set up the proxy and connect to it.
    this.proxy = new ConnectionProxy();
    this.port = await this.proxy.listen();
    this.connectionUrl = `ws://localhost:${this.port}/`;
    this.sessionId = sessionId;

    await this.negotiateConnection();

    return this.port;
  };

  negotiateConnection = async () => {
    // Note that this function is really for internal use only.
    // Prepare for the initial connection from the browser.
    this.client = new Client();
    let proxyConnection;
    this.connection = new Promise((resolve) => {
      const channel = 'initialConnection';
      const handleInitialConnection = () => {
        this.client.unsubscribe(handleInitialConnection, { channel });
        resolve();
      };
      this.client.subscribe(handleInitialConnection, { channel });
      proxyConnection = this.client.connect(this.connectionUrl, 'user', this.sessionId);
    });
    await proxyConnection;
  };

  quit = async () => {
    // Close all of the windows.
    if (this.client) {
      // We'll never get a response here, so it needs to be sent off asynchronously.
      this.evaluateInBackground(async () => (
        Promise.all((await browser.windows.getAll())
          .map(({ id }) => browser.windows.remove(id)))
      ));
    }

    if (this.driver) {
      await this.driver.quit();
    }

    if (this.proxy) {
      await this.proxy.close();
    }

    if (this.client) {
      await this.client.close();
    }
  };
}
