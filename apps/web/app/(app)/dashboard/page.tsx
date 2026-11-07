import type { Metadata } from 'next';
import Link from 'next/link';
import {
  budgetStatus,
  categoryColor,
  changePct,
  formatPeso,
  goalPace,
  periodRange,
  safeToSpend,
  spendingByCategory,
  totals,
  addDays
} from '@finora/core';
import { formatDate, loadFinances } from '@/lib/data';
import { CountUp } from '@/components/CountUp';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Bar, Empty, PageHeader, stateStyle } from '@/components/ui';
import { ActionForm, DemoButton } from '@/components/forms';
import { loadDemoData, setNextAllowance } from '../actions';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function Dashboard() {
  const f = await loadFinances();
  const first = f.profile.fullName.split(' ')[0];

  if (f.wallets.length === 0) {
    return (
      <>
        <PageHeader title={`Hi, ${first}!`} sub="Let's set up your money.">
          <ThemeToggle />
        </PageHeader>
        <div className="px-card flex flex-col items-center gap-4 text-center">
          <p className="text-[22px]">Add your first wallet to get started, or explore with Juan&apos;s demo data.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/wallets" className="px-btn px-btn-primary">Add a wallet</Link>
            <DemoButton action={loadDemoData} />
          </div>
        </div>
      </>
    );
  }

  const nextAllowance = f.profile.nextAllowanceOn && f.profile.nextAllowanceOn >= f.today ? f.profile.nextAllowanceOn : addDays(f.today, 7);
  const safe = safeToSpend({ wallets: f.wallets, transactions: f.transactions, bills: f.bills, today: f.today, nextAllowanceOn: nextAllowance });
  const month = periodRange('monthly', f.today);
  const monthTotals = totals(f.transactions, month.start, month.end);
  const all = totals(f.transactions);
  const lastMonthDay = addDays(month.start, -1);
  const lastMonth = periodRange('monthly', lastMonthDay);
  const dayOfMonth = Number(f.today.slice(8));
  const lastToDate = totals(f.transactions, lastMonth.start, addDays(lastMonth.start, dayOfMonth - 1));
  const spendChange = changePct(monthTotals.expenses, lastToDate.expenses);
  const cats = spendingByCategory(f.transactions, month.start, month.end);
  const budgets = f.budgets.map((b) => budgetStatus(b, f.transactions, f.today));
  const goals = f.goals.map((g) => goalPace(g, f.today));
  const saved = f.goals.reduce((s, g) => s + g.saved, 0);
  const walletName = new Map(f.wallets.map((w) => [w.id, w.name]));
  const over = budgets.filter((b) => b.state === 'over');
  const near = budgets.filter((b) => b.state === 'warning');

  const insights = [
    ...over.map((b) => ({
      tone: 'bg-over-bg text-over',
      title: `Over your ${b.budget.category} budget`,
      body: `${formatPeso(b.spent)} spent against a ${formatPeso(b.budget.limit)} ${b.budget.period} limit, ${formatPeso(-b.remaining)} over.`
    })),
    ...near.map((b) => ({
      tone: 'bg-warn-bg text-warn',
      title: `${b.budget.category} budget at ${Math.round(b.pct)}%`,
      body: `${formatPeso(b.remaining)} left until ${formatDate(b.end, { month: 'short', day: 'numeric' })}.`
    })),
    ...(spendChange !== null
      ? [{
          tone: 'bg-surface-alt text-ink',
          title: `Spending ${spendChange >= 0 ? 'up' : 'down'} ${Math.abs(spendChange)}%`,
          body: `${formatPeso(monthTotals.expenses)} so far this month, vs ${formatPeso(lastToDate.expenses)} by this day last month.`
        }]
      : [])
  ].slice(0, 3);

  return (
    <>
      <PageHeader title={`Good day, ${first}!`} sub={`${formatDate(f.today, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · Here's where your money stands.`}>
        <ThemeToggle />
        <Link href="/transactions?new=income" className="px-btn">Add allowance</Link>
        <Link href="/transactions?new=expense" className="px-btn px-btn-primary">+ Add expense</Link>
      </PageHeader>

      <section className="stagger grid gap-5 xl:grid-cols-3">
        <div className="px-hero flex flex-wrap gap-6 xl:col-span-2">
          <div className="flex min-w-[260px] flex-1 flex-col gap-2">
            <p className="font-pixel text-[11px] uppercase text-mint-300">Safe to spend today</p>
            <CountUp value={Math.max(0, safe.leftToday)} className="text-[30px] leading-tight" />
            <p className="text-[#B8C2D9]">left today, of {formatPeso(safe.dailyAllowance)}</p>
            <div className="mt-2 h-3 overflow-hidden bg-navy-700">
              <div className="px-bar" style={{ width: `${Math.min(100, safe.usedPct)}%`, background: safe.leftToday < 0 ? '#EA580C' : '#10B981' }} />
            </div>
            <p className="text-[#B8C2D9]">
              Spent today <b className="text-white">{formatPeso(safe.spentToday)}</b> · {formatPeso(safe.dailyAllowance)} a day for {safe.days}{' '}
              {safe.days === 1 ? 'day' : 'days'}, until your <b className="text-white">{f.profile.allowanceLabel}</b> on{' '}
              {formatDate(nextAllowance, { weekday: 'short', month: 'short', day: 'numeric' })}.
            </p>
          </div>
          <dl className="flex min-w-[220px] flex-1 flex-col gap-2 bg-navy-800 p-5">
            <div className="flex justify-between gap-3"><dt className="text-[#B8C2D9]">In spendable wallets</dt><dd className="px-money text-[12px]">{formatPeso(safe.spendable)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-[#B8C2D9]">Set aside for bills</dt><dd className="px-money text-[12px]">{formatPeso(-safe.billsReserved)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-[#B8C2D9]">Days until allowance</dt><dd className="px-money text-[12px]">{safe.days}</dd></div>
            {safe.bills.map((b) => (
              <div key={b.id} className="flex justify-between gap-3 border-t border-navy-700 pt-2">
                <dt className="text-[#B8C2D9]">{formatDate(b.dueOn, { month: 'short', day: '2-digit' })} · {b.name}</dt>
                <dd className="px-money text-[12px]">{formatPeso(b.amount)}</dd>
              </div>
            ))}
            <ActionForm action={setNextAllowance} className="mt-auto flex flex-wrap items-end gap-2 pt-2">
              <label htmlFor="nextAllowanceOn" className="sr-only">Next allowance date</label>
              <input id="nextAllowanceOn" name="nextAllowanceOn" type="date" defaultValue={nextAllowance} className="min-h-[44px] flex-1 border-2 border-mint-300 bg-navy-900 px-2 text-white" />
              <button type="submit" className="min-h-[44px] border-2 border-mint-300 px-3 text-mint-300">Set</button>
            </ActionForm>
          </dl>
        </div>

        <div className="px-card flex flex-col gap-1">
          <div className="mb-2 flex items-center justify-between"><h2 className="text-[13px]">Wallets</h2><Link href="/wallets" className="text-positive underline">Manage</Link></div>
          {f.wallets.map((w) => (
            <div key={w.id} className="flex items-center gap-3 border-b-2 border-dashed border-track py-2">
              <span className="flex h-9 w-9 items-center justify-center border-2 border-line bg-ok-bg font-pixel text-[11px] text-positive">{w.name[0]}</span>
              <span className="flex-1">{w.name}{!w.spendable && <span className="text-muted"> · savings</span>}</span>
              <span className="px-money text-[12px]">{formatPeso(w.balance)}</span>
            </div>
          ))}
          <Link href="/wallets#move" className="px-btn mt-auto">Move money</Link>
        </div>
      </section>

      <section aria-label="Summary" className="stagger grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total income', value: all.income, sub: `${formatPeso(monthTotals.income, { sign: true })} this month` },
          { label: 'Total expenses', value: all.expenses, sub: `${formatPeso(monthTotals.expenses)} this month` },
          { label: 'Remaining balance', value: all.balance, sub: 'Income minus expenses' },
          { label: 'Total savings', value: saved, sub: `Across ${f.goals.length} ${f.goals.length === 1 ? 'goal' : 'goals'}` }
        ].map((s) => (
          <div key={s.label} className="px-card">
            <p className="text-muted">{s.label}</p>
            <p className="px-money mt-2 text-[17px]">{formatPeso(s.value)}</p>
            <p className="mt-1 text-[18px] text-muted">{s.sub}</p>
          </div>
        ))}
      </section>

      <section className="stagger grid gap-5 lg:grid-cols-2">
        <div className="px-card flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[13px]">Spending by category</h2>
            <span className="text-muted">{formatDate(f.today, { month: 'long' })} · {formatPeso(monthTotals.expenses, { decimals: false })} spent</span>
          </div>
          {cats.length === 0 ? (
            <Empty>No spending yet this month.</Empty>
          ) : (
            cats.map((c) => (
              <div key={c.category} className="flex flex-col gap-1">
                <div className="flex justify-between gap-3"><span>{c.category} <span className="text-muted">· {c.pct}%</span></span><span className="px-money text-[12px]">{formatPeso(c.amount)}</span></div>
                <Bar pct={c.pct} color={categoryColor[c.category]} label={`${c.category} share of spending`} />
              </div>
            ))
          )}
        </div>

        <div className="px-card flex flex-col">
          <div className="mb-2 flex items-center justify-between"><h2 className="text-[13px]">Recent transactions</h2><Link href="/transactions" className="text-positive underline">View all</Link></div>
          {f.transactions.length === 0 ? (
            <Empty>Nothing recorded yet.</Empty>
          ) : (
            f.transactions.slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-center gap-3 border-b-2 border-dashed border-track py-2">
                <span className="min-w-0 flex-1"><span className="block truncate text-[21px]">{t.title}</span><span className="text-[17px] text-muted">{t.category} · {walletName.get(t.walletId)} · {formatDate(t.occurredOn, { month: 'short', day: 'numeric' })}</span></span>
                <span className={`px-money text-[11px] ${t.kind === 'income' ? 'text-positive' : ''}`}>{formatPeso(t.kind === 'income' ? t.amount : -t.amount, { sign: true })}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="stagger grid gap-5 lg:grid-cols-3">
        <div className="px-card flex flex-col gap-3">
          <h2 className="text-[13px]">Finora insights</h2>
          {insights.length === 0 ? <Empty>All good. Keep it up!</Empty> : insights.map((i) => (
            <div key={i.title} className={`p-3 ${i.tone}`}>
              <p className="font-bold">{i.title}</p>
              <p className="text-ink">{i.body}</p>
            </div>
          ))}
        </div>

        <div className="px-card flex flex-col gap-3">
          <div className="flex items-center justify-between"><h2 className="text-[13px]">Budgets</h2><Link href="/budgets" className="text-positive underline">Manage</Link></div>
          {budgets.length === 0 ? <Empty>No budgets yet.</Empty> : budgets.map((b) => {
            const s = stateStyle[b.state];
            return (
              <div key={b.budget.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2"><span>{b.budget.category} <span className="text-muted">· {b.budget.period}</span></span><span className={`px-tag ${s.cls}`}>{s.tag}</span></div>
                <Bar pct={b.pct} color={s.bar} label={`${b.budget.category} budget used`} />
                <span className="text-[18px] text-muted">{formatPeso(b.spent)} of {formatPeso(b.budget.limit)}</span>
              </div>
            );
          })}
        </div>

        <div className="px-card flex flex-col gap-3">
          <div className="flex items-center justify-between"><h2 className="text-[13px]">Savings goals</h2><Link href="/savings" className="text-positive underline">View all</Link></div>
          {goals.length === 0 ? <Empty>No goals yet.</Empty> : goals.map((g) => (
            <div key={g.goal.id} className="flex flex-col gap-1">
              <div className="flex justify-between"><span>{g.goal.name}</span><span className="px-money text-[11px] text-positive">{Math.round(g.pct)}%</span></div>
              <Bar pct={g.pct} label={`${g.goal.name} progress`} />
              <span className="text-[18px] text-muted">{formatPeso(g.goal.saved)} of {formatPeso(g.goal.target)}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
