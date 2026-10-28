/**
 * Shared building blocks for the /breadth interactive tables.
 *
 * Everything here is a direct port of the reference dashboard's table layer
 * (Rebh_Market_Breadth_Package/dashboard/pro_dashboard_template.html): the
 * StockRow record shape, the cell formatters, the KPI/card/tag chrome and the
 * per-symbol OHLC loader the stock modal uses. Table text is English (LTR),
 * exactly like the client's reference build.
 */
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import type { SeriesVal } from '../_engine/types';
import { fmt, num, pct, signClass } from './format';
import { fetchOhlcSymbol } from './tableApi';
import { heatStyle, rsColor } from './heat';
import { getPrefs } from './prefs';

/* ===================================================================== row types */

/** One row of /stocks — the unit every interactive table on these pages renders. */
export interface StockRow {
  sym: number;
  name: string;
  group: string;
  close?: number | null;
  d1?: number | null;
  m1?: number | null;
  m3?: number | null;
  vs50?: number | null;
  vs200?: number | null;
  hi52?: number | null;
  lo52?: number | null;
  stage?: number | null;
  rvol?: number | null;
  rs?: number | null;
  /** RS delta vs 21 days ago (CR3 rsCell) */
  rs21?: number | null;
  /** RS 5-day delta (engine rs5) */
  rs5?: number | null;
  /** RS rating history, last 30 sessions (sparkline + heat strip) */
  rsh?: (number | null)[] | null;
  tt?: boolean;
  nh?: boolean;
  nhv?: boolean;
  bo?: number | null;
  traded?: boolean;
}

export interface SectorHeatRow {
  sector: string;
  scores: (number | null)[];
  n?: number | null;
  pct50?: number | null;
  pct200?: number | null;
  nhnl?: number | null;
  ad10?: number | null;
  mom10?: number | null;
  rs?: number | null;
  rs21?: number | null;
  rsh?: (number | null)[] | null;
}

export interface SectorPerfRow {
  name: string;
  rank: Record<string, number>;
  rank_chg: Record<string, number>;
  stocks?: number;
  rs?: number | null;
  rs21?: number | null;
  rsh?: (number | null)[] | null;
  [period: string]: unknown;
}

/* ===================================================================== palettes */

/** Weinstein stage badge colours (reference STCOL). */
export const STAGE_COLORS: Record<number, string> = {
  1: 'var(--text2)',
  2: 'var(--blue)',
  3: 'var(--yellow)',
  4: 'var(--magenta)',
};

/** Library verdict tag colours (reference TAG). */
export const VERDICT_COLORS: Record<string, string> = {
  warning: 'var(--critical)',
  context: 'var(--text2)',
  'no edge': 'var(--warn)',
};

/** Signal-status colour (reference stCol). */
export function statusColor(status: string): string {
  return status === 'scored'
    ? 'var(--good)'
    : status.startsWith('indicative')
      ? 'var(--warn)'
      : 'var(--text2)';
}

/**
 * Sector heat colour — the exact CR3 palette (heatRGB: red → amber → green
 * with theme-blended fill and auto text contrast, reference template lines
 * 203-205). `v` is a 0-100 score. Kept string-returning for legacy callers;
 * prefer heatCellStyle() so cells also carry data-heat for the theme toggle.
 */
export function heatColor(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return 'var(--surface2)';
  return heatStyle(v / 100);
}

/** Parses a heatStyle() css string into a React style object. */
export function heatReactStyle(css: string): React.CSSProperties {
  const out: Record<string, string> = {};
  css.split(';').forEach((d) => {
    const i = d.indexOf(':');
    if (i < 0) return;
    const prop = d.slice(0, i).trim();
    const val = d.slice(i + 1).trim();
    const camel = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[camel] = val;
  });
  return out as React.CSSProperties;
}

/** Cell props for a heat-score td: reference `<td data-heat=… style=heatStyle>`. */
export function heatCellStyle(t: number | null | undefined, alpha?: number): React.CSSProperties | undefined {
  if (t == null || Number.isNaN(t)) return undefined;
  return heatReactStyle(heatStyle(t, alpha));
}

/** td props for a 0-100 sector score cell (data-heat lets the theme re-ink it). */
export function heatCellProps(v: number | null | undefined): { style?: React.CSSProperties; 'data-heat'?: string } {
  if (v == null || Number.isNaN(v)) return { style: { background: 'var(--surface2)' } };
  const t = v / 100;
  return { style: heatReactStyle(heatStyle(t)), 'data-heat': String(t) };
}

/** RS background for a name/row cell when PREFS.rscolor is on (reference style attr). */
export function rsCellBg(v: number | null | undefined): React.CSSProperties | undefined {
  if (!getPrefs().rscolor || v == null) return undefined;
  return heatReactStyle(rsColor(v));
}

/* ===================================================================== cell helpers */

