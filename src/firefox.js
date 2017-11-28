import path from 'path';

import { Builder } from 'selenium-webdriver';

import FeverDreamBase from './base';


export default class FeverDreamFirefox extends FeverDreamBase {
  // TODO: This functionality is on master, but hasn't been released yet.
  // We should revisit this in a few weeks.
  // https://github.com/SeleniumHQ/selenium/commit/6648015ba9490c5971ea2d6b80908f81ae6c7839
  initialize = async (url) => {
    this.driver = await new Builder()
      .forBrowser('firefox')
      .build();
    await this.driver.installAddon(path.join(__dirname, 'extension'));
    await this.driver.get(url);
    return this;
  }
}
