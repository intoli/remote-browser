import assert from 'assert';
import path from 'path';

// We're using the compiled code, so must register the source maps.
import 'source-map-support/register'
import Browser from '../dist';

const blankPageUrl = `file://${path.resolve(__dirname, 'data', 'blank-page.html')}`;


['Firefox', 'Chrome'].forEach((browserName) => {
  describe(`${browserName} Browser`, function() {
    this.timeout(15000);
    let browser;
    before(async () => {
      browser = new Browser();
      await browser.launch(browserName.toLowerCase());
    });
    after(async () => await browser.quit());

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
  });
});
