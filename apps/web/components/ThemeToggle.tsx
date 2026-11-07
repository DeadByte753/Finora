'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

/** Sun/moon button. A pixel wipe covers the screen while the theme swaps underneath. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [wipe, setWipe] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setMounted(true);
    return () => clearTimeout(timer.current);
  }, []);

  const dark = mounted && resolvedTheme === 'dark';

  function toggle() {
    const next = dark ? 'light' : 'dark';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return setTheme(next);
    setWipe((w) => w + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setTheme(next), 330);
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-pressed={dark}
        className="px-btn w-11 px-0"
      >
        {/* Renders the moon until mounted so server and client markup match. */}
        <svg key={dark ? 'sun' : 'moon'} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true" style={{ animation: 'fx-in .4s steps(4)' }}>
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
