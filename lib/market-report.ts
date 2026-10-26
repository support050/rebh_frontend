/**
 * Compact Market Report Types & Constants - ALL IN ONE FILE
 */

// ──── TYPES ────────────────────────────────────────────
export enum TrendType {
  BULL = 'Bull',
  BEAR = 'Bear',
  NEUTRAL = 'Neutral',
}

export interface IndexData {
  name: string;
  return: number;
}

export interface IndexPerformance {
  market_indices: IndexData[];
  market_cap_indices: IndexData[];
  global_indices: IndexData[];
}

export interface TrendSeriesPoint {
  date: string;
  close: number;
  trend: TrendType;
  high_250: number;
  low_250: number;
}

export interface TrendAnalysis {
  series: TrendSeriesPoint[];
  high_250: number;
  low_250: number;
  daily: TrendType;
  weekly: TrendType;
  monthly: TrendType;
  current_close: number;
}

export interface VolumeSeriesPoint {
  date: string;
  volume: number;
  index_level: number;
}

export interface Volume {
  series: VolumeSeriesPoint[];
  current_week_millions: number;
  pct_change: number;
  current_index_level: number;
}

export interface SectorData {
  sector: string;
  weekly_return: number;
  trend_daily: TrendType;
  trend_weekly: TrendType;
  trend_monthly: TrendType;
  trend_rank: number;
  pct_below_250d_high: number;
  days_since_250d_high: number;
}

export interface BreadthPoint {
  date: string;
  breadth: number;
}

export interface BreadthCurrent {
  daily: number;
  weekly: number;
  monthly: number;
}

export interface TrendBreadth {
  current: BreadthCurrent;
  daily: BreadthPoint[];
  weekly: BreadthPoint[];
  monthly: BreadthPoint[];
}

export interface NewHighsLowsPoint {
  date: string;
  pct_new_highs: number;
  pct_new_lows: number;
  close: number;
}

export interface NewHighsLowsCurrent {
  pct_new_highs: number;
  pct_new_lows: number;
}

export interface NewHighsLows {
  series: NewHighsLowsPoint[];
  current: NewHighsLowsCurrent;
}

export interface StockReturn {
  stock_name: string;
  return_pct?: number;
  return?: number;
}

export interface StockPerformance {
  positive_count: number;
  negative_count: number;
  mean_return: number;
  returns: StockReturn[];
}

export interface StockAnalytics {
  symbol: string;
  stock_name: string;
  weekly_return: number | null;
  trend_daily: TrendType;
  trend_weekly: TrendType;
  trend_monthly: TrendType;
  trend_rank: number;
  pct_below_250d_high: number;
  days_since_250d_high: number;
}

export interface BreakoutPoint {
  date: string;
  price: number;
}

export interface Breakout {
  stock_name: string;
  sector: string;
  price: number;
  breakout_type: string;
  date: string;
}

export interface BreakoutSummary {
  all_time_highs: number;
  all_time_lows: number;
  positive_breakouts: number;
  negative_breakouts: number;
}

export interface BreakoutStock {
  stock_name: string;
  price: number;
  breakout_type: string;
  series: BreakoutPoint[];
}

export interface Breakouts {
  summary: BreakoutSummary;
  breakouts: Breakout[];
}

export interface VolumeGainer {
  stock_name: string;
  volume_pct_change: number;
  current_week_vol?: number;
  prev_week_vol?: number;
}

// 2026-10-25: the WeeklyMarketReport interface was deleted together with the
// weekly report itself (backend/scripts/generate_weekly_report.py, the
// weekly_market_reports table and the Puppeteer PDF route). No page imported it.
// The remaining types above are still used by the market-reports pages.

// ──── CONSTANTS & COLORS ────────────────────────────────
export const COLORS = {
  pageBg: '#0d1b2a',
  cardBg: '#0f2236',
  border: '#1e3a5f',
  headerBg: '#1e3a5f',
  sectionRed: '#c0392b',
  accentBlue: '#4a9fd4',
  bull: '#27ae60',
  bear: '#e74c3c',
  neutral: '#7f8c8d',
  tasiLine: '#2980b9',
  volumeBar: '#5bc0de',
  positiveBar: '#27ae60',
  negativeBar: '#e74c3c',
  positiveFill: 'rgba(39,174,96,0.25)',
  negativeFill: 'rgba(231,76,60,0.25)',
  tableHeader: '#1e3a5f',
  tableText: '#c8d6e5',
  rowAlt: '#0d1b2a',
  badgeBg: '#2c5282',
  error: '#744210',
  errorBg: '#1a1000',
  errorText: '#fbbf24',
} as const;

export const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: 4, fontSize: 11, color: COLORS.tableText },
  labelStyle: { color: '#fff', fontWeight: 700 },
} as const;

export const CHART_MARGINS = {
  default: { top: 10, right: 20, left: 0, bottom: 0 },
  wide: { top: 10, right: 100, left: 0, bottom: 0 },
  large: { top: 28, right: 20, left: 0, bottom: 64 },
  compact: { top: 8, right: 0, left: 0, bottom: 0 },
} as const;

// ──── UTILITIES ────────────────────────────────────────
export const getTrendColor = (t: TrendType | string): string => {
  if (t === 'Bull') return COLORS.bull;
  if (t === 'Bear') return COLORS.bear;
  return COLORS.neutral;
};

export const formatPercent = (value: number | null | undefined, decimals = 2): string => {
  if (value == null) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${Number(value).toFixed(decimals)}%`;
};

export const formatNumber = (value: number | null | undefined): string => {
  if (value == null) return '—';
  return Number(value).toLocaleString();
};

export const shortIndexName = (name: string): string => {
  const map: Record<string, string> = {
    'All Share': 'Tadawul\nAll Share\nIndex',
    'Tada30': 'MSCI\nTada30\nIndex',
    'TASI50': 'Tadawul\nTASI50\nIndex',
    'Large': 'Tadawul\nLarge Cap\nIndex',
    'Medium': 'Tadawul\nMedium Cap\nIndex',
    'Small': 'Tadawul\nSmall Cap\nIndex',
    'ACWI': 'MSCI\nACWI',
    'Emerging': 'MSCI\nEmerging\nMarkets',
  };
  return Object.entries(map).find(([key]) => name.includes(key))?.[1] || name;
};

export const getBreakoutStyle = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('all-time high') || t.includes('all time high')) return { bg: '#1a3a1a', color: COLORS.bull, icon: '▲ ' };
  if (t.includes('all-time low') || t.includes('all time low')) return { bg: '#4a1010', color: COLORS.bear, icon: '▼ ' };
  if (t.includes('high') || t.includes('positive')) return { bg: '#0f2a0f', color: COLORS.bull, icon: '▲ ' };
  if (t.includes('low') || t.includes('negative')) return { bg: '#2a0f0f', color: '#ff6b6b', icon: '▼ ' };
  return { bg: '#1a2e42', color: COLORS.tableText, icon: '' };
};
