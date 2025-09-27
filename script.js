// Lightweight bootstrap that uses lib.js for core logic.
import lib from './lib.js';

// Re-query DOM elements (keep same IDs/classes from original markup)
const screens = {
  auth: document.getElementById('screen-auth'),
  dashboard: document.getElementById('screen-dashboard'),
  send: document.getElementById('screen-send'),
  cashout: document.getElementById('screen-cashout'),
  recharge: document.getElementById('screen-recharge'),
  billpay: document.getElementById('screen-billpay'),
  addmoney: document.getElementById('screen-addmoney'),
  history: document.getElementById('screen-history'),
  profile: document.getElementById('screen-profile'),
};

const modalEl = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalMsg = document.getElementById('modalMsg');
const modalIcon = document.getElementById('modalIcon');
const modalClose = document.getElementById('modalClose');

const userAvatar = document.getElementById('userAvatar');
const userNameText = document.getElementById('userNameText');
const userPhoneText = document.getElementById('userPhoneText');
const balanceText = document.getElementById('balanceText');
const recentList = document.getElementById('recentList');

const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const profilePhone = document.getElementById('profilePhone');

const loginForm = document.getElementById('loginForm');
const loginPhone = document.getElementById('loginPhone');
const loginPin = document.getElementById('loginPin');

const signupForm = document.getElementById('signupForm');
const signupName = document.getElementById('signupName');
const signupPhone = document.getElementById('signupPhone');
const signupPin = document.getElementById('signupPin');

const sendForm = document.getElementById('sendForm');
const sendReceiver = document.getElementById('sendReceiver');
const sendAmount = document.getElementById('sendAmount');
const sendPin = document.getElementById('sendPin');

const cashoutForm = document.getElementById('cashoutForm');
const cashAgent = document.getElementById('cashAgent');
const cashAmount = document.getElementById('cashAmount');
const cashPin = document.getElementById('cashPin');

const rechargeForm = document.getElementById('rechargeForm');
const rechargeOperator = document.getElementById('rechargeOperator');
const rechargeNumber = document.getElementById('rechargeNumber');
const rechargeAmount = document.getElementById('rechargeAmount');

const billForm = document.getElementById('billForm');
const billBiller = document.getElementById('billBiller');
const billAccount = document.getElementById('billAccount');
const billAmount = document.getElementById('billAmount');

const addForm = document.getElementById('addForm');
const addSource = document.getElementById('addSource');
const addAmount = document.getElementById('addAmount');

const historyFilter = document.getElementById('historyFilter');
const historyList = document.getElementById('historyList');

const pinForm = document.getElementById('pinForm');
const currentPin = document.getElementById('currentPin');
const newPin = document.getElementById('newPin');

// new UI pieces
const bottomNavContainer = createBottomNav();
document.body.appendChild(bottomNavContainer);
const notifBadge = document.getElementById('notifBadge');

function createBottomNav() {
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.setAttribute('aria-label', 'Primary');
  const items = [
    { href: '#/dashboard', icon: 'home', label: 'Dashboard' },
    { href: '#/send', icon: 'send', label: 'Send' },
    { href: '#/history', icon: 'history', label: 'History' },
    { href: '#/profile', icon: 'profile', label: 'Profile' },
  ];
  items.forEach(it => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.nav = it.href;
    btn.setAttribute('aria-label', it.label);
    btn.innerHTML = `<svg aria-hidden="true"><use href="#${it.icon}"/></svg><span>${it.label}</span>`;
    btn.addEventListener('click', () => { location.hash = it.href; });
    nav.appendChild(btn);
  });
  // history badge
  const historyBtn = nav.querySelector('button[data-nav="#/history"]');
  const badge = document.createElement('span'); badge.id = 'notifBadge'; badge.className = 'badge'; badge.textContent = '0';
  historyBtn.style.position = 'relative'; historyBtn.appendChild(badge);
  return nav;
}

