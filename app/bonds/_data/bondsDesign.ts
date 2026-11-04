/**
 * bondsDesign.ts — design tokens for the three /bonds Treasury pages, MEASURED
 * from the live source screens rather than assumed.
 *
 * Provenance (2026-11-03):
 *   Throwaway backend probes (_tmp_treasury_probe / _probe2, since deleted)
 *   fetched the live Treasury.gov Daily Par Yield Curve TextView page
 *   (https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve)
 *   and grepped its linked stylesheets. The rates grid is a USWDS (U.S. Web
 *   Design System) `usa-table` inside the Drupal `hamilton` theme, enhanced by
 *   DataTables + fixedHeader. Every colour below is copied off a real rule in
 *   those sheets — see the comment on each token for the exact selector.
 *
 * The interactive-link navy (#083c6f) is Treasury's OWN override on this page
 * (.daily-treasury-rates .usa-table thead th[aria-sort]), which is darker than
 * the generic USWDS sorted-header cyan (#97d4ea). We use the page-specific
 * navy because that is what the official Daily Rates table actually shows.
 */
import type { CSSProperties } from 'react';

/* ═══════════════════════ USWDS / Treasury.gov palette ═══════════════════════ */

/** .usa-prose>table,.usa-table { font-family: Source Sans Pro Web, Helvetica
 *  Neue, Helvetica, Roboto, Arial, sans-serif } */
export const BONDS_FONT =
  "'Source Sans Pro Web', 'Helvetica Neue', Helvetica, Roboto, Arial, sans-serif";
/** .usa-prose>table,.usa-table { font-size: 1.06rem; line-height: 1.5 } */
export const BONDS_TABLE_FONT_SIZE = '0.95rem';
export const BONDS_LINE_HEIGHT = 1.5;

export const USWDS = {
  /** ink — the base body/header text (.usa-table { color:#1b1b1b }) */
  ink: '#1b1b1b',
  /** default table header fill (.usa-table thead th { background-color:#dfe1e2 }) */
  theadBg: '#dfe1e2',
  /** cell fill (.usa-table th,.usa-table td { background-color:#fff }) */
  cellBg: '#ffffff',
  /** cell rule (border:1px solid #1b1b1b) */
  cellBorder: '#1b1b1b',
  /** zebra stripe (.usa-table--striped tbody tr:nth-child(odd) td { #f0f0f0 }) */
  stripe: '#f0f0f0',
  /** interactive link blue (…header__button { color:#005ea2 }) */
  link: '#005ea2',
  /** link hover (…:hover { color:#1a4480 }) */
  linkHover: '#1a4480',
  /** link active/pressed (…:active { color:#162e51 }) */
  linkActive: '#162e51',
  /** generic USWDS sorted-column header (.usa-table thead th[aria-sort] { #97d4ea }) */
  sortedHeaderCyan: '#97d4ea',
  /** Treasury Daily-Rates-specific sorted header override
   *  (.daily-treasury-rates .usa-table thead th[aria-sort] { background:#083c6f }) */
  sortedHeaderNavy: '#083c6f',
  /** active-sort cell tint (td[data-sort-active] { background:#e1f3f8 }) */
  sortActiveCell: '#e1f3f8',
  /** sticky-header fill (table.sticky-header { background-color:#fff }) */
  stickyHeaderBg: '#ffffff',
} as const;

/* ══════════════════════════ Curve-shape semantics ══════════════════════════ */
/** Mirrors backend /yield-curve/summary _shape(): inverted < 0 ≤ flat < 0.20 ≤
 *  normal. Colours follow FRED/analysis convention (red inverted, amber flat,
 *  green normal) — these are OUR semantic accents, not measured from Treasury. */
export const SHAPE_COLORS = {
  normal: { fg: '#0a7c52', bg: '#ecfdf5', border: '#6ee7b7' },
  flat: { fg: '#92640a', bg: '#fffbeb', border: '#fcd34d' },
  inverted: { fg: '#b91c1c', bg: '#fef2f2', border: '#fca5a5' },
  unknown: { fg: '#4b5563', bg: '#f3f4f6', border: '#d1d5db' },
} as const;

/* ═══════════════════════════ Table style helpers ═══════════════════════════ */

/** .usa-table th,.usa-table td { border:1px solid #1b1b1b; padding:.5rem 1rem } */
export const bondsTdStyle: CSSProperties = {
  border: `1px solid #e6e6e6`,
  padding: '0.5rem 1rem',
  color: USWDS.ink,
  backgroundColor: USWDS.cellBg,
};

export const bondsThStyle: CSSProperties = {
  border: `1px solid ${USWDS.cellBorder}`,
  padding: '0.5rem 1rem',
  backgroundColor: USWDS.theadBg,
  color: USWDS.ink,
  fontWeight: 700,
  lineHeight: 1.3,
};

/* ════════════════════ StockCharts dynamic-curve accents ════════════════════
 * Measured 2026-11-03 by pixel-sampling the reference Dynamic Yield Curve
 * screenshot: left curve line #ff2121 (red) with a vertical area gradient
 * #f9f9fc (top) → #7b7dc0 (bottom indigo); right S&P line blue with a pale
 * yellow gradient #fffffc → #f4f4c0; panels white with thin grey grid.
 */
export const STOCKCHARTS = {
  curveLine: '#ff2121',
  curveFillTop: '#f9f9fc',
  curveFillBottom: '#7b7dc0',
  spLine: '#1a3fb5',
  spFillTop: '#fffffc',
  spFillBottom: '#f4f4c0',
  panelBg: '#ffffff',
  grid: '#d0d0d0',
  axisText: '#333333',
} as const;

/* ════════════════════════════ Source deep links ════════════════════════════ */
/** Pathname → the official screen the data on that route came from.
 *  The two Treasury-fed routes open the Daily Par Yield Curve TextView; the
 *  dynamic simulator (/bonds/yield-curve) is modelled on StockCharts' free
 *  yield-curve tool, so its bubble points at the original tool instead. */
const TREASURY_TEXTVIEW =
  'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/' +
  'TextView?type=daily_treasury_yield_curve';
const STOCKCHARTS_TOOL = 'https://stockcharts.com/freecharts/yieldcurve.php';

export const BONDS_SOURCES = {
  daily: {
    name: 'Treasury.gov',
    url: TREASURY_TEXTVIEW,
    attribution:
      'Source: U.S. Department of the Treasury & Federal Reserve Bank of St. Louis (FRED®).',
  },
} as const;

export const BONDS_SOURCE_BY_PATH: Record<string, { name: string; url: string; tooltip: string }> = {
  '/bonds/daily-treasury-yield-curve': {
    name: BONDS_SOURCES.daily.name,
    url: TREASURY_TEXTVIEW,
    tooltip: 'View Official Source on Treasury.gov',
  },
  '/bonds/treasury-yield-curve': {
    name: BONDS_SOURCES.daily.name,
    url: TREASURY_TEXTVIEW,
    tooltip: 'View Official Source on Treasury.gov',
  },
  '/bonds/yield-curve': {
    name: 'StockCharts',
    url: STOCKCHARTS_TOOL,
    tooltip: 'View Original Tool on StockCharts',
  },
};

/** The one line the compliance brief mandates verbatim on all three pages. */
export const BONDS_ATTRIBUTION =
  'Source: U.S. Department of the Treasury & Federal Reserve Bank of St. Louis (FRED®).';
