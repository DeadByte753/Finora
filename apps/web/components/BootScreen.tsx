'use client';

import { useEffect, useState } from 'react';
import { TAGLINE } from '@finora/core';
import { LogoMark } from './Logo';

/** Plays once per browser session: logo builds in, name glitches, tagline types, then the screen wipes away. */
export function BootScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('finora-boot')) return;
      sessionStorage.setItem('finora-boot', '1');
    } catch {
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 2600);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;
  return (
    <div
      className="boot fixed inset-0 z-[60] flex items-center justify-center bg-navy-900"
      style={{ animation: 'fx-boot-out .6s steps(10) 1.9s both', backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,.05) 0 2px,transparent 2px 4px)' }}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-5">
        <LogoMark size={76} className="[animation:fx-reveal_.6s_steps(8)_both]" />
        <span className="glitch font-pixel text-[22px] text-white">FINORA</span>
        <span
          className="overflow-hidden whitespace-nowrap border-r-[3px] border-mint-300 font-body text-[24px] text-mint-300"
          style={{ width: 0, animation: 'fx-type .8s steps(26) .8s forwards' }}
        >
          {TAGLINE}
        </span>
        <span className="h-4 w-44 border-[3px] border-mint-300 p-[2px]">
          <span className="block h-full bg-mint [animation:fx-grow_1.5s_steps(10)_.2s_both] [transform-origin:left]" />
        </span>
      </div>
    </div>
  );
}
