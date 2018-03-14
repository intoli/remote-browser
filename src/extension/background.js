import Client from '../connections/client';


class Background {
  constructor() {
    this.client = new Client();

    // Handle evaluation requests.
    this.client.subscribe(async ({ args, asyncFunction }) => (
      // eslint-disable-next-line no-eval
      eval(`(${asyncFunction}).apply(null, ${JSON.stringify(args)})`)
    ), { channel: 'evaluateInBackground' });
    this.client.subscribe(async ({ args, asyncFunction, tabId }) => (
      browser.tabs.sendMessage(tabId, { args, asyncFunction, channel: 'evaluateInContent' })
    ), { channel: 'evaluateInContent' });

    // Emit and handle connection status events.
    this.connectionStatus = 'disconnected';
    this.client.on('connection', () => {
      this.connectionStatus = 'connected';
      this.broadcastConnectionStatus();
    });
    this.client.on('close', () => {
      this.connectionStatus = 'disconnected';
      this.broadcastConnectionStatus();
    });
    this.client.on('error', () => {
      this.connectionStatus = 'error';
      this.broadcastConnectionStatus();
    });

    // Listen for connection status requests from the popup.
    browser.runtime.onMessage.addListener((request) => {
      if (request.channel === 'connectionStatusRequest') {
        this.broadcastConnectionStatus();
      }
    });

    // Listen for connection requests from the popup browser action.
    browser.runtime.onMessage.addListener(async (request) => {
      if (request.channel === 'connectionRequest') {
        await this.connect(request.port, request.host);
      }
    });
    browser.runtime.onMessage.addListener(async (request) => {
      if (request.channel === 'disconnectionRequest') {
        await this.client.close();
      }
    });
  }

  broadcastConnectionStatus = () => {
    browser.runtime.sendMessage({
      channel: 'connectionStatus',
      connectionStatus: this.connectionStatus,
    });
  };

  connect = async (port, host = 'ws://localhost') => {
    try {
      await this.client.connect(port, host);
      this.client.send(null, { channel: 'initialConnection' });
    } catch (error) {
      this.connectionStatus = 'error';
      this.broadcastConnectionStatus();
    }
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
