'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { StockData, getCatColor, getCatText } from './types';
import { API_BASE_URL } from '@/lib/api/config';
import { authFetch } from '@/lib/api/authFetch';

type FilterKey = 'all' | '90' | '80' | '70' | 'blue' | 'up' | 'dn' | 'rsnh' | 'focus' | 'dist' | 'burst' | 'bull' | 'bear' | 'res' | 'STRONG' | 'IMPROVE' | 'NEUTRAL' | 'WEAK';
type SortKey = 's' | 'c' | 'rs' | 'd1w' | 'm1' | 'm3' | 'm6' | 'm9' | 'm12' | 'age' | 'grp';

const CMP_COLORS = ['#0f1420', '#2b4bf2', '#d97706'];

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
    const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
    const [levelField, setLevelField] = useState<'grp' | 'sec' | 'ind' | 'sub'>('grp');
    const [sortKey, setSortKey] = useState<SortKey>('rs');
    const [sortDir, setSortDir] = useState<-1 | 1>(-1);

    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyData, setHistoryData] = useState<any[]>([]);

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

    const filtered = useMemo(() => {
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
        }

        const val = (x: StockData): string | number => {
            if (sortKey === 'd1w') return x.rs - x.rs1w;
            if (sortKey === 'age') return x.age ?? (x.m1 - x.m12);
            if (sortKey === 's' || sortKey === 'c' || sortKey === 'grp') return (x[sortKey] || '') as string;
            return (x[sortKey] as number) ?? 0;
        };
        result.sort((a, b) => {
            const va = val(a), vb = val(b);
            if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb) * sortDir * -1;
            return ((va as number) - (vb as number)) * sortDir;
        });
        return result;
    }, [stocks, search, activeFilter, sortKey, sortDir]);

    useEffect(() => {
        const handler = (e: Event) => {
            const f = (e as CustomEvent).detail as FilterKey;
            if (f) setActiveFilter(f === 'all' ? 'all' : f);
        };
        window.addEventListener('rs-hub-filter', handler);
        return () => window.removeEventListener('rs-hub-filter', handler);
    }, []);

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
                setHistoryData(data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()));
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
        const headers = ['Symbol', 'Company', 'RS', 'D1W', '1M', '3M', '6M', '9M', '12M', 'Trend', 'Group', 'Signals'];
        const rows = filtered.map(st => [
            st.s,
            `"${st.c.replace(/"/g, '""')}"`,
            st.rs,
            st.rs - st.rs1w,
            st.m1, st.m3, st.m6, st.m9, st.m12,
            st.ageTag || '',
            `"${st.grp.replace(/"/g, '""')}"`,
            `"${[
                st.sig?.includes('blue') ? 'RS_LEAD' : '',
                (st.rsnh || st.sig?.includes('rsnh')) ? 'RS_1Y_HIGH' : '',
                (st.res || st.sig?.includes('res')) ? 'RESILIENT' : '',
                (st.focus || st.sig?.includes('focus')) ? 'FOCUS' : '',
                (st.dist || st.sig?.includes('dist')) ? 'DIST' : '',
                st.sig?.includes('up') ? 'UP' : '',
                st.sig?.includes('dn') ? 'DOWN' : '',
            ].filter(Boolean).join('|')}"`
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

    const toggleSort = (k: SortKey) => {
        if (sortKey === k) setSortDir(d => (d === -1 ? 1 : -1));
        else { setSortKey(k); setSortDir(-1); }
    };

    const chipClass = (f: FilterKey) =>
        `px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors whitespace-nowrap cursor-pointer ${activeFilter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`;

    const th = (k: SortKey, label: string, align: 'left' | 'right' = 'left') => (
        <th
            onClick={() => toggleSort(k)}
            className={`px-2 py-2.5 text-${align} text-[9.5px] font-mono text-gray-400 tracking-widest uppercase cursor-pointer hover:text-gray-700 select-none whitespace-nowrap`}
        >
            {label}{sortKey === k ? (sortDir === -1 ? ' ▾' : ' ▴') : ''}
        </th>
    );

    const wizard = selectedStock ? wizardChecks(selectedStock) : null;
    const trailPersist = selectedStock?.trail
        ? { cons: selectedStock.trail.filter((p: any) => p[1] >= 80).length, total: selectedStock.trail.length }
        : null;

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 p-3 border-b border-gray-200 flex-wrap bg-white">
                <input
                    type="text"
                    placeholder="Search symbol or name…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:border-gray-400"
                />
                <select
                    value={levelField}
                    onChange={e => setLevelField(e.target.value as any)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 cursor-pointer focus:outline-none"
                >
                    <option value="grp">Industry Group</option>
                    <option value="sec">Sector</option>
                    <option value="ind">Industry</option>
                    <option value="sub">Sub Industry</option>
                </select>
                <span className={chipClass('all')} onClick={() => setActiveFilter('all')}>All</span>
                <span className={chipClass('90')} onClick={() => setActiveFilter('90')}>90+</span>
                <span className={chipClass('80')} onClick={() => setActiveFilter('80')}>80+</span>
                <span className={chipClass('70')} onClick={() => setActiveFilter('70')}>70+</span>
                <span className={chipClass('blue')} onClick={() => setActiveFilter('blue')}>RS Lead <b className="ml-1 text-[10px] opacity-70">{counts.blue}</b></span>
                <span className={chipClass('up')} onClick={() => setActiveFilter('up')}>Upgraded <b className="ml-1 text-[10px] opacity-70">{counts.up}</b></span>
                <span className={chipClass('dn')} onClick={() => setActiveFilter('dn')}>Downgraded <b className="ml-1 text-[10px] opacity-70">{counts.dn}</b></span>
                <span className={chipClass('rsnh')} onClick={() => setActiveFilter('rsnh')}>RS 1Y-High <b className="ml-1 text-[10px] opacity-70">{counts.rsnh}</b></span>
                <span className={chipClass('focus')} onClick={() => setActiveFilter('focus')}>Focus <b className="ml-1 text-[10px] opacity-70">{counts.focus}</b></span>
                <span className={chipClass('res')} onClick={() => setActiveFilter('res')}>Resilient <b className="ml-1 text-[10px] opacity-70">{counts.res}</b></span>
                <span className={chipClass('dist')} onClick={() => setActiveFilter('dist')}>Distribution <b className="ml-1 text-[10px] opacity-70">{counts.dist}</b></span>
                <span className={chipClass('burst')} onClick={() => setActiveFilter('burst')}>Burst <b className="ml-1 text-[10px] opacity-70">{counts.burst}</b></span>
                <span className={chipClass('bull')} onClick={() => setActiveFilter('bull')}>Bullish <b className="ml-1 text-[10px] opacity-70">{counts.bull}</b></span>
                <span className={chipClass('bear')} onClick={() => setActiveFilter('bear')}>Bearish <b className="ml-1 text-[10px] opacity-70">{counts.bear}</b></span>

                {compare.length > 0 && (
                    <button
                        onClick={() => compare.length >= 2 ? setShowCompare(true) : undefined}
                        className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                    >
                        Compare {compare.length}/3 {compare.length >= 2 ? '↗' : ''}
                    </button>
                )}

                <button
                    onClick={exportCSV}
                    className="ml-auto flex items-center gap-1.5 px-4 py-2 border border-gray-200 bg-white rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                    Export CSV
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] min-h-[620px]">
                <div className="overflow-auto max-h-[620px] border-r border-gray-200">
                    <table className="w-full border-collapse">
                        <thead className="bg-white sticky top-0 z-10">
                            <tr className="border-b border-gray-200">
                                <th className="w-6 px-2 py-2.5"></th>
                                <th className="w-6 px-1 py-2.5 text-[9px] text-gray-400 font-mono">#</th>
                                {th('s', 'Symbol')}
                                {th('c', 'Company')}
                                {th('rs', 'RS')}
                                {th('d1w', 'Δ1W')}
                                {th('m1', '1M')}
                                {th('m3', '3M')}
                                {th('m12', '12M')}
                                {th('age', 'Trend')}
                                <th className="px-2 py-2.5 text-right text-[9.5px] font-mono text-gray-400 tracking-widest uppercase">Signals</th>
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
                                        className={`border-b border-gray-50 cursor-pointer ${isSel ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                                    >
                                        <td className="px-2 py-2 text-center" onClick={(e) => { e.stopPropagation(); onToggleWatchlist(st.s); }}>
                                            <span className={`text-base ${isFav ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
                                        </td>
                                        <td className="px-1 py-2 text-[9px] font-mono text-gray-400 text-center">{idx + 1}</td>
                                        <td className="px-2 py-2 text-xs font-bold font-mono">{st.s}</td>
                                        <td className="px-2 py-2 text-xs text-gray-600 font-semibold max-w-[120px] truncate">{st.c}</td>
                                        <td className={`px-2 py-2 text-sm font-extrabold ${getCatText(st.cat)}`}>{st.rs}</td>
                                        <td className={`px-2 py-2 text-xs font-mono font-bold ${d1w > 0 ? 'text-green-600' : d1w < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                            {d1w > 0 ? '+' : ''}{d1w}
                                        </td>
                                        <td className="px-2 py-2 text-[11px] font-mono text-gray-600">{st.m1}</td>
                                        <td className="px-2 py-2 text-[11px] font-mono text-gray-600">{st.m3}</td>
                                        <td className="px-2 py-2 text-[11px] font-mono text-gray-600">{st.m12}</td>
                                        <td className="px-2 py-2">
                                            <span className={`text-[9px] font-extrabold rounded px-1.5 py-0.5 ${
                                                st.ageTag === 'YOUNG' ? 'bg-green-100 text-green-700' :
                                                st.ageTag === 'MATURE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                                            }`}>{st.ageTag || '—'}</span>
                                        </td>
                                        <td className="px-2 py-2 text-right">
                                            <div className="flex gap-0.5 justify-end flex-wrap">
                                                {st.sig?.includes('blue') && <span className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-[8px] font-bold">LEAD</span>}
                                                {(st.rsnh || st.sig?.includes('rsnh')) && <span className="bg-amber-100 text-amber-700 px-1 py-0.5 rounded text-[8px] font-bold">1Y</span>}
                                                {st.sig?.includes('up') && <span className="bg-green-100 text-green-700 px-1 py-0.5 rounded text-[8px] font-bold">UP</span>}
                                                {st.sig?.includes('dn') && <span className="bg-red-100 text-red-700 px-1 py-0.5 rounded text-[8px] font-bold">DN</span>}
                                                {(st.focus || st.sig?.includes('focus')) && <span className="bg-purple-100 text-purple-700 px-1 py-0.5 rounded text-[8px] font-bold">FOC</span>}
                                                {(st.res || st.sig?.includes('res')) && <span className="bg-sky-100 text-sky-800 px-1 py-0.5 rounded text-[8px] font-bold">RES</span>}
                                                {(st.dist || st.sig?.includes('dist')) && <span className="bg-rose-100 text-rose-700 px-1 py-0.5 rounded text-[8px] font-bold">DIST</span>}
                                            </div>
                                        </td>
                                        <td className="px-2 py-2 text-[11px] text-gray-500 max-w-[100px] truncate">{st[levelField] || st.grp}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Detail */}
                <div className="p-4 overflow-y-auto max-h-[620px] bg-[#fafbfd]">
                    {selectedStock ? (
                        <div>
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h2 className="text-xl font-extrabold font-mono tracking-tight">
                                        {selectedStock.s}{' '}
                                        <span
                                            className={`cursor-pointer ${watchlist.includes(selectedStock.s) ? 'text-amber-400' : 'text-gray-300'}`}
                                            onClick={() => onToggleWatchlist(selectedStock.s)}
                                        >★</span>
                                    </h2>
                                    <p className="text-xs text-gray-500">{selectedStock.c}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        {selectedStock.sec} ▸ {selectedStock.grp} ▸ {selectedStock.ind} ▸ {selectedStock.sub}
                                    </p>
                                </div>
                                <span className={`px-3 py-2 rounded-xl text-xl font-extrabold border ${getCatColor(selectedStock.cat)}`}>{selectedStock.rs}</span>
                            </div>

                            {/* Histogram */}
                            <div className="border border-gray-200 rounded-lg p-3 mb-3 bg-white">
                                <div className="text-[9px] text-gray-400 font-mono tracking-wider uppercase mb-1">
                                    Where it sits · stronger than <span className={getCatText(selectedStock.cat)}>{percentile}%</span>
                                </div>
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
                                                fill={i === histogram.myBin ? '#16a34a' : '#e5e8ef'}
                                            />
                                        );
                                    })}
                                    <text x="6" y="55" fontSize="7.5" fill="#b6bdcb" fontFamily="monospace">0</text>
                                    <text x="246" y="55" fontSize="7.5" fill="#b6bdcb" fontFamily="monospace">99</text>
                                </svg>
                            </div>

                            {/* Wizard */}
                            {wizard && (
                                <div className="border border-gray-200 rounded-lg p-3 mb-3 bg-white">
                                    <div className="text-[9px] text-gray-400 font-mono tracking-wider uppercase mb-1.5">
                                        Wizard checks · alignment {wizard.align}/6
                                    </div>
                                    <div className="flex gap-1.5 mb-2">
                                        {wizard.checks.map(([lbl, ok]) => (
                                            <span
                                                key={lbl}
                                                title={lbl}
                                                className={`w-4 h-4 rounded ${ok ? 'bg-green-500' : 'bg-gray-200'}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="text-[11px] text-gray-600 leading-relaxed">
                                        {wizard.green ? '🟢' : '🔴'} RS {wizard.green ? 'above' : 'below'} trail avg ({wizard.sma10})
                                        {trailPersist && (
                                            <> · Persistence ≥80: <b>{trailPersist.cons}/{trailPersist.total}</b></>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                {[
                                    { label: 'Δ 1W', value: `${selectedStock.mom >= 0 ? '+' : ''}${selectedStock.mom}` },
                                    { label: 'Category', value: selectedStock.cat },
                                    { label: '1M', value: selectedStock.m1 },
                                    { label: '3M', value: selectedStock.m3 },
                                    { label: '6M', value: selectedStock.m6 },
                                    { label: '12M', value: selectedStock.m12 },
                                    { label: 'A/D', value: selectedStock.ad || '-' },
                                    { label: 'Group #', value: selectedStock.gRank ?? '—' },
                                ].map(item => (
                                    <div key={item.label} className="border border-gray-200 rounded-lg p-2 bg-white">
                                        <div className="text-[9px] text-gray-400 font-mono uppercase">{item.label}</div>
                                        <div className="text-sm font-extrabold text-gray-800 mt-0.5">{item.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Trail */}
                            <div className="border border-gray-200 rounded-lg p-3 mb-3 bg-white">
                                <div className="text-[9px] text-gray-400 font-mono tracking-wider uppercase mb-2">RS TRAIL</div>
                                <div className="flex items-end gap-1 h-12">
                                    {(selectedStock.trail || []).map((t: any, i: number) => {
                                        const val = typeof t[1] === 'number' ? t[1] : 0;
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                                                <div
                                                    className={`w-full rounded-sm ${val >= 70 ? 'bg-green-400' : val >= 50 ? 'bg-blue-400' : val >= 30 ? 'bg-amber-400' : 'bg-red-400'}`}
                                                    style={{ height: `${Math.max(val * 0.48, 3)}px` }}
                                                />
                                                <span className="text-[8px] text-gray-400">{t[0]}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Expert read */}
                            <div className="border border-gray-200 rounded-lg p-3 mb-3 bg-white text-[11px] text-gray-700 space-y-1 leading-relaxed">
                                <div className="text-[9px] text-gray-400 font-mono tracking-wider uppercase mb-1">Expert read</div>
                                {selectedStock.ageTag && (
                                    <div>
                                        <span className={`inline-block text-[9px] font-extrabold rounded px-1.5 py-0.5 mr-1 ${
                                            selectedStock.ageTag === 'YOUNG' ? 'bg-green-100 text-green-700' :
                                            selectedStock.ageTag === 'MATURE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                        }`}>{selectedStock.ageTag}</span>
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
                            <div className="border border-gray-200 rounded-lg p-3 mb-3 bg-white">
                                <div className="text-[9px] text-gray-400 font-mono tracking-wider uppercase mb-2">
                                    Technical checklist ({selectedStock.tts}/8)
                                </div>
                                <div className="space-y-1">
                                    {(selectedStock.tt || []).map((chk: any, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-[11px] text-gray-700">
                                            <span className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${chk[1] ? 'bg-green-500' : 'bg-gray-300'}`}>
                                                {chk[1] ? '✓' : '✗'}
                                            </span>
                                            {chk[0]}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => toggleCompare(selectedStock.s)}
                                className="w-full border border-dashed border-indigo-300 hover:border-indigo-600 bg-white py-2 rounded-lg text-xs font-bold text-indigo-800 mb-2"
                            >
                                {compare.includes(selectedStock.s)
                                    ? `✓ In compare (${compare.length}/3) — click to remove`
                                    : `⇄ Add to compare${compare.length ? ` (${compare.length}/3)` : ''} (C)`}
                            </button>

                            <button
                                onClick={handleOpenHistory}
                                className="w-full border border-dashed border-gray-300 hover:border-gray-900 bg-white py-2 rounded-lg text-xs font-bold text-gray-800 mb-3"
                            >
                                📈 History chart (H)
                            </button>

                            <Link
                                href={`/stocks/${selectedStock.s}`}
                                className="block w-full text-center bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800"
                            >
                                View Full Profile →
                            </Link>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-400 text-center mt-20">Select a stock</div>
                    )}
                </div>
            </div>

            {/* Compare Modal */}
            {showCompare && compareStocks.length >= 2 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative">
                        <button
                            onClick={() => setShowCompare(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold"
                        >×</button>
                        <h3 className="text-lg font-bold mb-3">RS Journey — Compare</h3>
                        <div className="flex flex-wrap gap-3 mb-3">
                            {compareStocks.map((x, si) => (
                                <span key={x.s} className="inline-flex items-center gap-2 text-xs font-bold">
                                    <span className="w-2.5 h-2.5 rounded" style={{ background: CMP_COLORS[si] }} />
                                    {x.c} ({x.rs})
                                    <button
                                        className="text-gray-400 hover:text-red-500"
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
                                        <line x1="60" y1={y} x2="820" y2={y} stroke="#eef0f5" />
                                        <text x="826" y={y + 3} fontSize="9" fill="#b6bdcb" fontFamily="monospace">{g}</text>
                                    </g>
                                );
                            })}
                            {['1Y', '6M', '3M', '4W', '1W', 'NOW'].map((l, i) => (
                                <text key={l} x={60 + (i / 5) * 760} y="330" fontSize="10" fill="#8a92a3" textAnchor="middle" fontFamily="monospace">{l}</text>
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

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
                        <button
                            onClick={() => setShowHistoryModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"
                        >×</button>
                        <h3 className="text-lg font-bold mb-1">{selectedStock?.s} Historical RS</h3>
                        <p className="text-xs text-gray-500 mb-4">{selectedStock?.c}</p>
                        <div className="flex-1 min-h-[300px] flex items-center justify-center border border-gray-100 rounded-xl p-4 bg-gray-50">
                            {historyLoading ? (
                                <div className="w-8 h-8 border-3 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
                            ) : historyData.length > 0 ? (
                                <svg viewBox="0 0 600 300" className="w-full h-full">
                                    {[0, 25, 50, 75, 100].map(val => {
                                        const y = 260 - (val / 100) * 220;
                                        return (
                                            <g key={val}>
                                                <line x1="40" y1={y} x2="570" y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3" />
                                                <text x="30" y={y + 4} textAnchor="end" className="text-[10px] fill-gray-400 font-mono">{val}</text>
                                            </g>
                                        );
                                    })}
                                    {(() => {
                                        const n = historyData.length;
                                        const xStep = 530 / (n - 1 || 1);
                                        const pathPoints = historyData.map((d, i) => `${40 + i * xStep},${260 - (d.rs_rating / 100) * 220}`);
                                        return (
                                            <path d={`M ${pathPoints.join(' L ')}`} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />
                                        );
                                    })()}
                                </svg>
                            ) : (
                                <div className="text-xs text-gray-400">No history found.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
