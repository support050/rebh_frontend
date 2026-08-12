'use client';

import type React from 'react';
import { FONT_SERIF, FONT_MONO, type PaperTokens } from './paperTheme';

/**
 * Mount once (top of the page tree). Light/dark surfaces + shared primitives.
 */
export function PaperGlobalStyles({ paper }: { paper: PaperTokens }) {
    return (
        <style jsx global>{`
            .paper-grain {
                background-color: ${paper.paper};
            }
            .paper-surface {
                background-color: ${paper.paperLight};
            }

            /* ---------- Binder rail: red rule + punched holes ---------- */
            .binder-rail { position: relative; padding-left: 30px; }
            .binder-rail::before {
                content: '';
                position: absolute;
                left: 15px; top: 6px; bottom: 6px; width: 1px;
                background: ${paper.marginRed};
                opacity: 0.4;
            }
            .binder-rail::after {
                content: '';
                position: absolute;
                left: 5px; top: 14px; bottom: 14px; width: 14px;
                background-image: radial-gradient(circle, ${paper.cardBorder} 0 3px, transparent 3.4px);
                background-size: 14px 28px;
                background-repeat: repeat-y;
            }

            /* ---------- Toggle / stamp buttons ---------- */
            .stamp {
                font-family: ${FONT_SERIF};
                text-transform: uppercase;
                letter-spacing: 0.05em;
                font-weight: 700;
                font-size: 11px;
                border: 1px solid ${paper.cardBorder};
                border-radius: 3px;
                background: ${paper.brassLight};
                color: ${paper.inkMuted};
                padding: 6px 13px;
                cursor: pointer;
                transition: color 0.12s ease, background 0.12s ease, border-color 0.12s ease;
                white-space: nowrap;
            }
            .stamp:hover { border-color: ${paper.marginRed}; color: ${paper.ink}; }
            .stamp.active {
                background: ${paper.paperLight};
                color: ${paper.stampRed};
                border-color: ${paper.stampRed};
                box-shadow: 0 1px 2px rgba(140,59,50,0.2);
            }
            .stamp.active.stamp-green { color: ${paper.stampGreen}; border-color: ${paper.stampGreen}; }

            /* ---------- Folder tabs ---------- */
            .folder-tabs { display: flex; align-items: flex-end; gap: 3px; }
            .folder-tab {
                font-family: ${FONT_SERIF};
                font-weight: 700;
                font-size: 12.5px;
                letter-spacing: 0.03em;
                padding: 9px 20px 8px;
                background: ${paper.brassLight};
                color: ${paper.inkMuted};
                clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
                cursor: pointer;
                border: none;
                transition: background 0.12s ease, color 0.12s ease;
            }
            .folder-tab:hover { color: ${paper.ink}; }
            .folder-tab.active {
                background: ${paper.paperLight};
                color: ${paper.ink};
                padding-top: 11px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.06);
                position: relative;
                z-index: 2;
            }

            /* ---------- Index card ---------- */
            .index-card {
                position: relative;
                background: ${paper.paperLight};
                border: 1px solid ${paper.cardBorder};
                border-radius: 3px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.06);
            }
            .index-card .tape {
                position: absolute;
                top: -8px; left: 14px; width: 44px; height: 15px;
                background: rgba(140,59,50,0.35);
                border: 1px solid rgba(140,59,50,0.25);
                transform: rotate(-4deg);
                box-shadow: 0 1px 2px rgba(0,0,0,0.06);
            }
            .index-label {
                font-family: ${FONT_SERIF};
                text-transform: uppercase;
                letter-spacing: 0.09em;
                font-size: 9.5px;
                color: ${paper.inkMuted};
                border-bottom: 1px dashed ${paper.cardBorder};
                padding-bottom: 4px;
                margin-bottom: 6px;
            }
            .emboss {
                font-family: ${FONT_MONO};
                font-weight: 800;
                color: ${paper.ink};
            }

            /* ---------- Ledger table ---------- */
            .ledger-table th {
                font-family: ${FONT_SERIF};
                text-transform: uppercase;
                letter-spacing: 0.08em;
                font-size: 9.5px;
                color: ${paper.inkMuted};
                background: ${paper.brassLight};
                border-bottom: 1px solid ${paper.cardBorder};
                font-weight: 700;
            }
            .ledger-table th.sort-active {
                background: ${paper.sortHighlight ?? paper.brassLight};
                color: ${paper.sortHighlightText ?? paper.ink};
                border-bottom: 2px solid ${paper.improve};
            }
            .ledger-table td {
                font-family: ${FONT_MONO};
                border-bottom: 1px solid ${paper.cardBorder};
                color: ${paper.ink};
            }
            .ledger-table tr.total-row td,
            .ledger-table tr.total-row th {
                background: ${paper.brassLight};
                font-weight: 800;
            }
            .ledger-table tbody tr:hover td { background: ${paper.rowHover ?? '#F9FAFB'}; }
            .ledger-table tr.selected td { background: ${paper.rowSelected ?? '#F3F4F6'}; }
            .num-negative { color: ${paper.stampRed}; }
            .num-positive { color: ${paper.stampGreen}; }

            /* ---------- Misc ---------- */
            .paper-input {
                font-family: ${FONT_SERIF};
                background: ${paper.paperLight};
                border: 1px solid ${paper.cardBorder};
                border-radius: 3px;
                color: ${paper.ink};
            }
            .paper-input:focus { outline: none; border-color: ${paper.brass}; }
            .paper-select {
                font-family: ${FONT_SERIF};
                background: ${paper.paperLight};
                border: 1px solid ${paper.cardBorder};
                border-radius: 3px;
                color: ${paper.ink};
                font-weight: 700;
            }
            .dashed-divider { border-bottom: 1px dashed ${paper.cardBorder}; }
            .scrollbar-ledger::-webkit-scrollbar { width: 9px; height: 9px; }
            .scrollbar-ledger::-webkit-scrollbar-track { background: ${paper.paper}; }
            .scrollbar-ledger::-webkit-scrollbar-thumb { background: ${paper.cardBorder}; border-radius: 5px; }
            .rs-hub-card-hover:hover { background: ${paper.rowHover ?? '#F9FAFB'} !important; }
        `}</style>
    );
}

/** Small serif eyebrow used above numbers/sections throughout the ledger. */
export function LedgerLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return <div className="index-label" style={style}>{children}</div>;
}

/** Toggle/button. */
export function Stamp({
    active, onClick, children, title, tiltRight, green,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title?: string;
    tiltRight?: boolean;
    green?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`stamp ${active ? `active${tiltRight ? ' tilt-r' : ''}${green ? ' stamp-green' : ''}` : ''}`}
        >
            {children}
        </button>
    );
}

/** Index-card shell with tape accent + dashed label rule. */
export function IndexCard({
    label, children, style, className,
}: {
    label?: React.ReactNode;
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
}) {
    return (
        <div className={`index-card p-3 ${className || ''}`} style={style}>
            <span className="tape" />
            {label && <div className="index-label">{label}</div>}
            {children}
        </div>
    );
}

export const paperShadow = '0 1px 3px rgba(0,0,0,0.06)';