// modal helpers
function showModal({ title = 'Success', msg = '', type = 'success' }) {
  modalTitle.textContent = title;
  modalMsg.textContent = msg;
  modalIcon.innerHTML = type === 'success' ? '<svg><use href="#success"/></svg>' : '<svg><use href="#alert"/></svg>';
  modalEl.classList.add('open');
  modalEl.setAttribute('role', 'dialog');
  modalEl.setAttribute('aria-modal', 'true');
  modalClose.focus();
}
function closeModal() { modalEl.classList.remove('open'); modalEl.removeAttribute('role'); modalEl.removeAttribute('aria-modal'); }
modalClose.addEventListener('click', closeModal);
modalEl.addEventListener('click', (e) => { if (e.target === modalEl) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// transitions manager
let activeScreen = null;
function setActive(route) {
  const key = route.replace('#', '').replace('/', '');
  const next = screens[key] || screens.auth;
  if (activeScreen === next) return;
  // handle outgoing screen
  const prev = document.querySelector('.screen.active');
  if (prev && prev !== next) {
    prev.classList.remove('active');
    prev.classList.add('leaving');
    setTimeout(() => prev.classList.remove('leaving'), 260);
  }
  // ensure no duplicate active classes
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  // activate next
  next.classList.add('active');
  activeScreen = next;
  // update bottom nav active
  document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.toggle('active', b.dataset.nav === route));

  // protect private routes
  const session = lib.getSession ? lib.getSession() : null;
  const isAuth = !!(session && session.loggedIn);
  if (!isAuth && next !== screens.auth) {
    location.hash = '#/auth';
    return;
  }

  if (next === screens.dashboard) renderDashboard();
  if (next === screens.history) { renderHistory(); resetNotifBadge(); }
  if (next === screens.profile) renderProfile();
}

window.addEventListener('hashchange', () => setActive(location.hash || '#/auth'));
document.addEventListener('DOMContentLoaded', async () => {
  if (!location.hash) location.hash = '#/auth';
  setActive(location.hash);
  bindAuth(); bindTransactions(); bindProfile(); bindSavingsUI();

  // Hamburger / nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  const navEl = document.querySelector('.nav');
  navToggle.addEventListener('click', (e) => {
    const open = navEl.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Close nav when clicking outside
  document.addEventListener('click', (e) => {
    const insideNav = e.target.closest('.nav') || e.target.closest('.nav-toggle');
    if (!insideNav) {
      navEl.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Theme toggle (persist in localStorage)
  const themeBtn = document.getElementById('themeToggle');
  const THEME_KEY = 'bpay_theme';
  function applyTheme(t) {
    if (t === 'light') document.body.classList.add('light'); else document.body.classList.remove('light');
  }
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);
  themeBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light');
    const newTheme = isLight ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, newTheme);
  });
});

// small helpers
function normalizePhone(p) { const s = String(p).replace(/\D/g, ''); return s.length > 11 ? s.slice(-11) : s; }
function isValidPhone(p) { return /^01\d{9}$/.test(p); }
function prettyDate(iso) { const d = new Date(iso); return d.toLocaleString(); }

// notification badge
function incNotif() { const v = Number(document.getElementById('notifBadge').textContent || '0') + 1; document.getElementById('notifBadge').textContent = String(v); }
function resetNotifBadge() { document.getElementById('notifBadge').textContent = '0'; }

/* Auth */
function bindAuth() {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = signupName.value.trim();
    const phone = normalizePhone(signupPhone.value);
    const pin = signupPin.value.trim();
    if (!isValidPhone(phone)) return showModal({ title: 'Invalid phone', msg: 'Please enter a valid Bangladeshi number.', type: 'error' });
    const hashed = await lib.hashPIN(pin);
    const user = { name, phone, pinHash: hashed, balance: 5000, avatar: lib.fmt ? undefined : undefined, createdAt: Date.now() };
    user.avatar = `https://i.postimg.cc/1Xk9bjC2/Copilot-20250921-112342.png`;
    user.savings = { balance: 0, goals: [] };
    lib.setUser(user);
    lib.setSession({ loggedIn: true, phone });
    if (!lib.getTxns().length) lib.setTxns([]);
    showModal({ title: 'Account created', msg: 'Welcome to Pay Demo(by Talha)!', type: 'success' });
    // navigate after a short delay so modal is visible
    setTimeout(() => { location.hash = '#/dashboard'; document.querySelector('.nav').classList.remove('open'); }, 700);
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = normalizePhone(loginPhone.value);
    const pin = loginPin.value.trim();
    const user = lib.getUser();
    if (!user) return showModal({ title: 'No account', msg: 'Please sign up first.', type: 'error' });
    if (user.phone !== phone) return showModal({ title: 'Wrong number', msg: 'Phone number does not match.', type: 'error' });
    const hashed = await lib.hashPIN(pin);
    if (hashed !== user.pinHash) return showModal({ title: 'Wrong PIN', msg: 'PIN does not match. Try again.', type: 'error' });
    lib.setSession({ loggedIn: true, phone });
    showModal({ title: 'Login successful', msg: 'Redirecting to dashboard…', type: 'success' });
    setTimeout(() => { location.hash = '#/dashboard'; document.querySelector('.nav').classList.remove('open'); }, 600);
  });
}

