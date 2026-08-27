// Light / dark design tokens for Financial Terminal.
// Matches the exact palette from the original REBH terminal demo.

export type TerminalTokens = {
  bg: string;
  panel: string;
  panel2: string;
  ink: string;
  ink2: string;
  muted: string;
  grid: string;
  baseline: string;
  border: string;
  accent: string;
  accent2: string;
  up: string;
  down: string;
  upBg: string;
  downBg: string;
  chip: string;
  gold: string;
  warn: string;
};

export const TERMINAL_DARK: TerminalTokens = {
  bg: '#0d0d0d',
  panel: '#1a1a19',
  panel2: '#222220',
  ink: '#f2f1ed',
  ink2: '#c3c2b7',
  muted: '#898781',
  grid: '#2c2c2a',
  baseline: '#383835',
  border: 'rgba(255, 255, 255, 0.09)',
  accent: '#3987e5',
  accent2: '#184f95',
  up: '#0ca30c',
  down: '#e66767',
  upBg: 'rgba(12, 163, 12, 0.13)',
  downBg: 'rgba(230, 103, 103, 0.13)',
  chip: '#262624',
  gold: '#d9b64a',
  warn: '#e8c464',
};

export const TERMINAL_LIGHT: TerminalTokens = {
  bg: '#f9f9f7',
  panel: '#fcfcfb',
  panel2: '#f0efec',
  ink: '#0b0b0b',
  ink2: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
  baseline: '#c3c2b7',
  border: 'rgba(11, 11, 11, 0.10)',
  accent: '#2a78d6',
  accent2: '#cde2fb',
  up: '#006300',
  down: '#d03b3b',
  upBg: 'rgba(12, 163, 12, 0.10)',
  downBg: 'rgba(208, 59, 59, 0.10)',
  chip: '#f0efec',
  gold: '#8a6d1d',
  warn: '#7a5b13',
};

export type TerminalThemeMode = 'light' | 'dark';

export function getTerminalTheme(mode: TerminalThemeMode): TerminalTokens {
  return mode === 'dark' ? TERMINAL_DARK : TERMINAL_LIGHT;
}
