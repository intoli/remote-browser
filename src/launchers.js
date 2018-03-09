import path from 'path';

import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';


const extension = path.resolve(__dirname, 'extension');


const launchChrome = async (url) => {
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new chrome.Options()
      .addArguments([`--load-extension=${extension}`]))
    .build();

  await driver.get(url);

  return driver;
};


export default launchChrome;
