export interface StockData {
    s: string;       // Symbol
    symbol: string;  // Compatibility with shariah filter (maps to s)
    c: string;       // Company Name
    grp: string;     // Group/Industry
    rs: number;      // Current RS
    rs1w: number;    // Previous RS (1W)
    cat: string;     // Category: STRONG, IMPROVE, NEUTRAL, WEAK
    sig: string[];   // Signals: blue, up, dn, rsnh, focus, burst, dist, res, bull, bear
    m1: number; m3: number; m6: number; m9: number; m12: number; // Ranks
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

// Helper functions shared across components
export function getCatColor(cat: string) {
    if (cat === 'STRONG') return 'bg-green-100 text-green-700 border-green-200';
    if (cat === 'IMPROVE') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (cat === 'NEUTRAL') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-red-100 text-red-700 border-red-200';
}

export function getCatText(cat: string) {
    if (cat === 'STRONG') return 'text-green-600';
    if (cat === 'IMPROVE') return 'text-blue-600';
    if (cat === 'NEUTRAL') return 'text-amber-500';
    return 'text-red-600';
}

export function getCatBg(cat: string) {
    if (cat === 'STRONG') return 'bg-green-600';
    if (cat === 'IMPROVE') return 'bg-blue-600';
    if (cat === 'NEUTRAL') return 'bg-amber-500';
    return 'bg-red-600';
}

export function getCatDot(cat: string) {
    if (cat === 'STRONG') return 'bg-green-500';
    if (cat === 'IMPROVE') return 'bg-blue-500';
    if (cat === 'NEUTRAL') return 'bg-amber-400';
    return 'bg-red-500';
}
