'use client';

import { useActionState, useState } from 'react';
import { signIn, signUp, type AuthState } from './actions';

export function LoginForm() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [inState, inAction, inPending] = useActionState<AuthState, FormData>(signIn, {});
  const [upState, upAction, upPending] = useActionState<AuthState, FormData>(signUp, {});
  const state = mode === 'in' ? inState : upState;
  const pending = mode === 'in' ? inPending : upPending;

  return (
    <form action={mode === 'in' ? inAction : upAction} className="stagger flex w-full max-w-sm flex-col gap-5">
      <div role="tablist" aria-label="Account" className="grid grid-cols-2 border-[3px] border-line">
        {(['in', 'up'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`min-h-[44px] text-[20px] ${mode === m ? 'bg-primary text-on-primary' : 'bg-surface text-muted'}`}
          >
            {m === 'in' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      <div>
        <h2 className="cursor text-[18px] leading-snug">{mode === 'in' ? 'Welcome back' : 'Start with Finora'}</h2>
        <p className="mt-2 text-muted">Take control of your allowance and stay on track.</p>
      </div>

      {mode === 'up' && (
        <div>
          <label htmlFor="fullName" className="px-label">Full name</label>
          <input id="fullName" name="fullName" autoComplete="name" required className="px-input" />
        </div>
      )}
      <div>
        <label htmlFor="email" className="px-label">Email address</label>
        <input id="email" name="email" type="email" autoComplete="email" required placeholder="juan@school.edu.ph" className="px-input" />
      </div>
      <div>
        <label htmlFor="password" className="px-label">Password</label>
        <input id="password" name="password" type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} required minLength={mode === 'up' ? 8 : undefined} className="px-input" />
      </div>

      <p aria-live="polite" className={state.error ? 'text-over' : 'text-positive'}>
        {state.error ?? state.info ?? ''}
      </p>

      <button type="submit" disabled={pending} className="px-btn px-btn-primary min-h-[52px] disabled:opacity-60">
        {pending ? 'One moment…' : mode === 'in' ? 'Sign in' : 'Create account'}
      </button>
    </form>
  );
}
