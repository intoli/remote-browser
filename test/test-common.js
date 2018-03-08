import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import parallel from 'mocha.parallel';

import * as errors from '../src/errors';
import * as common from '../src/common';


chai.use(chaiAsPromised);


parallel('common', () => {
  parallel('TimeoutPromise', () => {
    it('should throw an exception after timeout', () => {
      const promise = new common.TimeoutPromise(() => null, 50);
      chai.expect(promise).to.be.rejectedWith(errors.TimeoutError);
    });
    it('should resolve with the correct value', () => {
      const value = 'hello';
      const promise = new common.TimeoutPromise(resolve => resolve(value), 50);
      chai.expect(promise).to.eventually.equal(value);
    });
    it('should revoke with the correct value', () => {
      const value = 'hello';
      const promise = new common.TimeoutPromise((resolve, revoke) => revoke(new Error(value)), 50);
      chai.expect(promise).to.be.rejectedWith(Error, value);
    });
  });
});
