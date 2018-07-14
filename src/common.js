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

const nativeCodeSuffix = '{ [native code] }';
const serializedFunctionPrefix = '__remote-browser-serialized-function__:';
export const JSONfn = {
  parse(string) {
    return JSON.parse(string, (key, value) => {
      if (typeof value !== 'string' || !value.startsWith(serializedFunctionPrefix)) {
        return value;
      }
      let functionDefinition = value.slice(serializedFunctionPrefix.length);
      if (value.endsWith(nativeCodeSuffix)) {
        functionDefinition = functionDefinition.replace(
          nativeCodeSuffix,
          '{ console.warn(\'Native code could not be serialized, and was removed.\'); }',
        );
      }
      // eslint-disable-next-line no-eval
      return eval(functionDefinition);
    });
  },
  stringify(object) {
    return JSON.stringify(object, (key, value) => {
      if (value instanceof Function || typeof value === 'function') {
        return `${serializedFunctionPrefix}${serializeFunction(value)}`;
      }
      return value;
    });
  },
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
