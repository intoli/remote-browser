import assert from 'assert';

// We're using the compiled code, so must register the source maps.
import 'source-map-support/register'
import Browser from '../dist';


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
  });
});
