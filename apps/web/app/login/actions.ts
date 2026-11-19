'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseEnv } from '@/lib/supabase/env';

export type AuthState = { error?: string; info?: string };

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!email || !password) return { error: 'Enter your email and password.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Log the real Supabase answer so a misconfigured project or env file is visible in the server terminal.
    console.error('[login] sign-in failed', { project: new URL(supabaseEnv().url).host, status: error.status, code: error.code, message: error.message });
    if (error.code === 'email_not_confirmed' || /email not confirmed/i.test(error.message)) {
      return { error: 'Confirm your email first. Open the link we sent you, then sign in.' };
    }
    if (error.code === 'invalid_credentials' || /invalid login credentials/i.test(error.message)) {
      return { error: 'That email and password don’t match. Try again.' };
    }
    if (error.status === 401 || /invalid api key/i.test(error.message)) {
      return { error: 'The website can’t reach the account service. Check the Supabase URL and anon key in apps/web/.env.local.' };
    }
    if (error.status === 0 || error.name === 'AuthRetryableFetchError') {
      return { error: 'Couldn’t reach the account service. Check your connection and try again.' };
    }
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
    console.error('[login] sign-up failed', { status: error.status, code: error.code, message: error.message });
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
