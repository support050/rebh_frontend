/**
 * Type contract for the breadth canvas engine and its data source.
 * Mirrors the panel field contract captured in breadth-panel-spec.json and the
 * DATA object shape served by /api/rebh/breadth/* (see types/breadth.ts).
 */

export type SeriesVal = number | string | null;

/** The DATA slice the engine draws from — dates + parallel series + event lists. */
export interface DataSource {
  /** ISO trading dates, index-aligned with every series array. */
  dates: string[];
  /** 125 breadth series keyed by BreadthSeriesKey. */
  series: Record<string, SeriesVal[]>;
  /**
   * Event markers keyed by rule name. Values are either date-strings
   * (zweig, lowry_down, …) or canary episode objects ({start, end, …}).
   */
  events: Record<string, Array<string | CanaryEpisode>>;
}

export interface CanaryEpisode {
  start: string;
  end: string;
  [k: string]: unknown;
}

export type SeriesType = 'line' | 'hist' | 'bar' | 'area' | 'candle';

export interface SeriesDef {
  /** key into DataSource.series */
  key: string;
  /** CSS variable name (e.g. '--blue'), resolved against the breadth scope */
  color: string;
  label?: string;
  type?: SeriesType;
  width?: number;
  /** fixed fraction digits for the readout; default: 2 when |v|<10 else 0 */
  dec?: number;
  /** series key whose sign picks the up/down colour (used for volume bars) */
  colorBy?: string;
  up?: string;
  down?: string;
}

export interface ZoneDef {
  from: number;
  to: number;
  color: string;
}

export interface HLineDef {
  y: number;
  color?: string;
  label?: string;
  dash?: number[];
}

export interface EventDef {
  /** key into DataSource.events */
  key: string;
  color: string;
  pos?: 'top' | 'bottom';
  dot?: boolean;
}

export interface PanelDef {
  title?: string;
  height?: number;
  series: SeriesDef[];
  /** force the y-axis range, e.g. [0,100] for percentages */
  ylim?: [number, number];
  /** pin the baseline at zero (bars/histograms) */
  zero?: boolean;
  zones?: ZoneDef[];
  hlines?: HLineDef[];
  /** shade NH−NL canary episodes */
  episodes?: boolean;
  /** paint the regime colour strip along the bottom */
  regimeStrip?: boolean;
  events?: EventDef[];
  /** compact panel (no title chrome, tight margins) */
  mini?: boolean;
  /** rebase all series to 100 at the left edge of the visible range */
  rebase?: boolean;
}

export interface StackOptions {
  /** clone stack: no per-panel controls, no widget registration, no stack chrome (CR3) */
  noctl?: boolean;
  /** left-margin override, etc. reserved for future parity tweaks */
  [k: string]: unknown;
}

/** Regime → colour CSS-var map (matches the reference dashboard). */
export const REGIME_COLORS: Record<string, string> = {
  Strong: '--good',
  Healthy: '--good',
  Neutral: '--text2',
  Weak: '--serious',
  Washout: '--violet',
};

/** Regime → glyph map (matches the reference dashboard). */
export const REGIME_ICONS: Record<string, string> = {
  Strong: '▲▲',
  Healthy: '▲',
  Neutral: '●',
  Weak: '▼',
  Washout: '◆',
};
