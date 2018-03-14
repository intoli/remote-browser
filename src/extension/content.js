browser.runtime.onMessage.addListener((request) => {
  if (request.channel === 'evaluateInContent') {
    const { asyncFunction, args } = request;
    // eslint-disable-next-line no-eval
    return Promise.resolve(eval(`(${asyncFunction}).apply(null, ${JSON.stringify(args)})`))
      .catch(console.error);
  }
  return null;
});
