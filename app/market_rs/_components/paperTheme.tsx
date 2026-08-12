// Light / dark design tokens for RS Hub.
// Only visual values live here; no logic.

export type PaperTokens = {
    paper: string;
    paperLight: string;
    ink: string;
    inkMuted: string;
    brass: string;
    brassLight: string;
    cardBorder: string;
    marginRed: string;
    stampGreen: string;
    stampRed: string;
    strong: string; strongBg: string; strongBorder: string;
    improve: string; improveBg: string; improveBorder: string;
    neutral: string; neutralBg: string; neutralBorder: string;
    weak: string; weakBg: string; weakBorder: string;
    sortHighlight?: string;
    sortHighlightText?: string;
    rowHover?: string;
    rowSelected?: string;
};

export const PAPER: PaperTokens = {
    // surfaces
    paper: '#F7F8FA',       // page background
    paperLight: '#FFFFFF',  // card / panel surface
    // ink
    ink: '#1A1A1A',
    inkMuted: '#6B7280',
    // accents + hardware
    brass: '#8C3B32',
    brassLight: '#F3F4F6',
    cardBorder: '#E5E7EB',
    // margin rule + stamps
    marginRed: '#8C3B32',
    stampGreen: '#16A34A',
    stampRed: '#DC2626',

    // category quad — clear status colors on white
    strong: '#16A34A', strongBg: '#F0FDF4', strongBorder: '#86EFAC',
    improve: '#2563EB', improveBg: '#EFF6FF', improveBorder: '#93C5FD',
    neutral: '#D97706', neutralBg: '#FFFBEB', neutralBorder: '#FDE68A',
    weak: '#DC2626', weakBg: '#FEF2F2', weakBorder: '#FECACA',
    sortHighlight: '#EFF6FF',
    sortHighlightText: '#1E3A8A',
    rowHover: '#F9FAFB',
    rowSelected: '#F3F4F6',
};

export const PAPER_DARK: PaperTokens = {
    paper: '#0F1419',
    paperLight: '#1A1F26',
    ink: '#E8EAED',
    inkMuted: '#9CA3AF',
    brass: '#C97A72',
    brassLight: '#252B33',
    cardBorder: '#2D3748',
    marginRed: '#C97A72',
    stampGreen: '#4ADE80',
    stampRed: '#F87171',
    strong: '#4ADE80', strongBg: 'rgba(20,83,45,0.35)', strongBorder: '#166534',
    improve: '#60A5FA', improveBg: 'rgba(30,58,95,0.45)', improveBorder: '#2563EB',
    neutral: '#FBBF24', neutralBg: 'rgba(120,53,15,0.35)', neutralBorder: '#D97706',
    weak: '#F87171', weakBg: 'rgba(127,29,29,0.35)', weakBorder: '#DC2626',
    sortHighlight: 'rgba(37,99,235,0.25)',
    sortHighlightText: '#93C5FD',
    rowHover: '#252B33',
    rowSelected: '#2D3748',
};

export type RsHubThemeMode = 'light' | 'dark';

export function getPaper(mode: RsHubThemeMode): PaperTokens {
    return mode === 'dark' ? PAPER_DARK : PAPER;
}

export const FONT_SERIF = "'Tajawal', 'Inter', sans-serif";
export const FONT_MONO = "'Tajawal', 'Inter', sans-serif";

export type CatKey = 'STRONG' | 'IMPROVE' | 'NEUTRAL' | 'WEAK' | string;

export function catColor(cat: CatKey): string {
    if (cat === 'STRONG') return PAPER.strong;
    if (cat === 'IMPROVE') return PAPER.improve;
    if (cat === 'NEUTRAL') return PAPER.neutral;
    return PAPER.weak;
}
export function catBg(cat: CatKey): string {
    if (cat === 'STRONG') return PAPER.strongBg;
    if (cat === 'IMPROVE') return PAPER.improveBg;
    if (cat === 'NEUTRAL') return PAPER.neutralBg;
    return PAPER.weakBg;
}
export function catBorder(cat: CatKey): string {
    if (cat === 'STRONG') return PAPER.strongBorder;
    if (cat === 'IMPROVE') return PAPER.improveBorder;
    if (cat === 'NEUTRAL') return PAPER.neutralBorder;
    return PAPER.weakBorder;
}
