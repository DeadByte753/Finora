import type { Bill, Budget, BudgetPeriod, Category, Centavos, Goal, ISODate, Transaction, Wallet } from './types.ts';

/* ---------- money ---------- */

const MINUS = '−'; // typographic minus, matches the designs

/** 74100 -> "₱741.00"; with sign: "+₱1,500.00" / "−₱95.00". */
export function formatPeso(amount: Centavos, opts: { sign?: boolean; decimals?: boolean } = {}): string {
  if (!Number.isInteger(amount)) throw new TypeError('formatPeso expects whole centavos');
  const neg = amount < 0;
  const abs = Math.abs(amount);
  const pesos = Math.floor(abs / 100);
  const cents = abs % 100;
  let body = '₱' + pesos.toLocaleString('en-US');
  if (opts.decimals !== false) body += '.' + String(cents).padStart(2, '0');
  if (neg) return MINUS + body;
  if (opts.sign && amount > 0) return '+' + body;
  return body;
}

/** "1,500.5" -> 150050. Returns null for anything that is not a valid non-negative peso amount. */
export function parsePeso(input: string): Centavos | null {
  const clean = input.replace(/[₱,\s]/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return null;
  const [whole, frac = ''] = clean.split('.');
  const value = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
  return Number.isSafeInteger(value) ? value : null;
}

/** Sign-aware amount for a transaction (+income, -expense). */
export function signed(tx: Pick<Transaction, 'kind' | 'amount'>): Centavos {
  return tx.kind === 'income' ? tx.amount : -tx.amount;
}

/* ---------- dates (UTC math on calendar days, no time-zone drift) ---------- */

const DAY = 86_400_000;

function toUTC(d: ISODate): number {
  const [y, m, day] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, day);
}

function fromUTC(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((toUTC(to) - toUTC(from)) / DAY);
}

export function addDays(d: ISODate, n: number): ISODate {
  return fromUTC(toUTC(d) + n * DAY);
}

