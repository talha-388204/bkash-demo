import lib from '../lib.js';

test('hashPIN returns consistent SHA-256 hex string', async () => {
  const h1 = await lib.hashPIN('1234');
  const h2 = await lib.hashPIN('1234');
  expect(h1).toBe(h2);
  expect(typeof h1).toBe('string');
  expect(h1.length).toBeGreaterThan(8);
});
