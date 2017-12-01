import { TimeoutError } from './errors';

export class TimeoutPromise extends Promise {
  constructor(executor, timeout = 30000) {
    super((resolve, revoke) => {
      let completed = false;
      const guard = f => (...params) => {
        if (!completed) {
          completed = true;
          return f(...params);
        }
      };

      setTimeout(guard(() => {
        revoke(new TimeoutError(`Promise timed out after ${timeout} ms.`));
      }), timeout);
      executor(guard(resolve), guard(revoke));
    });
  };
};
