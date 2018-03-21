const connectButton = document.getElementById('connect');
const disconnectButton = document.getElementById('disconnect');
const hostInput = document.getElementById('host');
const portInput = document.getElementById('port');
const statusContainerDiv = document.getElementById('status-container');

// Request the current connection status and handle updates from the background.
browser.runtime.onMessage.addListener((request) => {
  if (request.channel === 'connectionStatus') {
    ['disconnected', 'connected', 'error'].forEach((status) => {
      statusContainerDiv.classList.remove(status);
    });
    statusContainerDiv.classList.add(request.connectionStatus);
  }
});
browser.runtime.sendMessage({
  channel: 'connectionStatusRequest',
});


connectButton.addEventListener('click', () => {
  const port = parseInt(portInput.value, 10);
  const url = `${hostInput.value}:${port}`;
  browser.runtime.sendMessage({
    channel: 'connectionRequest',
    sessionId: 'default',
    url,
  });
});


disconnectButton.addEventListener('click', () => {
  browser.runtime.sendMessage({
    channel: 'disconnectionRequest',
  });
});
