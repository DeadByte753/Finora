import { LOGO_PATH } from '@finora/core';

/** The Finora F in a mint tile. */
export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" fill="#10B981" />
      <path transform="matrix(0.0449 0 0 0.0449 -7.97 -7.93)" d={LOGO_PATH} fill="#0B1B3F" />
    </svg>
  );
}

export function Wordmark({ size = 32 }: { size?: number }) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark size={size} className="logo-bob" />
      <span className="glitch font-pixel text-[14px] text-white">Finora</span>
    </span>
  );
}
