import lib from '../lib.js';

test('filterTxns filters by type', () => {
  const txns = [
    { id: '1', type: 'send' },
    { id: '2', type: 'recharge' },
    { id: '3', type: 'send' },
  ];
  expect(lib.filterTxns(txns, 'all').length).toBe(3);
  expect(lib.filterTxns(txns, 'send').length).toBe(2);
  expect(lib.filterTxns(txns, 'recharge').length).toBe(1);
});
