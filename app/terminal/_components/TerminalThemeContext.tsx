'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getTerminalTheme, type TerminalTokens, type TerminalThemeMode } from './terminalTheme';

const STORAGE_KEY = 'terminal_theme';

type TerminalThemeContextValue = {
  mode: TerminalThemeMode;
  theme: TerminalTokens;
  isDark: boolean;
  toggleTheme: () => void;
  setMode: (mode: TerminalThemeMode) => void;
};

const TerminalThemeContext = createContext<TerminalThemeContextValue | null>(null);

export function TerminalThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<TerminalThemeMode>('dark');
  const [mounted, setMounted] = useState(false);


  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        setModeState(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setMode = useCallback((next: TerminalThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo(
    () => ({
      mode,
      theme: getTerminalTheme(mode),
      isDark: mode === 'dark',
      toggleTheme,
      setMode,
    }),
    [mode, toggleTheme, setMode]
  );

  if (!mounted) {
    return (
      <TerminalThemeContext.Provider
        value={{
          ...value,
          mode: 'light',
          theme: getTerminalTheme('light'),
          isDark: false,
        }}
      >
        {children}
      </TerminalThemeContext.Provider>
    );
  }

  return <TerminalThemeContext.Provider value={value}>{children}</TerminalThemeContext.Provider>;
}

export function useTerminalTheme() {
  const ctx = useContext(TerminalThemeContext);
  if (!ctx) {
    throw new Error('useTerminalTheme must be used within TerminalThemeProvider');
  }
  return ctx;
}
