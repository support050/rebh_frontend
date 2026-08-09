import { useState, useMemo, useEffect, useRef } from 'react';
import { StockData } from './types';

type RotShow = 'sec8' | 'secAll' | 'stk90' | 'stk20' | 'watch';
type LabelDensity = 'hide' | 'S' | 'M' | 'L';
type Level = 'grp' | 'sec' | 'ind' | 'sub';

// Design tokens lifted from the REBH reference build (REBH-RS-Rating-MOBILE.html)
const T = {
    border: '#e7e9ee',
    ink: '#0f1420',
    muted: '#8a92a3',
    accentText: '#475065',
    strong: '#16a34a', strongBg: '#ecfdf3',
    improve: '#2563eb', improveBg: '#eff6ff',
    neutral: '#d97706', neutralBg: '#fffbeb',
    weak: '#dc2626', weakBg: '#fef2f2',
};

const TIME_LABELS = ['1Y', '6M', '3M', '4W', '1W', 'NOW'];
const NOW_IDX = 5;

function Chip({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className="rounded-2xl px-3 py-1 text-[11px] font-bold whitespace-nowrap transition-colors"
            style={active
                ? { background: T.ink, color: '#fff', border: `1px solid ${T.ink}` }
                : { background: '#fff', color: T.accentText, border: `1px solid ${T.border}` }}
        >
            {children}
        </button>
    );
}

function UniSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="appearance-none rounded-[9px] bg-white pl-3 pr-7 py-2 text-xs font-semibold cursor-pointer focus:outline-none"
                style={{ border: `1px solid ${T.border}`, color: T.ink }}
            >
                {children}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[10px]" style={{ color: T.muted }}>▾</div>
        </div>
    );
}

interface PathPoint { rs: number; mom: number }
interface RotEntry { name: string; label: string; path: PathPoint[]; rs: number; mom: number }

function stepValue(st: StockData, idx: number): PathPoint {
    const t = st.trail?.[idx];
    if (t && typeof t[1] === 'number') {
        return { rs: t[1], mom: typeof t[2] === 'number' ? t[2] : st.mom };
    }
    return { rs: st.rs, mom: st.mom };
}

// EMA-lite smoothing on the velocity axis only (kills raw checkpoint noise so the
// trail reads as a flowing arc instead of a zig-zag), mirrors the reference build.
function smoothPath(path: PathPoint[]): PathPoint[] {
    return path.map((p, i) => i === 0 ? p : { rs: p.rs, mom: +(0.7 * p.mom + 0.3 * path[i - 1].mom).toFixed(2) });
}

// Catmull-Rom -> cubic Bezier, gives a smooth curve through the (already-smoothed) points.
function smoothCurvePath(pts: [number, number][]): string {
    if (pts.length < 2) return '';
    if (pts.length === 2) return `M${pts[0][0]},${pts[0][1]} L${pts[1][0]},${pts[1][1]}`;
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
        const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
}

