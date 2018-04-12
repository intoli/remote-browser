import { TimeoutError } from './errors';


export const serializeFunction = (f) => {
  const serialized = f.toString();

  // Safari serializes async arrow functions with an invalid `function` keyword.
  // This needs to be removed in order for the function to be interpretable.
  const safariPrefix = 'async function ';
  if (serialized.startsWith(safariPrefix)) {
    const arrowIndex = serialized.indexOf('=>');
    const bracketIndex = serialized.indexOf('{');
    if (arrowIndex > -1 && (bracketIndex === -1 || arrowIndex < bracketIndex)) {
      return `async ${serialized.slice(safariPrefix.length)}`;
    }
  }

  return serialized;
};


export class TimeoutPromise extends Promise {
  constructor(executor, timeout = 30000) {
    super((resolve, revoke) => {
      let completed = false;
      const guard = f => (...params) => {
        if (!completed) {
          completed = true;
          return f(...params);
        }
        return null;
      };

      setTimeout(guard(() => {
        revoke(new TimeoutError(`Promise timed out after ${timeout} ms.`));
      }), timeout);
      executor(guard(resolve), guard(revoke));
    });
  }
}
