import assert from 'assert';
import path from 'path';

import express from 'express';
import portfinder from 'portfinder';

// We're using the compiled code, so must register the source maps.
import 'source-map-support/register'
import Browser from '../dist';


['Firefox', 'Chrome'].forEach((browserName) => {
  describe(`${browserName} Browser`, function() {
    this.timeout(15000);
    let app;
    let appServer;
    let browser;
    let urlPrefix;
    const blankPagePath = path.resolve(__dirname, 'data', 'blank-page.html');
    before(async () => {
      browser = new Browser();
      await browser.launch(browserName.toLowerCase());
      const port = await portfinder.getPortPromise();
      urlPrefix = `http://localhost:${port}`;
      app = express();
      app.use(express.static('/'));
      await new Promise((resolve) => { appServer = app.listen(port, resolve); });
    });
    after(async () => {
      await browser.quit()
      await new Promise(resolve => appServer.close(resolve));
    });

    it('should receive a ping/pong response', async () => {
      const response = await browser.client.ping();
      assert.equal(response, 'pong');
    });

    it('should evaluate JavaScript in the background context', async () => {
      const userAgent = await browser.evaluateInBackground(async () => window.navigator.userAgent);
      assert(typeof userAgent === 'string');
      assert(userAgent.includes(browserName));
    });

    it('should evaluate JavaScript in the content context', async () => {
      // Get the current tab ID.
      const tabId = (await browser.evaluateInBackground(async () => (
        (await browser.tabs.query({ active: true })).map(tab => tab.id)
      )))[0];
      assert.equal(typeof tabId, 'number');

      // Navigate to the test page.
      const blankPageUrl = urlPrefix + blankPagePath;
      await browser.evaluateInBackground(async (tabId, blankPageUrl) => (
        browser.tabs.update({ url: blankPageUrl })
      ), tabId, blankPageUrl);


      // Retrieve the page title.
      const title = await browser.evaluateInContent(tabId, async () => (
        new Promise((resolve) => {
          if (['complete', 'loaded'].includes(document.readyState)) {
            resolve(document.title);
          } else {
            document.addEventListener('DOMContentLoaded', () => resolve(document.title));
          }
        })
      ));
      assert.equal(title, 'Blank Page');
    });

    it('should evaluate JavaScript in the background context when called as a function', async () => {
      const userAgent = await browser(async (prefix) => (
        prefix + window.navigator.userAgent
      ), 'USER-AGENT: ');
      assert(typeof userAgent === 'string');
      assert(userAgent.includes(browserName));
      assert(userAgent.startsWith('USER-AGENT: '));
    });

    it('should evaluate JavaScript in the content context when called as a function', async () => {
      // Get the current tab ID.
      const tabId = (await browser.evaluateInBackground(async () => (
        (await browser.tabs.query({ active: true })).map(tab => tab.id)
      )))[0];
      assert.equal(typeof tabId, 'number');

      // Navigate to the test page.
      const blankPageUrl = urlPrefix + blankPagePath;
      await browser.evaluateInBackground(async (tabId, blankPageUrl) => (
        browser.tabs.update({ url: blankPageUrl })
      ), tabId, blankPageUrl);

      // Retrieve the page title.
      const title = await browser[tabId]( async () => (
        new Promise((resolve) => {
          if (['complete', 'loaded'].includes(document.readyState)) {
            resolve(document.title);
          } else {
            document.addEventListener('DOMContentLoaded', () => resolve(document.title));
          }
        })
      ));
      assert.equal(title, 'Blank Page');
    });
  });
});