// close nav when any nav link clicked (improves mobile behavior)
document.addEventListener('click', (e) => {
  const link = e.target.closest('.nav-link');
  if (link) {
    document.querySelector('.nav').classList.remove('open');
    const toggle = document.querySelector('.nav-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
});

/* Transactions & fees */
function bindTransactions() {
  sendForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const receiver = normalizePhone(sendReceiver.value);
    const amount = Number(sendAmount.value);
    const pin = sendPin.value.trim();
    if (!isValidPhone(receiver)) return showModal({ title: 'Invalid number', msg: 'Enter a valid receiver number.', type: 'error' });
    if (amount <= 0) return showModal({ title: 'Invalid amount', msg: 'Enter an amount greater than zero.', type: 'error' });
    const user = lib.getUser();
    if (!user) return showModal({ title: 'No user', msg: 'Please signup/login.', type: 'error' });
    if ((await lib.hashPIN(sendPin.value)) !== user.pinHash) return showModal({ title: 'Wrong PIN', msg: 'PIN check failed.', type: 'error' });
    const fee = lib.calcFee('send', amount);
    const total = amount + fee;
    if (user.balance < total) return showModal({ title: 'Insufficient balance', msg: 'Not enough funds to send money (including fee).', type: 'error' });
    // Confirmation
    const confirm = confirmTransaction({ title: 'Confirm Send', amount, fee, total, note: `To: ${receiver}` });
    if (!confirm) return;
    user.balance -= total; lib.setUser(user);
    lib.addTxnRecord({ type: 'send', amount, fee, total, note: `To: ${receiver}` });
    showModal({ title: 'Money sent', msg: `Sent ${lib.fmt(amount)} to ${receiver}. Fee ${lib.fmt(fee)}.`, type: 'success' });
    sendForm.reset(); renderDashboard(); incNotif();
  });

  cashoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const agent = normalizePhone(cashAgent.value);
    const amount = Number(cashAmount.value);
    if (!isValidPhone(agent)) return showModal({ title: 'Invalid agent', msg: 'Enter a valid agent number.', type: 'error' });
    if (amount <= 0) return showModal({ title: 'Invalid amount', msg: 'Enter an amount greater than zero.', type: 'error' });
    const user = lib.getUser(); if (!user) return showModal({ title: 'No user', msg: 'Please signup/login.', type: 'error' });
    const fee = lib.calcFee('cashout', amount); const total = amount + fee;
    if ((await lib.hashPIN(cashPin.value)) !== user.pinHash) return showModal({ title: 'Wrong PIN', msg: 'PIN check failed.', type: 'error' });
    if (user.balance < total) return showModal({ title: 'Insufficient balance', msg: 'Not enough funds to cash out (including fee).', type: 'error' });
    if (!confirmTransaction({ title: 'Confirm Cash Out', amount, fee, total, note: `Agent: ${agent}` })) return;
    user.balance -= total; lib.setUser(user);
    lib.addTxnRecord({ type: 'cashout', amount, fee, total, note: `Agent: ${agent}` });
    showModal({ title: 'Cash out success', msg: `Cashed out ${lib.fmt(amount)} via ${agent}. Fee ${lib.fmt(fee)}.`, type: 'success' });
    cashoutForm.reset(); renderDashboard(); incNotif();
  });

  rechargeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const operator = rechargeOperator.value; const number = normalizePhone(rechargeNumber.value); const amount = Number(rechargeAmount.value);
    if (!operator) return showModal({ title: 'Choose operator', msg: 'Please select mobile operator.', type: 'error' });
    if (!isValidPhone(number)) return showModal({ title: 'Invalid number', msg: 'Enter a valid mobile number.', type: 'error' });
    if (amount < 10) return showModal({ title: 'Amount too low', msg: 'Minimum recharge is 10.', type: 'error' });
    const user = lib.getUser(); if (user.balance < amount) return showModal({ title: 'Insufficient balance', msg: 'Add money first to recharge.', type: 'error' });
    user.balance -= amount; lib.setUser(user);
    lib.addTxnRecord({ type: 'recharge', amount, fee: 0, total: amount, note: `${operator} • ${number}` });
    showModal({ title: 'Recharge success', msg: `Recharged ${lib.fmt(amount)} to ${number}.`, type: 'success' });
    rechargeForm.reset(); renderDashboard(); incNotif();
  });

  billForm.addEventListener('submit', (e) => {
    e.preventDefault(); const biller = billBiller.value; const account = billAccount.value.trim(); const amount = Number(billAmount.value);
    if (!biller) return showModal({ title: 'Choose biller', msg: 'Please select a biller.', type: 'error' });
    if (!account) return showModal({ title: 'Account required', msg: 'Please enter account/customer ID.', type: 'error' });
    if (amount <= 0) return showModal({ title: 'Invalid amount', msg: 'Enter an amount greater than zero.', type: 'error' });
    const user = lib.getUser(); if (user.balance < amount) return showModal({ title: 'Insufficient balance', msg: 'Not enough funds to pay bill.', type: 'error' });
    user.balance -= amount; lib.setUser(user);
    lib.addTxnRecord({ type: 'billpay', amount, fee: 0, total: amount, note: `${biller} • Acc: ${account}` });
    showModal({ title: 'Bill paid', msg: `Paid ${lib.fmt(amount)} to ${biller}.`, type: 'success' });
    billForm.reset(); renderDashboard(); incNotif();
  });

  addForm.addEventListener('submit', (e) => {
    e.preventDefault(); const source = addSource.value; const amount = Number(addAmount.value);
    if (!source) return showModal({ title: 'Choose source', msg: 'Please select source.', type: 'error' });
    if (amount <= 0) return showModal({ title: 'Invalid amount', msg: 'Enter an amount greater than zero.', type: 'error' });
    const user = lib.getUser(); user.balance += amount; lib.setUser(user);
    lib.addTxnRecord({ type: 'addmoney', amount, fee: 0, total: amount, note: `Source: ${source}` });
    showModal({ title: 'Money added', msg: `Added ${lib.fmt(amount)} via ${source}.`, type: 'success' });
    addForm.reset(); renderDashboard(); incNotif();
  });

  historyFilter.addEventListener('change', renderHistory);
}

