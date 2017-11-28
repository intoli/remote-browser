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

  it('should install and run the extension', async () => {
    const htmlFile = path.resolve(__dirname, 'data', 'blank-page.html');
    await chrome.driver.get(`file://${htmlFile}`);
    const title = await chrome.driver.getTitle();
    chai.expect(title).to.equal('Successfully Installed');
  });

  it('should echo sent messages', async () => {
    const response = await chrome.server.send('hello', 'echo');
    chai.expect(response).to.equal('hello');
  });
});
