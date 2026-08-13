'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { StockData, getCatColor, getCatText } from './types';
import { API_BASE_URL } from '@/lib/api/config';
import { authFetch } from '@/lib/api/authFetch';
import { FONT_SERIF, FONT_MONO, type PaperTokens } from './paperTheme';
import { Stamp, LedgerLabel } from './PaperUI';
import { useRsHubTheme } from './RsHubThemeContext';

type FilterKey = 'all' | '90' | '80' | '70' | 'blue' | 'up' | 'dn' | 'rsnh' | 'focus' | 'dist' | 'burst' | 'bull' | 'bear' | 'res' | 'STRONG' | 'IMPROVE' | 'NEUTRAL' | 'WEAK' | 'momentum';
type SortKey = 's' | 'c' | 'rs' | 'd1w' | 'm1' | 'm3' | 'm6' | 'm9' | 'm12' | 'age' | 'grp';

interface SortConfig {
    key: SortKey;
    direction: 'asc' | 'desc';
}

function SortIndicator({ sortConfigs, colKey, paper }: { sortConfigs: SortConfig[]; colKey: SortKey; paper: { inkMuted: string; improve: string; paperLight: string } }) {
    const idx = sortConfigs.findIndex(c => c.key === colKey);
    if (idx === -1) {
        return (
            <span className="inline-flex flex-col ml-1 leading-[8px] opacity-50" style={{ color: paper.inkMuted, fontSize: 8 }}>
                <span>▲</span><span>▼</span>
            </span>
        );
    }
    return (
        <span className="inline-flex items-center ml-1 gap-0.5">
            <span className="text-[10px] font-bold">{sortConfigs[idx].direction === 'asc' ? '▲' : '▼'}</span>
            <span
                className="inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold rounded-full"
                style={{ background: paper.improve, color: paper.paperLight }}
            >
                {idx + 1}
            </span>
        </span>
    );
}

function wizardChecks(x: StockData) {
    const trailVals = (x.trail || []).map((p: any) => p[1]).filter((v: any) => typeof v === 'number');
    const sma10 = trailVals.length
        ? Math.round(trailVals.slice(-Math.min(4, trailVals.length)).reduce((a: number, b: number) => a + b, 0) / Math.min(4, trailVals.length))
        : x.rs;
    const green = x.rs >= sma10;
    const checks: [string, boolean][] = [
        ['RS ≥ 80', x.rs >= 80],
        ['Rising this week', x.rs1w != null && x.rs > x.rs1w],
        ['Trend not mature', x.ageTag !== 'MATURE'],
        ['Group top-5', !!x.gconf],
        ['RS 1Y-high / Blue', !!(x.rsnh || x.sig?.includes('rsnh') || x.sig?.includes('blue'))],
        ['Above trail avg', green],
    ];
    return { checks, align: checks.filter(c => c[1]).length, green, sma10 };
}

