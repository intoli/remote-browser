import Client from '../connections/client';


const findPort = async () => (new Promise((resolve) => {
  const extractPort = (tabId, changeInfo) => {
    const match = /feverDreamPort=(\d+)/.exec(changeInfo.url);
    if (match && match.length > 1) {
      const port = match[1];
      resolve(port);
      browser.tabs.onUpdated.removeListener(extractPort);
    }
  };
  browser.tabs.onUpdated.addListener(extractPort);
}));

(async () => {
  const port = await findPort();
  console.log(`Port: ${port}`);
  const client = new Client();
  await client.connect(port);
  console.log('connected!');
})();
