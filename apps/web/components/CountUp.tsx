'use client';

import { useEffect, useRef } from 'react';
import { animate } from 'motion';
import { formatPeso } from '@finora/core';

/** Counts a peso amount up from zero. Server renders the final value, so it is correct without JavaScript. */
export function CountUp({ value, className = '' }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const booting = (() => {
      try {
        return performance.now() < 3000 && !sessionStorage.getItem('finora-counted');
      } catch {
        return false;
      }
    })();
    try {
      sessionStorage.setItem('finora-counted', '1');
    } catch {}
    // Only touch the DOM when the shown amount actually changes; each write re-lays out the card.
    let last = Number.NaN;
    const controls = animate(0, value, {
      duration: 1.4,
      delay: booting ? 2.3 : 0.3,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        const n = Math.round(v);
        if (n === last) return;
        last = n;
        el.textContent = formatPeso(n);
      }
    });
    return () => controls.stop();
  }, [value]);

  return (
    <span ref={ref} className={`px-money ${className}`}>
      {formatPeso(value)}
    </span>
  );
}
