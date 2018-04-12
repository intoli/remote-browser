import assert from 'assert';

import * as errors from '../src/errors';
import * as common from '../src/common';

const catchError = async(promise) => {
  try {
    await promise;
  } catch (e) {
    return e;
  }
};

describe('common', () => {
  describe('serializeFunction', () => {
    it('should serialize arrow functions', () => {
      const sayHello = () => 'hello';
      const serialized = common.serializeFunction(sayHello);
      const result = eval(`(${serialized})()`);
      assert.equal(result, 'hello');
    });

    it('should handle broken Safari functions', async () => {
      const sayHello = 'async function () => \'hello\'';
      const serialized = common.serializeFunction(sayHello);
      const result = await eval(`(${serialized})()`);
      assert.equal(result, 'hello');
    });
  });

  describe('TimeoutPromise', () => {
    it('should throw an exception after timeout', async () => {
      const error = await catchError(new common.TimeoutPromise(() => null, 50))
      assert(error instanceof errors.TimeoutError);
    });

    it('should resolve with the correct value', async () => {
      const expectedValue = 'hello';
      const value = await new common.TimeoutPromise(resolve => resolve(expectedValue), 50);
      assert.equal(value, expectedValue);
    });

    it('should revoke with the correct error message', async () => {
      const expectedMessage = 'hello';
      const error = await catchError(
        new common.TimeoutPromise((resolve, revoke) => revoke(new Error(expectedMessage)), 50),
      );
      assert(error instanceof Error);
      assert.equal(error.message, expectedMessage);
    });
  });
});
