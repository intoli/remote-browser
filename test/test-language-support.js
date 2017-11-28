import chai from 'chai';


describe('Temporary', () => {
  it('should run and pass this test', () => {
    chai.assert(true, 'this passes');
  });
  it('should support the object spread operator', () => {
    const a = { a: 1, b: 2 };
    const b = { ...a, a: 2 };
    chai.expect(b).to.deep.equal({ a: 2, b: 2 });
  });
});
