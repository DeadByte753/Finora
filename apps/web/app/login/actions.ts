'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AuthState = { error?: string; info?: string };

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!email || !password) return { error: 'Enter your email and password.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'That email and password don’t match. Try again.' };
  redirect('/dashboard');
}

export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  const fullName = String(form.get('fullName') ?? '').trim();
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!fullName || !email) return { error: 'Enter your name and email.' };
  if (password.length < 8) return { error: 'Use at least 8 characters for your password.' };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
  if (error) return { error: error.message };
  if (!data.session) return { info: 'Check your email to confirm your account, then sign in.' };
  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
