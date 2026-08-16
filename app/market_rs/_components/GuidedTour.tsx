'use client';

import { useState, useEffect, useCallback } from 'react';
import { TabId } from './types';
import { PAPER, FONT_SERIF, FONT_MONO } from './paperTheme';

export interface TourStep {
    sel: string | null;
    tab: TabId;
    t: string;
    b: string;
    try?: string;
}

const TOUR: TourStep[] = [
    {
        sel: ".strip-card-container",
        tab: "rankings",
        t: "Start here: the state of the market",
        b: "Four tiers, recalculated every day. Right now <b>11 stocks are STRONG</b> (RS 90+), 24 improving, and <b>188 are weak</b>. That last number is the point — in this market, leadership is narrow.",
        try: "Click any tier to filter the table to it."
    },
    {
        sel: ".insights-container",
        tab: "rankings",
        t: "The market's story, written for you",
        b: "These chips are generated from today's data: the fastest riser, stocks that just entered STRONG, the focus list, and leadership breadth — the share of stocks above RS 70 and whether that's widening or narrowing week over week.",
        try: "Every chip is clickable — it filters the table to exactly what it describes."
    },
    {
        sel: "#rkSearch",
        tab: "rankings",
        t: "The table: sort by anything",
        b: "<b>MIS at 99</b> leads the market, then GIG 98 and KEC 96. Every column sorts — symbol, rating, weekly change, each of the five period ranks, trend age, signals, classification.",
        try: "Click the Δ1W header twice to see this week's biggest losers."
    },
    {
        sel: "#lvlSel",
        tab: "rankings",
        t: "Four levels of classification",
        b: "Switch the grouping column between <b>Sector</b> (11), <b>Industry Group</b> (23), <b>Industry</b> (52) and <b>Sub-Industry</b> (83) — the same choice exists in Rotation and the Map.",
        try: "Pick Sub Industry, then sort by that column to cluster the market by niche."
    },
    {
        sel: ".detail-panel-container",
        tab: "rankings",
        t: "Click a stock: the full read",
        b: "Where it sits versus the entire market, the wizard checks (alignment score, the 10-session light, how long it has held above 70), its five period ranks, and a plain-English expert read. Optional: the full daily rating history back to 2007.",
        try: "Use ↑ ↓ to move between stocks, W to watchlist, C to compare up to three."
    },
    {
        sel: ".tab-switcher-container",
        tab: "matrix",
        t: "Matrix: the market split by tier",
        b: "The same universe arranged by strength tier, showing who was promoted and who was demoted this week — the cleanest way to see rotation between tiers at a glance.",
        try: "Switch between Cards and Quadrant views in the toolbar."
    },
    {
        sel: "#rotSvg",
        tab: "rotation",
        t: "Rotation: where money is moving",
        b: "Horizontal = strength today. Vertical = whether that strength is accelerating. The trail is the journey; the arrow is the heading. <b>Top-right is Leading</b>, top-left is Improving — money usually travels counter-clockwise.",
        try: "Hover any dot to see its journey. Press Play to animate the whole market."
    },
    {
        sel: "#rotShow",
        tab: "rotation",
        t: "Filter the noise, pick the period",
        b: "Show the top 8 groups, all groups, elite RS 90+ stocks, the top 20, or just your watchlist — at any classification level. Period runs from a year down to a single week, or a custom from→to range.",
        try: "Try 'Elite Stocks RS 90+' with the 4W period and Smart Zoom on."
    },
    {
        sel: "#mapSvg",
        tab: "map",
        t: "RS Map: the whole market on one line",
        b: "Every stock placed on the strength gradient, height showing this week's move. Blue rings mark stocks whose strength line hit a new high before price did — the classic pre-breakout tell.",
        try: "Press 'Replay this week' and watch the market move."
    },
    {
        sel: "#zoneCnt",
        tab: "map",
        t: "Zone filters",
        b: "Tap any zone to isolate it — STRONG alone shows you the leadership, WEAK alone shows what to avoid. Counts always reflect the full universe so you never lose context.",
        try: "Switch Stocks → Groups to map sectors instead of individual names."
    },
    {
        sel: "#evBody",
        tab: "events",
        t: "Events: everything that changed",
        b: "Your Monday-morning page. Crossings above 90 and 80, new yearly highs, strength-leads-price flags, the focus list, resilient names, upgrades, downgrades, and leaders under distribution — grouped and counted.",
        try: "Click any row to jump straight to that stock in Rankings."
    },
    {
        sel: null,
        tab: "rankings",
        t: "That's the tool",
        b: "Built on the official O'Neil formula, computed from 24 years of adjusted prices, validated at 0.962 against the reference tool, and documented formula by formula. <b>Feedback welcome — anything that feels off, flag it.</b>",
        try: "Run the walkthrough again anytime from the button in the corner."
    }
];

