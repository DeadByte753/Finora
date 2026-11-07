'use client';

import { useActionState, useEffect, useRef, useTransition } from 'react';
import type { FormState } from '@/app/(app)/actions';

type Action = (prev: FormState, form: FormData) => Promise<FormState>;

/** Form that runs a server action, shows its message, and clears itself on success. */
export function ActionForm({ action, children, className = '' }: { action: Action; children: React.ReactNode; className?: string }) {
  const [state, run, pending] = useActionState<FormState, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={run} className={className} aria-busy={pending}>
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      <p aria-live="polite" className={`min-h-[1.5em] ${state.error ? 'text-over' : 'text-positive'}`}>
        {state.error ?? state.ok ?? ''}
      </p>
    </form>
  );
}

/** Small button that calls a bound server action (delete, toggle). */
export function ActionButton({ action, children, label, className = 'px-btn' }: { action: () => Promise<unknown>; children: React.ReactNode; label?: string; className?: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" aria-label={label} disabled={pending} onClick={() => start(async () => void (await action()))} className={`${className} disabled:opacity-60`}>
      {children}
    </button>
  );
}

/** Loads demo data and reports any error inline. */
export function DemoButton({ action }: { action: () => Promise<FormState> }) {
  const [state, run, pending] = useActionState<FormState, FormData>(async () => action(), {});
  return (
    <form action={run} className="flex flex-col items-center gap-2">
      <button type="submit" disabled={pending} className="px-btn px-btn-mint disabled:opacity-60">
        {pending ? 'Loading…' : 'Load demo data'}
      </button>
      {state.error && <p className="text-over">{state.error}</p>}
    </form>
  );
}
