import path from 'path';

import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

import FeverDreamBase from './base';


export default class FeverDreamChrome extends FeverDreamBase {
  initialize = async (url) => {
    const extensionPath = path.resolve(__dirname, 'extension');
    console.log(__dirname);
    console.log(extensionPath);
    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(new chrome.Options()
        .addArguments([`--load-extension=${extensionPath}`]))
      .build();
    await this.driver.get(url);
    return this;
  }
}
