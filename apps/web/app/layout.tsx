import type { Metadata, Viewport } from 'next';
import { Press_Start_2P, VT323 } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const pixel = Press_Start_2P({ weight: '400', subsets: ['latin'], variable: '--font-pixel', display: 'swap' });
const body = VT323({ weight: '400', subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Finora', template: '%s · Finora' },
  description: 'Every Peso. Every Purpose. Allowance, budgets and savings goals for students.'
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F6FA' },
    { media: '(prefers-color-scheme: dark)', color: '#070D1F' }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${pixel.variable} ${body.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
