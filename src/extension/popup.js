const connectButton = document.getElementById('connect');
const hostInput = document.getElementById('host');
const portInput = document.getElementById('port');


connectButton.addEventListener('click', () => {
  document.body.innerHTML += 'click!';
  browser.runtime.sendMessage({
    channel: 'connectionRequest',
    host: hostInput.value,
    port: parseInt(portInput.value, 10),
  });
});
