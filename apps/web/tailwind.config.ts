import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['var(--font-pixel)', 'monospace'],
        body: ['var(--font-body)', 'monospace']
      },
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        'surface-alt': v('surface-alt'),
        ink: v('ink'),
        muted: v('muted'),
        line: v('line'),
        shade: v('shade'),
        track: v('track'),
        mint: { DEFAULT: '#10B981', 300: '#6EE7B7', 100: '#D1FAE5' },
        positive: v('positive'),
        warn: v('warn'),
        'warn-bg': v('warn-bg'),
        over: v('over'),
        'over-bg': v('over-bg'),
        'ok-bg': v('ok-bg'),
        hero: v('hero'),
        navy: { 950: '#040915', 900: '#0B1B3F', 800: '#13285A', 700: '#1D3672' },
        primary: v('primary'),
        'on-primary': v('on-primary')
      },
      boxShadow: {
        px: '5px 5px 0 rgb(var(--shade))',
        'px-sm': '3px 3px 0 rgb(var(--shade))',
        'px-mint': '6px 6px 0 #10B981',
        'px-lift': '8px 8px 0 #10B981'
      }
    }
  },
  plugins: []
} satisfies Config;
