const backgroundPort = browser.runtime.connect({ name: 'contentScriptConnection' });

backgroundPort.onMessage.addListener(({ id, message }) => {
  if (message.channel === 'evaluateInContent') {
    const { asyncFunction, args } = message;
    // eslint-disable-next-line no-eval
    Promise.resolve(eval(`(${asyncFunction}).apply(null, ${JSON.stringify(args)})`))
      .then((result) => {
        backgroundPort.postMessage({ id, message: result });
      });
  }
});
