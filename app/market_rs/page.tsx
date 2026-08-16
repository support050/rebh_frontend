'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import type React from 'react';
import { API_BASE_URL } from '@/lib/api/config';
import { authFetch } from '@/lib/api/authFetch';
import { ShariahFilterPage, useWatchlistShariah } from '@/components/Watchlist/WatchlistShariahContext';
import { applyShariahFilter } from '@/lib/watchlist/shariah';

import { StockData, TabId, getCatText } from './_components/types';
import { FONT_SERIF, FONT_MONO } from './_components/paperTheme';
import { PaperGlobalStyles } from './_components/PaperUI';
import { RsHubThemeProvider, useRsHubTheme } from './_components/RsHubThemeContext';
import { RankingsTab } from './_components/RankingsTab';
import { MatrixTab } from './_components/MatrixTab';
import { RotationTab } from './_components/RotationTab';
import { MapTab } from './_components/MapTab';
import { EventsTab } from './_components/EventsTab';

type UniverseType = 'all' | 'watchlist' | 'shariah';

const TABS: { id: TabId; label: string }[] = [
    { id: 'rankings', label: 'Rankings' },
    { id: 'matrix', label: 'Matrix' },
    { id: 'rotation', label: 'Rotation' },
    { id: 'map', label: 'RS Map' },
    { id: 'events', label: 'Events' },
];

