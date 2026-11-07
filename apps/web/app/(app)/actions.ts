'use server';

import { revalidatePath } from 'next/cache';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, parsePeso } from '@finora/core';
import { createClient } from '@/lib/supabase/server';

export type FormState = { error?: string; ok?: string };

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

function done(message: string): FormState {
  revalidatePath('/', 'layout');
  return { ok: message };
}

export async function addTransaction(_p: FormState, f: FormData): Promise<FormState> {
  const kind = str(f, 'kind') === 'income' ? 'income' : 'expense';
  const category = str(f, 'category');
  const allowed: readonly string[] = kind === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const amount = parsePeso(str(f, 'amount'));
  const title = str(f, 'title');
  const occurredOn = str(f, 'occurredOn');
  const walletId = str(f, 'walletId');

  if (!title) return { error: 'Give it a short name, like "Lunch at canteen".' };
  if (!amount) return { error: 'Enter an amount above ₱0, like 95 or 1,500.50.' };
  if (!allowed.includes(category)) return { error: 'Pick a category.' };
  if (!walletId) return { error: 'Pick the wallet it came from or went to.' };
  if (!isDate(occurredOn)) return { error: 'Pick a date.' };

  const supabase = await createClient();
  const { error } = await supabase.from('transactions').insert({
    kind,
    category,
    amount,
    title,
    note: str(f, 'note') || null,
    occurred_on: occurredOn,
    wallet_id: walletId
  });
  if (error) return { error: 'Couldn’t save that. ' + error.message };
  return done(kind === 'income' ? 'Income added.' : 'Expense added.');
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  await supabase.from('transactions').delete().eq('id', id);
  revalidatePath('/', 'layout');
}

export async function addWallet(_p: FormState, f: FormData): Promise<FormState> {
  const name = str(f, 'name');
  const kind = str(f, 'kind');
  const opening = parsePeso(str(f, 'opening') || '0');
  if (!name) return { error: 'Name the wallet, like "Maya".' };
  if (!['cash', 'ewallet', 'bank'].includes(kind)) return { error: 'Pick a wallet type.' };
  if (opening === null) return { error: 'Enter the current balance, or 0.' };

  const supabase = await createClient();
  const { error } = await supabase.from('wallets').insert({
    name,
    kind,
    opening_balance: opening,
    spendable: f.get('spendable') === 'on'
  });
  if (error) return { error: error.message };
  return done('Wallet added.');
}

export async function moveMoney(_p: FormState, f: FormData): Promise<FormState> {
  const from = str(f, 'from');
  const to = str(f, 'to');
  const amount = parsePeso(str(f, 'amount'));
  if (!from || !to || from === to) return { error: 'Pick two different wallets.' };
  if (!amount) return { error: 'Enter an amount above ₱0.' };

  const supabase = await createClient();
  const { error } = await supabase.from('transfers').insert({ from_wallet: from, to_wallet: to, amount, note: str(f, 'note') || null });
  if (error) return { error: error.message };
  return done('Money moved.');
}

export async function setSpendable(id: string, spendable: boolean) {
  const supabase = await createClient();
  await supabase.from('wallets').update({ spendable }).eq('id', id);
  revalidatePath('/', 'layout');
}

export async function addBudget(_p: FormState, f: FormData): Promise<FormState> {
  const category = str(f, 'category');
  const period = str(f, 'period') === 'weekly' ? 'weekly' : 'monthly';
  const limit = parsePeso(str(f, 'limit'));
  if (!(EXPENSE_CATEGORIES as readonly string[]).includes(category)) return { error: 'Pick a category.' };
  if (!limit) return { error: 'Enter a limit above ₱0.' };

  const supabase = await createClient();
  const { error } = await supabase.from('budgets').upsert({ category, period, limit_amount: limit }, { onConflict: 'user_id,category,period' });
  if (error) return { error: error.message };
  return done('Budget saved.');
}

export async function deleteBudget(id: string) {
  const supabase = await createClient();
  await supabase.from('budgets').delete().eq('id', id);
  revalidatePath('/', 'layout');
}

export async function addGoal(_p: FormState, f: FormData): Promise<FormState> {
  const name = str(f, 'name');
  const target = parsePeso(str(f, 'target'));
  const targetDate = str(f, 'targetDate');
  if (!name) return { error: 'Name your goal, like "New laptop".' };
  if (!target) return { error: 'Enter a target above ₱0.' };
  if (targetDate && !isDate(targetDate)) return { error: 'Pick a valid date or leave it empty.' };

  const supabase = await createClient();
  const { error } = await supabase.from('goals').insert({ name, target, target_date: targetDate || null });
  if (error) return { error: error.message };
  return done('Goal created.');
}

export async function goalEntry(_p: FormState, f: FormData): Promise<FormState> {
  const goalId = str(f, 'goalId');
  const amount = parsePeso(str(f, 'amount'));
  const withdraw = str(f, 'direction') === 'withdraw';
  const saved = Number(str(f, 'saved'));
  if (!amount) return { error: 'Enter an amount above ₱0.' };
  if (withdraw && amount > saved) return { error: 'You can’t withdraw more than you’ve saved.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('goal_entries')
    .insert({ goal_id: goalId, amount: withdraw ? -amount : amount, label: withdraw ? 'Withdrawal' : 'Deposit' });
  if (error) return { error: error.message };
  return done(withdraw ? 'Withdrawn.' : 'Saved! Nice one.');
}

export async function loadDemoData(): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('seed_demo_data');
  if (error) return { error: error.message };
  return done('Demo data loaded.');
}

export async function setNextAllowance(_p: FormState, f: FormData): Promise<FormState> {
  const date = str(f, 'nextAllowanceOn');
  if (!isDate(date)) return { error: 'Pick a date.' };
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sign in again.' };
  const { error } = await supabase.from('profiles').update({ next_allowance_on: date }).eq('user_id', user.id);
  if (error) return { error: error.message };
  return done('Allowance date saved.');
}
