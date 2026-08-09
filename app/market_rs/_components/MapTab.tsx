import { useState, useMemo, useEffect, useRef } from 'react';
import { StockData } from './types';

type LabelDensity = 'hide' | 'S' | 'M' | 'L';

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

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
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

// Deterministic small jitter so overlapping RS values fan out vertically, same as reference
function jitter(s: string) {
    let h = 0;
    for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 997;
    return (h / 997 - 0.5) * 2;
}

export function MapTab({ stocks }: { stocks: StockData[] }) {
    const [mode, setMode] = useState<'stocks' | 'sectors'>('stocks');
    const [levelField, setLevelField] = useState<'grp' | 'sec' | 'ind' | 'sub'>('grp');
    const [labelDensity, setLabelDensity] = useState<LabelDensity>('hide');
    const [zoneFilter, setZoneFilter] = useState<'all' | 'elite' | 'strong' | 'mid' | 'weak'>('all');

    // Animation State (weekly replay)
    const [animationProgress, setAnimationProgress] = useState<number>(1);
    const [isReplaying, setIsReplaying] = useState(false);
    const animationRef = useRef<any>(null);

    const [hoverName, setHoverName] = useState<string | null>(null);
    const [pinnedName, setPinnedName] = useState<string | null>(null);
    const activeName = hoverName ?? pinnedName;

    const triggerReplay = () => {
        if (isReplaying) return;
        setPinnedName(null);
        setIsReplaying(true);
        setAnimationProgress(0);
        let progress = 0;
        const step = 0.04;

        if (animationRef.current) clearInterval(animationRef.current);

        animationRef.current = setInterval(() => {
            progress += step;
            if (progress >= 1) {
                progress = 1;
                setIsReplaying(false);
                clearInterval(animationRef.current);
            }
            setAnimationProgress(progress);
        }, 35);
    };

    const points = useMemo(() => {
        if (mode === 'stocks') {
            return stocks.map(s => {
                const startRS = s.rs1w;
                const jd = jitter(s.s) * 3.2;
                return {
                    name: s.s, label: s.c, isGroup: false,
                    startRS, endRS: s.rs,
                    startDelta: jd, endDelta: (s.rs - s.rs1w) + jd,
                    cat: s.cat,
                };
            });
        }
        const groups: Record<string, { rs: number[]; rs1w: number[]; cats: string[] }> = {};
        stocks.forEach(s => {
            const key = s[levelField] || s.grp;
            if (!groups[key]) groups[key] = { rs: [], rs1w: [], cats: [] };
            groups[key].rs.push(s.rs);
            groups[key].rs1w.push(s.rs1w);
            groups[key].cats.push(s.cat);
        });
        return Object.entries(groups).map(([name, g]) => {
            const endRS = Math.round(g.rs.reduce((a, b) => a + b, 0) / g.rs.length);
            const startRS = Math.round(g.rs1w.reduce((a, b) => a + b, 0) / g.rs1w.length);
            const catCounts: Record<string, number> = {};
            g.cats.forEach(c => { catCounts[c] = (catCounts[c] || 0) + 1; });
            const majCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
                || (endRS >= 90 ? 'STRONG' : endRS >= 80 ? 'IMPROVE' : endRS >= 70 ? 'NEUTRAL' : 'WEAK');
            return {
                name, label: name, isGroup: true,
                startRS, endRS,
                startDelta: 0, endDelta: endRS - startRS,
                cat: majCat,
            };
        });
    }, [stocks, mode, levelField]);

    // Interpolated live positions given replay progress
    const live = useMemo(() => points.map(p => {
        const e = animationProgress < 1 ? (1 - Math.pow(1 - animationProgress, 3)) : 1;
        const rs = Math.round(p.startRS + (p.endRS - p.startRS) * e);
        const delta = +(p.startDelta + (p.endDelta - p.startDelta) * e).toFixed(1);
        return { ...p, rs, delta };
    }), [points, animationProgress]);

    // Zones by category (same as HTML zoneCounts — filter on cat, not live RS thresholds)
    const zoneCounts = useMemo(() => {
        const zones = { elite: 0, strong: 0, mid: 0, weak: 0 };
        live.forEach(p => {
            if (p.cat === 'STRONG') zones.elite++;
            else if (p.cat === 'IMPROVE') zones.strong++;
            else if (p.cat === 'NEUTRAL') zones.mid++;
            else zones.weak++;
        });
        return zones;
    }, [live]);

    const zoneOf = (p: { cat: string }): 'elite' | 'strong' | 'mid' | 'weak' =>
        p.cat === 'STRONG' ? 'elite' : p.cat === 'IMPROVE' ? 'strong' : p.cat === 'NEUTRAL' ? 'mid' : 'weak';

    const filtered = useMemo(() => zoneFilter === 'all' ? live : live.filter(p => zoneOf(p) === zoneFilter), [live, zoneFilter]);

    const W = 1100, H = 480;
    const pad = { t: 40, r: 40, b: 50, l: 60 };
    const iW = W - pad.l - pad.r;
    const iH = H - pad.t - pad.b;

    const xMin = 0, xMax = 100;
    const deltas = filtered.map(p => p.delta);
    const yMin = Math.min(-15, ...deltas) - 3;
    const yMax = Math.max(15, ...deltas) + 3;

    const sx = (v: number) => pad.l + ((v - xMin) / (xMax - xMin)) * iW;
    const sy = (v: number) => pad.t + iH - ((v - yMin) / (yMax - yMin)) * iH;

    const getZone = (rs: number) => {
        if (rs >= 90) return { color: T.strong, bg: T.strongBg, label: '90+' };
        if (rs >= 80) return { color: T.improve, bg: T.improveBg, label: '80-89' };
        if (rs >= 70) return { color: T.neutral, bg: T.neutralBg, label: '70-79' };
        return { color: T.weak, bg: T.weakBg, label: '<70' };
    };

    const shouldShowLabel = (p: typeof live[number], idx: number, total: number) => {
        if (labelDensity === 'hide') return p.isGroup;
        if (labelDensity === 'L') return true;
        if (labelDensity === 'S') return p.isGroup || idx < total * 0.15;
        return p.isGroup || idx < total * 0.45;
    };

    const activePoint = filtered.find(p => p.name === activeName) || null;
    const togglePin = (name: string) => setPinnedName(prev => prev === name ? null : name);

    const zoneChip = (key: typeof zoneFilter, label: string, count: number, color: string, bg: string) => (
        <button
            onClick={() => setZoneFilter(prev => prev === key ? 'all' : key)}
            className="text-[11px] font-bold rounded-2xl px-2.5 py-1 transition-colors"
            style={zoneFilter === key ? { background: color, color: '#fff' } : { background: bg, color }}
        >
            {label} {count}
        </button>
    );

    return (
        <div className="bg-white rounded-[14px] overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            {/* Toolbar */}
            <div className="flex items-center gap-2.5 p-3.5 md:px-[18px] flex-wrap" style={{ borderBottom: `1px solid ${T.border}` }}>
                <span className="font-extrabold text-sm" style={{ color: T.ink }}>RS Range Map</span>

                <div className="rounded-[9px] p-[3px] flex items-center" style={{ background: '#f2f4f8' }}>
                    <button
                        onClick={() => { setMode('stocks'); setPinnedName(null); }}
                        className="px-4 py-1.5 rounded-[7px] text-xs font-semibold transition-colors"
                        style={mode === 'stocks' ? { background: T.ink, color: '#fff' } : { color: '#5a6376' }}
                    >Stocks</button>
                    <button
                        onClick={() => { setMode('sectors'); setPinnedName(null); }}
                        className="px-4 py-1.5 rounded-[7px] text-xs font-semibold transition-colors"
                        style={mode === 'sectors' ? { background: T.ink, color: '#fff' } : { color: '#5a6376' }}
                    >Groups</button>
                </div>

                {mode === 'sectors' && (
                    <UniSelect value={levelField} onChange={v => { setLevelField(v as any); setPinnedName(null); }}>
                        <option value="grp">Industry Group</option>
                        <option value="sec">Sector</option>
                        <option value="ind">Industry</option>
                        <option value="sub">Sub Industry</option>
                    </UniSelect>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                    {zoneChip('all', 'ALL', live.length, T.ink, '#f2f4f8')}
                    {zoneChip('elite', 'STRONG', zoneCounts.elite, T.strong, T.strongBg)}
                    {zoneChip('strong', 'IMPROVE', zoneCounts.strong, T.improve, T.improveBg)}
                    {zoneChip('mid', 'NEUTRAL', zoneCounts.mid, T.neutral, T.neutralBg)}
                    {zoneChip('weak', 'WEAK', zoneCounts.weak, T.weak, T.weakBg)}
                </div>

                <div className="flex-1 hidden md:block" />
                <span className="text-[11.5px] hidden lg:inline" style={{ color: T.accentText }}>X = RS today · Y = weekly change</span>

                <span className="text-[11px] font-semibold" style={{ color: T.muted }}>Aa:</span>
                {(['hide', 'S', 'M', 'L'] as LabelDensity[]).map(d => (
                    <Chip key={d} active={labelDensity === d} onClick={() => setLabelDensity(d)}>
                        {d === 'hide' ? 'Hide' : d}
                    </Chip>
                ))}

                <button
                    onClick={triggerReplay}
                    disabled={isReplaying}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[9px] text-xs font-semibold transition-colors"
                    style={{ background: T.ink, color: '#fff', opacity: isReplaying ? 0.6 : 1 }}
                >
                    {isReplaying ? 'Replaying...' : '▶ Replay this week'}
                </button>
            </div>

            {/* Scatter Plot Chart */}
            <div className="p-2 bg-white relative">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 'min(58vh, 520px)' }}>
                    <defs>
                        <filter id="mapShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="1.2" stdDeviation="1.6" floodColor="#0f1420" floodOpacity="0.28" />
                        </filter>
                    </defs>

                    {/* Zone bands — match category thresholds 90 / 80 / 70 */}
                    <rect x={sx(90)} y={pad.t} width={sx(100) - sx(90)} height={iH} fill={T.strongBg} opacity="0.45" />
                    <rect x={sx(80)} y={pad.t} width={sx(90) - sx(80)} height={iH} fill={T.improveBg} opacity="0.35" />
                    <rect x={sx(70)} y={pad.t} width={sx(80) - sx(70)} height={iH} fill={T.neutralBg} opacity="0.35" />
                    <rect x={sx(0)} y={pad.t} width={sx(70) - sx(0)} height={iH} fill={T.weakBg} opacity="0.35" />

                    {/* Grid Lines */}
                    {[0, 20, 40, 60, 80, 100].map(v => (
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

                    <line x1={pad.l} y1={sy(0)} x2={sx(xMax)} y2={sy(0)} stroke="#9ca3af" strokeWidth="1.2" strokeDasharray="3,3" />

                    <text x={sx(35)} y={pad.t + 16} textAnchor="middle" style={{ fontSize: '10px', fontWeight: 800, fill: T.weak, letterSpacing: '1px' }}>WEAK</text>
                    <text x={sx(75)} y={pad.t + 16} textAnchor="middle" style={{ fontSize: '10px', fontWeight: 800, fill: T.neutral, letterSpacing: '1px' }}>NEUTRAL</text>
                    <text x={sx(85)} y={pad.t + 16} textAnchor="middle" style={{ fontSize: '10px', fontWeight: 800, fill: T.improve, letterSpacing: '1px' }}>IMPROVE</text>
                    <text x={sx(95)} y={pad.t + 16} textAnchor="middle" style={{ fontSize: '10px', fontWeight: 800, fill: T.strong, letterSpacing: '1px' }}>STRONG</text>

                    {(() => {
                        const total = filtered.length;
                        const labels: { x: number; y: number; text: string; strong: boolean; anchor: 'start' | 'end'; fs: number }[] = [];

                        const rendered = filtered.map((p, idx) => {
                            const zone = getZone(p.rs);
                            const isActive = activeName === p.name;
                            const dim = activeName !== null && !isActive;
                            const cx = sx(p.rs), cy = sy(p.delta);
                            const r = p.isGroup ? 9 : (isActive ? 7.5 : 5);

                            // Fading movement line while replay animates
                            const showMoveLine = isReplaying && animationProgress < 1 && p.startRS !== p.endRS;
                            const moveColor = p.endRS >= p.startRS ? T.strong : T.weak;

                            if ((!dim && (p.isGroup || (labelDensity !== 'hide' && shouldShowLabel(p, idx, total)))) || isActive) {
                                const fs = (isActive || p.isGroup ? 10.5 : 9.5);
                                const flip = cx + r + 4 + p.name.length * fs * 0.58 > sx(xMax) - 4;
                                labels.push({ x: flip ? cx - r - 4 : cx + r + 4, y: Math.max(pad.t + 14, Math.min(sy(yMin) - 4, cy + 4)), text: p.name, strong: isActive || p.isGroup, anchor: flip ? 'end' : 'start', fs });
                            }

                            return (
                                <g key={p.name}>
                                    {showMoveLine && (
                                        <line x1={sx(p.startRS)} y1={sy(p.startDelta)} x2={cx} y2={cy} stroke={moveColor} strokeWidth="1.5" opacity="0.3" />
                                    )}
                                    <circle
                                        cx={cx} cy={cy} r={r}
                                        fill={zone.color} fillOpacity={dim ? 0.15 : 0.92}
                                        stroke="#fff" strokeWidth={1.8}
                                        filter={(p.isGroup || isActive) && !dim ? 'url(#mapShadow)' : undefined}
                                        style={{ cursor: 'pointer' }}
                                        onMouseEnter={() => setHoverName(p.name)}
                                        onMouseLeave={() => setHoverName(null)}
                                        onClick={() => togglePin(p.name)}
                                    />
                                </g>
                            );
                        });

                        const kept: typeof labels = [];
                        labels.sort((a, b) => a.y - b.y || a.x - b.x);
                        labels.forEach(L => {
                            if (L.strong || !kept.some(K => Math.abs(K.y - L.y) < 12 && Math.abs(K.x - L.x) < 95)) kept.push(L);
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

                {/* Floating detail card near active point */}
                {activePoint && (() => {
                    const leftPct = (sx(activePoint.rs) / W) * 100;
                    const topPct = (sy(activePoint.delta) / H) * 100;
                    const flip = leftPct > 68;
                    return (
                        <div
                            className="absolute z-10 rounded-[10px] p-3 bg-white shadow-lg pointer-events-none"
                            style={{
                                border: `1px solid ${T.border}`,
                                width: 220,
                                left: flip ? undefined : `calc(${leftPct}% + 16px)`,
                                right: flip ? `calc(${100 - leftPct}% + 16px)` : undefined,
                                top: `max(6px, calc(${topPct}% - 20px))`,
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] font-extrabold" style={{ color: T.ink }}>
                                    {activePoint.label}{activePoint.isGroup ? '' : ` · ${activePoint.name}`}
                                </span>
                                {pinnedName === activePoint.name && !hoverName && (
                                    <button onClick={() => setPinnedName(null)} className="pointer-events-auto text-[10px]" style={{ color: T.muted }}>✕</button>
                                )}
                            </div>
                            <div className="text-[11.5px] mt-1" style={{ color: '#3a4256' }}>
                                RS <b style={{ color: getZone(activePoint.rs).color }}>{activePoint.rs}</b> · {activePoint.cat} · Δ1W {activePoint.endRS - activePoint.startRS >= 0 ? '+' : ''}{activePoint.endRS - activePoint.startRS}
                            </div>
                            <div className="text-[10.5px] mt-1" style={{ color: T.muted }}>RS Zone: {getZone(activePoint.rs).label}</div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}