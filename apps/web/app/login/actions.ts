'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AuthState = { error?: string; info?: string };

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!email || !password) return { error: 'Enter your email and password.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === 'email_not_confirmed') return { error: 'Confirm your email first. Open the link we sent you, then sign in.' };
    if (error.code === 'invalid_credentials') return { error: 'That email and password don’t match. Try again.' };
    return { error: error.message };
  }
  redirect('/dashboard');
}

export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  const fullName = String(form.get('fullName') ?? '').trim();
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!fullName || !email) return { error: 'Enter your name and email.' };
  if (password.length < 8) return { error: 'Use at least 8 characters for your password.' };

  const supabase = await createClient();
  const h = await headers();
  const origin = h.get('origin') ?? `http://${h.get('host')}`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: `${origin}/auth/callback` }
  });
  if (error) {
    if (error.code === 'over_email_send_rate_limit') return { error: 'Too many sign-up emails were sent. Wait a few minutes and try again.' };
    if (error.code === 'user_already_exists') return { error: 'That email already has an account. Sign in instead.' };
    return { error: error.message };
  }
  // Supabase returns a user with no identities when the email is already registered.
  if (data.user && data.user.identities?.length === 0) return { error: 'That email already has an account. Sign in instead.' };
  if (!data.session) return { info: 'Check your email to confirm your account, then sign in.' };
  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
