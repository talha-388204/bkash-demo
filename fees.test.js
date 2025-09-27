import lib from '../lib.js';

test('calcFee send and cashout boundaries and rounding', () => {
  expect(lib.calcFee('send', 100)).toBe(5); // 1% = 1 -> min 5
  expect(lib.calcFee('send', 1000)).toBe(10); // 10
  expect(lib.calcFee('send', 5000)).toBe(25); // capped at 25
  expect(lib.calcFee('cashout', 1000)).toBeGreaterThanOrEqual(15);
  expect(lib.calcFee('cashout', 5000)).toBe(50); // capped
});