/** Header caption for a StockTable column (reference H map). */
export const COL_HEADERS: Record<string, string> = {
  sym: 'Symbol',
  name: 'Company',
  group: 'Group',
  close: 'Close',
  d1: '1D',
  m1: '1M',
  m3: '3M',
  rs: 'RS (Δ21d · 30d)',
  vs50: 'vs 50DMA',
  vs200: 'vs 200DMA',
  hi52: 'from 52w high',
  lo52: 'from 52w low',
  stage: 'Stage',
  rvol: 'Rel. vol',
  bo: 'Breakout vol',
  flags: 'Flags',
};

/** Default column set of the reference stockTable. */
export const DEFAULT_COLS = [
  'sym', 'name', 'group', 'close', 'd1', 'm1', 'm3', 'rs', 'vs50', 'vs200',
  'hi52', 'lo52', 'stage', 'rvol', 'bo', 'flags',
];

/** Text a cell contributes to filter + CSV + sort (keeps '+'/'−' out of numbers). */
export function stockCellText(r: StockRow, col: string): string {
  switch (col) {
    case 'sym': return String(r.sym);
    case 'name': return `${r.name ?? ''}${r.traded === false ? ' (no trade)' : ''}`;
    case 'group': return r.group ?? '';
    case 'close': return fmt(r.close ?? null, 2);
    case 'rs': return r.rs == null ? '—' : String(r.rs);
    case 'stage': return r.stage == null ? '—' : String(r.stage);
    case 'rvol': return fmt(r.rvol ?? null, 2);
    case 'bo': return r.bo == null ? '—' : `${fmt(r.bo, 1)}×`;
    case 'flags': {
      const out: string[] = [];
      if (r.tt) out.push('TT');
      if (r.nhv) out.push('NH·vol');
      else if (r.nh) out.push('NH');
      return out.join(' ');
    }
    default: {
      const v = num((r as unknown as Record<string, unknown>)[col]);
      return v == null ? '—' : pct(v);
    }
  }
}

/** Numeric key for sorting (nulls last, like the reference val()). */
export function stockSortValue(r: StockRow, col: string): number | string {
  switch (col) {
    case 'sym': return r.sym;
    case 'name': return (r.name ?? '').toLowerCase();
    case 'group': return (r.group ?? '').toLowerCase();
    case 'flags': return (r.tt ? 2 : 0) + (r.nhv ? 1 : 0) + (r.nh ? 0.5 : 0);
    default: {
      const v = num((r as unknown as Record<string, unknown>)[col]);
      return v == null ? Number.NEGATIVE_INFINITY : v;
    }
  }
}

/* ===================================================================== chrome */

export function Kpi({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: string }) {
  return (
    <div className="kpi" style={tone ? { borderColor: tone } : undefined}>
      <div className="l">{label}</div>
      <div className="v">{value}</div>
      {sub ? <div className="d">{sub}</div> : null}
    </div>
  );
}

export function Card({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="hd">
        <h3>{title}</h3>
        <span className="sp" />
        {actions}
      </div>
      {children}
    </div>
  );
}

export function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="tag" style={{ background: color }}>
      {children}
    </span>
  );
}

export function StageBadge({ stage }: { stage: number | null | undefined }) {
  if (stage == null) return <>—</>;
  return (
    <span className="stg-b" style={{ background: STAGE_COLORS[stage] ?? 'var(--text2)' }}>
      {stage}
    </span>
  );
}

/* ===================================================================== RS cells (CR3) */

/**
 * 30-day RS sparkline — reference rsSpark (template line 207): 44×14 SVG
 * polyline, nulls skipped, stroke = --up when the window rose, --down when it
 * fell. Returns null when fewer than 5 points exist (reference behaviour).
 */
export function RsSpark({ hist }: { hist: (number | null)[] | null | undefined }) {
  const a = (hist ?? []).filter((x): x is number => x != null);
  if (a.length < 5) return null;
  const w = 44, ht = 14;
  const mn = Math.min(...a), mx = Math.max(...a), rg = (mx - mn) || 1;
  const src = hist as (number | null)[];
  const pts = src
    .map((v, i) => (v == null ? null : `${((i / (src.length - 1)) * w).toFixed(1)},${(ht - 1 - ((v - mn) / rg) * (ht - 2)).toFixed(1)}`))
    .filter(Boolean)
    .join(' ');
  const up = a[a.length - 1] >= a[0];
  return (
    <svg width={w} height={ht} style={{ verticalAlign: 'middle', marginLeft: 5 }} role="img" aria-label="RS rating, last 30 days">
      <title>RS rating, last 30 days</title>
      <polyline points={pts} fill="none" stroke={up ? 'var(--up)' : 'var(--down)'} strokeWidth={1.3} />
    </svg>
  );
}

