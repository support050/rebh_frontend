'use client';
/**
 * /breadth/conc — Concentration: Equal-Weight TASI vs cap-weighted TASI.
 * Faithful port of the reference #cc-stack (5 panels, first rebased).
 */
import React from 'react';
import { ChartPage } from '../_lib/BreadthView';
import type { PanelDef } from '../_engine/types';

const PANELS: PanelDef[] = [
  {
    title: 'TASI (blue) vs Equal-Weight TASI (orange) — rebased at window start',
    height: 240,
    series: [
      { key: 'tasi', color: '--blue', label: 'TASI' },
      { key: 'ew', color: '--orange', label: 'EW-TASI' },
    ],
    rebase: true,
    regimeStrip: true,
  },
  {
    title: 'EW − TASI 60-day spread (pct points)',
    height: 140,
    series: [{ key: 'spread_60', type: 'hist', color: '--blue', label: '60d spread' }],
    zero: true,
    hlines: [{ y: 5, color: '--aqua', label: '+5' }, { y: -5, color: '--red', label: '−5' }],
  },
  {
    title: 'EW − TASI 20-day spread',
    height: 110,
    series: [{ key: 'spread_20', type: 'hist', color: '--blue', label: '20d spread' }],
    zero: true,
  },
  {
    title: 'EW/TASI ratio vs its 50-day MA',
    height: 120,
    series: [
      { key: 'ratio', color: '--violet', label: 'ratio' },
      { key: 'ratio_ma', color: '--text2', label: 'MA50', width: 1 },
    ],
  },
  {
    title: "Share of the day's move explained by the top 5 names (2026+)",
    height: 100,
    series: [{ key: 'top5_share', type: 'bar', color: '--yellow', label: 'top-5 share' }],
    ylim: [0, 1],
  },
];

const KEYS = ['tasi', 'ew', 'spread_60', 'spread_20', 'ratio', 'ratio_ma', 'top5_share'];

export default function ConcPage() {
  return (
    <ChartPage
      title="Concentration — Equal-Weight TASI vs cap-weighted TASI"
      note="EW-TASI = daily mean return of the universe, chained from 2002. Spread = EW return − TASI return over 20/60 days (pct points). OOS: 60d spread < −5 (mega-caps masking weakness) → −0.6% / 60d, hit 43% — the only negative state in the engine; > +5 → +2.7%. Top-5 contribution uses a 15%-capped cap-weighted proxy (0.99 correlation with TASI) from Jan-2026. Concentration-family indicators are shown for context only and are not scored."
      keys={KEYS}
      panels={PANELS}
    />
  );
}
