'use client';

import { useMemo, useState, useCallback } from 'react';
import { StockData, getCatText } from './types';
import { FONT_SERIF, FONT_MONO, type PaperTokens } from './paperTheme';
import { useRsHubTheme } from './RsHubThemeContext';

interface EventGroupDef {
    title: string;
    filterFn: (s: StockData) => boolean;
    color: string;
    bg: string;
    border: string;
}

function buildEventGroups(paper: PaperTokens): EventGroupDef[] {
    return [
        {
            title: 'Crossed above 90',
            filterFn: (s) => s.rs >= 90 && s.rs1w != null && s.rs1w < 90,
            color: paper.strong, bg: paper.strongBg, border: paper.strongBorder,
        },
        {
            title: 'Crossed above 80',
            filterFn: (s) => s.rs >= 80 && s.rs < 90 && s.rs1w != null && s.rs1w < 80,
            color: '#3F7A6A', bg: paper.improveBg, border: paper.improveBorder,
        },
        {
            title: 'RS at 1-year high',
            filterFn: (s) => !!(s.rsnh ?? s.sig?.includes('rsnh')),
            color: paper.neutral, bg: paper.neutralBg, border: paper.neutralBorder,
        },
        {
            title: 'RS line led price',
            filterFn: (s) => s.sig?.includes('blue') ?? false,
            color: paper.improve, bg: paper.improveBg, border: paper.improveBorder,
        },
        {
            title: 'Focus list',
            filterFn: (s) => !!(s.focus ?? s.sig?.includes('focus')),
            color: '#6B4C8A', bg: '#E7DFEE', border: '#B49BC9',
        },
        {
            title: 'Resilient in down tape',
            filterFn: (s) => !!(s.res ?? s.sig?.includes('res')),
            color: '#3F6B7A', bg: '#DEE7EA', border: '#93B4BE',
        },
        {
            title: 'Upgraded category',
            filterFn: (s) => s.sig?.includes('up') ?? false,
            color: paper.strong, bg: paper.strongBg, border: paper.strongBorder,
        },
        {
            title: 'Downgraded category',
            filterFn: (s) => s.sig?.includes('dn') ?? false,
            color: paper.weak, bg: paper.weakBg, border: paper.weakBorder,
        },
        {
            title: 'Leaders under distribution',
            filterFn: (s) => !!(s.dist ?? s.sig?.includes('dist')),
            color: '#8A3F52', bg: '#EDDDE1', border: '#C793A0',
        },
    ];
}

type TipState = { label: string; x: number; y: number } | null;

function Tip({
    label,
    children,
    onShow,
    onHide,
}: {
    label: string;
    children: React.ReactNode;
    onShow: (label: string, rect: DOMRect) => void;
    onHide: () => void;
}) {
    return (
        <span
            className="inline-flex cursor-help"
            onMouseEnter={(e) => onShow(label, e.currentTarget.getBoundingClientRect())}
            onMouseLeave={onHide}
        >
            {children}
        </span>
    );
}

export function EventsTab({ stocks }: { stocks: StockData[] }) {
    const { paper: PAPER } = useRsHubTheme();
    const eventGroupsDef = useMemo(() => buildEventGroups(PAPER), [PAPER]);
    const [tip, setTip] = useState<TipState>(null);

    const showTip = useCallback((label: string, rect: DOMRect) => {
        setTip({
            label,
            x: rect.left + rect.width / 2,
            y: rect.top - 8,
        });
    }, []);

    const hideTip = useCallback(() => setTip(null), []);

    const eventData = useMemo(() => {
        return eventGroupsDef.map(g => ({
            title: g.title,
            color: g.color,
            bg: g.bg,
            border: g.border,
            items: stocks.filter(g.filterFn).sort((a, b) => b.rs - a.rs),
        })).filter(g => g.items.length > 0);
    }, [stocks, eventGroupsDef]);

    const totalEvents = eventData.reduce((sum, g) => sum + g.items.length, 0);

    return (
        <div
            className="binder-rail rounded-[4px] overflow-hidden"
            style={{ background: PAPER.paperLight, border: `1px solid ${PAPER.cardBorder}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
            <div className="flex items-center gap-3 p-4 dashed-divider">
                <span className="font-extrabold text-sm" style={{ fontFamily: FONT_SERIF, color: PAPER.ink }}>RS Events</span>
                <span className="text-xs italic" style={{ color: PAPER.inkMuted }}>Everything that changed this week</span>
                <div className="flex-1" />
                <span className="text-xs" style={{ color: PAPER.inkMuted, fontFamily: FONT_MONO }}>{totalEvents} events</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
                {eventData.map(group => (
                    <div key={group.title} className="rounded-[3px] overflow-hidden" style={{ border: `1px solid ${group.border}` }}>
                        <div className="px-3 py-2.5" style={{ background: group.bg, borderBottom: `1px dashed ${group.border}` }}>
                            <div className="flex items-baseline justify-between">
                                <span className="font-bold text-xs tracking-wide" style={{ color: group.color, fontFamily: FONT_SERIF }}>{group.title}</span>
                                <span className="emboss text-sm" style={{ color: group.color }}>{group.items.length}</span>
                            </div>
                        </div>
                        <div className="max-h-[260px] overflow-y-auto scrollbar-ledger min-h-[60px] flex flex-col justify-center" style={{ background: PAPER.paperLight }}>
                            {group.items.map(st => (
                                <div key={st.s} className="flex items-center gap-2 px-3 py-2 dashed-divider hover:opacity-90 transition-opacity text-xs">
                                    <span className="font-bold w-12" style={{ fontFamily: FONT_MONO, color: PAPER.ink }}>{st.s}</span>
                                    <span className="truncate flex-1" style={{ color: PAPER.inkMuted }}>{st.c}</span>
                                    <Tip
                                        label={`Current RS: ${st.rs}`}
                                        onShow={showTip}
                                        onHide={hideTip}
                                    >
                                        <span className="emboss" style={{ color: getCatText(st.cat, PAPER) }}>{st.rs}</span>
                                    </Tip>
                                    <Tip
                                        label={
                                            st.rs1w != null
                                                ? `Weekly change: ${st.mom >= 0 ? '+' : ''}${st.mom} (${st.rs1w} → ${st.rs})`
                                                : `Weekly change: ${st.mom >= 0 ? '+' : ''}${st.mom}`
                                        }
                                        onShow={showTip}
                                        onHide={hideTip}
                                    >
                                        <span
                                            className="text-[10px] font-semibold"
                                            style={{ fontFamily: FONT_MONO, color: st.mom >= 0 ? PAPER.stampGreen : PAPER.stampRed }}
                                        >
                                            {st.mom >= 0 ? '+' : ''}{st.mom}
                                        </span>
                                    </Tip>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {eventData.length === 0 && (
                    <div className="col-span-full text-center py-12 text-sm italic" style={{ color: PAPER.inkMuted }}>
                        No significant RS events this week.
                    </div>
                )}
            </div>

            {tip && (
                <div
                    className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-full rounded px-2 py-1 text-[10px] font-medium whitespace-nowrap"
                    style={{
                        left: tip.x,
                        top: tip.y,
                        background: PAPER.ink,
                        color: PAPER.paperLight,
                        fontFamily: FONT_SERIF,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                    }}
                >
                    {tip.label}
                </div>
            )}
        </div>
    );
}
