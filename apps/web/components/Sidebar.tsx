'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wordmark } from './Logo';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', d: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z' },
  { href: '/transactions', label: 'Transactions', d: 'M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7' },
  { href: '/wallets', label: 'Wallets', d: 'M20 7H5a2 2 0 0 1 0-4h13v4M3 5v14a2 2 0 0 0 2 2h15V7M16 14h.01' },
  { href: '/budgets', label: 'Budgets', d: 'M21 12A9 9 0 1 1 12 3v9zM15 3.5A9 9 0 0 1 20.5 9H15z' },
  { href: '/savings', label: 'Savings goals', d: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 11.5v1' }
];

export function Sidebar({ name, school, signOut }: { name: string; school: string; signOut: () => Promise<void> }) {
  const path = usePathname();
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <nav aria-label="Main navigation" className="flex w-full flex-col gap-7 bg-navy-900 p-4 text-white dark:bg-navy-950 lg:min-h-screen lg:w-64">
      <Link href="/dashboard" className="px-2 pt-2">
        <Wordmark />
      </Link>
      <ul className="stagger flex flex-wrap gap-1 lg:flex-col">
        {NAV.map((n) => {
          const active = path.startsWith(n.href);
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[44px] items-center gap-3 px-3 text-[20px] ${active ? 'bg-mint text-navy-900' : 'text-[#D5DCEB] hover:bg-navy-800'}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
                  <path d={n.d} />
                </svg>
                <span>{n.label}</span>
                {active && <span className="ml-auto hidden h-2 w-2 bg-navy-900 [animation:fx-blink_1s_steps(1)_infinite] lg:block" />}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto flex items-center gap-3 bg-navy-800 p-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center bg-mint font-pixel text-[11px] text-navy-900">{initials}</span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[19px]">{name}</span>
          {school && <span className="block truncate text-[16px] text-[#B8C2D9]">{school}</span>}
        </span>
        <form action={signOut}>
          <button type="submit" className="min-h-[44px] px-2 text-[16px] text-mint-300 underline">
            Log out
          </button>
        </form>
      </div>
    </nav>
  );
}
