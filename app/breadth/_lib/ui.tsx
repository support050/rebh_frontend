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
}

export interface SectorPerfRow {
  name: string;
  rank: Record<string, number>;
  rank_chg: Record<string, number>;
  stocks?: number;
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
 * Sector heat colour (reference col): score 50 is the divide, red below,
 * green above, opacity scaled by distance from 50.
 */
export function heatColor(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return 'var(--surface2)';
  const t = (v - 50) / 50;
  const a = Math.min(1, Math.abs(t));
  return t < 0 ? `rgba(227,73,72,${(0.15 + 0.7 * a).toFixed(3)})` : `rgba(27,175,122,${(0.15 + 0.7 * a).toFixed(3)})`;
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
  rs: 'RS',
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
