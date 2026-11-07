import type { Metadata } from 'next';
import Link from 'next/link';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatPeso, totals } from '@finora/core';
import { formatDate, loadFinances } from '@/lib/data';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Empty, PageHeader } from '@/components/ui';
import { ActionButton, ActionForm } from '@/components/forms';
import { addTransaction, deleteTransaction } from '../actions';

export const metadata: Metadata = { title: 'Transactions' };

const PAGE = 20;

export default async function Transactions({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const f = await loadFinances();
  const type = sp.type === 'income' || sp.type === 'expense' ? sp.type : 'all';
  const q = (sp.q ?? '').toLowerCase();
  const page = Math.max(1, Number(sp.page) || 1);
  const newKind = sp.new === 'income' ? 'income' : 'expense';
  const walletName = new Map(f.wallets.map((w) => [w.id, w.name]));
  const all = totals(f.transactions);

  const rows = f.transactions.filter(
    (t) => (type === 'all' || t.kind === type) && (!q || t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
  );
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const shown = rows.slice((page - 1) * PAGE, page * PAGE);
  const link = (patch: Record<string, string | number>) => {
    const p = new URLSearchParams({ ...(type !== 'all' && { type }), ...(q && { q }), ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, String(v)])) });
    return `/transactions?${p}`;
  };

  return (
    <>
      <PageHeader title="Transactions" sub="Every peso in and out, in one place.">
        <ThemeToggle />
      </PageHeader>

      <section className="stagger grid gap-5 sm:grid-cols-3">
        <div className="px-card"><p className="text-muted">Total income</p><p className="px-money mt-2 text-[17px] text-positive">{formatPeso(all.income)}</p></div>
        <div className="px-card"><p className="text-muted">Total expenses</p><p className="px-money mt-2 text-[17px]">{formatPeso(all.expenses)}</p></div>
        <div className="px-card"><p className="text-muted">Remaining balance</p><p className="px-money mt-2 text-[17px]">{formatPeso(all.balance)}</p></div>
      </section>

      <section id="new" className="px-card">
        <h2 className="mb-4 text-[13px]">{newKind === 'income' ? 'Add income' : 'Add expense'}</h2>
        {f.wallets.length === 0 ? (
          <Empty>Add a wallet first, then record transactions. <Link href="/wallets" className="text-positive underline">Go to Wallets</Link></Empty>
        ) : (
          <ActionForm action={addTransaction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <input type="hidden" name="kind" value={newKind} />
            <div>
              <label htmlFor="title" className="px-label">What was it?</label>
              <input id="title" name="title" required maxLength={80} placeholder={newKind === 'income' ? 'Weekly allowance' : 'Lunch at canteen'} className="px-input" />
            </div>
            <div>
              <label htmlFor="amount" className="px-label">Amount (₱)</label>
              <input id="amount" name="amount" required inputMode="decimal" placeholder="95.00" className="px-input" />
            </div>
            <div>
              <label htmlFor="category" className="px-label">Category</label>
              <select id="category" name="category" className="px-input">
                {(newKind === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="walletId" className="px-label">Wallet</label>
              <select id="walletId" name="walletId" className="px-input">
                {f.wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="occurredOn" className="px-label">Date</label>
              <input id="occurredOn" name="occurredOn" type="date" defaultValue={f.today} max={f.today} required className="px-input" />
            </div>
            <div>
              <label htmlFor="note" className="px-label">Note (optional)</label>
              <input id="note" name="note" maxLength={120} className="px-input" />
            </div>
            <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-3">
              <button type="submit" className="px-btn px-btn-primary">{newKind === 'income' ? 'Add income' : 'Add expense'}</button>
              <Link href={`/transactions?new=${newKind === 'income' ? 'expense' : 'income'}#new`} className="px-btn">
                Switch to {newKind === 'income' ? 'expense' : 'income'}
              </Link>
            </div>
          </ActionForm>
        )}
      </section>

      <section className="px-card flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <form className="flex min-w-[240px] flex-1 gap-2" action="/transactions">
            {type !== 'all' && <input type="hidden" name="type" value={type} />}
            <label htmlFor="q" className="sr-only">Search transactions</label>
            <input id="q" name="q" type="search" defaultValue={sp.q ?? ''} placeholder="Search transactions" className="px-input" />
            <button type="submit" className="px-btn">Search</button>
          </form>
          <div role="group" aria-label="Type" className="flex gap-2">
            {(['all', 'income', 'expense'] as const).map((t) => (
              <Link key={t} href={link({ type: t === 'all' ? '' : t, page: 1 })} aria-current={type === t ? 'true' : undefined} className={`px-btn capitalize ${type === t ? 'px-btn-primary' : ''}`}>
                {t}
              </Link>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <Empty>No transactions match.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr className="text-left text-muted">
                  <th className="border-b-[3px] border-line p-3 font-normal">Transaction</th>
                  <th className="border-b-[3px] border-line p-3 font-normal">Category</th>
                  <th className="border-b-[3px] border-line p-3 font-normal">Wallet</th>
                  <th className="border-b-[3px] border-line p-3 font-normal">Date</th>
                  <th className="border-b-[3px] border-line p-3 text-right font-normal">Amount</th>
                  <th className="border-b-[3px] border-line p-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="stagger">
                {shown.map((t) => (
                  <tr key={t.id} className="hover:bg-ok-bg">
                    <td className="border-b-2 border-dashed border-track p-3"><span className="block text-[21px]">{t.title}</span>{t.note && <span className="text-muted">{t.note}</span>}</td>
                    <td className="border-b-2 border-dashed border-track p-3">{t.category}</td>
                    <td className="border-b-2 border-dashed border-track p-3">{walletName.get(t.walletId)}</td>
                    <td className="whitespace-nowrap border-b-2 border-dashed border-track p-3">{formatDate(t.occurredOn)}</td>
                    <td className={`px-money border-b-2 border-dashed border-track p-3 text-right text-[12px] ${t.kind === 'income' ? 'text-positive' : ''}`}>
                      {formatPeso(t.kind === 'income' ? t.amount : -t.amount, { sign: true })}
                    </td>
                    <td className="border-b-2 border-dashed border-track p-3 text-right">
                      <ActionButton action={deleteTransaction.bind(null, t.id)} label={`Delete ${t.title}`} className="min-h-[44px] px-2 text-over underline">
                        Delete
                      </ActionButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 text-muted">
          <span>Page {page} of {pages}</span>
          <span className="flex gap-2">
            {page > 1 && <Link href={link({ page: page - 1 })} className="px-btn">Previous</Link>}
            {page < pages && <Link href={link({ page: page + 1 })} className="px-btn">Next</Link>}
          </span>
        </div>
      </section>
    </>
  );
}
