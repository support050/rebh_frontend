'use client';
/**
 * /breadth/ma — % of stocks above moving averages + Weinstein stages + Minervini.
 * Faithful port of the reference #ma-stack (7 panels).
 */
import React from 'react';
import { ChartPage } from '../_lib/BreadthView';
import { idxPanel, IDX_KEYS } from '../_lib/panels';
import type { PanelDef } from '../_engine/types';

export const PANELS: PanelDef[] = [
  idxPanel(),
  {
    title: '% above 200 DMA',
    height: 140,
    series: [{ key: 'pct_above_sma200', color: '--blue', label: '%>200DMA' }],
    ylim: [0, 100],
    zones: [
      { from: 60, to: 80, color: '--zone-hi' },
      { from: 80, to: 100, color: '--zone-lo' },
      { from: 0, to: 20, color: '--zone-lo' },
    ],
    hlines: [{ y: 20 }, { y: 80 }],
  },
  {
    title: '% above 150 DMA and 100 DMA',
    height: 110,
    series: [
      { key: 'pct_above_sma150', color: '--aqua', label: '%>150DMA' },
      { key: 'pct_above_sma100', color: '--text2', label: '%>100DMA', width: 1 },
    ],
    ylim: [0, 100],
    hlines: [{ y: 20 }, { y: 80 }],
  },
  {
    title: '% above 50 DMA (thrust rule 20→55 within 15 days)',
    height: 130,
    series: [{ key: 'pct_above_sma50', color: '--orange', label: '%>50DMA' }],
    ylim: [0, 100],
    hlines: [{ y: 20, color: '--aqua' }, { y: 55, color: '--red' }, { y: 80 }],
    events: [{ key: 'pct50', color: '--blue' }],
  },
  {
    title: '% above 20 DMA and 10 EMA',
    height: 110,
    series: [
      { key: 'pct_above_sma20', color: '--violet', label: '%>20DMA' },
      { key: 'pct_above_ema10', color: '--magenta', label: '%>10EMA' },
    ],
    ylim: [0, 100],
    hlines: [{ y: 20 }, { y: 80 }],
  },
  {
    title: 'Weinstein stages — daily proxy (150d MA): % in Stage 1 / 2 / 3 / 4',
    height: 140,
    series: [
      { key: 'pct_stage1', color: '--text2', label: 'Stage 1', width: 1 },
      { key: 'pct_stage2', color: '--blue', label: 'Stage 2' },
      { key: 'pct_stage3', color: '--yellow', label: 'Stage 3', width: 1 },
      { key: 'pct_stage4', color: '--magenta', label: 'Stage 4' },
    ],
    ylim: [0, 100],
  },
  {
    title: 'Weinstein stages — WEEKLY bars, 30-week MA, 4-week slope (his original setting)',
    height: 140,
    series: [
      { key: 'pct_stage1_w', color: '--text2', label: 'Stage 1 wk', width: 1 },
      { key: 'pct_stage2_w', color: '--blue', label: 'Stage 2 wk' },
      { key: 'pct_stage3_w', color: '--yellow', label: 'Stage 3 wk', width: 1 },
      { key: 'pct_stage4_w', color: '--magenta', label: 'Stage 4 wk' },
    ],
    ylim: [0, 100],
  },
  {
    title: 'Stocks in Stage 2 (count) vs Minervini trend template (%)',
    height: 110,
    series: [
      { key: 'stage2', type: 'bar', color: '--blue', label: '# Stage 2' },
      { key: 'pct_minervini', color: '--yellow', label: '% Minervini' },
    ],
    zero: true,
  },
];

const KEYS = [
  ...IDX_KEYS,
  'pct_above_sma200', 'pct_above_sma150', 'pct_above_sma100', 'pct_above_sma50',
  'pct_above_sma20', 'pct_above_ema10',
  'pct_stage1', 'pct_stage2', 'pct_stage3', 'pct_stage4',
  'pct_stage1_w', 'pct_stage2_w', 'pct_stage3_w', 'pct_stage4_w',
  'stage2', 'pct_minervini',
];

export default function MaPage() {
  return (
    <ChartPage
      title="% of stocks above moving averages · Weinstein stages · Minervini"
      note="Weinstein stages are shown twice: the daily proxy (150-day MA, faster) and his original weekly setting (30-week MA on weekly closes, slope over 4 weeks) — the weekly version changes state less often and is the one to trust for stage transitions. Hisham: 80% = optimism peak (overbought), 20% = pessimism peak (oversold); %>200DMA is the most reliable but lags. TASI finding (walk-forward): the 60–80 band on %>200DMA is the topping zone (−2.9% / 60d), while >80 is the best state (+5.5%, 82% hit) and <20 a washout bounce (+2.8%)."
      keys={KEYS}
      panels={PANELS}
    />
  );
}
