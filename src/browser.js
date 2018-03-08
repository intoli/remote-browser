import assert from 'assert';

import { Client, Proxy } from './connections';
import launchChrome from './launchers';


export default class Browser {
  constructor(options) {
    this.options = options;
  }

  launch = async (browser = 'chrome') => {
    assert(browser === 'chrome', 'Only Chrome is supported right now.');

    // Set up the proxy and connect to it.
    this.proxy = new Proxy();
    this.ports = await this.proxy.listen();
    this.client = new Client();
    await this.client.connect(this.ports[0]);

    // Prepare for the initial connection from the browser.
    const connectionPromise = new Promise((resolve) => {
      const channel = 'initialConnection';
      const handleInitialConnection = () => {
        console.log('unsubscript?');
        this.client.unsubscribe(handleInitialConnection, { channel });
        console.log('done');
        resolve();
      };
      this.client.subscribe(handleInitialConnection, { channel });
    });

    // Launch the browser with the correct arguments.
    const url = `file:///?remoteBrowserPort=${this.ports[1]}`;
    this.driver = await launchChrome(url);

    await connectionPromise;
  };

  quit = async () => {
    await this.driver.quit();
    await this.proxy.close();
  };
}
