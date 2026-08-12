'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { StockData, getCatColor, getCatText } from './types';
import { FONT_SERIF, FONT_MONO } from './paperTheme';
import { Stamp } from './PaperUI';
import { useRsHubTheme } from './RsHubThemeContext';
import { categoryFromRs, getCategoryMovement, rsRose } from './matrixHelpers';

type Theme = 'strong' | 'improve' | 'neutral' | 'weak';

const CATMETA: { cat: string; range: string; theme: Theme }[] = [
    { cat: 'STRONG', range: '≥90', theme: 'strong' },
    { cat: 'IMPROVE', range: '80–89', theme: 'improve' },
    { cat: 'NEUTRAL', range: '70–79', theme: 'neutral' },
    { cat: 'WEAK', range: '<70', theme: 'weak' },
];

function themeStyles(paper: ReturnType<typeof useRsHubTheme>['paper']) {
    return {
        strong: { bg: paper.strongBg, text: paper.strong, border: paper.strongBorder, dot: paper.strong },
        improve: { bg: paper.improveBg, text: paper.improve, border: paper.improveBorder, dot: paper.improve },
        neutral: { bg: paper.neutralBg, text: paper.neutral, border: paper.neutralBorder, dot: paper.neutral },
        weak: { bg: paper.weakBg, text: paper.weak, border: paper.weakBorder, dot: paper.weak },
    };
}

type ThemeStyleMap = ReturnType<typeof themeStyles>;

