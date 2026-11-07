import type { Metadata } from 'next';
import { formatPeso, periodRange, signed } from '@finora/core';
import { formatDate, loadFinances } from '@/lib/data';
import { CountUp } from '@/components/CountUp';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Empty, PageHeader } from '@/components/ui';
import { ActionButton, ActionForm } from '@/components/forms';
import { addWallet, moveMoney, setSpendable } from '../actions';

export const metadata: Metadata = { title: 'Wallets' };

const KIND_LABEL = { cash: 'Cash', ewallet: 'E-wallet', bank: 'Bank account' } as const;

export default async function Wallets() {
  const f = await loadFinances();
  const total = f.wallets.reduce((s, w) => s + w.balance, 0);
  const spendable = f.wallets.filter((w) => w.spendable).reduce((s, w) => s + w.balance, 0);
  const opening = f.wallets.reduce((s, w) => s + w.openingBalance, 0);
  const month = periodRange('monthly', f.today);
  const name = new Map(f.wallets.map((w) => [w.id, w.name]));

  return (
    <>
      <PageHeader title="Wallets" sub="Where your money is right now: cash, e-wallets and bank accounts.">
        <ThemeToggle />
      </PageHeader>

      <section className="stagger grid gap-5 sm:grid-cols-2">
        <div className="px-hero">
          <p className="text-[#B8C2D9]">Total in wallets</p>
          <CountUp value={total} className="mt-2 block text-[24px]" />
          {opening > 0 && <p className="mt-2 text-[#B8C2D9]">Includes {formatPeso(opening)} you had before Finora</p>}
        </div>
        <div className="px-card">
          <p className="text-muted">Spendable now</p>
          <p className="px-money mt-2 text-[24px] text-positive">{formatPeso(spendable)}</p>
          <p className="mt-2 text-muted">Counted in Safe to spend today</p>
        </div>
      </section>

      <section aria-label="Your wallets" className="stagger grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {f.wallets.map((w) => {
          const tx = f.transactions.filter((t) => t.walletId === w.id && t.occurredOn >= month.start && t.occurredOn <= month.end);
          const inflow = tx.filter((t) => t.kind === 'income').reduce((s, t) => s + t.amount, 0);
          const outflow = tx.filter((t) => t.kind === 'expense').reduce((s, t) => s - signed(t), 0);
          return (
            <div key={w.id} className="px-card flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center border-2 border-line bg-ok-bg font-pixel text-[12px] text-positive">{w.name[0]}</span>
                <span className="flex-1"><span className="block text-[22px]">{w.name}</span><span className="text-muted">{KIND_LABEL[w.kind]}</span></span>
              </div>
              <p className="px-money text-[18px]">{formatPeso(w.balance)}</p>
              <p className="text-muted">
                This month <span className="text-positive">{formatPeso(inflow, { sign: true })}</span> · <span className="text-ink">{formatPeso(-outflow)}</span>
              </p>
              <ActionButton action={setSpendable.bind(null, w.id, !w.spendable)} className="px-btn">
                {w.spendable ? 'Used for daily spending ✓' : 'Not for spending · turn on'}
              </ActionButton>
            </div>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="px-card">
          <h2 className="mb-4 text-[13px]">Add a wallet</h2>
          <ActionForm action={addWallet} className="grid gap-4">
            <div>
              <label htmlFor="name" className="px-label">Name</label>
              <input id="name" name="name" required maxLength={40} placeholder="Maya" className="px-input" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="kind" className="px-label">Type</label>
                <select id="kind" name="kind" className="px-input">
                  <option value="cash">Cash</option>
                  <option value="ewallet">E-wallet</option>
                  <option value="bank">Bank account</option>
                </select>
              </div>
              <div>
                <label htmlFor="opening" className="px-label">Current balance (₱)</label>
                <input id="opening" name="opening" inputMode="decimal" placeholder="0.00" className="px-input" />
              </div>
            </div>
            <label className="flex min-h-[44px] items-center gap-3">
              <input type="checkbox" name="spendable" defaultChecked className="h-5 w-5 accent-[#10B981]" />
              Use for daily spending
            </label>
            <button type="submit" className="px-btn px-btn-primary">Add wallet</button>
          </ActionForm>
        </div>

        <div id="move" className="px-card">
          <h2 className="mb-4 text-[13px]">Move money</h2>
          {f.wallets.length < 2 ? (
            <Empty>Add at least two wallets to move money between them.</Empty>
          ) : (
            <ActionForm action={moveMoney} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="from" className="px-label">From</label>
                  <select id="from" name="from" className="px-input">{f.wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
                </div>
                <div>
                  <label htmlFor="to" className="px-label">To</label>
                  <select id="to" name="to" defaultValue={f.wallets[1]?.id} className="px-input">{f.wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="move-amount" className="px-label">Amount (₱)</label>
                  <input id="move-amount" name="amount" required inputMode="decimal" className="px-input" />
                </div>
                <div>
                  <label htmlFor="move-note" className="px-label">Note</label>
                  <input id="move-note" name="note" placeholder="Cash-out at 7-Eleven" className="px-input" />
                </div>
              </div>
              <button type="submit" className="px-btn px-btn-primary">Move money</button>
            </ActionForm>
          )}
          <h3 className="mb-2 mt-6 text-[11px]">Recent transfers</h3>
          {f.transfers.length === 0 ? <p className="text-muted">None yet.</p> : f.transfers.slice(0, 6).map((t) => (
            <div key={t.id} className="flex items-center gap-3 border-b-2 border-dashed border-track py-2">
              <span className="flex-1"><span className="block">{name.get(t.from)} → {name.get(t.to)}</span><span className="text-muted">{formatDate(t.occurredOn)}{t.note ? ` · ${t.note}` : ''}</span></span>
              <span className="px-money text-[11px]">{formatPeso(t.amount)}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