function confirmTransaction({ title, amount, fee, total, note }) {
  // simple native confirm for now; can be replaced with accessible modal
  return confirm(`${title}\nAmount: ${lib.fmt(amount)}\nFee: ${lib.fmt(fee)}\nTotal: ${lib.fmt(total)}\n\nProceed?`);
}

function renderDashboard() {
  const user = lib.getUser(); if (!user) return;
  userAvatar.src = user.avatar || `data:image/svg+xml;base64,`;
  userNameText.textContent = user.name || 'User'; userPhoneText.textContent = user.phone || '—';
  balanceText.textContent = lib.fmt(user.balance || 0);
  const txns = lib.getTxns().slice(0, 6);
  recentList.innerHTML = txns.map(t => `
    <li>
      <div>
        <div><strong>${lib.labelForType(t.type)}</strong> • ${t.note}</div>
        <div class="meta">${prettyDate(t.time)}</div>
        ${t.fee ? `<div class="meta">Fee: ${lib.fmt(t.fee)}</div>` : ''}
      </div>
      <div style="text-align:right;">
        <div ${t.type === 'addmoney' ? 'class="neon"' : ''}>${t.type === 'addmoney' ? '+' : '-'}${lib.fmt(t.amount)}</div>
      </div>
    </li>
  `).join('');
}

function renderHistory() {
  const filter = historyFilter.value;
  const txns = lib.filterTxns(lib.getTxns(), filter);
  historyList.innerHTML = txns.map(t => `
    <li>
      <div>
        <div><strong>${lib.labelForType(t.type)}</strong> • ${t.note}</div>
        <div class="meta">${prettyDate(t.time)}</div>
        ${t.fee ? `<div class="meta">Fee: ${lib.fmt(t.fee)}</div>` : ''}
      </div>
      <div style="text-align:right;">
        <div ${t.type === 'addmoney' ? 'class="neon"' : ''}>${t.type === 'addmoney' ? '+' : '-'}${lib.fmt(t.amount)}</div>
      </div>
    </li>
  `).join('');
}

/* Profile & settings */
function bindProfile() {
  pinForm.addEventListener('submit', async (e) => {
    e.preventDefault(); const cur = currentPin.value.trim(); const next = newPin.value.trim();
    if (!(await lib.hashPIN(cur)) || !lib.getUser()) return showModal({ title: 'Wrong PIN', msg: 'Current PIN incorrect', type: 'error' });
    if (next.length < 4 || next.length > 6) return showModal({ title: 'Invalid PIN', msg: 'New PIN must be 4-6 digits', type: 'error' });
    const user = lib.getUser(); user.pinHash = await lib.hashPIN(next); lib.setUser(user);
    showModal({ title: 'PIN changed', msg: 'Your PIN was updated (demo).', type: 'success' }); pinForm.reset();
  });
}

