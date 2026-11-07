'use client';

import { ThemeProvider } from 'next-themes';

/** Light, dark or follow the device; the choice is remembered in the browser. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
