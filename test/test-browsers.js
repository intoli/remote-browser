import assert from 'assert';
import path from 'path';

import express from 'express';
import Jimp from 'jimp';
import portfinder from 'portfinder';

// We're using the compiled code, so must register the source maps.
import 'source-map-support/register'
import Browser, { RemoteError } from '../dist';


['Firefox', 'Chrome'].forEach((browserName) => {
  describe(`${browserName} Browser`, function() {
    this.timeout(15000);
    let app;
    let appServer;
    let browser;
    let urlPrefix;
    const blankPagePath = path.resolve(__dirname, 'data', 'blank-page.html');
    const redPagePath = path.resolve(__dirname, 'data', 'red-page.html');
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

    it('should raise a RemoteError if the background evaluation fails', async () => {
      try {
        await browser(() => { const variable = nonExistentVariableName; });
      } catch (error) {
        assert(error instanceof RemoteError);
        const { remoteError } = error;
        assert.equal(remoteError.name, 'ReferenceError');
        return;
      }
      throw new Error('The expected error was not thrown.');
    });

    it('should raise a RemoteError if the content evaluation fails', async () => {
      const tabId = (await browser.evaluateInBackground(async () => (
        (await browser.tabs.query({ active: true })).map(tab => tab.id)
      )))[0];
      try {
        await browser[tabId](() => { const variable = nonExistentVariableName; });
      } catch (error) {
        assert(error instanceof RemoteError);
        const { remoteError } = error;
        assert.equal(remoteError.name, 'ReferenceError');
        return;
      }
      throw new Error('The expected error was not thrown.');
    });

    it('should successfully transfer a screenshot of a remote page', async () => {
      // Get the current tab ID.
      const tabId = (await browser(async () => (
        (await browser.tabs.query({ active: true })).map(tab => tab.id)
      )))[0];
      assert.equal(typeof tabId, 'number');

      // Navigate to the red test page.
      const redPageUrl = urlPrefix + redPagePath;
      await browser(async (tabId, redPageUrl) => (
        browser.tabs.update({ url: redPageUrl })
      ), tabId, redPageUrl);

      // Wait for the DOM to load.
      await browser.evaluateInContent(tabId, async () => (
        new Promise((resolve) => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            document.addEventListener('load', resolve);
          }
        })
      ));

      // There's a bit of a race condition here, Chrome needs a few milliseconds to actually render.
      await new Promise(resolve => setTimeout(resolve, 100));

      // Fetch a data URI of the image.
      const dataUri = await browser(async (tabId) => (
        browser.tabs.captureVisibleTab({ format: 'png' })
      ), tabId);

      // Extract the actual data as a buffer.
      const imageBuffer = new Buffer(dataUri.match(/^data:.+\/.+;base64,(.*)$/)[1], 'base64');

      const image = await Jimp.read(imageBuffer);
      // We'll scan a 100x100 pixel square in the image and assert that it's red.
      image.scan(100, 100, 100, 100, (x, y, index) => {
        // Red, green, blue in sequence.
        assert.equal(image.bitmap.data[index], 255);
        assert.equal(image.bitmap.data[index + 1], 0);
        assert.equal(image.bitmap.data[index + 2], 0);
      });
    });
  });
});


describe('Remote Tour Browser', function() {
  this.timeout(15000);

  let browser;
  before(async () => {
    browser = new Browser();
    await browser.launch('remote');
  });
  after(async () => {
    await browser.quit()
  });

  it('should receive a ping/pong response', async () => {
    const response = await browser.client.ping();
    assert.equal(response, 'pong');
  });

  it('should evaluate JavaScript in the background context', async () => {
    const userAgent = await browser.evaluateInBackground(async () => window.navigator.userAgent);
    assert(typeof userAgent === 'string');
    assert(userAgent.includes('Firefox'));
  });
});