export function RankingsTab({
    stocks,
    watchlist,
    onToggleWatchlist
}: {
    stocks: StockData[];
    watchlist: string[];
    onToggleWatchlist: (symbol: string) => void;
}) {
    const { paper: PAPER } = useRsHubTheme();
    const CMP_COLORS = [PAPER.ink, PAPER.improve, PAPER.neutral];

    const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
    const [levelField, setLevelField] = useState<'grp' | 'sec' | 'ind' | 'sub'>('grp');
    const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ key: 'rs', direction: 'desc' }]);

    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyData, setHistoryData] = useState<{ date: string; rs_rating: number }[]>([]);
    const [histHover, setHistHover] = useState<{ i: number; x: number; y: number } | null>(null);

    // Compare (max 3) — REBH reference
    const [compare, setCompare] = useState<string[]>([]);
    const [showCompare, setShowCompare] = useState(false);

    const counts = useMemo(() => ({
        blue: stocks.filter(s => s.sig?.includes('blue')).length,
        up: stocks.filter(s => s.sig?.includes('up')).length,
        dn: stocks.filter(s => s.sig?.includes('dn')).length,
        rsnh: stocks.filter(s => !!(s.rsnh ?? s.sig?.includes('rsnh'))).length,
        focus: stocks.filter(s => !!(s.focus ?? s.sig?.includes('focus'))).length,
        dist: stocks.filter(s => !!(s.dist ?? s.sig?.includes('dist'))).length,
        res: stocks.filter(s => !!(s.res ?? s.sig?.includes('res'))).length,
        burst: stocks.filter(s => s.sig?.includes('burst')).length,
        bull: stocks.filter(s => s.sig?.includes('bull')).length,
        bear: stocks.filter(s => s.sig?.includes('bear')).length,
    }), [stocks]);

    const sortValue = useCallback((x: StockData, key: SortKey): string | number => {
        if (key === 'd1w') return x.rs - x.rs1w;
        if (key === 'age') return x.age ?? (x.m1 - x.m12);
        if (key === 'grp') return (x[levelField] || x.grp || '') as string;
        if (key === 's' || key === 'c') return (x[key] || '') as string;
        return (x[key as keyof StockData] as number) ?? 0;
    }, [levelField]);

    const handleSort = useCallback((key: SortKey) => {
        setSortConfigs(prev => {
            const idx = prev.findIndex(c => c.key === key);
            if (idx === -1) return [...prev, { key, direction: 'asc' }];
            if (prev[idx].direction === 'asc') {
                const next = [...prev];
                next[idx] = { ...next[idx], direction: 'desc' };
                return next;
            }
            return prev.filter((_, i) => i !== idx);
        });
    }, []);

    const filteredOnly = useMemo(() => {
        let result = [...stocks];
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(st => st.s.toLowerCase().includes(q) || st.c.toLowerCase().includes(q));
        }
        switch (activeFilter) {
            case '90': case 'STRONG': result = result.filter(s => activeFilter === 'STRONG' ? s.cat === 'STRONG' : s.rs >= 90); break;
            case '80': result = result.filter(s => s.rs >= 80); break;
            case '70': result = result.filter(s => s.rs >= 70); break;
            case 'IMPROVE': result = result.filter(s => s.cat === 'IMPROVE'); break;
            case 'NEUTRAL': result = result.filter(s => s.cat === 'NEUTRAL'); break;
            case 'WEAK': result = result.filter(s => s.cat === 'WEAK'); break;
            case 'blue': result = result.filter(s => s.sig?.includes('blue')); break;
            case 'up': result = result.filter(s => s.sig?.includes('up')); break;
            case 'dn': result = result.filter(s => s.sig?.includes('dn')); break;
            case 'rsnh': result = result.filter(s => !!(s.rsnh ?? s.sig?.includes('rsnh'))); break;
            case 'focus': result = result.filter(s => !!(s.focus ?? s.sig?.includes('focus'))); break;
            case 'dist': result = result.filter(s => !!(s.dist ?? s.sig?.includes('dist'))); break;
            case 'res': result = result.filter(s => !!(s.res ?? s.sig?.includes('res'))); break;
            case 'burst': result = result.filter(s => s.sig?.includes('burst')); break;
            case 'bull': result = result.filter(s => s.sig?.includes('bull')); break;
            case 'bear': result = result.filter(s => s.sig?.includes('bear')); break;
            case 'momentum': result = result.filter(s => Math.abs(s.rs - s.rs1w) >= 10); break;
        }
        return result;
    }, [stocks, search, activeFilter]);

    const filtered = useMemo(() => {
        const result = [...filteredOnly];
        const configs = sortConfigs.length > 0 ? sortConfigs : [{ key: 'rs' as SortKey, direction: 'desc' as const }];
        result.sort((a, b) => {
            for (const config of configs) {
                const va = sortValue(a, config.key);
                const vb = sortValue(b, config.key);
                if (va === vb) continue;
                if (typeof va === 'string' && typeof vb === 'string') {
                    const cmp = va.localeCompare(vb);
                    if (cmp !== 0) return config.direction === 'asc' ? cmp : -cmp;
                } else {
                    const diff = Number(va) - Number(vb);
                    if (diff !== 0) return config.direction === 'asc' ? diff : -diff;
                }
            }
            return 0;
        });
        return result;
    }, [filteredOnly, sortConfigs, sortValue]);

    useEffect(() => {
        if (activeFilter === 'burst') setSortConfigs([{ key: 'm1', direction: 'desc' }]);
        else if (activeFilter === 'momentum') setSortConfigs([{ key: 'd1w', direction: 'desc' }]);
    }, [activeFilter]);

    useEffect(() => {
        const onFilter = (e: Event) => {
            const f = (e as CustomEvent).detail as FilterKey;
            if (f) {
                setSearch('');
                setActiveFilter(f === 'all' ? 'all' : f);
            }
        };
        const onSelect = (e: Event) => {
            const sym = String((e as CustomEvent).detail || '');
            if (!sym) return;
            setActiveFilter('all');
            setSearch(sym);
            const st = stocks.find(s => s.s === sym);
            if (st) setSelectedStock(st);
        };
        window.addEventListener('rs-hub-filter', onFilter);
        window.addEventListener('rs-hub-select', onSelect);
        return () => {
            window.removeEventListener('rs-hub-filter', onFilter);
            window.removeEventListener('rs-hub-select', onSelect);
        };
    }, [stocks]);

    useEffect(() => {
        if (filtered.length > 0) {
            if (!selectedStock || !filtered.some(st => st.s === selectedStock.s)) {
                setSelectedStock(filtered[0]);
            }
        } else {
            setSelectedStock(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtered]);

    const toggleCompare = useCallback((sym: string) => {
        setCompare(prev => {
            let next: string[];
            if (prev.includes(sym)) next = prev.filter(z => z !== sym);
            else {
                next = prev.length >= 3 ? [...prev.slice(1), sym] : [...prev, sym];
            }
            if (next.length >= 2) setShowCompare(true);
            return next;
        });
    }, []);

    const handleOpenHistory = useCallback(async () => {
        if (!selectedStock) return;
        setShowHistoryModal(true);
        setHistoryLoading(true);
        try {
            const res = await authFetch(`${API_BASE_URL}/api/rs/${selectedStock.s}/`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setHistoryData(
                    (Array.isArray(data) ? data : []).map((d: any) => ({
                        date: d.date,
                        rs_rating: Number(d.rs_rating),
                    })).sort((a: { date: string }, b: { date: string }) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                    )
                );
            }
        } catch (e) {
            console.error('Error loading history', e);
        } finally {
            setHistoryLoading(false);
        }
    }, [selectedStock]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!filtered.length || !selectedStock) return;
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') return;

            const currentIndex = filtered.findIndex(s => s.s === selectedStock.s);
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedStock(filtered[(currentIndex + 1) % filtered.length]);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedStock(filtered[(currentIndex - 1 + filtered.length) % filtered.length]);
            } else if (e.key.toLowerCase() === 'w') {
                e.preventDefault();
                onToggleWatchlist(selectedStock.s);
            } else if (e.key.toLowerCase() === 'c') {
                e.preventDefault();
                toggleCompare(selectedStock.s);
            } else if (e.key.toLowerCase() === 'h') {
                e.preventDefault();
                handleOpenHistory();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filtered, selectedStock, onToggleWatchlist, toggleCompare, handleOpenHistory]);

    const exportCSV = () => {
        const csvCell = (value: unknown) => {
            const text = value == null ? '' : String(value);
            return `"${text.replace(/"/g, '""')}"`;
        };

        const headers = ['Symbol', 'Company', 'RS', 'D1W', '1M', '3M', '6M', '9M', '12M', 'Trend', 'Group', 'Signals'];
        const rows = filtered.map(st => [
            st.s,
            csvCell(st.c),
            st.rs,
            st.rs - st.rs1w,
            st.m1, st.m3, st.m6, st.m9, st.m12,
            st.ageTag || '',
            csvCell(st.grp),
            csvCell([
                st.sig?.includes('blue') ? 'RS_LEAD' : '',
                (st.rsnh || st.sig?.includes('rsnh')) ? 'RS_1Y_HIGH' : '',
                (st.res || st.sig?.includes('res')) ? 'RESILIENT' : '',
                (st.focus || st.sig?.includes('focus')) ? 'FOCUS' : '',
                (st.dist || st.sig?.includes('dist')) ? 'DIST' : '',
                st.sig?.includes('up') ? 'UP' : '',
                st.sig?.includes('dn') ? 'DOWN' : '',
            ].filter(Boolean).join('|')),
        ]);
        const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rebh_rs_rankings.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const percentile = useMemo(() => {
        if (!selectedStock || !stocks.length) return 0;
        return Math.round((stocks.filter(s => s.rs < selectedStock.rs).length / stocks.length) * 100);
    }, [selectedStock, stocks]);

    const histogram = useMemo(() => {
        const bins = new Array(10).fill(0);
        stocks.forEach(z => { bins[Math.min(9, Math.floor(z.rs / 10))]++; });
        const mx = Math.max(...bins, 1);
        const myBin = selectedStock ? Math.min(9, Math.floor(selectedStock.rs / 10)) : -1;
        return { bins, mx, myBin };
    }, [stocks, selectedStock]);

    const compareStocks = useMemo(
        () => compare.map(s => stocks.find(z => z.s === s) || null).filter(Boolean) as StockData[],
        [compare, stocks]
    );

    const toggleSort = handleSort;

    const th = (k: SortKey, label: string, align: 'left' | 'right' = 'left') => {
        const isSorted = sortConfigs.some(c => c.key === k);
        return (
            <th
                key={k}
                onClick={() => toggleSort(k)}
                className={`px-2 py-2.5 text-${align} text-[9.5px] uppercase cursor-pointer select-none whitespace-nowrap${isSorted ? ' sort-active' : ''}`}
                style={{ fontFamily: FONT_SERIF, letterSpacing: '0.08em' }}
                title="Click: asc → desc → remove. Shift+click adds secondary sort."
            >
                <span className="inline-flex items-center">
                    {label}
                    <SortIndicator sortConfigs={sortConfigs} colKey={k} paper={PAPER} />
                </span>
            </th>
        );
    };

    const wizard = selectedStock ? wizardChecks(selectedStock) : null;
    const trailPersist = selectedStock?.trail
        ? { cons: selectedStock.trail.filter((p: any) => p[1] >= 80).length, total: selectedStock.trail.length }
        : null;

    return (
        <div
            className="binder-rail rounded-[4px] overflow-hidden"
            style={{ background: PAPER.paperLight, border: `1px solid ${PAPER.cardBorder}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
            <div className="flex items-center gap-2 p-3 dashed-divider flex-wrap">
                <input
                    type="text"
                    placeholder="Search symbol or name…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="paper-input px-3 py-2 text-sm w-48"
                />
                <select
                    value={levelField}
                    onChange={e => setLevelField(e.target.value as any)}
                    className="paper-select px-3 py-2 text-xs cursor-pointer"
                >
                    <option value="grp">Industry Group</option>
                    <option value="sec">Sector</option>
                    <option value="ind">Industry</option>
                    <option value="sub">Sub Industry</option>
                </select>
                <Stamp active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>All</Stamp>
                <Stamp active={activeFilter === '90'} onClick={() => setActiveFilter('90')}>90+</Stamp>
                <Stamp active={activeFilter === '80'} onClick={() => setActiveFilter('80')}>80+</Stamp>
                <Stamp active={activeFilter === '70'} onClick={() => setActiveFilter('70')}>70+</Stamp>
                <Stamp active={activeFilter === 'blue'} onClick={() => setActiveFilter('blue')}>RS Lead ({counts.blue})</Stamp>
                <Stamp active={activeFilter === 'up'} onClick={() => setActiveFilter('up')} green>Upgraded ({counts.up})</Stamp>
                <Stamp active={activeFilter === 'dn'} onClick={() => setActiveFilter('dn')}>Downgraded ({counts.dn})</Stamp>
                <Stamp active={activeFilter === 'rsnh'} onClick={() => setActiveFilter('rsnh')}>RS 1Y-High ({counts.rsnh})</Stamp>
                <Stamp active={activeFilter === 'focus'} onClick={() => setActiveFilter('focus')} tiltRight>Focus ({counts.focus})</Stamp>
                <Stamp active={activeFilter === 'res'} onClick={() => setActiveFilter('res')}>Resilient ({counts.res})</Stamp>
                <Stamp active={activeFilter === 'dist'} onClick={() => setActiveFilter('dist')}>Distribution ({counts.dist})</Stamp>
                <Stamp active={activeFilter === 'burst'} onClick={() => setActiveFilter('burst')}>Burst ({counts.burst})</Stamp>
                <Stamp active={activeFilter === 'bull'} onClick={() => setActiveFilter('bull')} green>Bullish ({counts.bull})</Stamp>
                <Stamp active={activeFilter === 'bear'} onClick={() => setActiveFilter('bear')}>Bearish ({counts.bear})</Stamp>

                {compare.length > 0 && (
                    <button
                        onClick={() => compare.length >= 2 ? setShowCompare(true) : undefined}
                        className="px-3 py-1.5 rounded-full text-[11px] font-bold"
                        style={{ background: PAPER.improveBg, color: PAPER.improve, border: `1px solid ${PAPER.improveBorder}`, fontFamily: FONT_SERIF }}
                    >
                        Compare {compare.length}/3 {compare.length >= 2 ? '↗' : ''}
                    </button>
                )}

                <div className="ml-auto flex items-center gap-2">
                    {sortConfigs.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setSortConfigs([{ key: 'rs', direction: 'desc' }])}
                            className="text-[10px] font-semibold underline-offset-2 hover:underline"
                            style={{ color: PAPER.inkMuted, fontFamily: FONT_SERIF }}
                            title="Reset to RS descending"
                        >
                            Clear sort
                        </button>
                    )}
                    <span className="text-xs font-semibold" style={{ color: PAPER.inkMuted, fontFamily: FONT_SERIF }}>
                        {filtered.length} stocks
                    </span>
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-[3px] text-xs font-semibold"
                        style={{ background: PAPER.brassLight, color: PAPER.ink, border: `1px solid ${PAPER.brass}`, fontFamily: FONT_SERIF }}
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] min-h-[620px]">
                <div className="overflow-auto max-h-[620px] scrollbar-ledger" style={{ borderRight: `1px solid ${PAPER.cardBorder}` }}>
                    <table className="w-full border-collapse ledger-table">
                        <thead className="sticky top-0 z-10" style={{ background: PAPER.brassLight }}>
                            <tr>
                                <th className="w-6 px-2 py-2.5"></th>
                                <th className="w-6 px-1 py-2.5 text-[9px]" style={{ fontFamily: FONT_MONO, color: PAPER.inkMuted }}>#</th>
                                {th('s', 'Symbol')}
                                {th('c', 'Company')}
                                {th('rs', 'RS')}
                                {th('d1w', 'Δ1W')}
                                {th('m1', '1M')}
                                {th('m3', '3M')}
                                {th('m12', '12M')}
                                {th('age', 'Trend')}
                                <th className="px-2 py-2.5 text-right text-[9.5px] uppercase" style={{ fontFamily: FONT_SERIF, letterSpacing: '0.08em' }}>Signals</th>
                                {th('grp', levelField === 'grp' ? 'Group' : levelField === 'sec' ? 'Sector' : levelField === 'ind' ? 'Industry' : 'Sub')}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((st, idx) => {
                                const isSel = selectedStock?.s === st.s;
                                const isFav = watchlist.includes(st.s);
                                const d1w = st.rs - st.rs1w;
                                return (
                                    <tr
                                        key={st.s}
                                        onClick={() => setSelectedStock(st)}
                                        className={`cursor-pointer ${isSel ? 'selected' : ''}`}
                                    >
                                        <td className="px-2 py-2 text-center" onClick={(e) => { e.stopPropagation(); onToggleWatchlist(st.s); }}>
                                            <span className="text-base" style={{ color: isFav ? PAPER.brass : PAPER.cardBorder }}>★</span>
                                        </td>
                                        <td className="px-1 py-2 text-[9px] text-center" style={{ color: PAPER.inkMuted }}>{idx + 1}</td>
                                        <td className="px-2 py-2 text-xs font-bold">{st.s}</td>
                                        <td className="px-2 py-2 text-xs font-semibold max-w-[120px] truncate" style={{ fontFamily: FONT_SERIF, color: PAPER.ink }}>{st.c}</td>
                                        <td className="emboss px-2 py-2 text-sm" style={{ color: getCatText(st.cat, PAPER) }}>{st.rs}</td>
                                        <td className={`px-2 py-2 text-xs font-bold ${d1w > 0 ? 'num-positive' : d1w < 0 ? 'num-negative' : ''}`} style={d1w === 0 ? { color: PAPER.inkMuted } : undefined}>
                                            {d1w > 0 ? '+' : ''}{d1w}
                                        </td>
                                        <td className="px-2 py-2 text-[11px]" style={{ color: PAPER.inkMuted }}>{st.m1}</td>
                                        <td className="px-2 py-2 text-[11px]" style={{ color: PAPER.inkMuted }}>{st.m3}</td>
                                        <td className="px-2 py-2 text-[11px]" style={{ color: PAPER.inkMuted }}>{st.m12}</td>
                                        <td className="px-2 py-2">
                                            <span
                                                className="text-[9px] font-extrabold rounded-sm px-1.5 py-0.5"
                                                style={{
                                                    fontFamily: FONT_SERIF,
                                                    background: st.ageTag === 'YOUNG' ? PAPER.strongBg : st.ageTag === 'MATURE' ? PAPER.weakBg : PAPER.paper,
                                                    color: st.ageTag === 'YOUNG' ? PAPER.strong : st.ageTag === 'MATURE' ? PAPER.weak : PAPER.inkMuted,
                                                }}
                                            >{st.ageTag || '—'}</span>
                                        </td>
                                        <td className="px-2 py-2 text-right">
                                            <div className="flex gap-0.5 justify-end flex-wrap">
                                                {st.sig?.includes('blue') && <SignalTag color={PAPER.improve} bg={PAPER.improveBg}>LEAD</SignalTag>}
                                                {(st.rsnh || st.sig?.includes('rsnh')) && <SignalTag color={PAPER.neutral} bg={PAPER.neutralBg}>1Y</SignalTag>}
                                                {st.sig?.includes('up') && <SignalTag color={PAPER.strong} bg={PAPER.strongBg}>UP</SignalTag>}
                                                {st.sig?.includes('dn') && <SignalTag color={PAPER.weak} bg={PAPER.weakBg}>DN</SignalTag>}
                                                {(st.focus || st.sig?.includes('focus')) && <SignalTag color="#6B4C8A" bg="#E7DFEE">FOC</SignalTag>}
                                                {(st.res || st.sig?.includes('res')) && <SignalTag color="#3F6B7A" bg="#DEE7EA">RES</SignalTag>}
                                                {(st.dist || st.sig?.includes('dist')) && <SignalTag color="#8A3F52" bg="#EDDDE1">DIST</SignalTag>}
                                            </div>
                                        </td>
                                        <td className="px-2 py-2 text-[11px] max-w-[100px] truncate" style={{ color: PAPER.inkMuted }}>{st[levelField] || st.grp}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Detail */}
                <div className="p-4 overflow-y-auto max-h-[620px] scrollbar-ledger" style={{ background: PAPER.paper }}>
                    {selectedStock ? (
                        <div>
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h2 className="emboss text-xl tracking-tight">
                                        {selectedStock.s}{' '}
                                        <span
                                            className="cursor-pointer"
                                            style={{ color: watchlist.includes(selectedStock.s) ? PAPER.brass : PAPER.cardBorder }}
                                            onClick={() => onToggleWatchlist(selectedStock.s)}
                                        >★</span>
                                    </h2>
                                    <p className="text-xs" style={{ color: PAPER.inkMuted, fontFamily: FONT_SERIF }}>{selectedStock.c}</p>
                                    <p className="text-[10px] mt-0.5" style={{ color: PAPER.inkMuted }}>
                                        {selectedStock.sec} ▸ {selectedStock.grp} ▸ {selectedStock.ind} ▸ {selectedStock.sub}
                                    </p>
                                </div>
                                <span
                                    className="emboss px-3 py-2 rounded-[3px] text-xl"
                                    style={{ ...getCatColor(selectedStock.cat, PAPER), border: `1px solid ${getCatColor(selectedStock.cat, PAPER).borderColor}` }}
                                >{selectedStock.rs}</span>
                            </div>

                            {/* Histogram */}
                            <div className="index-card p-3 mb-3">
                                <span className="tape" />
                                <LedgerLabel>
                                    Where it sits · stronger than <span style={{ color: getCatText(selectedStock.cat, PAPER) }}>{percentile}%</span>
                                </LedgerLabel>
                                <svg viewBox="0 0 260 56" className="w-full h-14">
                                    {histogram.bins.map((b, i) => {
                                        const bh = (b / histogram.mx) * 40;
                                        const bx = 6 + i * (248 / 10);
                                        return (
                                            <rect
                                                key={i}
                                                x={bx}
                                                y={46 - bh}
                                                width={248 / 10 - 3}
                                                height={bh}
                                                rx={2.5}
                                                fill={i === histogram.myBin ? PAPER.stampGreen : PAPER.cardBorder}
                                            />
                                        );
                                    })}
                                    <text x="6" y="55" fontSize="7.5" fill={PAPER.inkMuted} fontFamily={FONT_MONO}>0</text>
                                    <text x="246" y="55" fontSize="7.5" fill={PAPER.inkMuted} fontFamily={FONT_MONO}>99</text>
                                </svg>
                            </div>

                            {/* Wizard */}
                            {wizard && (
                                <div className="index-card p-3 mb-3">
                                    <span className="tape" />
                                    <LedgerLabel>Wizard checks · alignment {wizard.align}/6</LedgerLabel>
                                    <div className="flex gap-1.5 mb-2">
                                        {wizard.checks.map(([lbl, ok]) => (
                                            <span
                                                key={lbl}
                                                title={lbl}
                                                className="w-4 h-4 rounded-sm"
                                                style={{ background: ok ? PAPER.stampGreen : PAPER.cardBorder }}
                                            />
                                        ))}
                                    </div>
                                    <div className="text-[11px] leading-relaxed" style={{ color: PAPER.ink }}>
                                        {wizard.green ? '🟢' : '🔴'} RS {wizard.green ? 'above' : 'below'} trail avg ({wizard.sma10})
                                        {trailPersist && (
                                            <> · Persistence ≥80: <b>{trailPersist.cons}/{trailPersist.total}</b></>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                {[
                                    { label: 'Δ 1W', value: `${(selectedStock.rs - selectedStock.rs1w) >= 0 ? '+' : ''}${selectedStock.rs - selectedStock.rs1w}` },
                                    { label: 'Category', value: selectedStock.cat },
                                    { label: '1M', value: selectedStock.m1 },
                                    { label: '3M', value: selectedStock.m3 },
                                    { label: '6M', value: selectedStock.m6 },
                                    { label: '12M', value: selectedStock.m12 },
                                    { label: 'A/D', value: selectedStock.ad || '-' },
                                    { label: 'Group #', value: selectedStock.gRank ?? '—' },
                                ].map(item => (
                                    <div key={item.label} className="rounded-[3px] p-2" style={{ background: PAPER.paperLight, border: `1px solid ${PAPER.cardBorder}` }}>
                                        <div className="text-[9px] uppercase" style={{ color: PAPER.inkMuted, fontFamily: FONT_SERIF }}>{item.label}</div>
                                        <div className="emboss text-sm mt-0.5">{item.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Trail */}
                            <div className="index-card p-3 mb-3">
                                <span className="tape" />
                                <LedgerLabel>RS Trail</LedgerLabel>
                                <div className="flex items-end gap-1 h-12">
                                    {(selectedStock.trail || []).map((t: any, i: number) => {
                                        const val = typeof t[1] === 'number' ? t[1] : 0;
                                        const barColor = val >= 70 ? PAPER.strong : val >= 50 ? PAPER.improve : val >= 30 ? PAPER.neutral : PAPER.weak;
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                                                <div
                                                    className="w-full rounded-sm"
                                                    style={{ height: `${Math.max(val * 0.48, 3)}px`, background: barColor }}
                                                />
                                                <span className="text-[8px]" style={{ color: PAPER.inkMuted }}>{t[0]}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Expert read */}
                            <div className="index-card p-3 mb-3 text-[11px] space-y-1 leading-relaxed" style={{ color: PAPER.ink }}>
                                <span className="tape" />
                                <LedgerLabel>Expert read</LedgerLabel>
                                {selectedStock.ageTag && (
                                    <div>
                                        <span
                                            className="inline-block text-[9px] font-extrabold rounded-sm px-1.5 py-0.5 mr-1"
                                            style={{
                                                fontFamily: FONT_SERIF,
                                                background: selectedStock.ageTag === 'YOUNG' ? PAPER.strongBg : selectedStock.ageTag === 'MATURE' ? PAPER.weakBg : PAPER.paper,
                                                color: selectedStock.ageTag === 'YOUNG' ? PAPER.strong : selectedStock.ageTag === 'MATURE' ? PAPER.weak : PAPER.inkMuted,
                                            }}
                                        >{selectedStock.ageTag}</span>
                                    </div>
                                )}
                                {selectedStock.rs >= 90 ? <div>Elite strength (top decile)</div>
                                    : selectedStock.rs >= 80 ? <div>Institutional-grade strength (RS 80+)</div>
                                        : selectedStock.rs >= 70 ? <div>Minervini minimum met (RS 70+)</div>
                                            : <div>Below leadership threshold</div>}
                                {selectedStock.gconf && <div>Group confirms: {selectedStock.grp} top-5 (#{selectedStock.gRank})</div>}
                                {(selectedStock.focus || selectedStock.sig?.includes('focus')) && <div>🎯 On focus list</div>}
                                {(selectedStock.rsnh || selectedStock.sig?.includes('rsnh')) && <div>🏔 RS at 1-year high</div>}
                                {(selectedStock.res || selectedStock.sig?.includes('res')) && <div>🛡 Resilient in down tape</div>}
                                {(selectedStock.dist || selectedStock.sig?.includes('dist')) && <div>🔻 Distribution risk</div>}
                                {selectedStock.sig?.includes('blue') && <div>🔵 RS led price</div>}
                            </div>

                            {/* Technical checklist */}
                            <div className="index-card p-3 mb-3">
                                <span className="tape" />
                                <LedgerLabel>Technical checklist ({selectedStock.tts}/8)</LedgerLabel>
                                <div className="space-y-1">
                                    {(selectedStock.tt || []).map((chk: any, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-[11px]" style={{ color: PAPER.ink }}>
                                            <span
                                                className="w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-bold shrink-0"
                                                style={{ background: chk[1] ? PAPER.stampGreen : PAPER.cardBorder, color: PAPER.paperLight }}
                                            >
                                                {chk[1] ? '✓' : '✗'}
                                            </span>
                                            {chk[0]}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => toggleCompare(selectedStock.s)}
                                className="stamp w-full py-2 mb-2"
                                style={{ width: '100%' }}
                            >
                                {compare.includes(selectedStock.s)
                                    ? `✓ In compare (${compare.length}/3) — click to remove`
                                    : `⇄ Add to compare${compare.length ? ` (${compare.length}/3)` : ''} (C)`}
                            </button>

                            <button
                                onClick={handleOpenHistory}
                                className="stamp w-full py-2 mb-3"
                                style={{ width: '100%' }}
                            >
                                History chart (H)
                            </button>
                        </div>
                    ) : (
                        <div className="text-sm text-center mt-20 italic" style={{ color: PAPER.inkMuted }}>Select a stock</div>
                    )}
                </div>
            </div>

            {/* Compare Modal */}
            {showCompare && compareStocks.length >= 2 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
                    <div className="rounded-[4px] max-w-3xl w-full p-6 relative" style={{ background: PAPER.paperLight, border: `1px solid ${PAPER.cardBorder}`, boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
                        <button
                            onClick={() => setShowCompare(false)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center font-bold"
                            style={{ background: PAPER.paper, color: PAPER.inkMuted }}
                        >×</button>
                        <h3 className="text-lg font-bold mb-3" style={{ fontFamily: FONT_SERIF, color: PAPER.ink }}>RS Journey — Compare</h3>
                        <div className="flex flex-wrap gap-3 mb-3">
                            {compareStocks.map((x, si) => (
                                <span key={x.s} className="inline-flex items-center gap-2 text-xs font-bold" style={{ color: PAPER.ink }}>
                                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: CMP_COLORS[si] }} />
                                    {x.c} ({x.rs})
                                    <button
                                        style={{ color: PAPER.inkMuted }}
                                        onClick={() => {
                                            const next = compare.filter(s => s !== x.s);
                                            setCompare(next);
                                            if (next.length < 2) setShowCompare(false);
                                        }}
                                    >✕</button>
                                </span>
                            ))}
                        </div>
                        <svg viewBox="0 0 860 340" className="w-full">
                            {[20, 50, 80].map(g => {
                                const y = 310 - (g / 100) * 280;
                                return (
                                    <g key={g}>
                                        <line x1="60" y1={y} x2="820" y2={y} stroke={PAPER.cardBorder} />
                                        <text x="826" y={y + 3} fontSize="9" fill={PAPER.inkMuted} fontFamily={FONT_MONO}>{g}</text>
                                    </g>
                                );
                            })}
                            {['1Y', '6M', '3M', '4W', '1W', 'NOW'].map((l, i) => (
                                <text key={l} x={60 + (i / 5) * 760} y="330" fontSize="10" fill={PAPER.inkMuted} textAnchor="middle" fontFamily={FONT_MONO}>{l}</text>
                            ))}
                            {compareStocks.map((x, si) => {
                                const labels = ['1Y', '6M', '3M', '4W', '1W', 'NOW'];
                                const pts = labels.map((l, i) => {
                                    const p = (x.trail || []).find((t: any) => String(t[0]).toUpperCase() === l);
                                    if (!p) return null;
                                    const px = 60 + (i / 5) * 760;
                                    const py = 310 - (p[1] / 100) * 280;
                                    return [px, py, p[1]] as [number, number, number];
                                }).filter(Boolean) as [number, number, number][];
                                return (
                                    <g key={x.s}>
                                        <polyline
                                            points={pts.map(p => `${p[0]},${p[1]}`).join(' ')}
                                            fill="none"
                                            stroke={CMP_COLORS[si]}
                                            strokeWidth="2.4"
                                        />
                                        {pts.map((p, j) => (
                                            <g key={j}>
                                                <circle cx={p[0]} cy={p[1]} r="3.4" fill={CMP_COLORS[si]} />
                                                <text x={p[0]} y={p[1] - 7} fontSize="9" fontWeight="700" fill={CMP_COLORS[si]} textAnchor="middle">{p[2]}</text>
                                            </g>
                                        ))}
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>
            )}

            {/* History Modal — data from GET /api/rs/{symbol}/ (rs_daily_v2), not rs_data.json */}
            {showHistoryModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.45)' }}
                    onClick={() => { setShowHistoryModal(false); setHistHover(null); }}
                >
                    <div
                        className="rounded-[4px] max-w-2xl w-full p-6 relative flex flex-col max-h-[90vh]"
                        style={{ background: PAPER.paperLight, border: `1px solid ${PAPER.cardBorder}`, boxShadow: '0 8px 28px rgba(0,0,0,0.18)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => { setShowHistoryModal(false); setHistHover(null); }}
                            className="absolute top-4 right-4 text-xl font-bold w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: PAPER.paper, color: PAPER.inkMuted }}
                            aria-label="Close"
                        >×</button>
                        <h3 className="text-lg font-bold mb-0.5" style={{ fontFamily: FONT_SERIF, color: PAPER.ink }}>
                            {selectedStock?.s} Historical RS
                        </h3>
                        <p className="text-xs mb-1" style={{ color: PAPER.inkMuted }}>{selectedStock?.c}</p>
                        {!historyLoading && historyData.length > 0 && (
                            <p className="text-[10px] mb-3" style={{ color: PAPER.inkMuted, fontFamily: FONT_MONO }}>
                                {historyData.length} sessions · {fmtHistDate(historyData[0].date)} → {fmtHistDate(historyData[historyData.length - 1].date)}
                                {' · '}latest RS {historyData[historyData.length - 1].rs_rating}
                            </p>
                        )}
                        <div
                            className="flex-1 min-h-[320px] flex items-center justify-center rounded-[3px] p-3 relative"
                            style={{ background: PAPER.paper, border: `1px solid ${PAPER.cardBorder}` }}
                        >
                            {historyLoading ? (
                                <div className="w-8 h-8 rounded-full animate-spin" style={{ border: `3px solid ${PAPER.cardBorder}`, borderTopColor: PAPER.marginRed }} />
                            ) : historyData.length > 0 ? (
                                <HistoryRsChart
                                    data={historyData}
                                    paper={PAPER}
                                    hover={histHover}
                                    setHover={setHistHover}
                                />
                            ) : (
                                <div className="text-xs italic" style={{ color: PAPER.inkMuted }}>No history found.</div>
                            )}
                        </div>
                        <p className="text-[10px] mt-2 text-center" style={{ color: PAPER.inkMuted }}>
                            Hover the chart for date &amp; RS · click outside to close
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

function fmtHistDate(d: string) {
    try {
        const dt = new Date(d);
        return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
    } catch {
        return d;
    }
}

function HistoryRsChart({
    data,
    paper,
    hover,
    setHover,
}: {
    data: { date: string; rs_rating: number }[];
    paper: PaperTokens;
    hover: { i: number; x: number; y: number } | null;
    setHover: (v: { i: number; x: number; y: number } | null) => void;
}) {
    const W = 640, H = 320;
    const pad = { l: 44, r: 16, t: 16, b: 36 };
    const iW = W - pad.l - pad.r;
    const iH = H - pad.t - pad.b;
    const n = data.length;
    const xAt = (i: number) => pad.l + (n <= 1 ? iW / 2 : (i / (n - 1)) * iW);
    const yAt = (rs: number) => pad.t + iH - (Math.max(0, Math.min(100, rs)) / 100) * iH;

    const linePts = data.map((d, i) => `${xAt(i)},${yAt(d.rs_rating)}`).join(' ');
    const areaD = n > 0
        ? `M ${xAt(0)},${yAt(data[0].rs_rating)} L ${linePts.split(' ').slice(1).join(' L ')} L ${xAt(n - 1)},${pad.t + iH} L ${xAt(0)},${pad.t + iH} Z`
        : '';

    // ~5 evenly spaced date labels on X
    const labelIdx = (() => {
        if (n <= 1) return [0];
        const count = Math.min(5, n);
        const out: number[] = [];
        for (let k = 0; k < count; k++) out.push(Math.round((k / (count - 1)) * (n - 1)));
        return [...new Set(out)];
    })();

    const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width) * W;
        if (mx < pad.l || mx > W - pad.r || n === 0) {
            setHover(null);
            return;
        }
        const t = n <= 1 ? 0 : (mx - pad.l) / iW;
        const i = Math.max(0, Math.min(n - 1, Math.round(t * (n - 1))));
        setHover({ i, x: xAt(i), y: yAt(data[i].rs_rating) });
    };

    const h = hover ? data[hover.i] : null;

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-full select-none"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
        >
            {/* zone bands */}
            <rect x={pad.l} y={yAt(100)} width={iW} height={yAt(90) - yAt(100)} fill={paper.strongBg} opacity="0.55" />
            <rect x={pad.l} y={yAt(90)} width={iW} height={yAt(80) - yAt(90)} fill={paper.improveBg} opacity="0.5" />
            <rect x={pad.l} y={yAt(80)} width={iW} height={yAt(70) - yAt(80)} fill={paper.neutralBg} opacity="0.45" />
            <rect x={pad.l} y={yAt(70)} width={iW} height={yAt(0) - yAt(70)} fill={paper.weakBg} opacity="0.35" />

            {[0, 25, 50, 70, 80, 90, 100].map(val => {
                const y = yAt(val);
                return (
                    <g key={val}>
                        <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke={paper.cardBorder} strokeWidth="1" strokeDasharray={val % 25 === 0 ? undefined : '3,3'} />
                        <text x={pad.l - 8} y={y + 3} textAnchor="end" fontSize="10" fill={paper.inkMuted} fontFamily={FONT_MONO}>{val}</text>
                    </g>
                );
            })}

            {labelIdx.map(i => (
                <text
                    key={i}
                    x={xAt(i)}
                    y={H - 10}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill={paper.inkMuted}
                    fontFamily={FONT_MONO}
                >
                    {fmtHistDate(data[i].date)}
                </text>
            ))}

            {areaD && (
                <path d={areaD} fill={paper.marginRed} opacity="0.1" />
            )}
            <polyline
                points={linePts}
                fill="none"
                stroke={paper.marginRed}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* invisible hit strip handled via mouse move */}
            {hover && h && (
                <g>
                    <line x1={hover.x} y1={pad.t} x2={hover.x} y2={pad.t + iH} stroke={paper.inkMuted} strokeWidth="1" strokeDasharray="3,3" opacity="0.7" />
                    <circle cx={hover.x} cy={hover.y} r="5" fill={paper.marginRed} stroke={paper.paperLight} strokeWidth="2" />
                    {(() => {
                        const tipW = 118;
                        const tipH = 40;
                        let tipX = hover.x - tipW / 2;
                        tipX = Math.max(pad.l, Math.min(W - pad.r - tipW, tipX));
                        let tipY = hover.y - tipH - 12;
                        if (tipY < pad.t) tipY = hover.y + 12;
                        return (
                            <g>
                                <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="4" fill={paper.ink} opacity="0.92" />
                                <text x={tipX + tipW / 2} y={tipY + 15} textAnchor="middle" fontSize="10" fill={paper.paperLight} fontFamily={FONT_SERIF}>
                                    {fmtHistDate(h.date)}
                                </text>
                                <text x={tipX + tipW / 2} y={tipY + 30} textAnchor="middle" fontSize="12" fontWeight="700" fill={paper.paperLight} fontFamily={FONT_MONO}>
                                    RS {h.rs_rating}
                                </text>
                            </g>
                        );
                    })()}
                </g>
            )}
        </svg>
    );
}

function SignalTag({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
    return (
        <span
            className="px-1 py-0.5 rounded-sm text-[8px] font-bold"
            style={{ background: bg, color, fontFamily: FONT_SERIF }}
        >
            {children}
        </span>
    );
}