'use client';
/**
 * /breadth/ad — Advance / Decline & volume.
 * Faithful port of the reference #ad-stack (8 panels).
 */
import React from 'react';
import { ChartPage } from '../_lib/BreadthView';
import { idxPanel, IDX_KEYS } from '../_lib/panels';
import type { PanelDef } from '../_engine/types';

export const PANELS: PanelDef[] = [
  idxPanel({
    events: [
      { key: 'lowry_down', color: '--red', pos: 'top' },
      { key: 'lowry_up', color: '--aqua' },
      { key: 'lowry_seq', color: '--yellow', dot: true },
    ],
  }),
  {
    title: 'A/D line (cumulative)',
    height: 150,
    series: [{ key: 'ad_line', type: 'area', color: '--blue', label: 'A/D line' }],
  },
  {
    title: 'Advances − declines (daily)',
    height: 110,
    series: [{ key: 'ad_net', type: 'hist', color: '--blue', label: 'A−D' }],
    zero: true,
  },
  {
    title: 'Up from open (green) vs down from open (red) · Up on volume vs down on volume (lines)',
    height: 130,
    series: [
      { key: 'up_from_open', type: 'bar', color: '--up', label: 'Up from open' },
      { key: 'down_from_open', type: 'bar', color: '--down', label: 'Down from open' },
      { key: 'up_on_volume', color: '--aqua', label: 'Up on volume', width: 1.2 },
      { key: 'down_on_volume', color: '--orange', label: 'Down on volume', width: 1.2 },
    ],
    zero: true,
  },
  {
    title: 'Up/Down volume ratio (log-like view, capped)',
    height: 110,
    series: [{ key: 'ud_volume_ratio', color: '--orange', label: 'UV/DV' }],
    ylim: [0, 5],
    hlines: [{ y: 1 }],
  },
  {
    title: 'TRIN (daily) & TRIN-10',
    height: 130,
    series: [
      { key: 'trin', color: '--text2', label: 'TRIN', width: 1 },
      { key: 'trin_10', color: '--red', label: 'TRIN-10', width: 1.8 },
    ],
    ylim: [0, 3],
    zones: [
      { from: 1.2, to: 3, color: '--zone-lo' },
      { from: 0, to: 0.8, color: '--zone-hi' },
    ],
    hlines: [{ y: 1 }],
  },
  {
    title: 'Lowry conditions — up-volume share (violet) and up-points share (orange): ≤0.05 = 95% down day',
    height: 120,
    series: [
      { key: 'up_volume_pct', color: '--violet', label: 'UpVol %' },
      { key: 'up_points_pct', color: '--orange', label: 'UpPoints %', width: 1 },
    ],
    ylim: [0, 1],
    hlines: [{ y: 0.95, color: '--aqua' }, { y: 0.05, color: '--red' }],
  },
  {
    title: 'Which condition fired (1 = yes): points (orange) · volume (violet)',
    height: 70,
    series: [
      { key: 'lowry_down_points', type: 'bar', color: '--orange', label: 'points ≤5%' },
      { key: 'lowry_down_volume', type: 'bar', color: '--violet', label: 'volume ≤5%' },
    ],
    ylim: [0, 1.2],
  },
];

const KEYS = [
  ...IDX_KEYS,
  'ad_line', 'ad_net', 'up_from_open', 'down_from_open', 'up_on_volume', 'down_on_volume',
  'ud_volume_ratio', 'trin', 'trin_10', 'up_volume_pct', 'up_points_pct',
  'lowry_down_points', 'lowry_down_volume',
];

export default function AdPage() {
  return (
    <ChartPage
      title="Advance / Decline & volume"
      note="A/D line = cumulative (advances − declines) over the universe; suspended days excluded. TRIN = (A/D)/(UpVol/DownVol); TRIN-10 > 1.2 is the strongest short-term oversold state on TASI (+2.0% / 20d, 71% hit). Lowry days: a 95% day requires BOTH conditions — ≥95% of points (up-points ÷ total) and ≥95% of volume — shown separately in the bottom panel so you can see which one fired. Markers on the index: ▼ red = 95% down day (both conditions), ▲ aqua = 95% up day, ◆ yellow = Lowry sequence (95% down day followed by a ≥90% up day within 10 sessions — his major-bottom rule). Tested on TASI: the sequence has NO edge (n=43, +0.4% / 60d) and 95% up days add nothing; only the 95% down day carries +1.9% / 60d (64% hit). Kept on the chart so the rule can be judged, not scored."
      keys={KEYS}
      panels={PANELS}
    />
  );
}
