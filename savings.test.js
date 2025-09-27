import lib from '../lib.js';

test('create goal, transfer to savings and withdraw', () => {
  // prepare user
  const user = { name: 'T', phone: '01700000000', balance: 1000 };
  lib.setUser(user);
  const goal = lib.createGoal(user, { title: 'Trip', target: 500 });
  expect(goal.title).toBe('Trip');
  lib.transferToSavings(user, goal.id, 200);
  const u2 = lib.getUser();
  expect(u2.balance).toBe(800);
  expect(u2.savings.balance).toBe(200);
  lib.withdrawFromSavings(u2, goal.id, 100);
  const u3 = lib.getUser();
  expect(u3.balance).toBe(900);
  expect(u3.savings.balance).toBe(100);
});
