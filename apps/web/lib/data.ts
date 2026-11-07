import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { todayIn, type Bill, type Budget, type Category, type Goal, type Transaction, type Wallet } from '@finora/core';
import { createClient } from './supabase/server';

export interface Transfer {
  id: string;
  from: string;
  to: string;
  amount: number;
  note: string | null;
  occurredOn: string;
}

export interface GoalEntry {
  id: string;
  goalId: string;
  amount: number;
  label: string;
  occurredOn: string;
}

export interface Profile {
  fullName: string;
  school: string;
  timeZone: string;
  nextAllowanceOn: string | null;
  allowanceLabel: string;
}

export interface Finances {
  userId: string;
  profile: Profile;
  today: string;
  wallets: (Wallet & { openingBalance: number })[];
  transactions: Transaction[];
  transfers: Transfer[];
  budgets: Budget[];
  goals: (Goal & { reachedOn: string | null })[];
  goalEntries: GoalEntry[];
  bills: Bill[];
}

/** Everything the signed-in user's pages need, fetched once per request. */
export const loadFinances = cache(async (): Promise<Finances> => {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profile, wallets, txs, transfers, budgets, goals, entries, bills] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('wallets').select('*').order('created_at'),
    supabase.from('transactions').select('*').order('occurred_on', { ascending: false }).order('created_at', { ascending: false }).limit(1000),
    supabase.from('transfers').select('*').order('occurred_on', { ascending: false }).limit(200),
    supabase.from('budgets').select('*').order('created_at'),
    supabase.from('goals').select('*').order('created_at'),
    supabase.from('goal_entries').select('*').order('occurred_on', { ascending: false }),
    supabase.from('bills').select('*').order('due_on')
  ]);

  const firstError = [profile, wallets, txs, transfers, budgets, goals, entries, bills].find((r) => r.error)?.error;
  if (firstError) throw new Error(firstError.message);

  const p = profile.data;
  const timeZone = p?.time_zone ?? 'Asia/Manila';

  return {
    userId: user.id,
    today: todayIn(timeZone),
    profile: {
      fullName: p?.full_name || user.email?.split('@')[0] || 'Student',
      school: p?.school ?? '',
      timeZone,
      nextAllowanceOn: p?.next_allowance_on ?? null,
      allowanceLabel: p?.allowance_label ?? 'Allowance'
    },
    wallets: (wallets.data ?? []).map((w) => ({
      id: w.id,
      name: w.name,
      kind: w.kind,
      balance: Number(w.balance),
      openingBalance: Number(w.opening_balance),
      spendable: w.spendable
    })),
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
    transfers: (transfers.data ?? []).map((t) => ({
      id: t.id,
      from: t.from_wallet,
      to: t.to_wallet,
      amount: Number(t.amount),
      note: t.note,
      occurredOn: t.occurred_on
    })),
    budgets: (budgets.data ?? []).map((b) => ({
      id: b.id,
      category: b.category as Category,
      period: b.period,
      limit: Number(b.limit_amount)
    })),
    goals: (goals.data ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      target: Number(g.target),
      saved: Number(g.saved),
      targetDate: g.target_date,
      reachedOn: g.reached_on
    })),
    goalEntries: (entries.data ?? []).map((e) => ({
      id: e.id,
      goalId: e.goal_id,
      amount: Number(e.amount),
      label: e.label,
      occurredOn: e.occurred_on
    })),
    bills: (bills.data ?? []).map((b) => ({ id: b.id, name: b.name, amount: Number(b.amount), dueOn: b.due_on }))
  };
});

/** "Oct 31, 2026" from YYYY-MM-DD without time-zone shifts. */
export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit', year: 'numeric' }) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { ...opts, timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
}
