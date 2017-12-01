import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

import FeverDreamBase from './base';


export default class FeverDreamChrome extends FeverDreamBase {
  initializeDriver = async (url, extension) => {
    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(new chrome.Options()
        .addArguments([`--load-extension=${extension}`]))
      .build();

    await this.driver.get(url);
  };
}
