'use client';
/**
 * /breadth/cycle — Deepvue-style Market Cycle (trend count vs the SMA).
 *
 * Reference #p-cycle ported 1:1: the 21-day / 50-day average switch (swaps the
 * SMA line, the cycle-count series and the stress dots — the template's
 * setCycleMA), the today-counts line in the note, the verified #cy-stack
 * charts, and the 12-card Breadth board (mini histograms + today's value,
 * reference #cy-board). dv_cycle / dv_cycle50 / dv_stress(50) are stored
 * server-side, so this page needs no browser derivation.
 */
import React, { useMemo, useState } from 'react';
import { BreadthView, PageHead, RangeToolbar, StackMount } from '../_lib/BreadthView';
import { idxPanel, IDX_KEYS, SCORE_HLINES } from '../_lib/panels';
import { useBreadthStore } from '../_lib/store';
import { fmt, num } from '../_lib/ui';
import type { PanelDef } from '../_engine/types';

/** Breadth board cards — [series key, label] (reference board list). */
const BOARD: [string, string][] = [
  ['net_nh_nl', 'Net new highs − new lows (52w)'],
  ['ad_net', 'Advances − declines'],
  ['up_x', 'Up 4% (with volume)'],
  ['down_x', 'Down 4% (with volume)'],
  ['pct_above_sma20', '% above 20 DMA'],
  ['pct_above_sma50', '% above 50 DMA'],
  ['pct_above_sma200', '% above 200 DMA'],
  ['up_25_q', 'Up 25%+ in a quarter'],
  ['down_25_q', 'Down 25%+ in a quarter'],
  ['stage2', 'Stocks in Stage 2'],
  ['stage4', 'Stocks in Stage 4'],
  ['n_healthy', 'Healthy sectors'],
];

const NET_KEYS = new Set(['net_nh_nl', 'ad_net']);

/** Stable per-key mini panel columns (reference new Stack($('#mini-'+k),…)). */
const MINI: Record<string, PanelDef[]> = {};
for (const [k, label] of BOARD) {
  MINI[k] = [
    {
      title: '',
      mini: true,
      height: 64,
      series: [
        {
          key: k,
          type: NET_KEYS.has(k) ? 'hist' : 'bar',
          color: k.startsWith('down') || k === 'stage4' ? '--down' : '--blue',
          label,
        },
      ],
      zero: true,
    },
  ];
}

const KEYS = [
  ...IDX_KEYS,
  'tasi_sma21', 'tasi_sma50', 'dv_cycle', 'dv_cycle50', 'score_smooth',
  ...BOARD.map(([k]) => k),
];

function CycleBody() {
  const [ma, setMa] = useState<21 | 50>(21);
  const series = useBreadthStore((s) => s.series);
  const dates = useBreadthStore((s) => s.dates);
  const N = dates.length;

  const cv21 = num(series.dv_cycle?.[N - 1]);
  const cv50 = num(series.dv_cycle50?.[N - 1]);

  // Reference setCycleMA: swap SMA line + stress events + cycle-count series.
  const panels = useMemo<PanelDef[]>(
    () => [
      idxPanel({
        series: [
          { key: 'tasi', type: 'candle', color: '--text', label: 'TASI' },
          { key: 'tasi', type: 'line', color: '--blue', label: 'TASI', width: 1.2 },
          ma === 50
            ? { key: 'tasi_sma50', color: '--orange', label: 'SMA 50', width: 1 }
            : { key: 'tasi_sma21', color: '--orange', label: 'SMA 21', width: 1 },
        ],
        events: [{ key: ma === 50 ? 'dv_stress50' : 'dv_stress', color: '--yellow', dot: true, pos: 'top' }],
      }),
      {
        title: `DV-style Market Cycle count (days above / below the ${ma}-day SMA)`,
        height: 140,
        series: [
          ma === 50
            ? { key: 'dv_cycle50', type: 'hist', color: '--blue', label: 'cycle count' }
            : { key: 'dv_cycle', type: 'hist', color: '--blue', label: 'cycle count' },
        ],
        zero: true,
        events: [{ key: ma === 50 ? 'dv_stress50' : 'dv_stress', color: '--yellow', dot: true, pos: 'top' }],
      },
      {
        title: 'Breadth Score & regime (for context)',
        height: 110,
        series: [{ key: 'score_smooth', color: '--orange', label: 'Score EMA5' }],
        ylim: [0, 100],
        hlines: SCORE_HLINES,
      },
    ],
    [ma],
  );

  const count = (v: number | null | undefined) => (
    <b style={{ color: (v ?? 0) >= 0 ? 'var(--up)' : 'var(--down)' }}>
      {v != null && v >= 0 ? '+' : ''}
      {fmt(v)}
    </b>
  );

  return (
    <div className="space-y-3">
      <PageHead
        title="Market Cycle — Deepvue-style trend count on TASI"
        note={
          <>
            Counts the consecutive days TASI closes <b>above</b> its 21-day SMA (green, +1 per day) or{' '}
            <b>below</b> it (red, −1 per day); the count restarts when the index crosses the average. Orange dots
            = <b>stress tests</b>: a dip below the average lasting ≤ 3 days inside the first 60 days of an uptrend
            that the trend survived. Today: {count(cv21)} days on the 21-day · {count(cv50)} on the 50-day.
            (Deepvue&apos;s exact formula is proprietary; this is the documented mechanic — count up above a chosen
            MA, negative count below — reproduced on TASI on two averages: 21-day for the swing cycle, 50-day for
            the intermediate cycle.)
          </>
        }
      />

      <div className="breadth-toolbar">
        <span className="lbl">Average</span>
        {([21, 50] as const).map((m) => (
          <button key={m} className={`btn${ma === m ? ' active' : ''}`} onClick={() => setMa(m)}>
            {m}-day
          </button>
        ))}
      </div>

      <RangeToolbar />
      <StackMount panels={panels} />

      <div>
        <h2 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>
          Breadth board — last 250 days
        </h2>
        <p className="note">
          Each card is a mini histogram of one breadth series with today&apos;s value; hover for the daily
          readings. Green above zero / red below for net series.
        </p>
        <div className="kpis">
          {BOARD.map(([k, label]) => (
            <div key={k} className="kpi">
              <div className="l">{label}</div>
              <div className="v">{fmt(num(series[k]?.[N - 1]))}</div>
              <StackMount panels={MINI[k]} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CyclePage() {
  return (
    <BreadthView keys={KEYS}>
      <CycleBody />
    </BreadthView>
  );
}
