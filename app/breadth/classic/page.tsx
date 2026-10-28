'use client';
/**
 * /breadth/classic — StockCharts-style composite.
 * Faithful port of the reference #cl-stack (5 panels): index with EMA21/MA50/MA200,
 * direction-coloured volume, NH−NL, and both McClellan forms.
 */
import React from 'react';
import { ChartPage } from '../_lib/BreadthView';
import { IDX_KEYS } from '../_lib/panels';
import type { PanelDef } from '../_engine/types';

export const PANELS: PanelDef[] = [
  {
    title: 'TASI · EMA(21) · MA(50) · MA(200)',
    height: 300,
    series: [
      { key: 'tasi', type: 'candle', color: '--text', label: 'TASI' },
      { key: 'tasi', type: 'line', color: '--text2', label: 'close', width: 1 },
      { key: 'tasi_ema21', color: '--blue', label: 'EMA 21', width: 1.2 },
      { key: 'tasi_sma50', color: '--red', label: 'MA 50', width: 1.2 },
      { key: 'tasi_sma200', color: '--text', label: 'MA 200', width: 1.4 },
    ],
    regimeStrip: true,
  },
  {
    title: 'Volume (green = up day, red = down day)',
    height: 110,
    series: [{ key: 'tasi_vol', type: 'bar', color: '--blue', label: 'Volume', colorBy: 'tasi_chg', dec: 0 }],
    zero: true,
  },
  {
    title: 'New highs − new lows (close)',
    height: 120,
    series: [{ key: 'net_nh_nl', type: 'hist', color: '--blue', label: 'NH−NL' }],
    zero: true,
  },
  {
    title: 'McClellan Oscillator (traditional: EMA19 − EMA39 of A−D)',
    height: 120,
    series: [{ key: 'mcclellan_trad', color: '--blue', label: 'traditional' }],
    zero: true,
  },
  {
    title: 'McClellan Oscillator (ratio-adjusted)',
    height: 120,
    series: [{ key: 'mcclellan_osc', color: '--violet', label: 'ratio-adjusted' }],
    zero: true,
    hlines: [{ y: 85, color: '--red' }, { y: -85, color: '--aqua' }],
  },
];

const KEYS = [
  ...IDX_KEYS, 'tasi_ema21', 'tasi_sma50', 'tasi_sma200', 'tasi_vol', 'tasi_chg',
  'net_nh_nl', 'mcclellan_trad', 'mcclellan_osc',
];

export default function ClassicPage() {
  return (
    <ChartPage
      title="Classic chart — index with 21 EMA / 50 MA / 200 MA, volume, NH−NL, McClellan"
      note="The StockCharts layout Hisham uses for the US total market, reproduced for TASI: OHLC bars (zoom in), EMA(21) blue, MA(50) red, MA(200) black/grey; volume coloured by the day's direction; net new highs − new lows; and the McClellan Oscillator in both the traditional (EMA19−EMA39 of A−D) and ratio-adjusted forms."
      keys={KEYS}
      panels={PANELS}
    />
  );
}
