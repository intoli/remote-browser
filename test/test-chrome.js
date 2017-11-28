import path from 'path';
import chai from 'chai';

import FeverDream from '../dist';


describe('Chrome', () => {
  let chrome;
  before(async () => chrome = await FeverDream());
  after(async () => await chrome.end());

  it('should install and run the extension', async () => {
    const htmlFile = path.resolve(__dirname, 'data', 'blank-page.html');
    await chrome.driver.get(`file://${htmlFile}`);
    const title = await chrome.driver.getTitle();
    chai.expect(title).to.equal('Successfully Installed');
  });
});
