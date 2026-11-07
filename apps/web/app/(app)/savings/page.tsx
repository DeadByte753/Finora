import type { Metadata } from 'next';
import { formatPeso, goalPace } from '@finora/core';
import { formatDate, loadFinances } from '@/lib/data';
import { CountUp } from '@/components/CountUp';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Bar, Empty, PageHeader } from '@/components/ui';
import { ActionForm } from '@/components/forms';
import { addGoal, goalEntry } from '../actions';

export const metadata: Metadata = { title: 'Savings goals' };

export default async function Savings() {
  const f = await loadFinances();
  const paces = f.goals.map((g) => ({ ...goalPace(g, f.today), reachedOn: g.reachedOn }));
  const active = paces.filter((p) => !p.reached);
  const reached = paces.filter((p) => p.reached);
  const saved = f.goals.reduce((s, g) => s + g.saved, 0);
  const targets = active.reduce((s, p) => s + p.goal.target, 0);

  return (
    <>
      <PageHeader title="Savings goals" sub="Put money aside for what matters and watch it grow.">
        <ThemeToggle />
      </PageHeader>

      <section className="stagger grid gap-5 sm:grid-cols-3">
        <div className="px-hero"><p className="text-[#B8C2D9]">Total saved</p><CountUp value={saved} className="mt-2 block text-[22px]" /></div>
        <div className="px-card"><p className="text-muted">Active goals</p><p className="px-money mt-2 text-[22px]">{active.length}</p><p className="text-muted">{formatPeso(targets)} in targets</p></div>
        <div className="px-card"><p className="text-muted">Goals reached</p><p className="px-money mt-2 text-[22px] text-positive">{reached.length}</p></div>
      </section>

      <section className="stagger grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {active.length === 0 && <Empty>No active goals. Create one below.</Empty>}
        {active.map((p) => (
          <div key={p.goal.id} className="px-card flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[13px]">{p.goal.name}</h2>
                <p className="mt-1 text-muted">{p.goal.targetDate ? `Target ${formatDate(p.goal.targetDate)}` : 'No target date'}</p>
              </div>
              <span className="px-money text-[14px] text-positive">{Math.round(p.pct)}%</span>
            </div>
            <p><span className="px-money text-[18px]">{formatPeso(p.goal.saved)}</span> <span className="text-muted">of {formatPeso(p.goal.target)}</span></p>
            <Bar pct={p.pct} label={`${p.goal.name} progress`} />
            <p>
              {formatPeso(p.remaining)} to go
              {p.perWeek !== null && p.daysLeft !== null && (
                <> · about {formatPeso(p.perWeek)}/week for {p.daysLeft} more {p.daysLeft === 1 ? 'day' : 'days'}</>
              )}
            </p>
            <ActionForm action={goalEntry} className="flex flex-col gap-3 border-t-2 border-dashed border-track pt-3">
              <input type="hidden" name="goalId" value={p.goal.id} />
              <input type="hidden" name="saved" value={p.goal.saved} />
              <label htmlFor={`amt-${p.goal.id}`} className="px-label">Amount (₱)</label>
              <input id={`amt-${p.goal.id}`} name="amount" required inputMode="decimal" className="px-input" />
              <div className="grid grid-cols-2 gap-3">
                <button type="submit" name="direction" value="add" className="px-btn px-btn-mint">Add money</button>
                <button type="submit" name="direction" value="withdraw" className="px-btn">Withdraw</button>
              </div>
            </ActionForm>
          </div>
        ))}
      </section>

      {reached.length > 0 && (
        <section className="px-card flex flex-col gap-3">
          <h2 className="text-[13px]">Goals reached</h2>
          {reached.map((p) => (
            <div key={p.goal.id} className="flex items-center gap-4 bg-ok-bg p-3">
              <span className="sparkle flex h-10 w-10 items-center justify-center bg-mint text-navy-900" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square"><path d="M5 12.5 10 17l9-10" /></svg>
              </span>
              <span>
                <span className="block text-[21px]">{p.goal.name}</span>
                <span className="text-positive">{formatPeso(p.goal.saved)} saved{p.reachedOn ? ` · ${formatDate(p.reachedOn)}` : ''}</span>
              </span>
            </div>
          ))}
        </section>
      )}

      <section className="px-card">
        <h2 className="mb-4 text-[13px]">New goal</h2>
        <ActionForm action={addGoal} className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="goal-name" className="px-label">Goal</label>
            <input id="goal-name" name="name" required maxLength={60} placeholder="New laptop" className="px-input" />
          </div>
          <div>
            <label htmlFor="target" className="px-label">Target (₱)</label>
            <input id="target" name="target" required inputMode="decimal" placeholder="35,000" className="px-input" />
          </div>
          <div>
            <label htmlFor="targetDate" className="px-label">Target date (optional)</label>
            <input id="targetDate" name="targetDate" type="date" min={f.today} className="px-input" />
          </div>
          <div className="sm:col-span-3"><button type="submit" className="px-btn px-btn-primary">Create goal</button></div>
        </ActionForm>
      </section>
    </>
  );
}