export function GuidedTour({ onSwitchTab }: { onSwitchTab: (tab: TabId) => void }) {
    const [active, setActive] = useState(false);
    const [stepIdx, setStepIdx] = useState(0);
    const [spotRect, setSpotRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const [cardPos, setCardPos] = useState<{ top: number; left: number }>({ top: 100, left: 100 });

    const step = TOUR[stepIdx];

    const updatePosition = useCallback((s: TourStep) => {
        if (!s) return;
        const el = s.sel ? document.querySelector(s.sel) : null;
        if (el) {
            const r = el.getBoundingClientRect();
            if (r.height > 4) {
                const pad = 6;
                setSpotRect({
                    top: Math.max(0, r.top - pad),
                    left: Math.max(0, r.left - pad),
                    width: r.width + pad * 2,
                    height: Math.min(r.height, window.innerHeight * 0.6) + pad * 2,
                });
                const cardH = 260;
                const cardW = 380;
                const below = r.bottom + 16;
                const top = (below + cardH < window.innerHeight - 10) ? below : Math.max(12, r.top - cardH - 16);
                const left = Math.min(Math.max(12, r.left), window.innerWidth - cardW - 12);
                setCardPos({ top, left });
                return;
            }
        }
        setSpotRect(null);
        setCardPos({
            top: Math.max(20, window.innerHeight / 2 - 130),
            left: Math.max(20, window.innerWidth / 2 - 190),
        });
    }, []);

    const goToStep = useCallback((idx: number) => {
        const nextIdx = (idx + TOUR.length) % TOUR.length;
        setStepIdx(nextIdx);
        const s = TOUR[nextIdx];
        if (s.tab) onSwitchTab(s.tab);
        setActive(true);
        setTimeout(() => updatePosition(s), 80);
    }, [onSwitchTab, updatePosition]);

    const handleNext = () => {
        if (stepIdx === TOUR.length - 1) setActive(false);
        else goToStep(stepIdx + 1);
    };

    const handlePrev = () => {
        goToStep(stepIdx - 1);
    };

    const handleExit = () => {
        setActive(false);
    };

    useEffect(() => {
        if (!active) return;
        const onResize = () => updatePosition(TOUR[stepIdx]);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [active, stepIdx, updatePosition]);

    useEffect(() => {
        if (!active) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setActive(false);
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [active, stepIdx]);

    return (
        <>
            {/* Tour start floating trigger button */}
            {!active && (
                <button
                    type="button"
                    onClick={() => goToStep(0)}
                    className="fixed right-5 bottom-5 z-40 px-5 py-3 rounded-full text-xs font-bold shadow-lg transition-all transform hover:scale-105"
                    style={{
                        background: PAPER.ink,
                        color: PAPER.paperLight,
                        border: `1px solid ${PAPER.cardBorder}`,
                        fontFamily: FONT_SERIF,
                    }}
                >
                    ▶ Guided walkthrough
                </button>
            )}

            {/* Tour overlay backdrop */}
            {active && (
                <>
                    <div
                        className="fixed inset-0 z-[900]"
                        onClick={handleExit}
                        style={{ background: 'rgba(10, 14, 22, 0.62)', backdropFilter: 'blur(1.5px)' }}
                    />

                    {/* Highlight spot border */}
                    {spotRect && (
                        <div
                            className="fixed z-[901] pointer-events-none rounded-xl transition-all duration-300"
                            style={{
                                top: spotRect.top,
                                left: spotRect.left,
                                width: spotRect.width,
                                height: spotRect.height,
                                boxShadow: '0 0 0 4px #5fd08a, 0 0 0 9999px rgba(10, 14, 22, 0.62)',
                            }}
                        />
                    )}

                    {/* Step Card */}
                    <div
                        className="fixed z-[902] w-[min(400px,92vw)] p-5 rounded-2xl shadow-2xl transition-all duration-300"
                        style={{
                            top: cardPos.top,
                            left: cardPos.left,
                            background: PAPER.paperLight,
                            border: `1px solid ${PAPER.cardBorder}`,
                            fontFamily: FONT_SERIF,
                        }}
                    >
                        <div className="text-[10px] font-bold tracking-widest mb-1.5 uppercase" style={{ color: PAPER.strong, fontFamily: FONT_MONO }}>
                            STEP {stepIdx + 1} OF {TOUR.length}
                        </div>
                        <h4 className="text-base font-extrabold mb-2" style={{ color: PAPER.ink }}>
                            {step.t}
                        </h4>
                        <p
                            className="text-xs leading-relaxed mb-3"
                            style={{ color: PAPER.ink }}
                            dangerouslySetInnerHTML={{ __html: step.b }}
                        />
                        {step.try && (
                            <div className="p-2.5 rounded-md text-[11px] font-semibold mb-3 border-l-2" style={{ background: PAPER.strongBg, color: PAPER.strong, borderColor: PAPER.strong }}>
                                💡 Try it: {step.try}
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-4 pt-2" style={{ borderTop: `1px solid ${PAPER.cardBorder}` }}>
                            <button
                                type="button"
                                onClick={handlePrev}
                                className="px-3 py-1.5 rounded text-xs font-bold"
                                style={{ background: PAPER.paper, color: PAPER.ink, border: `1px solid ${PAPER.cardBorder}` }}
                            >
                                ‹ Back
                            </button>
                            <button
                                type="button"
                                onClick={handleNext}
                                className="px-4 py-1.5 rounded text-xs font-bold"
                                style={{ background: PAPER.ink, color: PAPER.paperLight }}
                            >
                                {stepIdx === TOUR.length - 1 ? 'Finish' : 'Next ›'}
                            </button>
                            <button
                                type="button"
                                onClick={handleExit}
                                className="ml-auto text-xs font-semibold hover:underline"
                                style={{ color: PAPER.inkMuted }}
                            >
                                Exit
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
