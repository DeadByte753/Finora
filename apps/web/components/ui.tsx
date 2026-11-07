import type { BudgetState } from '@finora/core';

/** Pixel progress bar; width is clamped to 0-100%. */
export function Bar({ pct, color = '#10B981', label }: { pct: number; color?: string; label: string }) {
  const w = Math.max(0, Math.min(100, pct));
  return (
    <div className="px-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(w)}>
      <div className="px-bar" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

export const stateStyle: Record<BudgetState, { tag: string; cls: string; bar: string }> = {
  over: { tag: 'Over budget', cls: 'bg-over-bg text-over shake', bar: '#EA580C' },
  warning: { tag: 'Near limit', cls: 'bg-warn-bg text-warn', bar: '#F59E0B' },
  ok: { tag: 'On track', cls: 'bg-ok-bg text-positive', bar: '#10B981' }
};

export function PageHeader({ title, sub, children }: { title: string; sub: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="cursor text-[22px] leading-snug">{title}</h1>
        <p className="mt-2 text-muted">{sub}</p>
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </header>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="border-[3px] border-dashed border-line p-6 text-center text-muted">{children}</p>;
}
