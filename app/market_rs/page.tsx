'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import type React from 'react';
import { API_BASE_URL } from '@/lib/api/config';
import { authFetch } from '@/lib/api/authFetch';
import { ShariahFilterPage, useWatchlistShariah } from '@/components/Watchlist/WatchlistShariahContext';

import { StockData, TabId, getCatBg, getCatText } from './_components/types';
import { RankingsTab } from './_components/RankingsTab';
import { MatrixTab } from './_components/MatrixTab';
import { RotationTab } from './_components/RotationTab';
import { MapTab } from './_components/MapTab';
import { EventsTab } from './_components/EventsTab';

type UniverseType = 'all' | 'watchlist' | 'shariah';

function RSHubContent() {
    const { filterStocks } = useWatchlistShariah();
    const [stocks, setStocks] = useState<StockData[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabId>('rankings');
    const [universe, setUniverse] = useState<UniverseType>('all');
    
    // Local Watchlist (stored in localStorage)
    const [watchlist, setWatchlist] = useState<string[]>([]);

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

    // Apply universe filtering first
    const universeStocks = useMemo(() => {
        if (universe === 'shariah') {
            // Exact match with REBH-RS-Rating-MOBILE.html: shariah === "متوافقة مع الضوابط"
            return stocks.filter(st => (st.shariah || '').trim() === 'متوافقة مع الضوابط');
        }
        if (universe === 'watchlist') {
            return stocks.filter(st => watchlist.includes(st.s));
        }
        // "all" still respects the Shariah filter bar when user selects statuses
        return filterStocks(stocks);
    }, [stocks, universe, watchlist, filterStocks]);

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

        const goRankings = (filter?: string) => {
            setActiveTab('rankings');
            if (filter) window.dispatchEvent(new CustomEvent('rs-hub-filter', { detail: filter }));
        };

        if (fast && fast.d > 0) {
            chips.push({
                key: 'fast',
                text: <>🚀 Fastest riser: <b>{fast.c}</b> +{fast.d} pts</>,
                action: () => goRankings(),
            });
        }
        if (newStrong.length) {
            chips.push({
                key: 'newStrong',
                text: <>⭐ New to STRONG: <b>{newStrong.map(x => x.c).join(', ')}</b></>,
                action: () => goRankings('90'),
            });
        }
        if (blues.length) {
            chips.push({
                key: 'blue',
                text: <>🔵 <b>{blues.length}</b> stocks: RS hit a new high before price</>,
                action: () => goRankings('blue'),
            });
        }
        if (drop && drop.d < 0) {
            chips.push({
                key: 'drop',
                text: <>⚠️ Biggest drop: <b>{drop.c}</b> {drop.d} pts</>,
                action: () => goRankings(),
            });
        }
        if (focusN.length) {
            chips.push({
                key: 'focus',
                text: <>🎯 Focus list: <b>{focusN.length}</b> stocks</>,
                action: () => goRankings('focus'),
            });
        }
        if (resN.length) {
            chips.push({
                key: 'res',
                text: <>🛡 Gaining RS in a down week: <b>{resN.map(x => x.c).slice(0, 3).join(', ')}{resN.length > 3 ? ` +${resN.length - 3}` : ''}</b></>,
                action: () => goRankings('res'),
            });
        }
        if (distN.length) {
            chips.push({
                key: 'dist',
                text: <>🔻 Leaders under distribution: <b>{distN.length}</b></>,
                action: () => goRankings('dist'),
            });
        }
        const surge = S.filter(x => x.rs - x.rs1w >= 10).length;
        const crash = S.filter(x => x.rs - x.rs1w <= -10).length;
        if (surge || crash) {
            chips.push({
                key: 'breadth',
                text: <>⚡ Momentum: <b>{surge}</b> ≥+10 vs <b>{crash}</b> ≤−10</>,
                action: () => goRankings('all'),
            });
        }
        const now70 = (S.filter(x => x.rs >= 70).length / (S.length || 1)) * 100;
        const prev70 = (S.filter(x => x.rs1w >= 70).length / (S.length || 1)) * 100;
        const dpp = now70 - prev70;
        const dir = dpp > 0.2 ? `▲ +${dpp.toFixed(1)}pp` : dpp < -0.2 ? `▼ ${dpp.toFixed(1)}pp` : 'flat';
        chips.push({
            key: 'lead70',
            text: <>📊 Leadership breadth: <b>{now70.toFixed(1)}%</b> RS≥70 ({dir})</>,
            action: () => goRankings('70'),
        });
        return chips;
    }, [universeStocks]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f7f9] text-[#0f1420] p-4 lg:p-8 font-sans select-none">
            <div className="max-w-[1440px] mx-auto">
                {/* Header */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 mb-5 shadow-sm">
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            RS Rating Hub <span className="text-[10px] bg-blue-600 text-white rounded px-2 py-0.5 uppercase tracking-wide">Beta</span>
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">LUMIVST Proprietary Relative Strength Analysis</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Universe selector */}
                        <div className="relative">
                            <select
                                value={universe}
                                onChange={e => setUniverse(e.target.value as UniverseType)}
                                className="appearance-none border border-gray-200 bg-white rounded-xl px-4 py-2 pr-8 text-xs font-semibold text-gray-700 cursor-pointer focus:outline-none focus:border-gray-400"
                            >
                                <option value="all">Universe: All Stocks</option>
                                <option value="watchlist">Watchlist ({watchlist.length})</option>
                                <option value="shariah">Shariah Compliant</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Strips — click filters Rankings by category (HTML goCat) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {(['STRONG', 'IMPROVE', 'NEUTRAL', 'WEAK'] as const).map(cat => {
                        const count = dist[cat];
                        const pct = ((count / (universeStocks.length || 1)) * 100).toFixed(1);
                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                    setActiveTab('rankings');
                                    window.dispatchEvent(new CustomEvent('rs-hub-filter', { detail: cat }));
                                }}
                                className="bg-white border border-gray-200 rounded-xl p-4 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left"
                            >
                                <div className={`absolute top-0 left-0 right-0 h-1 ${getCatBg(cat)}`}></div>
                                <div className={`text-[10px] font-extrabold tracking-wider ${getCatText(cat)}`}>{cat}</div>
                                <div className="text-2xl font-bold mt-1">
                                    {count} <span className="text-xs text-gray-400 font-normal">{pct}%</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Insights — REBH reference chips */}
                {insights.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-4">
                        {insights.map(chip => (
                            <button
                                key={chip.key}
                                type="button"
                                onClick={chip.action}
                                className="bg-white border border-gray-200 rounded-full px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-400 transition-colors"
                            >
                                {chip.text}
                            </button>
                        ))}
                    </div>
                )}

                {/* Tabs Switcher */}
                <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit mb-5 shadow-sm overflow-x-auto">
                    {[
                        { id: 'rankings', label: 'Rankings' },
                        { id: 'matrix', label: 'Matrix' },
                        { id: 'rotation', label: 'Rotation' },
                        { id: 'map', label: 'RS Map' },
                        { id: 'events', label: 'Events' },
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabId)}
                                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${isActive ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Views */}
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
                <div className="text-center text-xs text-gray-400 mt-8">
                    REBH · RS Rating Hub · {universeStocks.length} stocks · Sun–Thu trading week · Calibrated vs TASI
                </div>
            </div>
        </div>
    );
}

export default function RSHubPage() {
    return (
        <ShariahFilterPage variant="light">
            <RSHubContent />
        </ShariahFilterPage>
    );
}
