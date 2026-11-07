import type { Metadata } from 'next';
import { TAGLINE } from '@finora/core';
import { Wordmark } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BootScreen } from '@/components/BootScreen';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

const COINS = [
  { left: '8%', delay: '0s', dur: '8s' },
  { left: '24%', delay: '2.6s', dur: '9.5s' },
  { left: '42%', delay: '1.1s', dur: '7s' },
  { left: '60%', delay: '4s', dur: '8s' },
  { left: '76%', delay: '0.5s', dur: '10s' },
  { left: '90%', delay: '3.2s', dur: '8.5s' }
];

export default function LoginPage() {
  const [first, second] = TAGLINE.split('. ');
  return (
    <div className="flex min-h-screen flex-wrap">
      <BootScreen />
      <div className="fixed right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <section className="relative isolate flex flex-[1_1_480px] flex-col justify-between gap-12 overflow-hidden bg-navy-900 p-8 text-white sm:p-14">
        <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
          {COINS.map((c) => (
            <span key={c.left} className="coin" style={{ left: c.left, animationDelay: c.delay, animationDuration: c.dur }}>
              ₱
            </span>
          ))}
        </div>
        <Wordmark size={36} />
        <h1 className="cursor max-w-lg text-[26px] leading-tight sm:text-[34px]">
          {first}.
          <br />
          <span className="text-mint-300">{second}</span>
        </h1>
        <p className="max-w-md text-[22px] text-[#B8C2D9]">
          Manage your allowance, track every peso across cash and e-wallets, and reach your savings goals.
        </p>
      </section>

      <section className="flex flex-[1_1_420px] items-center justify-center p-8 sm:p-14">
        <LoginForm />
      </section>
    </div>
  );
}
