'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getPaper, type PaperTokens, type RsHubThemeMode } from './paperTheme';

const STORAGE_KEY = 'rs_hub_theme';

type RsHubThemeContextValue = {
    mode: RsHubThemeMode;
    paper: PaperTokens;
    isDark: boolean;
    toggleTheme: () => void;
    setMode: (mode: RsHubThemeMode) => void;
};

const RsHubThemeContext = createContext<RsHubThemeContextValue | null>(null);

export function RsHubThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setModeState] = useState<RsHubThemeMode>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'dark' || saved === 'light') setModeState(saved);
        } catch { /* ignore */ }
    }, []);

    const setMode = useCallback((next: RsHubThemeMode) => {
        setModeState(next);
        try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
    }, []);

    const toggleTheme = useCallback(() => {
        setMode(mode === 'dark' ? 'light' : 'dark');
    }, [mode, setMode]);

    const value = useMemo(() => ({
        mode,
        paper: getPaper(mode),
        isDark: mode === 'dark',
        toggleTheme,
        setMode,
    }), [mode, toggleTheme, setMode]);

    if (!mounted) {
        return (
            <RsHubThemeContext.Provider value={{ ...value, mode: 'light', paper: getPaper('light'), isDark: false }}>
                {children}
            </RsHubThemeContext.Provider>
        );
    }

    return <RsHubThemeContext.Provider value={value}>{children}</RsHubThemeContext.Provider>;
}

export function useRsHubTheme() {
    const ctx = useContext(RsHubThemeContext);
    if (!ctx) throw new Error('useRsHubTheme must be used within RsHubThemeProvider');
    return ctx;
}
