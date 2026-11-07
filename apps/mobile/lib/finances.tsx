import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { todayIn, type Bill, type Budget, type Category, type Goal, type Transaction, type Wallet } from '@finora/core';
import { supabase } from './supabase';

export interface Finances {
  fullName: string;
  today: string;
  nextAllowanceOn: string | null;
  allowanceLabel: string;
  wallets: Wallet[];
  transactions: Transaction[];
  transfers: { id: string; from: string; to: string; amount: number; note: string | null; occurredOn: string }[];
  budgets: Budget[];
  goals: Goal[];
  bills: Bill[];
}

interface Ctx {
  data: Finances | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const FinCtx = createContext<Ctx | null>(null);

async function fetchAll(): Promise<Finances> {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Signed out');

  const [profile, wallets, txs, transfers, budgets, goals, bills] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('wallets').select('*').order('created_at'),
    supabase.from('transactions').select('*').order('occurred_on', { ascending: false }).order('created_at', { ascending: false }).limit(500),
    supabase.from('transfers').select('*').order('occurred_on', { ascending: false }).limit(50),
    supabase.from('budgets').select('*').order('created_at'),
    supabase.from('goals').select('*').order('created_at'),
    supabase.from('bills').select('*').order('due_on')
  ]);
  const err = [profile, wallets, txs, transfers, budgets, goals, bills].find((r) => r.error)?.error;
  if (err) throw new Error(err.message);

  const p = profile.data;
  return {
    fullName: p?.full_name || user.email?.split('@')[0] || 'Student',
    today: todayIn(p?.time_zone ?? 'Asia/Manila'),
    nextAllowanceOn: p?.next_allowance_on ?? null,
    allowanceLabel: p?.allowance_label ?? 'Allowance',
    wallets: (wallets.data ?? []).map((w) => ({ id: w.id, name: w.name, kind: w.kind, balance: Number(w.balance), spendable: w.spendable })),
    transactions: (txs.data ?? []).map((t) => ({
      id: t.id,
      walletId: t.wallet_id,
      kind: t.kind,
      category: t.category as Category,
      amount: Number(t.amount),
      title: t.title,
      note: t.note,
      occurredOn: t.occurred_on
    })),
    transfers: (transfers.data ?? []).map((t) => ({ id: t.id, from: t.from_wallet, to: t.to_wallet, amount: Number(t.amount), note: t.note, occurredOn: t.occurred_on })),
    budgets: (budgets.data ?? []).map((b) => ({ id: b.id, category: b.category as Category, period: b.period, limit: Number(b.limit_amount) })),
    goals: (goals.data ?? []).map((g) => ({ id: g.id, name: g.name, target: Number(g.target), saved: Number(g.saved), targetDate: g.target_date })),
    bills: (bills.data ?? []).map((b) => ({ id: b.id, name: b.name, amount: Number(b.amount), dueOn: b.due_on }))
  };
}

export function FinancesProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Finances | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchAll());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <FinCtx.Provider value={{ data, loading, error, refresh }}>{children}</FinCtx.Provider>;
}

export function useFinances() {
  const v = useContext(FinCtx);
  if (!v) throw new Error('useFinances must be used inside FinancesProvider');
  return v;
}

export function shortDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
}