export function MatrixTab({ stocks }: { stocks: StockData[] }) {
    const { paper: PAPER } = useRsHubTheme();
    const THEME_STYLES = useMemo(() => themeStyles(PAPER), [PAPER]);
    const [viewMode, setViewMode] = useState<'cards' | 'quad'>('cards');
    const [selectedStock, setSelectedStock] = useState<StockData | null>(null);

    useEffect(() => {
        setSelectedStock(null);
    }, [viewMode]);

    const groups = useMemo(() => ({
        STRONG: stocks.filter(s => s.cat === 'STRONG').sort((a, b) => b.rs - a.rs),
        IMPROVE: stocks.filter(s => s.cat === 'IMPROVE').sort((a, b) => b.rs - a.rs),
        NEUTRAL: stocks.filter(s => s.cat === 'NEUTRAL').sort((a, b) => b.rs - a.rs),
        WEAK: stocks.filter(s => s.cat === 'WEAK').sort((a, b) => b.rs - a.rs),
    }), [stocks]);

    const topGroup = (cat: string) => {
        const m: Record<string, number> = {};
        (groups[cat as keyof typeof groups] || []).forEach(x => {
            m[x.grp] = (m[x.grp] || 0) + 1;
        });
        const e = Object.entries(m).sort((a, b) => b[1] - a[1])[0];
        return e ? `${e[0]} (${e[1]})` : '—';
    };

    const stats = useMemo(() => {
        const total = stocks.length || 1;
        return {
            STRONG: { count: groups.STRONG.length, pct: ((groups.STRONG.length / total) * 100).toFixed(1) },
            IMPROVE: { count: groups.IMPROVE.length, pct: ((groups.IMPROVE.length / total) * 100).toFixed(1) },
            NEUTRAL: { count: groups.NEUTRAL.length, pct: ((groups.NEUTRAL.length / total) * 100).toFixed(1) },
            WEAK: { count: groups.WEAK.length, pct: ((groups.WEAK.length / total) * 100).toFixed(1) },
        };
    }, [stocks, groups]);

    return (
        <div
            className="binder-rail rounded-[4px] overflow-hidden"
            style={{ background: PAPER.paperLight, border: `1px solid ${PAPER.cardBorder}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
            <div className="flex items-center gap-4 p-4 dashed-divider flex-wrap">
                <div className="flex items-center gap-2">
                    <Stamp active={viewMode === 'cards'} onClick={() => setViewMode('cards')}>Cards</Stamp>
                    <Stamp active={viewMode === 'quad'} onClick={() => setViewMode('quad')} tiltRight>Quadrant</Stamp>
                </div>
                <div className="flex-1" />
                <span className="text-xs italic" style={{ color: PAPER.inkMuted }}>
                    {viewMode === 'quad' ? 'Click a stock for details · ↑↓ = category change' : 'From WEAK/NEUTRAL… badges = category moves'}
                </span>
            </div>

            {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
                    {CATMETA.map(({ cat, range, theme }) => (
                        <MatrixCard
                            key={cat}
                            paper={PAPER}
                            themeStyles={THEME_STYLES}
                            title={cat}
                            subtitle={`Top group: ${topGroup(cat)}`}
                            range={range}
                            list={groups[cat as keyof typeof groups]}
                            stats={stats[cat as keyof typeof stats]}
                            theme={theme}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col xl:flex-row gap-3 p-4 min-h-[500px]">
                    <div className="grid grid-cols-2 gap-2 flex-1 min-w-0">
                        <QuadCell
                            paper={PAPER}
                            themeStyles={THEME_STYLES}
                            title={`NEUTRAL · ${stats.NEUTRAL.count} · ${stats.NEUTRAL.pct}%`}
                            list={groups.NEUTRAL}
                            theme="neutral"
                            selectedSymbol={selectedStock?.s}
                            onSelect={setSelectedStock}
                        />
                        <QuadCell
                            paper={PAPER}
                            themeStyles={THEME_STYLES}
                            title={`STRONG · ${stats.STRONG.count} · ${stats.STRONG.pct}%`}
                            list={groups.STRONG}
                            theme="strong"
                            selectedSymbol={selectedStock?.s}
                            onSelect={setSelectedStock}
                        />
                        <QuadCell
                            paper={PAPER}
                            themeStyles={THEME_STYLES}
                            title={`WEAK · ${stats.WEAK.count} · ${stats.WEAK.pct}%`}
                            list={groups.WEAK.slice(0, 120)}
                            theme="weak"
                            selectedSymbol={selectedStock?.s}
                            onSelect={setSelectedStock}
                        />
                        <QuadCell
                            paper={PAPER}
                            themeStyles={THEME_STYLES}
                            title={`IMPROVE · ${stats.IMPROVE.count} · ${stats.IMPROVE.pct}%`}
                            list={groups.IMPROVE}
                            theme="improve"
                            selectedSymbol={selectedStock?.s}
                            onSelect={setSelectedStock}
                        />
                    </div>
                    {selectedStock ? (
                        <MatrixStockDetail
                            stock={selectedStock}
                            paper={PAPER}
                            onClose={() => setSelectedStock(null)}
                        />
                    ) : (
                        <div
                            className="hidden xl:flex xl:w-[280px] shrink-0 items-center justify-center rounded-[3px] border border-dashed p-6 text-center text-xs italic"
                            style={{ borderColor: PAPER.cardBorder, color: PAPER.inkMuted, background: PAPER.paper }}
                        >
                            Select a stock in the quadrant to view details
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function CategoryMovementBadge({
    movement,
    paper,
    compact,
}: {
    movement: NonNullable<ReturnType<typeof getCategoryMovement>>;
    paper: ReturnType<typeof useRsHubTheme>['paper'];
    compact?: boolean;
}) {
    const up = movement.direction === 'up';
    const color = up ? paper.stampGreen : paper.stampRed;

    return (
        <span className="inline-flex items-center gap-0.5 shrink-0">
            <span
                className={`${compact ? 'text-[8px] px-1 py-0.5' : 'text-[9px] px-1.5 py-0.5'} rounded font-bold uppercase whitespace-nowrap`}
                style={{ background: color, color: paper.paperLight, fontFamily: FONT_SERIF }}
            >
                From {movement.from}
            </span>
            <span className={`${compact ? 'text-[10px]' : 'text-sm'} font-bold`} style={{ color }}>
                {up ? '↑' : '↓'}
            </span>
        </span>
    );
}

function MatrixCard({ paper, themeStyles, title, subtitle, range, list, stats, theme }: {
    paper: ReturnType<typeof useRsHubTheme>['paper'];
    themeStyles: ThemeStyleMap;
    title: string; subtitle: string; range: string;
    list: StockData[]; stats: { count: number; pct: string }; theme: Theme;
}) {
    const s = themeStyles[theme];

    return (
        <div className="rounded-[3px] flex flex-col overflow-hidden" style={{ border: `1px solid ${s.border}` }}>
            <div className="p-3 relative overflow-hidden" style={{ background: s.bg, borderBottom: `1px dashed ${s.border}` }}>
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: s.text }} />
                <div className="flex items-baseline justify-between">
                    <span className="font-extrabold text-sm tracking-wide" style={{ color: s.text, fontFamily: FONT_SERIF }}>{title}</span>
                    <span className="emboss text-lg" style={{ color: s.text }}>{stats.count}</span>
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: paper.inkMuted, fontFamily: FONT_MONO }}>{range} · {stats.pct}%</div>
            </div>
            <div className="px-3 py-2 dashed-divider text-[10.5px] italic" style={{ color: paper.inkMuted }}>
                🏆 {subtitle}
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-ledger max-h-[330px]" style={{ background: paper.paperLight }}>
                {list.map(st => {
                    const movement = getCategoryMovement(st);
                    const rose = rsRose(st);
                    return (
                        <div
                            key={st.s}
                            className="flex items-center gap-2 px-3 py-2 dashed-divider transition-opacity text-xs font-semibold"
                            style={{ background: movement?.direction === 'up' ? `${paper.strongBg}` : movement?.direction === 'down' ? `${paper.weakBg}` : undefined }}
                        >
                            <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: s.dot }} />
                            <span
                                className="truncate flex-1 min-w-0 flex items-center gap-1"
                                style={{
                                    color: movement?.direction === 'up' ? paper.stampGreen : movement?.direction === 'down' ? paper.stampRed : paper.ink,
                                    fontFamily: FONT_SERIF,
                                }}
                            >
                                <span className="truncate">{st.c}</span>
                                {!movement && rose && (
                                    <span className="text-[10px] font-bold shrink-0" style={{ color: paper.stampGreen }} title={`RS was ${st.rs1w}`}>↑</span>
                                )}
                            </span>
                            {movement && <CategoryMovementBadge movement={movement} paper={paper} />}
                            {st.sig?.includes('blue') && <span className="text-[9px] shrink-0">🔵</span>}
                            <span className="emboss shrink-0 px-1.5 py-0.5 rounded-sm" style={{ background: paper.brassLight }}>{st.rs}</span>
                        </div>
                    );
                })}
                {list.length === 0 && <div className="p-4 text-xs text-center italic" style={{ color: paper.inkMuted }}>No stocks</div>}
            </div>
        </div>
    );
}

function QuadCell({
    paper, themeStyles, title, list, theme, selectedSymbol, onSelect,
}: {
    paper: ReturnType<typeof useRsHubTheme>['paper'];
    themeStyles: ThemeStyleMap;
    title: string;
    list: StockData[];
    theme: Theme;
    selectedSymbol?: string;
    onSelect: (st: StockData) => void;
}) {
    const s = themeStyles[theme];

    return (
        <div className="rounded-[3px] p-4 min-h-[230px] flex flex-col relative overflow-hidden" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-[2.5rem] font-black uppercase opacity-[0.07]"
                style={{ color: s.text, fontFamily: FONT_SERIF }}
            >
                {theme.toUpperCase()}
            </div>
            <h3 className="font-extrabold text-xs tracking-wider mb-3 relative z-[1]" style={{ color: s.text, fontFamily: FONT_SERIF }}>{title}</h3>
            <div className="flex flex-wrap gap-1.5 overflow-y-auto scrollbar-ledger content-start flex-1 relative z-[1]">
                {list.map(st => {
                    const movement = getCategoryMovement(st);
                    const isSel = selectedSymbol === st.s;
                    const nameColor = movement?.direction === 'up'
                        ? paper.stampGreen
                        : movement?.direction === 'down'
                            ? paper.stampRed
                            : paper.ink;

                    return (
                        <button
                            key={st.s}
                            type="button"
                            onClick={() => onSelect(st)}
                            className="emboss rounded-sm px-2 py-1 text-[10.5px] flex items-center gap-1 cursor-pointer transition-all hover:scale-105 hover:shadow-md max-w-[160px]"
                            style={{
                                background: isSel ? paper.paperLight : paper.paperLight,
                                border: `1px solid ${isSel ? paper.improve : s.border}`,
                                boxShadow: isSel ? `0 0 0 2px ${paper.improve}33` : '0 1px 2px rgba(0,0,0,0.06)',
                                color: nameColor,
                                fontFamily: FONT_SERIF,
                                fontWeight: 600,
                            }}
                        >
                            <span className="truncate">{st.c}</span>
                            {movement && (
                                <span className="text-[11px] font-bold shrink-0">
                                    {movement.direction === 'up' ? '↑' : '↓'}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function MatrixStockDetail({
    stock,
    paper,
    onClose,
}: {
    stock: StockData;
    paper: ReturnType<typeof useRsHubTheme>['paper'];
    onClose: () => void;
}) {
    const movement = getCategoryMovement(stock);
    const d1w = stock.rs - stock.rs1w;
    const prevCat = categoryFromRs(stock.rs1w);

    return (
        <div
            className="w-full xl:w-[300px] shrink-0 rounded-[4px] overflow-hidden flex flex-col max-h-[520px] xl:sticky xl:top-4"
            style={{ background: paper.paperLight, border: `1px solid ${paper.cardBorder}`, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
            <div className="flex items-start justify-between gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${paper.cardBorder}`, background: paper.brassLight }}>
                <div className="min-w-0">
                    <div className="text-sm font-bold truncate" style={{ fontFamily: FONT_SERIF, color: paper.ink }}>{stock.c}</div>
                    <div className="text-[11px] font-mono" style={{ color: paper.inkMuted }}>{stock.s}</div>
                </div>
                <button type="button" onClick={onClose} className="text-lg leading-none px-1" style={{ color: paper.inkMuted }} aria-label="Close">×</button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto scrollbar-ledger text-xs">
                <div className="grid grid-cols-2 gap-2">
                    <DetailCell paper={paper} label="RS Rating" value={String(stock.rs)} accent={getCatText(stock.cat, paper)} />
                    <DetailCell
                        paper={paper}
                        label="Δ 1W"
                        value={stock.rs1w != null ? `${d1w >= 0 ? '+' : ''}${d1w}` : '—'}
                        accent={d1w >= 0 ? paper.stampGreen : paper.stampRed}
                    />
                    <DetailCell paper={paper} label="Category" value={stock.cat} accent={getCatText(stock.cat, paper)} />
                    <DetailCell paper={paper} label="1W RS was" value={stock.rs1w != null ? String(stock.rs1w) : '—'} />
                </div>

                {movement && (
                    <div
                        className="rounded-[3px] px-3 py-2 flex items-center gap-2"
                        style={{ background: movement.direction === 'up' ? paper.strongBg : paper.weakBg, border: `1px solid ${movement.direction === 'up' ? paper.strongBorder : paper.weakBorder}` }}
                    >
                        <span className="text-base">★</span>
                        <div>
                            <div className="font-bold" style={{ color: movement.direction === 'up' ? paper.stampGreen : paper.stampRed, fontFamily: FONT_SERIF }}>
                                Moved from {movement.from}
                            </div>
                            <div style={{ color: paper.inkMuted }}>Was {prevCat} · now {stock.cat}</div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-4 gap-1.5 text-center">
                    {(['m1', 'm3', 'm6', 'm12'] as const).map(k => (
                        <div key={k} className="rounded-[3px] py-1.5" style={{ background: paper.paper, border: `1px solid ${paper.cardBorder}` }}>
                            <div className="text-[8px] uppercase" style={{ color: paper.inkMuted }}>{k === 'm1' ? '1M' : k === 'm3' ? '3M' : k === 'm6' ? '6M' : '12M'}</div>
                            <div className="font-bold emboss">{stock[k]}</div>
                        </div>
                    ))}
                </div>

                {(stock.sig?.length ?? 0) > 0 && (
                    <div>
                        <div className="text-[9px] uppercase mb-1.5" style={{ color: paper.inkMuted, fontFamily: FONT_SERIF }}>Signals</div>
                        <div className="flex flex-wrap gap-1">
                            {stock.sig.map(sig => (
                                <span
                                    key={sig}
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm"
                                    style={{ ...getCatColor(stock.cat, paper), border: `1px solid ${getCatColor(stock.cat, paper).borderColor}` }}
                                >
                                    {sig}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="text-[10px]" style={{ color: paper.inkMuted }}>
                    {stock.grp || stock.sec || '—'}
                </div>

                <Link
                    href={`/stocks/${stock.s}/financials`}
                    className="block text-center py-2 rounded-[3px] text-[11px] font-bold"
                    style={{ background: paper.improve, color: paper.paperLight, fontFamily: FONT_SERIF }}
                >
                    Open stock →
                </Link>
            </div>
        </div>
    );
}

function DetailCell({
    paper, label, value, accent,
}: {
    paper: ReturnType<typeof useRsHubTheme>['paper'];
    label: string;
    value: string;
    accent?: string;
}) {
    return (
        <div className="rounded-[3px] p-2" style={{ background: paper.paper, border: `1px solid ${paper.cardBorder}` }}>
            <div className="text-[8px] uppercase mb-0.5" style={{ color: paper.inkMuted, fontFamily: FONT_SERIF }}>{label}</div>
            <div className="font-bold emboss" style={{ color: accent ?? paper.ink }}>{value}</div>
        </div>
    );
}
