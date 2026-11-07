/** Finora brand tokens shared by the website and the mobile app. */
export const palette = {
  navy950: '#040915',
  navy900: '#0B1B3F',
  navy800: '#13285A',
  navy700: '#1D3672',
  mint500: '#10B981',
  mint300: '#6EE7B7',
  mint700: '#047857',
  orange600: '#EA580C',
  amber500: '#F59E0B',
  blue600: '#2563EB'
} as const;

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  outline: string;
  shadow: string;
  track: string;
  accent: string;
  accentText: string;
  positive: string;
  warn: string;
  warnBg: string;
  over: string;
  overBg: string;
  okBg: string;
  hero: string;
  heroText: string;
  heroMuted: string;
  primaryBg: string;
  primaryText: string;
}

export const themes: Record<'light' | 'dark', ThemeColors> = {
  light: {
    bg: '#F4F6FA',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF1F6',
    text: '#0B1B3F',
    textMuted: '#5B6478',
    outline: '#0B1B3F',
    shadow: '#0B1B3F',
    track: '#EEF1F6',
    accent: '#10B981',
    accentText: '#0B1B3F',
    positive: '#047857',
    warn: '#92400E',
    warnBg: '#FEF6E7',
    over: '#B23C0A',
    overBg: '#FFF1E8',
    okBg: '#ECFDF5',
    hero: '#0B1B3F',
    heroText: '#FFFFFF',
    heroMuted: '#B8C2D9',
    primaryBg: '#0B1B3F',
    primaryText: '#FFFFFF'
  },
  dark: {
    bg: '#070D1F',
    surface: '#101C3A',
    surfaceAlt: '#1B2747',
    text: '#E8EDF7',
    textMuted: '#9AA6C2',
    outline: '#2E4275',
    shadow: '#000611',
    track: '#1B2747',
    accent: '#10B981',
    accentText: '#0B1B3F',
    positive: '#34D399',
    warn: '#FCD34D',
    warnBg: '#382A0C',
    over: '#FDBA74',
    overBg: '#3A1E10',
    okBg: '#0A3329',
    hero: '#0F2350',
    heroText: '#FFFFFF',
    heroMuted: '#B8C2D9',
    primaryBg: '#10B981',
    primaryText: '#0B1B3F'
  }
};

/** Colors per category, readable on both themes. */
export const categoryColor: Record<string, string> = {
  Food: '#10B981',
  Entertainment: '#8B5CF6',
  Transportation: '#2563EB',
  Education: '#F59E0B',
  'School Supplies': '#EA580C',
  'Personal Needs': '#8B95A9',
  Others: '#64748B',
  Allowance: '#10B981',
  Scholarship: '#10B981',
  'Part-time Income': '#10B981',
  'Other Income': '#10B981'
};

/** The Finora F mark, drawn in a 1024 box (x 330-742, y 288-780). */
export const LOGO_PATH =
  'M330 372C330 325 368 288 414 288L728 288C737 288 742 297 738 305L716 344C710 353 702 357 692 357' +
  'L414 357C406 357 400 363 400 371L400 538L430 480C441 461 459 452 481 452L657 452C666 452 670 461 666 468' +
  'L648 504C643 514 634 520 623 520L486 520L357 770C350 783 330 779 330 765Z';

export const TAGLINE = 'Every Peso. Every Purpose.';
