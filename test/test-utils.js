import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import parallel from 'mocha.parallel';

import * as errors from '../src/errors';
import * as utils from '../src/utils';


chai.use(chaiAsPromised);


parallel('utils', () => {
  parallel('TimeoutPromise', () => {
    it('should throw an exception after timeout', () => {
      const promise = new utils.TimeoutPromise(() => null, 50);
      chai.expect(promise).to.be.rejectedWith(errors.TimeoutError);
    });
    it('should resolve with the correct value', () => {
      const value = 'hello';
      const promise = new utils.TimeoutPromise(resolve => resolve(value), 50);
      chai.expect(promise).to.eventually.equal(value);
    });
  });
});
