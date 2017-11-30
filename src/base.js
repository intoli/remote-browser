import assert from 'assert';
import path from 'path';

import { Server } from './connections';


export default class FeverDreamBase {
  constructor(options) {
    this.options = options;
  }

  initialize = async () => {
    // Initialze and connect to the browser.
    const extension = path.resolve(__dirname, 'extension');
    await new Promise(async (resolve) => {
      this.server = new Server();
      this.server.once('connection', resolve);
      this.port = await this.server.listen();
      const url = `file:///?feverDreamPort=${this.port}`;

      await this.initializeDriver(url, extension);
    });

    // Find the current tab id.
    this.tabIds = await this.evaluateInBackground(async () => (
      (await browser.tabs.query({ active: true })).map(tab => tab.id)
    ));
    assert(this.tabIds.length === 1);
    [this.tabId] = this.tabIds;
  };

  createTab = async (url = 'about:blank') => {
    const tab = new this.constructor(this.options);
    tab.port = this.port;
    tab.server = this.server;
    tab.tabIds = this.tabIds;

    tab.tabId = await this.evaluateInBackground(async injectedUrl => (
      (await browser.tabs.create({ url: injectedUrl })).id
    ), url);

    tab.tabIds.push(tab.tabId);
    return tab;
  };

  end = async () => {
    // Works for Selenium driven clients.
    await this.driver.quit();

    // Do this after so the connection breaks.
    await this.server.close();
  };

  goto = async url => (
    this.evaluateInBackground(async (injectedUrl, tabId) => (
      browser.tabs.update(tabId, { url: injectedUrl })
    ), url, this.tabId)
  );

  evaluateInBackground = async (asyncFunction, ...args) => (
    this.server.send({
      args,
      asyncFunction: asyncFunction.toString(),
    }, { channel: 'evaluateInBackground' })
  );
}
