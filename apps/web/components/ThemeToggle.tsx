'use client';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useTheme } from 'next-themes';

/**
 * Sun/moon button. The new theme spreads out from the button in a growing circle
 * (View Transitions API); browsers without it get the pixel wipe instead.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [wipe, setWipe] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => clearTimeout(timer.current);
  }, []);

  const dark = mounted && resolvedTheme === 'dark';

  function toggle() {
    const next = dark ? 'light' : 'dark';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return setTheme(next);

    if (!document.startViewTransition || !button.current) {
      setWipe((w) => w + 1);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setTheme(next), 330);
      return;
    }

    const r = button.current.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    const transition = document.startViewTransition(() => {
      // Swap the class now so the browser captures the new theme in this frame.
      const root = document.documentElement;
      root.classList.toggle('dark', next === 'dark');
      root.classList.toggle('light', next === 'light');
      root.style.colorScheme = next;
      flushSync(() => setTheme(next));
    });

    transition.ready.then(() => {
      const easing = 'cubic-bezier(0.65, 0, 0.35, 1)';
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 700, easing, pseudoElement: '::view-transition-new(root)' }
      );
      document.documentElement.animate(
        { transform: ['scale(1)', 'scale(0.96)'], filter: ['brightness(1)', 'brightness(0.6)'] },
        { duration: 700, easing, pseudoElement: '::view-transition-old(root)' }
      );
    });
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={toggle}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-pressed={dark}
        className="px-btn w-11 px-0"
      >
        {/* Renders the moon until mounted so server and client markup match. */}
        <svg key={dark ? 'sun' : 'moon'} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true" style={{ animation: 'fx-spin-in .5s cubic-bezier(.16,1,.3,1)' }}>
          {dark ? (
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
          ) : (
            <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
          )}
        </svg>
      </button>
      {wipe > 0 && <div key={wipe} className="wipe" aria-hidden="true" onAnimationEnd={() => setWipe(0)} />}
    </>
  );
}
