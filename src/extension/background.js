import Client from '../connections/client';
import { RemoteError } from '../errors';


class Background {
  constructor() {
    this.client = new Client();

    // Maintain a registry of open ports with the content scripts.
    this.tabMessageId = 0;
    this.tabMessageResolves = {};
    this.tabMessageRevokes = {};
    this.tabPorts = {};
    this.tabPortPendingRequests = {};
    this.tabPortResolves = {};
    browser.runtime.onConnect.addListener((port) => {
      if (port.name === 'contentScriptConnection') {
        this.addTabPort(port);
      }
    });

    // Handle evaluation requests.
    this.client.subscribe(async ({ args, asyncFunction }) => (
      Promise.resolve()
        // eslint-disable-next-line no-eval
        .then(() => eval(`(${asyncFunction}).apply(null, ${JSON.stringify(args)})`))
        .then(result => ({ result }))
        .catch(error => ({ error: new RemoteError(error) }))
    ), { channel: 'evaluateInBackground' });
    this.client.subscribe(async ({ args, asyncFunction, tabId }) => (
      Promise.resolve()
        // eslint-disable-next-line no-eval
        .then(() => this.sendToTab(tabId, { args, asyncFunction, channel: 'evaluateInContent' }))
        .then(result => ({ result }))
        .catch(error => ({ error: new RemoteError(error) }))
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
        await this.connect(request.url, request.sessionId);
      }
    });
    browser.runtime.onMessage.addListener(async (request) => {
      if (request.channel === 'disconnectionRequest') {
        await this.client.close();
      }
    });
  }

  addTabPort = (port) => {
    // Store the port.
    const tabId = port.sender.tab.id;
    this.tabPorts[tabId] = port;

    // Handle incoming messages.
    port.onMessage.addListener((request) => {
      const resolve = this.tabMessageResolves[request.id];
      const revoke = this.tabMessageRevokes[request.id];
      if (revoke && request.error) {
        revoke(new RemoteError(JSON.parse(request.error)));
      } else if (resolve) {
        resolve(request.message);
      }
      delete this.tabMessageResolves[request.id];
      delete this.tabMessageRevokes[request.id];

      this.tabPortPendingRequests[tabId] = this.tabPortPendingRequests[tabId]
        .filter(({ id }) => id !== request.id);
      if (this.tabPortPendingRequests[tabId].length === 0) {
        delete this.tabPortPendingRequests[tabId];
      }
    });

    // Handle any promise resolutions that are waiting for this port.
    if (this.tabPortResolves[tabId]) {
      this.tabPortResolves[tabId].forEach(resolve => resolve(port));
      delete this.tabPortResolves[tabId];
    }

    // Handle disconnects, this will happen on every page navigation.
    port.onDisconnect.addListener(async () => {
      if (this.tabPorts[tabId] === port) {
        delete this.tabPorts[tabId];
      }

      // If there are pending requests, we'll need to resend them. The resolve/revoke callbacks will
      // still be in place, we just need to repost the requests.
      const pendingRequests = this.tabPortPendingRequests[tabId];
      if (pendingRequests && pendingRequests.length) {
        const newPort = await this.getTabPort(tabId);
        pendingRequests.forEach(request => newPort.postMessage(request));
      }
    });
  };

  broadcastConnectionStatus = () => {
    browser.runtime.sendMessage({
      channel: 'connectionStatus',
      connectionStatus: this.connectionStatus,
    });
  };

  connect = async (url, sessionId = 'default') => {
    try {
      await this.client.connect(url, 'extension', sessionId);
      this.client.send(null, { channel: 'initialConnection' });
      this.client.on('close', this.handleConnectionLoss);
      this.client.on('error', this.handleConnectionLoss);
      this.pingInterval = setInterval(() => {
        let alive = false;
        this.client.ping().then(() => { alive = true; });
        setTimeout(() => {
          if (!alive) {
            this.handleConnectionLoss();
          }
        }, 58000);
      }, 60000);
    } catch (error) {
      this.handleConnectionLoss();
      this.connectionStatus = 'error';
      this.broadcastConnectionStatus();
    }
  };

  connectOnLaunch = async () => {
    const { url, sessionId } = await this.findConnectionDetails();
    // This will only apply if the browser was launched by the browser client.
    this.quitOnConnectionLoss = true;
    await this.connect(url, sessionId);
  };

  findConnectionDetails = async () => (new Promise((resolve) => {
    const extractConnectionDetails = (tabId, changeInfo, tab) => {
      const url = tab ? tab.url : tabId;
      let match = /remoteBrowserSessionId=([^&]*)/.exec(url);
      const sessionId = match && match.length > 1 && match[1];
      match = /remoteBrowserUrl=([^&]*)/.exec(url);
      const connectionUrl = match && match.length > 1 && match[1];

      if (sessionId && connectionUrl) {
        resolve({ sessionId, url: connectionUrl });
        browser.tabs.onUpdated.removeListener(extractConnectionDetails);
        browser.tabs.update({ url: 'about:blank' });
      }
    };
    browser.tabs.onUpdated.addListener(extractConnectionDetails);
    browser.tabs.getCurrent().then(extractConnectionDetails);
  }));

  getTabPort = async (tabId) => {
    const port = this.tabPorts[tabId];
    if (port) {
      return port;
    }
    return new Promise((resolve) => {
      this.tabPortResolves[tabId] = this.tabPortResolves[tabId] || [];
      this.tabPortResolves[tabId].push(resolve);
    });
  };

  handleConnectionLoss = async () => {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    if (this.quitOnConnectionLoss) {
      this.quit();
    }
  }

  sendToTab = async (tabId, message) => {
    const port = await this.getTabPort(tabId);
    this.tabMessageId += 1;
    const id = this.tabMessageId;
    return new Promise((resolve, revoke) => {
      const request = { id, message };
      // Store this in case the port disconnects before we get a response.
      this.tabPortPendingRequests[tabId] = this.tabPortPendingRequests[tabId] || [];
      this.tabPortPendingRequests[tabId].push(request);

      this.tabMessageResolves[id] = resolve;
      this.tabMessageRevokes[id] = revoke;
      port.postMessage(request);
    });
  };

  quit = async () => (
    Promise.all((await browser.windows.getAll())
      .map(({ id }) => browser.windows.remove(id)))
  );
}


(async () => {
  const background = new Background();
  // TODO: This should be disabled in extension builds that are meant to be distributed
  // independently from the node module as a security measure.
  await background.connectOnLaunch();
})();