/** Today's date in a given IANA time zone (default Asia/Manila). */
export function todayIn(timeZone = 'Asia/Manila', now: Date = new Date()): ISODate {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** Inclusive start/end of the budget period containing `day`. Weeks run Monday to Sunday. */
export function periodRange(period: BudgetPeriod, day: ISODate): { start: ISODate; end: ISODate } {
  if (period === 'monthly') {
    const [y, m] = day.split('-').map(Number);
    const start = fromUTC(Date.UTC(y, m - 1, 1));
    const end = fromUTC(Date.UTC(y, m, 0));
    return { start, end };
  }
  const weekday = new Date(toUTC(day)).getUTCDay(); // 0 = Sunday
  const back = (weekday + 6) % 7;
  const start = addDays(day, -back);
  return { start, end: addDays(start, 6) };
}

function inRange(d: ISODate, start: ISODate, end: ISODate): boolean {
  return d >= start && d <= end;
}

/* ---------- safe to spend ---------- */

export interface SafeToSpend {
  /** Sum of spendable wallets right now. */
  spendable: Centavos;
  /** Bills due from today until the day before the next allowance. */
  billsReserved: Centavos;
  bills: Bill[];
  /** Days the money must last, counting today (minimum 1). */
  days: number;
  /** Daily amount fixed at the start of today. */
  dailyAllowance: Centavos;
  spentToday: Centavos;
  leftToday: Centavos;
  /** Share of today's amount already spent, 0-100 (can exceed 100). */
  usedPct: number;
}

/**
 * The daily amount is based on what you had at the start of today, so spending
 * during the day lowers "left today" without shrinking the daily amount itself.
 */
export function safeToSpend(input: {
  wallets: Wallet[];
  transactions: Transaction[];
  bills: Bill[];
  today: ISODate;
  nextAllowanceOn: ISODate;
}): SafeToSpend {
  const { wallets, transactions, bills, today, nextAllowanceOn } = input;
  const spendableIds = new Set(wallets.filter((w) => w.spendable).map((w) => w.id));
  const spendable = wallets.filter((w) => w.spendable).reduce((s, w) => s + w.balance, 0);

  const todays = transactions.filter((t) => t.occurredOn === today && spendableIds.has(t.walletId));
  const spentToday = todays.filter((t) => t.kind === 'expense').reduce((s, t) => s + t.amount, 0);
  const incomeToday = todays.filter((t) => t.kind === 'income').reduce((s, t) => s + t.amount, 0);

  const due = bills.filter((b) => b.dueOn >= today && b.dueOn < nextAllowanceOn);
  const billsReserved = due.reduce((s, b) => s + b.amount, 0);

  const days = Math.max(1, daysBetween(today, nextAllowanceOn));
  const startOfDay = spendable + spentToday - incomeToday;
  const dailyAllowance = Math.max(0, Math.floor((startOfDay - billsReserved) / days));
  const leftToday = dailyAllowance - spentToday;
  const usedPct = dailyAllowance === 0 ? (spentToday > 0 ? 100 : 0) : (spentToday / dailyAllowance) * 100;

  return { spendable, billsReserved, bills: due, days, dailyAllowance, spentToday, leftToday, usedPct };
}

/* ---------- budgets ---------- */

export type BudgetState = 'ok' | 'warning' | 'over';

export interface BudgetStatus {
  budget: Budget;
  start: ISODate;
  end: ISODate;
  spent: Centavos;
  remaining: Centavos;
  /** 0-100+, unrounded. */
  pct: number;
  state: BudgetState;
}

/** Alerts fire at these percentages of a budget. */
export const BUDGET_ALERTS = [75, 90, 100] as const;

export function budgetStatus(budget: Budget, transactions: Transaction[], today: ISODate): BudgetStatus {
  const { start, end } = periodRange(budget.period, today);
  const spent = transactions
    .filter((t) => t.kind === 'expense' && t.category === budget.category && inRange(t.occurredOn, start, end))
    .reduce((s, t) => s + t.amount, 0);
  const pct = budget.limit === 0 ? (spent > 0 ? 100 : 0) : (spent / budget.limit) * 100;
  const state: BudgetState = pct > 100 ? 'over' : pct >= 75 ? 'warning' : 'ok';
  return { budget, start, end, spent, remaining: budget.limit - spent, pct, state };
}

/** Highest alert threshold newly crossed by adding `amount`, or null. */
export function crossedAlert(before: BudgetStatus, amount: Centavos): number | null {
  const after = before.budget.limit === 0 ? 100 : ((before.spent + amount) / before.budget.limit) * 100;
  const crossed = BUDGET_ALERTS.filter((a) => before.pct < a && after >= a);
  return crossed.length ? crossed[crossed.length - 1] : null;
}

/* ---------- goals ---------- */

export interface GoalPace {
  goal: Goal;
  remaining: Centavos;
  pct: number;
  reached: boolean;
  daysLeft: number | null;
  /** Centavos per week needed to finish on time, or null when there is no target date. */
  perWeek: Centavos | null;
}

export function goalPace(goal: Goal, today: ISODate): GoalPace {
  const remaining = Math.max(0, goal.target - goal.saved);
  const pct = goal.target === 0 ? 100 : Math.min(100, (goal.saved / goal.target) * 100);
  const reached = remaining === 0;
  if (!goal.targetDate) return { goal, remaining, pct, reached, daysLeft: null, perWeek: null };
  const daysLeft = Math.max(0, daysBetween(today, goal.targetDate));
  const weeks = Math.max(1, daysLeft / 7);
  return { goal, remaining, pct, reached, daysLeft, perWeek: reached ? 0 : Math.round(remaining / weeks) };
}

/* ---------- reports ---------- */

export interface CategorySlice {
  category: Category;
  amount: Centavos;
  /** Whole-number share, largest-remainder rounded so slices sum to 100. */
  pct: number;
}

export function spendingByCategory(transactions: Transaction[], from: ISODate, to: ISODate): CategorySlice[] {
  const totals = new Map<Category, number>();
  for (const t of transactions) {
    if (t.kind !== 'expense' || !inRange(t.occurredOn, from, to)) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  if (sum === 0) return [];
  const slices = [...totals].map(([category, amount]) => {
    const exact = (amount / sum) * 100;
    return { category, amount, exact, pct: Math.floor(exact) };
  });
  let left = 100 - slices.reduce((s, r) => s + r.pct, 0);
  const byRemainder = [...slices].sort((a, b) => b.exact - b.pct - (a.exact - a.pct));
  for (const s of byRemainder) {
    if (left <= 0) break;
    s.pct += 1;
    left -= 1;
  }
  return slices
    .map(({ category, amount, pct }) => ({ category, amount, pct }))
    .sort((a, b) => b.amount - a.amount);
}

export function totals(transactions: Transaction[], from?: ISODate, to?: ISODate) {
  let income = 0;
  let expenses = 0;
  for (const t of transactions) {
    if (from && to && !inRange(t.occurredOn, from, to)) continue;
    if (t.kind === 'income') income += t.amount;
    else expenses += t.amount;
  }
  return { income, expenses, balance: income - expenses };
}

/** Percentage change vs. a previous figure, rounded; null when there is nothing to compare. */
export function changePct(current: Centavos, previous: Centavos): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
