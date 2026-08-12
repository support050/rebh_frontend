import type { StockData } from './types';

export const CATEGORY_ORDER = ['WEAK', 'NEUTRAL', 'IMPROVE', 'STRONG'] as const;
export type CategoryName = (typeof CATEGORY_ORDER)[number];

export function categoryFromRs(rs: number | null | undefined): CategoryName {
    if (rs == null) return 'WEAK';
    if (rs >= 90) return 'STRONG';
    if (rs >= 80) return 'IMPROVE';
    if (rs >= 70) return 'NEUTRAL';
    return 'WEAK';
}

export type CategoryMovement = {
    direction: 'up' | 'down';
    from: CategoryName;
    to: CategoryName;
};

/** Category transition vs ~1 week ago (same idea as watchlist Matrix Chart / RS Matrix). */
export function getCategoryMovement(st: StockData): CategoryMovement | null {
    const current = (st.cat || categoryFromRs(st.rs)) as CategoryName;
    const prev = categoryFromRs(st.rs1w);
    if (st.rs1w == null || prev === current) return null;

    const currIdx = CATEGORY_ORDER.indexOf(current);
    const prevIdx = CATEGORY_ORDER.indexOf(prev);
    if (currIdx === prevIdx) return null;

    return {
        direction: currIdx > prevIdx ? 'up' : 'down',
        from: prev,
        to: current,
    };
}

/** RS rating rose vs last week (even if still same category). */
export function rsRose(st: StockData): boolean {
    return st.rs1w != null && st.rs > st.rs1w;
}