function RSHubContent() {
    const { paper: PAPER, isDark, toggleTheme } = useRsHubTheme();
    const { filterStocks, bySymbol, options: shariahOptions, loading: shariahLoading } = useWatchlistShariah();
    const [stocks, setStocks] = useState<StockData[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabId>('rankings');
    const [universe, setUniverse] = useState<UniverseType>('all');

    // Local Watchlist (stored in localStorage)
    const [watchlist, setWatchlist] = useState<string[]>([]);

    const [dataDate, setDataDate] = useState<string>('');
    const [isStale, setIsStale] = useState<boolean>(false);

    useEffect(() => {
        // Load watchlist from localStorage on mount
        const saved = localStorage.getItem('rs_hub_watchlist');
        if (saved) {
            try {
                setWatchlist(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse watchlist', e);
            }
        }

        const loadData = async () => {
            try {
                const res = await authFetch(`${API_BASE_URL}/api/rs/latest_hub/`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.error) console.error("Backend Error:", data.error);
                    const formatted = (data.stocks || []).map((st: any) => ({
                        ...st,
                        symbol: st.s
                    }));
                    setStocks(formatted);

                    if (data.meta?.date) {
                        setDataDate(data.meta.date);
                        // Check if data is stale (> 3 days old to account for weekends)
                        const dDate = new Date(data.meta.date);
                        const now = new Date();
                        const diffDays = Math.floor((now.getTime() - dDate.getTime()) / (1000 * 3600 * 24));
                        setIsStale(diffDays > 3);
                    }
                } else {
                    const text = await res.text();
                    console.error('Failed to load RS Hub Data, Status:', res.status, text);
                }
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const toggleWatchlist = useCallback((symbol: string) => {
        setWatchlist(prev => {
            const next = prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol];
            localStorage.setItem('rs_hub_watchlist', JSON.stringify(next));
            return next;
        });
    }, []);

    // Same chip as top bar: "متوافقة مع الضوابط" only (not brokerage / نقية)
    const compliantStatuses = useMemo(() => {
        const exact = shariahOptions.filter(
            (o) => o === 'متوافقة مع الضوابط' || o === 'متوافق مع الضوابط',
        );
        return exact.length > 0 ? exact : ['متوافقة مع الضوابط'];
    }, [shariahOptions]);

    const shariahStocks = useMemo(
        () => applyShariahFilter(stocks, bySymbol, compliantStatuses),
        [stocks, bySymbol, compliantStatuses],
    );

    const shariahCount = shariahStocks.length;

    // Apply universe filtering — drives every tab + status cards
    const universeStocks = useMemo(() => {
        if (universe === 'shariah') {
            return shariahStocks;
        }
        if (universe === 'watchlist') {
            return stocks.filter(st => watchlist.includes(st.s));
        }
        // "all" still respects the top Shariah filter bar when user selects statuses
        return filterStocks(stocks);
    }, [stocks, universe, watchlist, filterStocks, shariahStocks]);

    // Calculate category distribution
    const dist = useMemo(() => {
        const counts = { STRONG: 0, IMPROVE: 0, NEUTRAL: 0, WEAK: 0 };
        universeStocks.forEach(st => {
            if (counts[st.cat as keyof typeof counts] !== undefined) {
                counts[st.cat as keyof typeof counts]++;
            }
        });
        return counts;
    }, [universeStocks]);

    // Insights chips — same rules as REBH-RS-Rating-MOBILE.html buildInsights()
    const insights = useMemo(() => {
        const S = universeStocks;
        const chips: { key: string; text: React.ReactNode; action: () => void }[] = [];
        const withD = S.map(x => ({ ...x, d: x.rs - x.rs1w }));
        const qual = withD.filter(x => x.rs >= 70);
        const fast = [...(qual.length ? qual : withD)].sort((a, b) => b.d - a.d)[0];
        const drop = [...withD].sort((a, b) => a.d - b.d)[0];
        const newStrong = S.filter(x => x.cat === 'STRONG' && x.sig?.includes('up'));
        const blues = S.filter(x => x.sig?.includes('blue'));
        const focusN = S.filter(x => x.focus ?? x.sig?.includes('focus'));
        const resN = S.filter(x => x.res ?? x.sig?.includes('res'));
        const distN = S.filter(x => x.dist ?? x.sig?.includes('dist'));

        const goRankings = (filter?: string, symbol?: string) => {
            setActiveTab('rankings');
            // Defer so RankingsTab is mounted before events fire
            window.setTimeout(() => {
                if (filter) window.dispatchEvent(new CustomEvent('rs-hub-filter', { detail: filter }));
                if (symbol) window.dispatchEvent(new CustomEvent('rs-hub-select', { detail: symbol }));
            }, 0);
        };

        if (fast && fast.d > 0) {
            chips.push({
                key: 'fast',
                text: <>Fastest riser: <b>{fast.c}</b> +{fast.d} pts</>,
                action: () => goRankings(undefined, fast.s),
            });
        }
        if (newStrong.length) {
            chips.push({
                key: 'newStrong',
                text: <>New to STRONG: <b>{newStrong.map(x => x.c).join(', ')}</b></>,
                action: () => goRankings('up'),
            });
        }
        if (blues.length) {
            chips.push({
                key: 'blue',
                text: <>RS ahead of price: <b>{blues.length}</b></>,
                action: () => goRankings('blue'),
            });
        }
        if (drop && drop.d < 0) {
            chips.push({
                key: 'drop',
                text: <>Biggest drop: <b>{drop.c}</b> {drop.d} pts</>,
                action: () => goRankings(undefined, drop.s),
            });
        }
        if (focusN.length) {
            chips.push({
                key: 'focus',
                text: <>Focus list: <b>{focusN.length}</b></>,
                action: () => goRankings('focus'),
            });
        }
        if (resN.length) {
            chips.push({
                key: 'res',
                text: <>Resilient: <b>{resN.map(x => x.c).slice(0, 3).join(', ')}{resN.length > 3 ? ` +${resN.length - 3}` : ''}</b></>,
                action: () => goRankings('res'),
            });
        }
        if (distN.length) {
            chips.push({
                key: 'dist',
                text: <>Under distribution: <b>{distN.length}</b></>,
                action: () => goRankings('dist'),
            });
        }
        const surge = S.filter(x => x.rs - x.rs1w >= 10).length;
        const crash = S.filter(x => x.rs - x.rs1w <= -10).length;
        if (surge || crash) {
            chips.push({
                key: 'breadth',
                text: <>Momentum: <b>{surge}</b> ↑10+ / <b>{crash}</b> ↓10+</>,
                action: () => goRankings('momentum'),
            });
        }
        const now70 = (S.filter(x => x.rs >= 70).length / (S.length || 1)) * 100;
        const prev70 = (S.filter(x => x.rs1w >= 70).length / (S.length || 1)) * 100;
        const dpp = now70 - prev70;
        const dir = dpp > 0.2 ? `▲ +${dpp.toFixed(1)}pp` : dpp < -0.2 ? `▼ ${dpp.toFixed(1)}pp` : 'flat';
        chips.push({
            key: 'lead70',
            text: <>RS ≥ 70: <b>{now70.toFixed(1)}%</b> ({dir})</>,
            action: () => goRankings('70'),
        });
        return chips;
    }, [universeStocks]);

    if (loading) {
        return (
            <div className="paper-grain min-h-screen flex items-center justify-center">
                <PaperGlobalStyles paper={PAPER} />
                <div className="flex flex-col items-center gap-3">
                    <div
                        className="w-12 h-12 rounded-full animate-spin"
                        style={{ border: `4px solid ${PAPER.cardBorder}`, borderTopColor: PAPER.marginRed }}
                    />
                    <span style={{ fontFamily: FONT_SERIF, color: PAPER.inkMuted, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Opening the ledger…
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="paper-grain min-h-screen w-full p-3 sm:p-4 lg:p-5 select-none" style={{ color: PAPER.ink, fontFamily: FONT_SERIF }}>
            <PaperGlobalStyles paper={PAPER} />
            <div className="w-full max-w-none">
                {/* Header + categories + insights — one compact panel */}
                <div
                    className="rounded-[4px] mb-4 overflow-hidden"
                    style={{
                        background: PAPER.paperLight,
                        border: `1px solid ${PAPER.cardBorder}`,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                >
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${PAPER.cardBorder}` }}>
                        <div className="min-w-0">
                            <h1 className="text-base font-bold flex items-center gap-2 flex-wrap" style={{ fontFamily: FONT_SERIF }}>
                                RS Rating Hub
                                {dataDate && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded border" style={{ background: PAPER.paper, color: PAPER.inkMuted, borderColor: PAPER.cardBorder }}>
                                        Data as of {dataDate}
                                    </span>
                                )}
                                {isStale && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border animate-pulse" style={{ background: PAPER.weakBg, color: PAPER.weak, borderColor: PAPER.weakBorder }}>
                                        ⚠️ Data Stale
                                    </span>
                                )}
                            </h1>
                            <p className="text-[11px] mt-0.5" style={{ color: PAPER.inkMuted }}>Relative Strength Analysis</p>
                        </div>

                        <div className="relative flex items-center gap-2">
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="paper-select px-2.5 py-1.5 text-xs cursor-pointer"
                                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                                title={isDark ? 'Light mode' : 'Dark mode'}
                            >
                                {isDark ? '☀ Light' : '☾ Dark'}
                            </button>
                            <select
                                value={universe}
                                onChange={e => setUniverse(e.target.value as UniverseType)}
                                className="paper-select appearance-none px-3 py-1.5 pr-7 text-xs cursor-pointer"
                                aria-label="Stock universe"
                            >
                                <option value="all">Universe: All Stocks ({stocks.length})</option>
                                <option value="watchlist">Watchlist ({watchlist.length})</option>
                                <option value="shariah">Shariah Compliant ({shariahCount})</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2" style={{ color: PAPER.inkMuted }}>
                                <svg className="fill-current h-3.5 w-3.5" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {universe !== 'all' && universeStocks.length === 0 && (
                        <div className="px-4 py-2 text-xs" style={{ color: PAPER.inkMuted, borderBottom: `1px solid ${PAPER.cardBorder}` }}>
                            {universe === 'watchlist'
                                ? 'Watchlist is empty — star stocks in Rankings (★) to add them here.'
                                : shariahLoading
                                    ? 'Loading Shariah statuses…'
                                    : shariahOptions.length === 0
                                        ? 'Shariah statuses are not available yet.'
                                        : 'No Shariah-compliant stocks matched. Try the top “Shariah & Margin” chips for all statuses.'}
                        </div>
                    )}

                    <div className="grid grid-cols-4 gap-px" style={{ background: PAPER.cardBorder }}>
                        {(['STRONG', 'IMPROVE', 'NEUTRAL', 'WEAK'] as const).map(cat => {
                            const count = dist[cat];
                            const pct = ((count / (universeStocks.length || 1)) * 100).toFixed(1);
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => {
                                        setActiveTab('rankings');
                                        window.setTimeout(() => {
                                            window.dispatchEvent(new CustomEvent('rs-hub-filter', { detail: cat }));
                                        }, 0);
                                    }}
                                    className="text-left px-3 py-2.5 transition-colors rs-hub-card-hover"
                                    style={{ background: PAPER.paperLight }}
                                >
                                    <div
                                        className="text-[9px] font-bold tracking-wider uppercase"
                                        style={{ color: getCatText(cat, PAPER), fontFamily: FONT_SERIF }}
                                    >
                                        {cat}
                                    </div>
                                    <div className="mt-0.5 flex items-baseline gap-1.5">
                                        <span className="text-lg font-bold leading-none" style={{ fontFamily: FONT_SERIF }}>{count}</span>
                                        <span className="text-[11px]" style={{ color: PAPER.inkMuted, fontFamily: FONT_SERIF }}>{pct}%</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {insights.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap px-3 py-2.5" style={{ borderTop: `1px solid ${PAPER.cardBorder}` }}>
                            {insights.map(chip => (
                                <button
                                    key={chip.key}
                                    type="button"
                                    onClick={chip.action}
                                    className="rounded-[3px] px-2.5 py-1 text-[11px] font-medium transition-colors rs-hub-card-hover"
                                    style={{
                                        background: PAPER.brassLight,
                                        border: `1px solid ${PAPER.cardBorder}`,
                                        color: PAPER.ink,
                                        fontFamily: FONT_SERIF,
                                    }}
                                >
                                    {chip.text}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="folder-tabs mb-0 overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`folder-tab ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Views */}
                <div className="mb-5" />
                {activeTab === 'rankings' && (
                    <RankingsTab
                        stocks={universeStocks}
                        watchlist={watchlist}
                        onToggleWatchlist={toggleWatchlist}
                    />
                )}
                {activeTab === 'matrix' && <MatrixTab stocks={universeStocks} />}
                {activeTab === 'rotation' && <RotationTab stocks={universeStocks} watchlist={watchlist} />}
                {activeTab === 'map' && <MapTab stocks={universeStocks} />}
                {activeTab === 'events' && <EventsTab stocks={universeStocks} />}

                {/* Footer Note */}
                <div className="text-center text-xs mt-8 italic" style={{ color: PAPER.inkMuted, fontFamily: FONT_MONO, letterSpacing: '0.02em' }}>
                    REBH · RS Rating Hub · {universeStocks.length} stocks · Sun–Thu trading week · Calibrated vs TASI
                </div>
            </div>
        </div>
    );
}

export default function RSHubPage() {
    return (
        <RsHubThemeProvider>
            <RSHubThemeShell />
        </RsHubThemeProvider>
    );
}

function RSHubThemeShell() {
    const { isDark } = useRsHubTheme();
    return (
        <ShariahFilterPage variant={isDark ? 'dark' : 'light'}>
            <RSHubContent />
        </ShariahFilterPage>
    );
}