import path from 'path';

import chromedriver from 'chromedriver';
import geckodriver from 'geckodriver';
import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { Command } from 'selenium-webdriver/lib/command';
import firefox from 'selenium-webdriver/firefox';


const extension = path && path.resolve && path.resolve(__dirname, 'extension');


const constructFileUrl = (connectionUrl, sessionId) => (
  `file:///?remoteBrowserUrl=${connectionUrl}&remoteBrowserSessionId=${sessionId}`
);


export const launchChrome = async (connectionUrl, sessionId = 'default', extensionPath = extension) => {
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new chrome.Options()
      .addArguments([`--load-extension=${extensionPath}`]))
    .setChromeService(new chrome.ServiceBuilder(chromedriver.path))
    .build();

  const fileUrl = constructFileUrl(connectionUrl, sessionId);
  await driver.get(fileUrl);

  return driver;
};


export const launchFirefox = async (connectionUrl, sessionId = 'default', extensionPath = extension) => {
  const driver = await new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(new firefox.Options()
      .headless())
    .setFirefoxService(new firefox.ServiceBuilder(geckodriver.path))
    .build();

  const command = new Command('install addon')
    .setParameter('path', extensionPath)
    .setParameter('temporary', true);
  await driver.execute(command);

  const fileUrl = constructFileUrl(connectionUrl, sessionId);
  await driver.get(fileUrl);

  return driver;
};
