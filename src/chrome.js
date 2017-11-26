import path from 'path';

import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

import FeverDreamBase from './base';
import { Server } from './connections';


export default class FeverDreamChrome extends FeverDreamBase {
  initialize = async () => {
    const extensionPath = path.resolve(__dirname, 'extension');
    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(new chrome.Options()
        .addArguments([`--load-extension=${extensionPath}`]))
      .build();

    return new Promise(async (resolve) => {
      this.server = new Server();
      this.server.once('connect', resolve);
      this.port = await this.server.listen();

      const url = `file:///?feverDreamPort=${this.port}`;
      await this.driver.get(url);
    }).then(async () => {
      await this.driver.get('about:blank');
      return this;
    });
  }
}
