'use client';
/**
 * /breadth/bpi — Bullish Percent Index (Point & Figure, Dorsey).
 * Port of the reference #bpi-stack. bpi_state_num is derived in the browser
 * from the stored bpi_status label (see _engine/derive). The three headline
 * KPI cards mirror the template's #p-bpi kpis row (BPI today / Status / Field
 * position).
 */
import React from 'react';
import { ChartPage } from '../_lib/BreadthView';
import { idxPanel, IDX_KEYS } from '../_lib/panels';
import { useBreadthStore } from '../_lib/store';
import { Kpi, fmt, lastVal } from '../_lib/ui';
import type { PanelDef } from '../_engine/types';

/** BPI status badge colours (template SC map). */
const STATUS_COLORS: Record<string, string> = {
  'Bull Confirmed': 'var(--good)',
  'Bull Alert': 'var(--aqua)',
  'Bull Correction': 'var(--warn)',
  'Bear Alert': 'var(--serious)',
  'Bear Confirmed': 'var(--critical)',
  'Bear Correction': 'var(--text2)',
};

/** #p-bpi kpis — BPI today / Status / Field position, from today + P&F counts. */
function BpiKpis() {
  const today = useBreadthStore((s) => s.today);
  const series = useBreadthStore((s) => s.series);
  if (!today) return null;
  const buy = lastVal(series, 'pnf_buy');
  const sell = lastVal(series, 'pnf_sell');
  const status = today.bpi_status || '—';
  const field = today.bpi >= 70 ? 'Overbought' : today.bpi <= 30 ? 'Oversold' : 'Middle';
  return (
    <div className="kpis">
      <Kpi
        label="BPI today"
        value={`${fmt(today.bpi, 1)}%`}
        sub={`${fmt(buy)} on buy / ${fmt(sell)} on sell`}
      />
      <Kpi
        label="Status"
        value={
          <span className="badge" style={{ background: STATUS_COLORS[status] || 'var(--text2)' }}>
            {status}
          </span>
        }
        sub="P&F of the BPI, 2-pt boxes"
      />
      <Kpi label="Field position" value={field} sub="70 / 30 (Dorsey)" />
    </div>
  );
}

const PANELS: PanelDef[] = [
  idxPanel({ regimeStrip: true }),
  {
    title: 'Bullish Percent Index — % of stocks on a P&F buy signal',
    height: 170,
    series: [{ key: 'bpi', type: 'area', color: '--blue', label: 'BPI' }],
    ylim: [0, 100],
    zones: [
      { from: 70, to: 100, color: '--zone-hi' },
      { from: 0, to: 30, color: '--zone-lo' },
    ],
    hlines: [{ y: 30 }, { y: 50 }, { y: 70 }],
  },
  {
    title: 'Stocks on buy (green) vs sell (red) signals',
    height: 110,
    series: [
      { key: 'pnf_buy', color: '--up', label: 'buy' },
      { key: 'pnf_sell', color: '--down', label: 'sell' },
    ],
    zero: true,
  },
  {
    title: 'BPI status (3 Bull Confirmed · 2 Bull Alert · 1 Bull Correction · −1 Bear Correction · −2 Bear Alert · −3 Bear Confirmed)',
    height: 100,
    series: [{ key: 'bpi_state_num', type: 'hist', color: '--blue', label: 'status' }],
    ylim: [-3.5, 3.5],
  },
];

const KEYS = [...IDX_KEYS, 'bpi', 'pnf_buy', 'pnf_sell', 'bpi_status'];

export default function BpiPage() {
  return (
    <ChartPage
      title="Bullish Percent Index — Point & Figure (Dorsey / Chartcraft)"
      note="Every stock keeps a P&F chart (2% boxes on a log scale, 3-box reversal). A stock is on a buy signal from a double-top breakout until a double-bottom breakdown. BPI = % of eligible stocks on a buy signal. Dorsey's reading: above 70 = overbought field position, below 30 = oversold; the status comes from a P&F chart of the BPI itself (2-point boxes): Bull Confirmed / Bull Alert (reversal up from ≤30) / Bull Correction / Bear Alert (reversal down from ≥70) / Bear Confirmed / Bear Correction. TASI test: the level buckets carry no edge, the status does — Bull Alert +1.5% / 20d (60%), Bear Alert −0.8% / 20d."
      keys={KEYS}
      panels={PANELS}
      extra={<BpiKpis />}
    />
  );
}