/** Δ21 arrow chip — reference rsCell's `arr` span (▲/▼/• + |Δ|, theme colours). */
export function RsDelta({ d }: { d: number | null | undefined }) {
  if (d == null) return null;
  return (
    <span
      title="RS change vs 21 days ago"
      style={{ fontSize: 10, marginLeft: 4, color: d > 0 ? 'var(--up)' : d < 0 ? 'var(--down)' : 'var(--text2)' }}
    >
      {d > 0 ? '▲' : d < 0 ? '▼' : '•'}{Math.abs(d)}
    </span>
  );
}

/**
 * The interactive RS table cell — reference rsCell(rs,d,h,extra) (template
 * line 206): bold nowrap td, rsColor heat background when PREFS.rscolor, Δ21
 * arrow and the 30-day sparkline. `tag` is a pre-existing <td> slot, so this
 * renders the td itself.
 */
export function RsCell({
  rs,
  d,
  h,
  extra,
}: {
  rs: number | null | undefined;
  d?: number | null;
  h?: (number | null)[] | null;
  extra?: React.CSSProperties;
}) {
  if (rs == null) return <td>—</td>;
  const P = getPrefs();
  return (
    <td
      data-heat={P.rscolor ? String((rs - 1) / 98) : undefined}
      style={{ fontWeight: 700, whiteSpace: 'nowrap', ...(P.rscolor ? heatReactStyle(rsColor(rs)) : undefined), ...extra }}
    >
      {rs}
      <RsDelta d={d} />
      {P.rscolor && h ? <RsSpark hist={h} /> : null}
    </td>
  );
}

/** Placeholder line while a table payload is in flight / failed. */
export function TableStatus({ loading, error, loadingText }: { loading: boolean; error: string | null; loadingText: string }) {
  if (error) return <div className="breadth-error">Failed to load table — {error}</div>;
  if (loading) return <p className="note">{loadingText}…</p>;
  return null;
}

/* ===================================================================== stock data */

export interface OhlcWindow {
  symbol: string;
  dates: string[];
  tasi: number[];
  data: { o: number[]; h: number[]; l: number[]; c: number[]; v: number[]; m50: number[]; m150: number[]; m200: number[] };
}

/** Lazily loads (and memoises per symbol) the 260-day OHLC window for the modal. */
export function useOhlcSymbol(sym: number | null): { data: OhlcWindow | null; loading: boolean; error: string | null } {
  const [state, setState] = useState<{ data: OhlcWindow | null; loading: boolean; error: string | null }>({
    data: null, loading: false, error: null,
  });
  useEffect(() => {
    if (sym == null) return;
    let alive = true;
    setState((s) => ({ data: s.data, loading: true, error: null }));
    fetchOhlcSymbol(sym)
      .then((d) => alive && setState({ data: d as unknown as OhlcWindow, loading: false, error: null }))
      .catch((e) => alive && setState({ data: null, loading: false, error: (e as Error).message }));
    return () => { alive = false; };
  }, [sym]);
  return state;
}

/** Last numeric reading of a stored series (used by the library verdict table). */
export function lastVal(series: Record<string, SeriesVal[]> | undefined, key: string): number | null {
  const a = series?.[key];
  if (!a || !a.length) return null;
  for (let i = a.length - 1; i >= 0; i--) {
    const v = num(a[i]);
    if (v != null) return v;
  }
  return null;
}

/**
 * Shared "open the stock chart modal" state for the table pages (reference
 * openStock/closeModal): the row lookup keeps the header meta instant while the
 * OHLC window streams in.
 */
export function useStockModal(rows: StockRow[] | null) {
  const [sym, setSym] = useState<number | null>(null);
  const row = useMemo(
    () => (sym == null ? null : (rows?.find((r) => r.sym === sym) ?? ({ sym, name: '', group: '' }) as StockRow)),
    [rows, sym],
  );
  return { sym, row, open: setSym, close: () => setSym(null) };
}

/* ===================================================================== stock maps */

/** Flattens /stocks into every row, indexed by symbol (modal header + name lists). */
export function indexBySymbol(groups: unknown): Map<number, StockRow> {
  const map = new Map<number, StockRow>();
  const g = groups as Record<string, StockRow[]> | undefined;
  if (!g) return map;
  for (const key of Object.keys(g)) {
    for (const r of g[key] ?? []) map.set(r.sym, r);
  }
  return map;
}

/**
 * Stocks of one sector (reference sectorStocks): the heat table is keyed by the
 * pooled group name, so 'Other' collects every pool member instead of a group.
 */
export function sectorStocks(name: string, groups: unknown, pool: unknown): StockRow[] {
  const g = groups as Record<string, StockRow[]> | undefined;
  const p = pool as Record<string, string> | undefined;
  if (name === 'Other') {
    const out: StockRow[] = [];
    for (const key of Object.keys(p ?? {})) {
      if (p![key] !== 'Other') continue;
      out.push(...(g?.[key] ?? []));
    }
    return out;
  }
  return g?.[name] ?? [];
}

export { fmt, num, pct, signClass };
