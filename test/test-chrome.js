import path from 'path';
import chai from 'chai';

// We're using the compiled code, so must register the source maps.
import 'source-map-support/register'
import FeverDream from '../dist';


describe('Chrome Browser', function() {
  this.timeout(5000);
  let chrome;
  before(async () => chrome = await FeverDream());
  after(async () => await chrome.end());

  it('should receive a ping/pong response', async () => {
    const response = await chrome.server.ping();
    chai.expect(response).to.equal('pong');
  });

  it('should execute JavaScript in the background', async () => {
    const userAgent = await chrome.evaluateInBackground(async () => window.navigator.userAgent);
    chai.expect(userAgent).to.be.a('string');
    chai.expect(userAgent).to.have.lengthOf.above(10);
  });

  it('should handle multiple tabs', async () => {
    const tabCount = 5;
    const titles = [];
    const tabs = await Promise.all([...Array(tabCount).keys()].map(i => {
      const title = `Tab Title ${i}`;
      titles.push(title);
      return chrome.createTab('file:///').then(async tab => {
        await tab.evaluateInBackground(async (tabId, injectedTitle) => (
          browser.tabs.executeScript(tabId, {
            code: `window.stop; document.title = "${injectedTitle}";`,
            matchAboutBlank: true,
          })
        ), tab.tabId, title);
        return tab;
      });
    }));
    const observedTitles = await Promise.all(tabs.map(tab => (
      tab.evaluateInBackground(async (tabId) => (
        (await browser.tabs.get(tabId)).title
      ), tab.tabId)
    )));
    chai.expect(observedTitles).to.deep.equal(titles);
    await Promise.all(tabs.map(tab => tab.close()));
  });
});
