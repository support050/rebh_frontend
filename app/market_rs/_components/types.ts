import { PAPER, type PaperTokens } from './paperTheme';

export interface StockData {
    s: string;       // Symbol
    symbol: string;  // Compatibility with shariah filter (maps to s)
    c: string;       // Company Name
    grp: string;     // Group/Industry
    rs: number;      // Current RS
    rs1w: number;    // Previous RS (1W)
    cat: string;     // Category: STRONG, IMPROVE, NEUTRAL, WEAK
    sig: string[];   // Signals: blue, up, dn, rsnh, focus, burst, dist, res, bull, bear
    m1: number | null; m3: number | null; m6: number | null; m9: number | null; m12: number | null; // Ranks
    ad?: string;     // A/D Rating
    price: number; chg: number;
    offh?: number; offl?: number | null;
    p50?: number; p150?: number; p200?: number;
    vold?: number;
    mcap?: number;
    tt: any[]; tts: number; trail: any[];
    mom: number; dirn: 'up' | 'down' | 'flat' | string; pos: string; shariah: string;
    sec: string; ind: string; sub: string;
    // REBH reference championship fields
    age?: number;
    ageTag?: 'YOUNG' | 'MATURE' | 'STEADY' | string;
    gRank?: number | null;
    gconf?: boolean;
    rsnh?: boolean;
    focus?: boolean;
    res?: boolean;
    dist?: boolean;
}

export type TabId = 'rankings' | 'matrix' | 'rotation' | 'map' | 'events';

// Helper functions shared across components — now return Paper Ledger hex
// values (used via inline `style`) instead of Tailwind utility classes.
export function getCatColor(cat: string, paper: PaperTokens = PAPER) {
    if (cat === 'STRONG') return { color: paper.strong, background: paper.strongBg, borderColor: paper.strongBorder };
    if (cat === 'IMPROVE') return { color: paper.improve, background: paper.improveBg, borderColor: paper.improveBorder };
    if (cat === 'NEUTRAL') return { color: paper.neutral, background: paper.neutralBg, borderColor: paper.neutralBorder };
    return { color: paper.weak, background: paper.weakBg, borderColor: paper.weakBorder };
}

export function getCatText(cat: string, paper: PaperTokens = PAPER): string {
    if (cat === 'STRONG') return paper.strong;
    if (cat === 'IMPROVE') return paper.improve;
    if (cat === 'NEUTRAL') return paper.neutral;
    return paper.weak;
}

export function getCatBg(cat: string, paper: PaperTokens = PAPER): string {
    if (cat === 'STRONG') return paper.strong;
    if (cat === 'IMPROVE') return paper.improve;
    if (cat === 'NEUTRAL') return paper.neutral;
    return paper.weak;
}

export function getCatDot(cat: string, paper: PaperTokens = PAPER): string {
    if (cat === 'STRONG') return paper.strong;
    if (cat === 'IMPROVE') return paper.improve;
    if (cat === 'NEUTRAL') return paper.neutral;
    return paper.weak;
}