export function RotationTab({ stocks, watchlist = [] }: { stocks: StockData[]; watchlist?: string[] }) {
    const [show, setShow] = useState<RotShow>('sec8');
    const [level, setLevel] = useState<Level>('grp');
    const [zoom, setZoom] = useState<'auto' | 'full'>('auto');
    const [labelDensity, setLabelDensity] = useState<LabelDensity>('hide');
    const [quadCenter, setQuadCenter] = useState(70);

    // Period = where the trail STARTS (HTML default: 3M → index 2)
    const [fromIdx, setFromIdx] = useState(2);
    const [periodMode, setPeriodMode] = useState<'preset' | 'custom'>('preset');
    const [customOpen, setCustomOpen] = useState(false);

    // Reveal animation (Play button sweeps the trail in from 0% -> 100%)
    const [revealRatio, setRevealRatio] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const playRef = useRef<any>(null);

    const [hoverName, setHoverName] = useState<string | null>(null);
    const [pinnedName, setPinnedName] = useState<string | null>(null);
    const activeName = hoverName ?? pinnedName;

    const stopPlayback = () => {
        if (isPlaying) { setIsPlaying(false); if (playRef.current) clearInterval(playRef.current); }
    };

    const play = () => {
        if (isPlaying) return;
        setRevealRatio(0);
        setIsPlaying(true);
        let r = 0;
        if (playRef.current) clearInterval(playRef.current);
        playRef.current = setInterval(() => {
            r += 0.03;
            if (r >= 1) { r = 1; setIsPlaying(false); clearInterval(playRef.current); }
            setRevealRatio(r);
        }, 30);
    };

    useEffect(() => () => { if (playRef.current) clearInterval(playRef.current); }, []);

    const setPeriodPreset = (idx: number) => {
        stopPlayback(); setRevealRatio(1); setPinnedName(null);
        setFromIdx(idx); setPeriodMode('preset'); setCustomOpen(false);
    };

    // Build the raw (unsmoothed) path for each entry across [fromIdx .. NOW]
    const entries: RotEntry[] = useMemo(() => {
        const buildPath = (getStep: (idx: number) => PathPoint): PathPoint[] => {
            const path: PathPoint[] = [];
            for (let i = fromIdx; i <= NOW_IDX; i++) path.push(getStep(i));
            return path;
        };

        if (show === 'stk90' || show === 'stk20' || show === 'watch') {
            let list = stocks.filter(s => s.s);
            if (show === 'stk90') list = list.filter(s => s.rs >= 90);
            else if (show === 'stk20') list = [...list].sort((a, b) => b.rs - a.rs).slice(0, 20);
            else list = list.filter(s => watchlist.includes(s.s));
            return list.map(s => {
                const path = buildPath(idx => stepValue(s, idx));
                const last = path[path.length - 1];
                return { name: s.s, label: s.c || s.s, path, rs: last.rs, mom: last.mom };
            });
        }

        const groupKey = (s: StockData) => s[level] || s.grp || 'Unclassified';
        const groupNames = Array.from(new Set(stocks.map(groupKey))).filter((n): n is string => !!n);
        let list = groupNames.map(name => {
            const members = stocks.filter(s => groupKey(s) === name);
            const path = buildPath(idx => {
                const vals = members.map(s => stepValue(s, idx));
                return {
                    rs: Math.round(vals.reduce((a, b) => a + b.rs, 0) / vals.length),
                    mom: +(vals.reduce((a, b) => a + b.mom, 0) / vals.length).toFixed(1),
                };
            });
            const last = path[path.length - 1];
            return { name, label: name, path, rs: last.rs, mom: last.mom };
        });
        if (show === 'sec8') {
            list.sort((a, b) => b.rs - a.rs);
            list = list.slice(0, 8);
        }
        return list;
    }, [stocks, show, level, fromIdx, watchlist]).filter(e => !!e.name);

    // Smoothed paths used for drawing (velocity axis only)
    const smoothedEntries = useMemo(() => entries.map(e => ({ ...e, spath: smoothPath(e.path) })), [entries]);

    // Dimensions
    const W = 760, H = 500;
    const pad = { t: 40, r: 40, b: 55, l: 60 };
    const iW = W - pad.l - pad.r;
    const iH = H - pad.t - pad.b;

    const allPts = smoothedEntries.length ? smoothedEntries.flatMap(e => e.spath) : [{ rs: 50, mom: 0 }];
    const xMin = zoom === 'full' ? 0 : Math.max(0, Math.min(...allPts.map(p => p.rs)) - 8);
    const xMax = zoom === 'full' ? 100 : Math.min(100, Math.max(...allPts.map(p => p.rs)) + 8);
    const yMin = zoom === 'full' ? -50 : Math.min(-15, ...allPts.map(p => p.mom)) - 4;
    const yMax = zoom === 'full' ? 50 : Math.max(15, ...allPts.map(p => p.mom)) + 4;

    const sx = (v: number) => pad.l + ((v - xMin) / (xMax - xMin)) * iW;
    const sy = (v: number) => pad.t + iH - ((v - yMin) / (yMax - yMin)) * iH;

    const quadX = sx(Math.min(Math.max(quadCenter, xMin), xMax));
    const quadY = sy(0);

    const getQuad = (rs: number, mom: number) => {
        if (rs >= quadCenter && mom >= 0) return 'Leading';
        if (rs >= quadCenter && mom < 0) return 'Weakening';
        if (rs < quadCenter && mom >= 0) return 'Improving';
        return 'Lagging';
    };
    const quadColor = (q: string) => q === 'Leading' ? T.strong : q === 'Improving' ? T.improve : q === 'Weakening' ? T.neutral : T.weak;
    const quadBg = (q: string) => q === 'Leading' ? T.strongBg : q === 'Improving' ? T.improveBg : q === 'Weakening' ? T.neutralBg : T.weakBg;

    const shouldShowLabel = (idx: number, total: number) => {
        if (labelDensity === 'hide') return false;
        if (labelDensity === 'L') return true;
        if (labelDensity === 'S') return idx < total * 0.15;
        return idx < total * 0.45;
    };

    const rankedEntries = useMemo(() => [...entries].sort((a, b) => b.rs - a.rs), [entries]);
    const activeEntry = entries.find(e => e.name === activeName) || null;
    const activeQuad = activeEntry ? getQuad(activeEntry.rs, activeEntry.mom) : null;

    const togglePin = (name: string) => setPinnedName(prev => prev === name ? null : name);
    const showLevelPicker = show === 'sec8' || show === 'secAll';

    return (
        <div className="bg-white rounded-[14px] overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            {/* Toolbar */}
            <div className="flex items-center gap-2.5 p-3.5 md:px-[18px] flex-wrap" style={{ borderBottom: `1px solid ${T.border}` }}>
                <UniSelect value={show} onChange={v => { stopPlayback(); setRevealRatio(1); setPinnedName(null); setShow(v as RotShow); }}>
                    <option value="sec8">Show: Top 8 Groups</option>
                    <option value="secAll">All Groups</option>
                    <option value="stk90">Elite Stocks · RS 90+</option>
                    <option value="stk20">Top 20 Stocks</option>
                    <option value="watch">⭐ My Watchlist</option>
                </UniSelect>

                {showLevelPicker && (
                    <UniSelect value={level} onChange={v => { setPinnedName(null); setLevel(v as Level); }}>
                        <option value="grp">Industry Group</option>
                        <option value="sec">Sector</option>
                        <option value="ind">Industry</option>
                        <option value="sub">Sub Industry</option>
                    </UniSelect>
                )}

                <span className="text-[11px] font-semibold" style={{ color: T.muted }}>Period:</span>
                {TIME_LABELS.slice(0, 5).map((lbl, i) => (
                    <Chip key={lbl} active={periodMode === 'preset' && fromIdx === i} onClick={() => setPeriodPreset(i)}>{lbl}</Chip>
                ))}
                <Chip active={periodMode === 'custom'} onClick={() => { setPeriodMode('custom'); setCustomOpen(o => !o); }}>Custom…</Chip>
                {customOpen && periodMode === 'custom' && (
                    <UniSelect value={String(fromIdx)} onChange={v => { stopPlayback(); setRevealRatio(1); setFromIdx(Number(v)); }}>
                        {TIME_LABELS.slice(0, 5).map((lbl, i) => <option key={lbl} value={i}>From: {lbl}</option>)}
                    </UniSelect>
                )}

                <span className="text-[11px] font-semibold" style={{ color: T.muted }}>Zoom:</span>
                <Chip active={zoom === 'auto'} onClick={() => setZoom('auto')} title="Frame the visible trail — no wasted space">🔍 Auto</Chip>
                <Chip active={zoom === 'full'} onClick={() => setZoom('full')}>Full 0-100</Chip>

                <span className="text-[11px] font-semibold" style={{ color: T.muted }}>Center:</span>
                <Chip active={quadCenter === 70} onClick={() => setQuadCenter(70)} title="IBD school: Leading = RS 70+ (leaders vs the pack)">70</Chip>
                <Chip active={quadCenter === 50} onClick={() => setQuadCenter(50)} title="RRG school: Leading = above market median">50</Chip>

                <span className="text-[11px] font-semibold" style={{ color: T.muted }}>Aa:</span>
                {(['hide', 'S', 'M', 'L'] as LabelDensity[]).map(d => (
                    <Chip key={d} active={labelDensity === d} onClick={() => setLabelDensity(d)}>{d === 'hide' ? 'Hide' : d}</Chip>
                ))}

                <button
                    onClick={play}
                    disabled={isPlaying}
                    className="rounded-[9px] px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
                    style={{ background: '#fff', color: T.ink, border: `1px solid ${T.border}`, opacity: isPlaying ? 0.6 : 1 }}
                >
                    {isPlaying ? '⏳ Playing…' : '▶ Play'}
                </button>

                <div className="flex-1 hidden md:block" />
                <span className="text-[11.5px] hidden lg:inline" style={{ color: T.accentText }}>X = RS today · Y = RS velocity (Δ per 4W)</span>
            </div>

            {/* Chart Area */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px]">
                <div className="p-2" style={{ borderRight: '1px solid ' + T.border }}>
                    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 'min(62vh, 540px)' }}>
                        <defs>
                            <filter id="rotShadow" x="-50%" y="-50%" width="200%" height="200%">
                                <feDropShadow dx="0" dy="1.2" stdDeviation="1.6" floodColor="#0f1420" floodOpacity="0.28" />
                            </filter>
                        </defs>

                        {/* Quadrants */}
                        <rect x={quadX} y={pad.t} width={sx(xMax) - quadX} height={quadY - pad.t} fill={T.strongBg} opacity="0.45" />
                        <rect x={pad.l} y={pad.t} width={quadX - pad.l} height={quadY - pad.t} fill={T.neutralBg} opacity="0.45" />
                        <rect x={pad.l} y={quadY} width={quadX - pad.l} height={sy(yMin) - quadY} fill={T.weakBg} opacity="0.45" />
                        <rect x={quadX} y={quadY} width={sx(xMax) - quadX} height={sy(yMin) - quadY} fill={T.improveBg} opacity="0.45" />

                        {/* Grid lines */}
                        {[0, 20, 40, 60, 80, 100].filter(v => v >= xMin && v <= xMax).map(v => (
                            <g key={`gx${v}`}>
                                <line x1={sx(v)} y1={pad.t} x2={sx(v)} y2={sy(yMin)} stroke="#e5e7eb" strokeWidth="1" />
                                <text x={sx(v)} y={H - 12} textAnchor="middle" className="fill-gray-400 font-mono" style={{ fontSize: '9.5px' }}>{v}</text>
                            </g>
                        ))}
                        {Array.from({ length: 9 }, (_, i) => Math.round(yMin + ((yMax - yMin) / 8) * i)).map(v => (
                            <g key={`gy${v}`}>
                                <line x1={pad.l} y1={sy(v)} x2={sx(xMax)} y2={sy(v)} stroke="#e5e7eb" strokeWidth="1" />
                                <text x={pad.l - 8} y={sy(v) + 3} textAnchor="end" className="fill-gray-400 font-mono" style={{ fontSize: '9px' }}>{v}</text>
                            </g>
                        ))}

                        <line x1={quadX} y1={pad.t} x2={quadX} y2={sy(yMin)} stroke="#9ca3af" strokeWidth="1.2" strokeDasharray="4,4" />
                        <line x1={pad.l} y1={quadY} x2={sx(xMax)} y2={quadY} stroke="#9ca3af" strokeWidth="1.2" strokeDasharray="4,4" />

                        <text x={sx(xMax) - 8} y={pad.t + 16} textAnchor="end" style={{ fontSize: '10px', fontWeight: 800, fill: T.strong }}>LEADING</text>
                        <text x={pad.l + 8} y={pad.t + 16} textAnchor="start" style={{ fontSize: '10px', fontWeight: 800, fill: T.neutral }}>WEAKENING</text>
                        <text x={pad.l + 8} y={sy(yMin) - 8} textAnchor="start" style={{ fontSize: '10px', fontWeight: 800, fill: T.weak }}>LAGGING</text>
                        <text x={sx(xMax) - 8} y={sy(yMin) - 8} textAnchor="end" style={{ fontSize: '10px', fontWeight: 800, fill: T.improve }}>IMPROVING</text>

                        {/* Trails + points */}
                        {(() => {
                            const few = smoothedEntries.length <= 10;
                            const labels: { x: number; y: number; text: string; strong: boolean; anchor: 'start' | 'end'; fs: number }[] = [];

                            const rendered = smoothedEntries.map((e, idx) => {
                                const quad = getQuad(e.rs, e.mom);
                                const col = quadColor(quad);
                                const isActive = activeName === e.name;
                                const dim = activeName !== null && !isActive;
                                const trailOp = isActive ? 0.9 : dim ? 0.07 : (few ? 0.55 : 0.35);

                                // Reveal a fraction of the (already time-windowed) trail
                                const revealCount = Math.max(2, Math.round(e.spath.length * revealRatio));
                                const seg = e.spath.slice(0, Math.min(e.spath.length, revealCount));
                                const last = seg[seg.length - 1];
                                const cx = sx(last.rs), cy = sy(last.mom);
                                const r = isActive ? 9 : few ? 8 : 6;

                                const curvePts: [number, number][] = seg.map(p => [sx(p.rs), sy(p.mom)]);
                                const curveD = smoothCurvePath(curvePts);

                                let arrow: string | null = null;
                                if (seg.length >= 2) {
                                    const a = seg[seg.length - 2];
                                    const ax0 = sx(a.rs), ay0 = sy(a.mom);
                                    const hd = Math.atan2(cy - ay0, cx - ax0);
                                    const ax = cx + Math.cos(hd) * (r + 5), ay = cy + Math.sin(hd) * (r + 5);
                                    const l = 6, w1 = hd + 2.6, w2 = hd - 2.6;
                                    arrow = `M${ax + Math.cos(hd) * l},${ay + Math.sin(hd) * l} L${ax + Math.cos(w1) * l * 0.7},${ay + Math.sin(w1) * l * 0.7} L${ax + Math.cos(w2) * l * 0.7},${ay + Math.sin(w2) * l * 0.7} Z`;
                                }

                                if ((!dim && labelDensity !== 'hide' && shouldShowLabel(idx, smoothedEntries.length)) || isActive) {
                                    const fs = (isActive || few ? 11 : 9.5);
                                    const flip = cx + r + 4 + e.name.length * fs * 0.58 > sx(xMax) - 4;
                                    labels.push({ x: flip ? cx - r - 4 : cx + r + 4, y: Math.max(pad.t + 12, Math.min(sy(yMin) - 4, cy + 4)), text: e.name, strong: isActive, anchor: flip ? 'end' : 'start', fs });
                                }

                                return (
                                    <g key={e.name}>
                                        <path d={curveD} fill="none" stroke={col} strokeWidth={isActive ? 2.6 : few ? 2 : 1.5} strokeLinecap="round" opacity={trailOp} />
                                        {seg.slice(0, -1).map((p, k) => (
                                            <circle key={k} cx={sx(p.rs)} cy={sy(p.mom)} r={2} fill={col} opacity={isActive ? 0.8 : dim ? 0.05 : 0.4} />
                                        ))}
                                        {arrow && <path d={arrow} fill={col} opacity={isActive ? 1 : dim ? 0.06 : 0.7} />}
                                        <circle
                                            cx={cx} cy={cy} r={r}
                                            fill={col} fillOpacity={dim ? 0.2 : 1}
                                            stroke="#fff" strokeWidth={2.2}
                                            filter={dim ? undefined : 'url(#rotShadow)'}
                                            style={{ cursor: 'pointer' }}
                                            onMouseEnter={() => setHoverName(e.name)}
                                            onMouseLeave={() => setHoverName(null)}
                                            onClick={() => togglePin(e.name)}
                                        />
                                    </g>
                                );
                            });

                            const kept: typeof labels = [];
                            labels.sort((a, b) => a.y - b.y || a.x - b.x);
                            labels.forEach(L => {
                                if (L.strong || !kept.some(K => Math.abs(K.y - L.y) < 13 && Math.abs(K.x - L.x) < 115)) kept.push(L);
                            });

                            return (
                                <>
                                    {rendered}
                                    {kept.map((L, i) => (
                                        <text key={i} x={L.x} y={L.y} fontSize={L.fs} fontWeight={L.strong ? 800 : 700} fill={T.ink} textAnchor={L.anchor}>{L.text}</text>
                                    ))}
                                </>
                            );
                        })()}
                    </svg>
                </div>

                {/* Side panel */}
                <div className="p-4 overflow-y-auto max-h-[560px]">
                    <h4 className="text-xs font-bold mb-2" style={{ color: T.ink }}>How to read it</h4>
                    <div className="flex flex-col gap-1.5 mb-4">
                        {[
                            { label: 'Leading', desc: 'strong & accelerating', color: T.strong, bg: T.strongBg },
                            { label: 'Improving', desc: 'rising from below', color: T.improve, bg: T.improveBg },
                            { label: 'Weakening', desc: 'strong but fading', color: T.neutral, bg: T.neutralBg },
                            { label: 'Lagging', desc: 'weak & falling', color: T.weak, bg: T.weakBg },
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-2 text-[11.5px]">
                                <span className="w-[11px] h-[11px] rounded-[3px]" style={{ background: item.bg, border: `1px solid ${item.color}` }} />
                                <b>{item.label}</b>
                                <span style={{ color: T.muted }}>— {item.desc}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-1">
                        <h4 className="text-xs font-bold mb-1.5" style={{ color: T.ink }}>Rankings</h4>
                        <div>
                            {rankedEntries.slice(0, 15).map((e, index) => {
                                const quad = getQuad(e.rs, e.mom);
                                const isActive = activeName === e.name;
                                return (
                                    <div
                                        key={e.name}
                                        className="flex items-center gap-1.5 text-[11.5px] py-1.5 cursor-pointer"
                                        style={{ borderBottom: '1px solid #f0f2f6', background: isActive ? '#f8f9fc' : 'transparent' }}
                                        onMouseEnter={() => setHoverName(e.name)}
                                        onMouseLeave={() => setHoverName(null)}
                                        onClick={() => togglePin(e.name)}
                                    >
                                        <span className="w-4 text-[9.5px] font-mono" style={{ color: T.muted }}>{index + 1}</span>
                                        <span className="w-2 h-2 rounded-full" style={{ background: quadColor(quad) }} />
                                        <span className="truncate flex-1 font-semibold" style={{ color: '#3a4256' }}>{e.name}</span>
                                        <b className="font-mono">{e.rs}</b>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Detail card — persists while pinned, previews on hover */}
                    {activeEntry && activeQuad ? (
                        <div className="rounded-[10px] p-3 mt-3" style={{ border: `1px solid ${T.border}` }}>
                            <div className="flex items-start justify-between">
                                <div className="text-sm font-extrabold font-mono" style={{ color: T.ink }}>{activeEntry.name}</div>
                                {pinnedName === activeEntry.name && !hoverName && (
                                    <button onClick={() => setPinnedName(null)} className="text-[10px]" style={{ color: T.muted }}>✕</button>
                                )}
                            </div>
                            <span
                                className="text-[10px] font-extrabold rounded px-1.5 py-0.5 inline-block mt-1 mb-1.5"
                                style={{ background: quadBg(activeQuad), color: quadColor(activeQuad) }}
                            >
                                {activeQuad.toUpperCase()}
                            </span>
                            <div className="text-[11px] leading-relaxed" style={{ color: '#3a4256' }}>
                                RS: <b>{activeEntry.rs}</b> · velocity: <b>{activeEntry.mom >= 0 ? '+' : ''}{activeEntry.mom}</b>/4W
                            </div>
                            <div className="text-[10.5px] mt-1" style={{ color: T.muted }}>
                                Journey ({TIME_LABELS[fromIdx]}→now): {activeEntry.path.map(p => p.rs).join(' → ')}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-5 text-[11px] rounded-[10px] mt-3" style={{ color: T.muted, border: `1px dashed ${T.border}` }}>
                            Hover or click a point
                        </div>
                    )}
                </div>
            </div>

            {/* Scrub bar — sweeps the trail reveal, from the period start up to Now */}
            <div className="flex items-center gap-2.5 px-[18px] py-2.5" style={{ borderTop: `1px solid ${T.border}` }}>
                <span className="font-mono text-[10px] tracking-widest" style={{ color: T.muted }}>{TIME_LABELS[fromIdx]}</span>
                <input
                    type="range"
                    min="0"
                    max="1000"
                    value={Math.round(revealRatio * 1000)}
                    onChange={e => { stopPlayback(); setRevealRatio(Number(e.target.value) / 1000); }}
                    className="flex-1 cursor-pointer"
                    style={{ accentColor: T.ink }}
                />
                <span className="font-mono text-[10px] tracking-widest" style={{ color: T.muted }}>NOW</span>
            </div>
        </div>
    );
}