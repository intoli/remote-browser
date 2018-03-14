export class ConnectionError extends Error {
  constructor(...params) {
    super(...params);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConnectionError);
    }
  }
}


export class RemoteError extends Error {
  constructor(error, message) {
    super(message || error.message);
    if (error instanceof Error) {
      this.remoteError = {};
      let object = error;
      while (object instanceof Error) {
        Object.getOwnPropertyNames(object).forEach((name) => {
          this.remoteError[name] = error[name];
        });
        object = Object.getPrototypeOf(object);
      }
    } else {
      this.remoteError = error;
    }
  }

  toJSON = () => ({
    name: 'RemoteError',
    remoteError: this.remoteError,
  });
}


export class TimeoutError extends Error {
  constructor(...params) {
    super(...params);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TimeoutError);
    }
  }
}
