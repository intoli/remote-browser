import path from 'path';

import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { Command } from 'selenium-webdriver/lib/command';


const extension = path.resolve(__dirname, 'extension');


export const launchChrome = async (url) => {
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new chrome.Options()
      .addArguments([`--load-extension=${extension}`]))
    .build();

  await driver.get(url);

  return driver;
};


export const launchFirefox = async (url) => {
  const driver = await new Builder()
    .forBrowser('firefox')
    .build();

  const command = new Command('install addon')
    .setParameter('path', extension)
    .setParameter('temporary', true);
  await driver.execute(command);

  await driver.get(url);

  return driver;
};
