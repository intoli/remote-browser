// eslint-disable-next-line global-require
export default typeof window === 'undefined' ? require('ws') : window.WebSocket;
