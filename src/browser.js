import assert from 'assert';

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

  evaluateInContent = async (tabId, asyncFunction, ...args) => (
    this.client.send({
      args,
      asyncFunction: asyncFunction.toString(),
      tabId,
    }, { channel: 'evaluateInContent' })
  );

  launch = async (browser = 'chrome') => {
    assert(
      ['chrome', 'firefox'].includes(browser),
      'Only Chrome and Firefox are supported right now.',
    );
    const launch = (browser === 'chrome' ? launchChrome : launchFirefox);

    // Prepare the client and the proxy.
    await this.listen();

    // Launch the browser with the correct arguments.
    const url = `file:///?remoteBrowserPort=${this.ports[1]}`;
    this.driver = await launch(url);

    await this.connection;
  };

  listen = async () => {
    // Set up the proxy and connect to it.
    this.proxy = new ConnectionProxy();
    this.ports = await this.proxy.listen();
    this.client = new Client();
    await this.client.connect(this.ports[0]);

    // Prepare for the initial connection from the browser.
    this.connection = new Promise((resolve) => {
      const channel = 'initialConnection';
      const handleInitialConnection = () => {
        this.client.unsubscribe(handleInitialConnection, { channel });
        resolve();
      };
      this.client.subscribe(handleInitialConnection, { channel });
    });

    return this.ports[1];
  };

  quit = async () => {
    await this.driver.quit();
    await this.proxy.close();
  };
}
