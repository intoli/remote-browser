import Client from '../connections/client';


class Background {
  constructor() {
    this.client = new Client();

    this.client.subscribe(async ({ args, asyncFunction }) => (
      // eslint-disable-next-line no-eval
      eval(`(${asyncFunction}).apply(null, ${JSON.stringify(args)})`)
    ), { channel: 'evaluateInBackground' });

    // Listen for connection requests from the popup browser action.
    browser.runtime.onMessage.addListener(async (request) => {
      if (request.channel === 'connectionRequest') {
        await this.connect(request.port, request.host);
      }
    });
  }

  connect = async (port, host = 'ws://localhost') => {
    await this.client.connect(port, host);
    this.client.send(null, { channel: 'initialConnection' });
  };

  connectOnLaunch = async () => {
    const port = await this.findPort();
    await this.connect(port);
  };

  findPort = async () => (new Promise((resolve) => {
    const extractPort = (tabId, changeInfo, tab) => {
      const url = tab ? tab.url : tabId;
      const match = /remoteBrowserPort=(\d+)/.exec(url);
      if (match && match.length > 1) {
        const port = match[1];
        resolve(port);
        browser.tabs.onUpdated.removeListener(extractPort);
        browser.tabs.update({ url: 'about:blank' });
      }
    };
    browser.tabs.onUpdated.addListener(extractPort);
    browser.tabs.getCurrent().then(extractPort);
  }));
}


(async () => {
  const background = new Background();
  // TODO: This should be disabled in extension builds that are meant to be distributed
  // independently from the node module as a security measure.
  await background.connectOnLaunch();
})();
