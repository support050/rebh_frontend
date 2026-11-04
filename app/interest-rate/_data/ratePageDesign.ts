/**
 * ratePageDesign.ts — design tokens for the two interest-rate pages, MEASURED
 * from the live source screens, never assumed.
 *
 * Provenance (all three artefacts are regenerated, not hand-written):
 *   1. backend/output/rate_page_design/measured_design.json
 *      ← backend/scripts/extract_rate_pages_design.py (Playwright
 *        getComputedStyle + getBoundingClientRect on the live pages, including
 *        the QuikStrike iframe and its "Probabilities" view).
 *   2. backend/output/rate_page_design/cme_css_rules.json
 *      ← backend/scripts/fetch_cme_css.py (the QuikStrike .less sheets; the
 *        highlight / vtab / tab colours only exist there, not in the HTML).
 *   3. backend/output/rate_page_design/investing_css_rules.json
 *      ← backend/scripts/fetch_investing_css.py (.genTbl rules) plus the
 *        chart option JSON embedded in the QuikStrike payload (LabelColor,
 *        Palette, WatermarkImg).
 *
 * Anything below that could not be computed was read off the captured PNGs
 * (cme_tool.png / cme_probabilities.png / investing_table.png) and is marked
 * "from capture" in the comment.
 */
import type { CSSProperties } from 'react';

/* ══════════════════════════ CME / QuikStrike ══════════════════════════ */

/** body { font: arial, helvetica, clean, sans-serif / 13px / #000 on #fff } */
export const QS_FONT = 'arial, helvetica, clean, sans-serif';
export const QS_FONT_SIZE = 13;

export const QS_COLORS = {
  pageBg: '#ffffff',
  text: '#000000',
  /** th background-color — measured rgb(248,248,248) */
  thBg: '#F8F8F8',
  /** every grid cell border — measured 1px solid rgb(224,224,226) */
  cellBorder: '#E0E0E2',
  /** td.highlight — the "Now *" column and the ease/hold side of the matrix */
  highlight: '#FAFAD2',
  /** td.highlight2 — the modal (highest-probability) bucket of each matrix row */
  highlight2: '#BFF7FF',
  /** td.highlight1 / td.highlightSubtle, used by other QuikStrike panels */
  highlight1: '#CBDADD',
  highlightSubtle: '#FFF7E2',
  /** chart series fill, measured .highcharts-series path { fill: rgb(41,128,185) } */
  barFill: '#2980B9',
  barStroke: '#FFFFFF',
  /** .highcharts-subtitle { fill: rgb(42,61,104) } */
  subtitle: '#2A3D68',
  /** chart payload { LabelColor: "#8C8C8C" } — axis titles + category labels */
  axisLabel: '#8C8C8C',
  /** ul.ui-vtabs-nav a */
  vtabLink: '#293154',
  vtabActiveBg: '#DDDDDD',
  vtabHoverBg: '#EEEEEE',
  /** div.qs-tabs li { border: 1px solid #bec1cb } — the meeting-date strip */
  tabBorder: '#BEC1CB',
  /** Highcharts series palette (chart JSON "Palette"); index 0 is the only one
   *  the FedWatch column chart ever uses because it renders a single series. */
  palette: ['#2980b9', '#d35400', '#16a085', '#8e44ad', '#c0392b', '#7f8c8d', '#2c3e50', '#f39c12'],
} as const;

/** table.gridtable — measured 11.05px (not 11px: the source really is fractional) */
export const QS_TABLE_FONT_SIZE = '11.05px';
/** th — measured 9.945px / 700 */
export const QS_TH_FONT_SIZE = '9.945px';
/** td padding — measured 3.8675px all round */
export const QS_CELL_PADDING = '3.87px';

export const qsTableStyle: CSSProperties = {
  borderCollapse: 'collapse',
  fontFamily: QS_FONT,
  fontSize: QS_TABLE_FONT_SIZE,
  color: QS_COLORS.text,
  width: '100%',
};

export const qsThStyle: CSSProperties = {
  backgroundColor: QS_COLORS.thBg,
  border: `1px solid ${QS_COLORS.cellBorder}`,
  fontSize: QS_TH_FONT_SIZE,
  fontWeight: 700,
  padding: QS_CELL_PADDING,
  textAlign: 'center',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};

export const qsTdStyle: CSSProperties = {
  border: `1px solid ${QS_COLORS.cellBorder}`,
  padding: QS_CELL_PADDING,
  verticalAlign: 'middle',
};

/** td.number — the tool right-aligns every numeric cell */
export const qsNumberStyle: CSSProperties = {
  ...qsTdStyle,
  textAlign: 'right',
};

export const qsCenterStyle: CSSProperties = {
  ...qsTdStyle,
  textAlign: 'center',
};

/* ═══════════════════════════ investing.com ═══════════════════════════ */

/** body { font: Arial, Helvetica, sans-serif / 12px / rgb(51,51,51) } */
export const INV_FONT = 'Arial, Helvetica, sans-serif';
export const INV_FONT_SIZE = 12;

export const INV_COLORS = {
  pageBg: '#ffffff',
  text: '#333333',
  /** #BarchartDataTable tbody td.left a — measured rgb(18,86,160) */
  link: '#1256A0',
  /** td.grayFont (unchanged) — measured rgb(63,74,84) */
  neutral: '#3F4A54',
  /** td.greenFont — measured rgb(14,166,0) */
  up: '#0EA600',
  /** td.redFont — measured rgb(255,0,0) */
  down: '#FF0000',
  /** .genTbl TD { border-top: 1px solid #dadada } */
  rowBorder: '#DADADA',
  /** .genTbl TR:first-child TD { border-top: 2px solid #bababa } + table edges */
  strongBorder: '#BABABA',
  /** .genTbl TBODY TR:hover { background-color: #edf4fa } */
  rowHover: '#EDF4FA',
} as const;

export const invTableStyle: CSSProperties = {
  borderCollapse: 'separate',
  borderSpacing: 0,
  width: '100%',
  fontFamily: INV_FONT,
  fontSize: INV_FONT_SIZE,
  color: INV_COLORS.text,
};

/** .genTbl TH — 24px tall, bold, right-aligned, no background */
export const invThStyle: CSSProperties = {
  color: INV_COLORS.text,
  fontWeight: 700,
  fontSize: INV_FONT_SIZE,
  height: 24,
  textAlign: 'right',
  whiteSpace: 'nowrap',
  paddingRight: 5,
  backgroundColor: 'transparent',
};

/** .genTbl TD — 23px tall, 1px #dadada top rule, right-aligned */
export const invTdStyle: CSSProperties = {
  borderTop: `1px solid ${INV_COLORS.rowBorder}`,
  height: 23,
  textAlign: 'right',
  verticalAlign: 'middle',
  paddingRight: 5,
  fontSize: INV_FONT_SIZE,
};

/* ═══════════════════════════ Source links ═══════════════════════════ */

export const RATE_SOURCES = {
  cme: {
    name: 'CME Group',
    toolName: 'CME FedWatch Tool',
    /** One wrapper page hosts every QuikStrike view (Current, Probabilities, …);
     *  the view itself is chosen inside the tool, so there is no per-view deep
     *  link to measure — both views point here. */
    url: 'https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html',
    attribution: 'Market data courtesy of CME Group. Source: CME FedWatch Tool.',
  },
  investing: {
    name: 'Investing.com',
    toolName: 'Eurodollar Contracts',
    url: 'https://www.investing.com/rates-bonds/eurodollar-futures',
    attribution: 'Source: Investing.com — Eurodollar Futures.',
  },
} as const;
