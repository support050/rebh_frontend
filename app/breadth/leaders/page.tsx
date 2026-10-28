'use client';
/**
 * /breadth/leaders — Leaders & Minervini Trend Template.
 *
 * Chart column is the verified #ld-stack port; below/above it sits the
 * reference page's interactive layer: the three-KPI row, the leaders table,
 * the new-52-week-highs-on-volume list and the full-universe screener — all
 * rendered by the shared StockTable off /stocks, with the stock chart modal on
 * symbol click (1:1 with the client dashboard).
 */
import React, { useMemo } from 'react';
import { BreadthView, PageHead, RangeToolbar, StackMount } from '../_lib/BreadthView';
import { idxPanel, IDX_KEYS } from '../_lib/panels';
import { useBreadthStore } from '../_lib/store';
import { fetchStocks, useTableData } from '../_lib/tableApi';
import StockTable, { TableGate } from '../_lib/StockTable';
import StockChartModal from '../_lib/StockChartModal';
import { fmt, Kpi, useStockModal } from '../_lib/ui';
import type { StockRow } from '../_lib/ui';
import { num } from '../_lib/format';
import type { PanelDef } from '../_engine/types';
import type { BreadthStocks } from '@/types/breadth';

export const PANELS: PanelDef[] = [
  idxPanel({ regimeStrip: true }),
  {
    title: '% passing the Minervini trend template',
    height: 130,
    series: [{ key: 'pct_minervini', color: '--yellow', label: '% template' }],
    zero: true,
  },
  {
    title: 'New 52-week highs on volume (bars) vs all new highs (line)',
    height: 110,
    series: [
      { key: 'new_highs_vol', type: 'bar', color: '--up', label: 'NH on volume' },
      { key: 'new_highs', color: '--text2', label: 'NH', width: 1 },
    ],
    zero: true,
  },
];

const KEYS = [
  ...IDX_KEYS,
  'pct_minervini', 'n_minervini', 'new_highs_vol', 'new_highs', 'pct_stage2', 'pct_stage2_w',
];

/** Adapts the raw /stocks payload to the typed rows the tables render. */
function asRows(list: unknown): StockRow[] {
  return (list ?? []) as StockRow[];
}
function universe(data: BreadthStocks | null): StockRow[] {
  if (!data?.stocks) return [];
  return Object.keys(data.stocks).reduce<StockRow[]>((acc, g) => acc.concat(asRows(data.stocks[g])), []);
}

function LeadersBody() {
  const { data, loading, error } = useTableData(fetchStocks);
  const rows = useMemo(() => universe(data), [data]);
  const leaders = useMemo(() => asRows(data?.leaders), [data]);
  const nhv = useMemo(() => asRows(data?.nh_vol_list), [data]);
  const screener = useMemo(() => rows.slice().sort((a, b) => (b.rs ?? 0) - (a.rs ?? 0)), [rows]);
  const modal = useStockModal(rows.length ? rows : leaders);

  const series = useBreadthStore((s) => s.series);
  const dates = useBreadthStore((s) => s.dates);
  const today = useBreadthStore((s) => s.today);
  const last = (k: string) => num(series[k]?.[dates.length - 1]);
  const snapshot = today?.date ?? '';

  return (
    <div className="space-y-3">
      <PageHead
        title="Leaders & Trend Template (Minervini)"
        note="A stock passes the trend template when: price > MA150 > MA200, MA200 rising ≥ 20 days, MA50 > MA150, price > MA50, price ≥ 1.25× 52-week low, price ≥ 0.75× 52-week high, and RS percentile ≥ 70 (6-month return within the universe). RS = IBD-style rating 1–99 (2×3M + 6M + 9M + 12M return, ranked across the universe). Breakout vol = volume on the last cross above the 150-day MA ÷ 50-day average (Weinstein: a Stage-2 breakout needs volume expansion). Click a symbol for its chart."
      />

      <div className="kpis">
        <Kpi
          label="Pass the template"
          value={data ? fmt(leaders.length) : '—'}
          sub={`${fmt(last('pct_minervini'), 1)}% of ${fmt(last('n_minervini'))} eligible`}
        />
        <Kpi
          label="New 52w highs on volume"
          value={fmt(last('new_highs_vol'))}
          sub={`of ${fmt(last('new_highs'))} new highs today`}
        />
        <Kpi
          label="Stage 2 (daily / weekly)"
          value={`${fmt(last('pct_stage2'))}% / ${fmt(last('pct_stage2_w'))}%`}
          sub="150d MA proxy / 30-week MA"
        />
      </div>

      <RangeToolbar />
      <StackMount panels={PANELS} />

      <TableGate loading={loading} error={error} loadingText="loading leaders table">
        <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
          Stocks passing the trend template today — by RS
        </h2>
        <div className="tblwrap" style={{ maxHeight: 600 }}>
          <StockTable rows={leaders} csvName="leaders" csvDate={snapshot} onSymbol={modal.open} />
        </div>

        <h2 className="text-sm font-bold mt-4" style={{ color: 'var(--text)' }}>
          New 52-week highs on volume expansion today
        </h2>
        {nhv.length ? (
          <div className="tblwrap">
            <StockTable rows={nhv} csvName="new_highs_volume" csvDate={snapshot} onSymbol={modal.open} />
          </div>
        ) : (
          <p className="note">None today.</p>
        )}

        <h2 className="text-sm font-bold mt-4" style={{ color: 'var(--text)' }}>
          All active stocks — screener
        </h2>
        <div className="tblwrap" style={{ maxHeight: 600 }}>
          <StockTable rows={screener} csvName="universe" csvDate={snapshot} onSymbol={modal.open} />
        </div>
      </TableGate>

      <StockChartModal sym={modal.sym} row={modal.row} onClose={modal.close} />
    </div>
  );
}

export default function LeadersPage() {
  return (
    <BreadthView keys={KEYS}>
      <LeadersBody />
    </BreadthView>
  );
}
