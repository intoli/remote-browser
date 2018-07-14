import JSONfn from 'json-fn';

import { RemoteError } from '../errors';


window.JSONfn = JSONfn;

let backgroundPort;

const handleMessage = ({ id, message }) => {
  if (message.channel === 'evaluateInContent') {
    const { asyncFunction, args } = message;
    Promise.resolve()
      // eslint-disable-next-line no-eval
      .then(() => eval(`(${asyncFunction}).apply(null, window.JSONfn.parse(${JSON.stringify(window.JSONfn.stringify(args))}))`))
      .then(result => backgroundPort.postMessage({ id, message: result }))
      .catch((error) => {
        backgroundPort.postMessage({
          id,
          error: JSONfn.stringify((new RemoteError(error)).toJSON()),
        });
      });
  }
};

const createNewConnection = () => {
  backgroundPort = browser.runtime.connect({ name: 'contentScriptConnection' });
  backgroundPort.onDisconnect.addListener(createNewConnection);
  backgroundPort.onMessage.addListener(handleMessage);
};

createNewConnection();
