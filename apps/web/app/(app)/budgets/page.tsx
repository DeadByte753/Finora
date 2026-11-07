import type { Metadata } from 'next';
import Link from 'next/link';
import { EXPENSE_CATEGORIES, budgetStatus, formatPeso } from '@finora/core';
import { formatDate, loadFinances } from '@/lib/data';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Bar, Empty, PageHeader, stateStyle } from '@/components/ui';
import { ActionButton, ActionForm } from '@/components/forms';
import { addBudget, deleteBudget } from '../actions';

export const metadata: Metadata = { title: 'Budgets' };

export default async function Budgets() {
  const f = await loadFinances();
  const rows = f.budgets.map((b) => budgetStatus(b, f.transactions, f.today));
  const limits = rows.reduce((s, r) => s + r.budget.limit, 0);
  const spent = rows.reduce((s, r) => s + r.spent, 0);
  const attention = rows.filter((r) => r.state !== 'ok').length;

  return (
    <>
      <PageHeader title="Budgets" sub="Set limits per category and see how much room you have left.">
        <ThemeToggle />
      </PageHeader>

      <section className="stagger grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="px-card"><p className="text-muted">Active budgets</p><p className="px-money mt-2 text-[17px]">{rows.length}</p></div>
        <div className="px-card"><p className="text-muted">Total limits</p><p className="px-money mt-2 text-[17px]">{formatPeso(limits)}</p></div>
        <div className="px-card"><p className="text-muted">Spent so far</p><p className="px-money mt-2 text-[17px]">{formatPeso(spent)}</p>{limits > 0 && <p className="text-muted">{Math.round((spent / limits) * 100)}% of limits</p>}</div>
        <div className={`px-card ${attention ? 'bg-over-bg' : ''}`}><p className={attention ? 'text-over' : 'text-muted'}>Need attention</p><p className={`px-money mt-2 text-[17px] ${attention ? 'text-over' : ''}`}>{attention}</p><p className="text-muted">At 75% or more</p></div>
      </section>

      <section className="stagger grid gap-5 md:grid-cols-2">
        {rows.length === 0 && <Empty>No budgets yet. Add one below.</Empty>}
        {rows.map((r) => {
          const s = stateStyle[r.state];
          return (
            <div key={r.budget.id} className="px-card flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[13px]">{r.budget.category}</h2>
                  <p className="mt-1 text-muted capitalize">{r.budget.period} · {formatDate(r.start, { month: 'short', day: 'numeric' })} – {formatDate(r.end, { month: 'short', day: 'numeric' })}</p>
                </div>
                <span className={`px-tag ${s.cls}`}>{s.tag}</span>
              </div>
              <p><span className="px-money text-[18px]">{formatPeso(r.spent)}</span> <span className="text-muted">of {formatPeso(r.budget.limit)}</span></p>
              <Bar pct={r.pct} color={s.bar} label={`${r.budget.category} budget used`} />
              <div className="flex justify-between">
                <span className="text-muted">{r.remaining < 0 ? 'Over by' : 'Remaining'} <b className={r.remaining < 0 ? 'text-over' : 'text-ink'}>{formatPeso(Math.abs(r.remaining))}</b></span>
                <span className="text-muted">Used <b className="text-ink">{Math.round(r.pct)}%</b></span>
              </div>
              <div className="flex gap-3">
                <Link href={`/transactions?q=${encodeURIComponent(r.budget.category)}&type=expense`} className="px-btn flex-1">View expenses</Link>
                <ActionButton action={deleteBudget.bind(null, r.budget.id)} label={`Delete ${r.budget.category} budget`} className="px-btn text-over">Delete</ActionButton>
              </div>
            </div>
          );
        })}
      </section>

      <section className="px-card">
        <h2 className="mb-4 text-[13px]">New budget</h2>
        <ActionForm action={addBudget} className="grid gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="category" className="px-label">Category</label>
            <select id="category" name="category" className="px-input">{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <div>
            <label htmlFor="period" className="px-label">Period</label>
            <select id="period" name="period" className="px-input"><option value="monthly">Monthly</option><option value="weekly">Weekly</option></select>
          </div>
          <div>
            <label htmlFor="limit" className="px-label">Limit (₱)</label>
            <input id="limit" name="limit" required inputMode="decimal" placeholder="1,200" className="px-input" />
          </div>
          <div className="sm:col-span-4"><button type="submit" className="px-btn px-btn-primary">Save budget</button></div>
        </ActionForm>
        <p className="mt-2 text-muted">Saving a budget for a category and period you already have updates its limit.</p>
      </section>
    </>
  );
}
