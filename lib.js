// lib.js - testable pure functions and storage helpers for Pay Demo
const KEY_USER = 'pay_demo_user';
const KEY_TXNS = 'pay_demo_transactions';
const KEY_SESSION = 'pay_demo_session';

// safeStorage: use localStorage in browser, otherwise fall back to in-memory map for Node tests
const _memStore = {};
const safeStorage = (() => {
  try {
    if (typeof localStorage !== 'undefined') {
      return {
        getItem: (k) => localStorage.getItem(k),
        setItem: (k, v) => localStorage.setItem(k, v),
        removeItem: (k) => localStorage.removeItem(k),
      };
    }
  } catch (e) {}
  return {
    getItem: (k) => (_memStore.hasOwnProperty(k) ? _memStore[k] : null),
    setItem: (k, v) => { _memStore[k] = String(v); },
    removeItem: (k) => { delete _memStore[k]; },
  };
})();

export function fmt(amount) { return `৳${Number(amount).toLocaleString('en-IN')}`; }

export async function hashPIN(pin) {
  if (!pin) return '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const enc = new TextEncoder().encode(String(pin));
    const digest = await window.crypto.subtle.digest('SHA-256', enc);
    const bytes = Array.from(new Uint8Array(digest));
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    let h = 0; for (let i = 0; i < pin.length; i++) h = (h << 5) - h + pin.charCodeAt(i);
    return String(h >>> 0);
  }
}

export function calcFee(type, amount) {
  if (!amount || amount <= 0) return 0;
  if (type === 'send') {
    const fee = Math.min(Math.max(amount * 0.01, 5), 25);
    return Math.round(fee);
  }
  if (type === 'cashout') {
    const fee = Math.min(Math.max(amount * 0.018, 15), 50);
    return Math.round(fee);
  }
  return 0;
}

export function getUser() { try { return JSON.parse(safeStorage.getItem(KEY_USER)) || null; } catch { return null; } }
export function setUser(user) { safeStorage.setItem(KEY_USER, JSON.stringify(user)); }
export function getTxns() { try { return JSON.parse(safeStorage.getItem(KEY_TXNS)) || []; } catch { return []; } }
export function setTxns(txns) { safeStorage.setItem(KEY_TXNS, JSON.stringify(txns)); }
export function getSession() { try { return JSON.parse(safeStorage.getItem(KEY_SESSION)) || null; } catch { return null; } }
export function setSession(s) { safeStorage.setItem(KEY_SESSION, JSON.stringify(s)); }
export function clearSession() { safeStorage.removeItem(KEY_SESSION); }

export function addTxnRecord({ type, amount, note, fee = 0, total = 0 }) {
  const txns = getTxns();
  txns.unshift({ id: 'TX' + Date.now(), type, amount, fee, total, note, time: new Date().toISOString() });
  setTxns(txns);
}

export function labelForType(type) {
  switch (type) {
    case 'send': return 'Send';
    case 'cashout': return 'Cash Out';
    case 'recharge': return 'Recharge';
    case 'billpay': return 'Bill Pay';
    case 'addmoney': return 'Add Money';
    case 'savings': return 'Savings';
    case 'savings-withdraw': return 'Savings Withdraw';
    default: return type;
  }
}

export function filterTxns(txns, filter) {
  if (filter === 'all') return txns;
  return txns.filter(t => t.type === filter);
}

// Savings helpers
export function ensureSavings(user) {
  if (!user.savings) user.savings = { balance: 0, goals: [] };
  return user;
}

export function createGoal(user, { title, target = 0, deadline = null }) {
  ensureSavings(user);
  const goal = { id: 'G' + Date.now(), title, target: Number(target), saved: 0, deadline };
  user.savings.goals.push(goal);
  setUser(user);
  return goal;
}

export function transferToSavings(user, goalId, amount) {
  ensureSavings(user);
  amount = Number(amount);
  if (amount <= 0 || user.balance < amount) throw new Error('Insufficient');
  const goal = user.savings.goals.find(g => g.id === goalId);
  if (!goal) throw new Error('Goal not found');
  user.balance -= amount;
  user.savings.balance = (user.savings.balance || 0) + amount;
  goal.saved = (goal.saved || 0) + amount;
  setUser(user);
  addTxnRecord({ type: 'savings', amount, note: `To goal: ${goal.title}`, fee: 0, total: amount });
  return goal;
}

export function withdrawFromSavings(user, goalId, amount) {
  amount = Number(amount);
  ensureSavings(user);
  const goal = user.savings.goals.find(g => g.id === goalId);
  if (!goal) throw new Error('Goal not found');
  if ((user.savings.balance || 0) < amount || goal.saved < amount) throw new Error('Insufficient savings');
  user.savings.balance -= amount; goal.saved -= amount; user.balance += amount;
  setUser(user);
  addTxnRecord({ type: 'savings-withdraw', amount, note: `From goal: ${goal.title}`, fee: 0, total: amount });
  return goal;
}

// Expose for debugging/tests in non-module environments
if (typeof window !== 'undefined') {
  window.__bpay = window.__bpay || {};
  Object.assign(window.__bpay, { fmt, calcFee, hashPIN, getUser, setUser, getTxns, setTxns, addTxnRecord, createGoal, transferToSavings, withdrawFromSavings, filterTxns, labelForType });
}

export default {
  fmt,
  calcFee,
  hashPIN,
  getUser,
  setUser,
  getTxns,
  setTxns,
  getSession,
  setSession,
  clearSession,
  addTxnRecord,
  createGoal,
  transferToSavings,
  withdrawFromSavings,
  filterTxns,
  labelForType
};
