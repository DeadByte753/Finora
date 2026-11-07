import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  budgetStatus,
  changePct,
  crossedAlert,
  formatPeso,
  goalPace,
  parsePeso,
  periodRange,
  safeToSpend,
  spendingByCategory,
  todayIn
} from '../src/finance.ts';
import type { Bill, Transaction, Wallet } from '../src/types.ts';

const wallets: Wallet[] = [
  { id: 'cash', name: 'Cash', kind: 'cash', balance: 107100, spendable: true },
  { id: 'gcash', name: 'GCash', kind: 'ewallet', balance: 70000, spendable: true },
  { id: 'bpi', name: 'BPI Savings', kind: 'bank', balance: 3849100, spendable: false }
];

const tx = (id: string, title: string, category: Transaction['category'], walletId: string, occurredOn: string, amount: number, kind: Transaction['kind'] = 'expense'): Transaction =>
  ({ id, title, category, walletId, occurredOn, amount, kind });

const transactions: Transaction[] = [
  tx('1', 'Iced coffee', 'Food', 'cash', '2026-10-31', 9500),
  tx('2', 'Lunch at canteen', 'Food', 'cash', '2026-10-31', 9500),
  tx('3', 'Grab ride home', 'Transportation', 'gcash', '2026-10-30', 18500),
  tx('4', 'Jeepney fare', 'Transportation', 'cash', '2026-10-29', 5200),
  tx('5', 'Weekly allowance', 'Allowance', 'gcash', '2026-10-26', 150000, 'income'),
  tx('6', 'Jeepney fare', 'Transportation', 'cash', '2026-10-25', 2600),
  tx('7', 'Lab manual', 'Education', 'gcash', '2026-10-25', 45000)
];

const bills: Bill[] = [{ id: 'b1', name: 'Phone load', amount: 9900, dueOn: '2026-11-01' }];

test('formatPeso matches the design copy', () => {
  assert.equal(formatPeso(74100), '₱741.00');
  assert.equal(formatPeso(3849100), '₱38,491.00');
  assert.equal(formatPeso(-9500), '−₱95.00');
  assert.equal(formatPeso(150000, { sign: true }), '+₱1,500.00');
  assert.equal(formatPeso(520700, { decimals: false }), '₱5,207');
  assert.throws(() => formatPeso(1.5));
});

test('parsePeso accepts typed amounts and rejects junk', () => {
  assert.equal(parsePeso('1,500.5'), 150050);
  assert.equal(parsePeso('₱ 95'), 9500);
  assert.equal(parsePeso('0.07'), 7);
  assert.equal(parsePeso('-5'), null);
  assert.equal(parsePeso('1.234'), null);
  assert.equal(parsePeso('abc'), null);
});

test('safe to spend reproduces the dashboard: ₱931 a day, ₱741 left', () => {
  const s = safeToSpend({ wallets, transactions, bills, today: '2026-10-31', nextAllowanceOn: '2026-11-02' });
  assert.equal(s.spendable, 177100);
  assert.equal(s.billsReserved, 9900);
  assert.equal(s.days, 2);
  assert.equal(s.spentToday, 19000);
  assert.equal(s.dailyAllowance, 93100);
  assert.equal(s.leftToday, 74100);
  assert.equal(Math.round(s.usedPct), 20);
});

test('safe to spend ignores savings wallets and bills after the allowance', () => {
  const later: Bill[] = [...bills, { id: 'b2', name: 'Rent', amount: 100000, dueOn: '2026-11-05' }];
  const s = safeToSpend({ wallets, transactions, bills: later, today: '2026-10-31', nextAllowanceOn: '2026-11-02' });
  assert.equal(s.billsReserved, 9900);
  assert.equal(s.bills.length, 1);
});

test('safe to spend never goes below zero per day and handles allowance today', () => {
  const broke: Wallet[] = [{ id: 'cash', name: 'Cash', kind: 'cash', balance: 1000, spendable: true }];
  // ₱10 left but a ₱99 bill due before the allowance: daily amount floors at zero.
  const s = safeToSpend({ wallets: broke, transactions: [], bills, today: '2026-10-31', nextAllowanceOn: '2026-11-02' });
  assert.equal(s.dailyAllowance, 0);
  assert.equal(s.leftToday, 0);
  // Allowance arriving today still counts as one day to cover.
  const t = safeToSpend({ wallets: broke, transactions: [], bills: [], today: '2026-10-31', nextAllowanceOn: '2026-10-31' });
  assert.equal(t.days, 1);
  assert.equal(t.dailyAllowance, 1000);
});

test('weekly budgets run Monday to Sunday', () => {
  assert.deepEqual(periodRange('weekly', '2026-10-31'), { start: '2026-10-26', end: '2026-11-01' });
  assert.deepEqual(periodRange('weekly', '2026-10-26'), { start: '2026-10-26', end: '2026-11-01' });
  assert.deepEqual(periodRange('monthly', '2026-02-10'), { start: '2026-02-01', end: '2026-02-28' });
});

test('budget status: transportation weekly is over (₱237 of ₱220)', () => {
  const b = budgetStatus({ id: 't', category: 'Transportation', period: 'weekly', limit: 22000 }, transactions, '2026-10-31');
  assert.equal(b.spent, 23700);
  assert.equal(b.state, 'over');
  assert.equal(b.remaining, -1700);
});

test('budget alerts fire once per threshold', () => {
  const b = budgetStatus({ id: 'f', category: 'Food', period: 'monthly', limit: 26000 }, transactions, '2026-10-31');
  assert.equal(b.spent, 19000);
  assert.equal(b.state, 'ok');
  assert.equal(crossedAlert(b, 1000), 75);
  assert.equal(crossedAlert(b, 10000), 100);
  assert.equal(crossedAlert(b, 100), null);
});

test('goal pace matches the savings screen', () => {
  const laptop = goalPace({ id: 'l', name: 'New laptop', target: 3500000, saved: 1800000, targetDate: '2027-03-30' }, '2026-10-31');
  assert.equal(laptop.daysLeft, 150);
  assert.equal(laptop.perWeek, 79333);
  const trip = goalPace({ id: 't', name: 'Baguio trip', target: 600000, saved: 420000, targetDate: '2026-11-05' }, '2026-10-31');
  assert.equal(trip.perWeek, 180000);
  const calc = goalPace({ id: 'c', name: 'Graphing calculator', target: 250000, saved: 250000, targetDate: null }, '2026-10-31');
  assert.equal(calc.reached, true);
  assert.equal(calc.perWeek, null);
});

test('category shares always add up to 100', () => {
  const slices = spendingByCategory(transactions, '2026-10-01', '2026-10-31');
  assert.equal(slices.reduce((s, x) => s + x.pct, 0), 100);
  assert.equal(slices[0].category, 'Education');
});

test('changePct and todayIn', () => {
  assert.equal(changePct(520700, 259500), 101);
  assert.equal(changePct(100, 0), null);
  assert.equal(todayIn('Asia/Manila', new Date('2026-10-31T17:30:00Z')), '2026-11-01');
});
