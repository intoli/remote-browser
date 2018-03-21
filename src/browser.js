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
        name.match(/^\d+$/) ?
          (...args) => this.evaluateInContent(parseInt(name, 10), ...args) :
          Reflect.get(target, name)
      ),
    });
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
    const url = `file:///?remoteBrowserUrl=${this.connectionUrl}`
     + `&remoteBrowserSessionId=${this.sessionId}`;
    this.driver = await launch(url);

    await this.connection;
  };

  launchRemote = async () => {
    const secure = typeof window === 'undefined' || window.location.protocol.startswith('https');
    const initializationUrl = `http${secure ? 's' : ''}://tour-backend.intoli.com/`;
    const response = (await fetch(initializationUrl)).json();
    this.connectionUrl = response.url;
    if (secure && response.url.startswith('ws:')) {
      this.connectionUrl = `wss:${response.url.slice(3)}`;
    } else if (!secure && response.url.startswith('wss:')) {
      this.connectionUrl = `wsx:${response.url.slice(4)}`;
    }
    this.sessionId = this.sessionId;

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
    // Note that this is really for internal use only.
    this.client = new Client();
    await this.client.connect(this.connectionUrl, 'user', this.sessionId);

    // Prepare for the initial connection from the browser.
    this.connection = new Promise((resolve) => {
      const channel = 'initialConnection';
      const handleInitialConnection = () => {
        this.client.unsubscribe(handleInitialConnection, { channel });
        resolve();
      };
      this.client.subscribe(handleInitialConnection, { channel });
    });
  };

  quit = async () => {
    await this.driver.quit();
    await this.proxy.close();
  };
}
