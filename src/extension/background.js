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
        await this.connect(request.port, request.host);
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
}


(async () => {
  const background = new Background();
  // TODO: This should be disabled in extension builds that are meant to be distributed
  // independently from the node module as a security measure.
  await background.connectOnLaunch();
})();