function renderProfile() {
  const user = lib.getUser(); if (!user) return;
  profileAvatar.src = user.avatar || `data:image/svg+xml;base64,`;
  profileName.textContent = user.name || '—'; profilePhone.textContent = user.phone || '—';
  // render savings
  const savingsWrap = document.getElementById('savingsWrap'); if (savingsWrap) {
    savingsWrap.innerHTML = '';
    const s = user.savings || { balance: 0, goals: [] };
    const balanceEl = document.createElement('div'); balanceEl.textContent = `Savings balance: ${lib.fmt(s.balance || 0)}`; savingsWrap.appendChild(balanceEl);
    const goalsEl = document.createElement('div'); goalsEl.className = 'mt-12';
    s.goals.forEach(g => {
      const gEl = document.createElement('div'); gEl.className = 'card glass mt-8';
      gEl.innerHTML = `<div><strong>${g.title}</strong> • Target ${lib.fmt(g.target)}</div>
        <div style="margin-top:8px;"><div style="height:10px;background:rgba(255,255,255,0.06);border-radius:6px;overflow:hidden;"><div style="width:${Math.min(100, Math.round((g.saved/g.target||0)*100))}%;height:10px;background:linear-gradient(90deg,var(--neon),var(--neon-2));"></div></div>
        <div class="meta">Saved ${lib.fmt(g.saved || 0)}</div>
        <div style="margin-top:8px;"><button data-withdraw="${g.id}" class="btn btn-ghost">Withdraw</button> <button data-save="${g.id}" class="btn btn-secondary">Add to goal</button></div>
        </div>`;
      goalsEl.appendChild(gEl);
    });
    savingsWrap.appendChild(goalsEl);
    // bind goal buttons
    savingsWrap.querySelectorAll('[data-save]').forEach(b => b.addEventListener('click', (ev) => {
      const id = ev.currentTarget.dataset.save; const amt = Number(prompt('Amount to save to this goal', '100')); try { lib.transferToSavings(user, id, amt); renderProfile(); renderDashboard(); incNotif(); } catch (err) { showModal({ title: 'Error', msg: err.message, type: 'error' }); }
    }));
    savingsWrap.querySelectorAll('[data-withdraw]').forEach(b => b.addEventListener('click', (ev) => {
      const id = ev.currentTarget.dataset.withdraw; const amt = Number(prompt('Amount to withdraw from this goal', '50')); try { lib.withdrawFromSavings(user, id, amt); renderProfile(); renderDashboard(); incNotif(); } catch (err) { showModal({ title: 'Error', msg: err.message, type: 'error' }); }
    }));
  }
}

/* Savings UI for creating goals */
function bindSavingsUI() {
  const profileSection = screens.profile;
  const html = document.createElement('div'); html.innerHTML = `
    <div class="card glass mt-16">
      <h3 class="title">Savings / Goals</h3>
      <div id="savingsWrap"></div>
      <form id="goalForm" class="mt-12">
        <div class="form-group"><label>Title</label><input id="goalTitle" required></div>
        <div class="form-group"><label>Target amount</label><input id="goalTarget" type="number" min="1" required></div>
        <div class="form-group"><label>Deadline (optional)</label><input id="goalDeadline" type="date"></div>
        <button class="btn btn-primary" type="submit">Create goal</button>
      </form>
    </div>`;
  profileSection.appendChild(html);
  const goalForm = document.getElementById('goalForm');
  goalForm.addEventListener('submit', (e) => {
    e.preventDefault(); const title = document.getElementById('goalTitle').value; const target = Number(document.getElementById('goalTarget').value); const deadline = document.getElementById('goalDeadline').value || null;
    const user = lib.getUser(); if (!user) return showModal({ title: 'No user', msg: 'Please login', type: 'error' });
    lib.createGoal(user, { title, target, deadline }); renderProfile(); showModal({ title: 'Goal created', msg: `Goal ${title} created.`, type: 'success' });
  });
}

// ensure session consistency
if (!lib.getUser()) { lib.clearSession && lib.clearSession(); }

// Expose some functions for tests
window.__bpay = window.__bpay || {};
Object.assign(window.__bpay, { calcFee: lib.calcFee, hashPIN: lib.hashPIN, transferToSavings: lib.transferToSavings, withdrawFromSavings: lib.withdrawFromSavings, filterTxns: lib.filterTxns });
