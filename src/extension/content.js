import { RemoteError } from '../errors';


let backgroundPort;

const handleMessage = ({ id, message }) => {
  if (message.channel === 'evaluateInContent') {
    const { asyncFunction, args } = message;
    Promise.resolve()
      // eslint-disable-next-line no-eval
      .then(() => eval(`(${asyncFunction}).apply(null, ${JSON.stringify(args)})`))
      .then(result => backgroundPort.postMessage({ id, message: result }))
      .catch((error) => {
        backgroundPort.postMessage({
          id,
          error: JSON.stringify((new RemoteError(error)).toJSON()),
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
