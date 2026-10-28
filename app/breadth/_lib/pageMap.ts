/**
 * The breadth module's page table — the single source shared by the sidebar
 * layout, the export/drawer/tour chrome and the Custom Dashboard catalog.
 * Order + labels mirror the reference `PAGES` array
 * (Rebh_CR3_reference/pro_dashboard_template.html line 404-405), extended with
 * the two routes this SPA adds for CR3 §2/§12 (custom, summary).
 */

export interface PageMeta {
  id: string;
  /** Next.js route (used for navigation + pathname matching) */
  path: string;
  name: string;
}

export const BREADTH_PAGES: PageMeta[] = [
  { id: 'overview', path: '/breadth', name: 'Overview' },
  { id: 'custom', path: '/breadth/custom', name: '★ Custom Dashboard' },
  { id: 'summary', path: '/breadth/summary', name: 'Daily Read (عربي)' },
  { id: 'widget', path: '/breadth/widget', name: 'Market Breadth widget' },
  { id: 'leaders', path: '/breadth/leaders', name: 'Leaders & Trend Template' },
  { id: 'nhnl', path: '/breadth/nhnl', name: 'New Highs / New Lows' },
  { id: 'mcclellan', path: '/breadth/mcclellan', name: 'McClellan' },
  { id: 'ma', path: '/breadth/ma', name: '% Above MAs' },
  { id: 'ad', path: '/breadth/ad', name: 'Advance / Decline' },
  { id: 'stockbee', path: '/breadth/stockbee', name: 'Stockbee Monitor' },
  { id: 'cycle', path: '/breadth/cycle', name: 'Market Cycle (DV)' },
  { id: 'classic', path: '/breadth/classic', name: 'Classic chart' },
  { id: 'library', path: '/breadth/library', name: 'Classic breadth library' },
  { id: 'bpi', path: '/breadth/bpi', name: 'Bullish Percent (P&F)' },
  { id: 'sectors', path: '/breadth/sectors', name: 'Sectors' },
  { id: 'conc', path: '/breadth/conc', name: 'Concentration' },
  { id: 'signals', path: '/breadth/signals', name: 'Signals & Regimes' },
  { id: 'thr', path: '/breadth/thresholds', name: 'Thresholds & Method' },
];

/** Resolve page meta from a pathname (exact for overview, prefix otherwise). */
export function pageByPath(pathname: string): PageMeta | null {
  const exact = BREADTH_PAGES.find((p) => p.path === pathname);
  if (exact) return exact;
  const byPrefix = [...BREADTH_PAGES]
    .filter((p) => p.path !== '/breadth' && pathname.startsWith(p.path + '/'))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return byPrefix ?? null;
}

/** Sidebar list — the ★ Custom Dashboard is a first-class page (user request
 *  2026-10-27); only the Arabic Daily Read stays off the nav. */
export const SIDEBAR_PAGES = BREADTH_PAGES.filter((p) => p.id !== 'summary');
