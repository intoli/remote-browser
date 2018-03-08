import assert from 'assert';


describe('Language Support', () => {
  it('should run and pass this test', () => {
    assert(true);
  });
  it('should support the object spread operator', () => {
    const a = { a: 1, b: 2 };
    const b = { ...a, a: 2 };
    assert.deepEqual(b, { a: 2, b: 2 });
  });
});
