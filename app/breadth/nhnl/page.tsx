'use client';
/**
 * /breadth/nhnl — New 52-week Highs / Lows (the canary).
 * Faithful port of the reference #nh-stack plus the "Canary episodes on TASI
 * (2007–2026)" table under the charts (template #p-nhnl): open episodes are
 * bold + ACTIVE, and the footer averages the closed ones.
 */
import React from 'react';
import { BreadthView, PageHead, RangeToolbar, StackMount } from '../_lib/BreadthView';
import { idxPanel, IDX_KEYS } from '../_lib/panels';
import { useBreadthStore } from '../_lib/store';
import { Tag, fmt, signClass } from '../_lib/ui';
import type { BreadthEventsCanaryItem } from '@/types/breadth';
import type { PanelDef } from '../_engine/types';

export const PANELS: PanelDef[] = [
  idxPanel({ episodes: true }),
  {
    title: 'New highs (green) / new lows (red)',
    height: 130,
    series: [
      { key: 'new_highs', type: 'bar', color: '--up', label: 'New highs' },
      { key: 'new_lows', type: 'bar', color: '--down', label: 'New lows' },
    ],
    zero: true,
  },
  {
    title: 'Net NH−NL (daily)',
    height: 130,
    series: [{ key: 'net_nh_nl', type: 'hist', color: '--blue', label: 'Net' }],
    zero: true,
    episodes: true,
    hlines: [
      { y: -23, color: '--aqua', label: '−23 (5th pct)' },
      { y: 16, color: '--red', label: '+16 (95th pct)' },
    ],
  },
  {
    title: 'NH−NL 5-day sum vs canary threshold (−75% of universe)',
    height: 150,
    series: [
      { key: 'nhnl_sum5', type: 'hist', color: '--blue', label: '5-day sum' },
      { key: 'nhnl_thr', color: '--red', label: 'canary line', width: 1 },
    ],
    zero: true,
    episodes: true,
  },
  {
    title: 'High-Low Index (10d MA of NH/(NH+NL))',
    height: 120,
    series: [{ key: 'hl_index', color: '--orange', label: 'HL index' }],
    ylim: [0, 1],
    zones: [{ from: 0.3, to: 0.7, color: '--zone-hi' }],
    hlines: [{ y: 0.3 }, { y: 0.7 }],
  },
];

const KEYS = [...IDX_KEYS, 'new_highs', 'new_lows', 'net_nh_nl', 'nhnl_sum5', 'nhnl_thr', 'hl_index'];

/** "Canary episodes on TASI (2007–2026)" — header order and footer exactly as the template. */
export function CanaryTable({ episodes }: { episodes: BreadthEventsCanaryItem[] }) {
  if (!episodes.length) return null;
  const closed = episodes.filter((e) => e.pct != null);
  const mean = (get: (e: BreadthEventsCanaryItem) => number) =>
    closed.length ? closed.reduce((a, e) => a + get(e), 0) / closed.length : null;
  const avgPct = mean((e) => e.pct);
  const avgDays = mean((e) => e.days);
  const avgMax = mean((e) => e.max_read);
  const ddClosed = closed.filter((e) => e.dd != null);
  const avgDd = ddClosed.length ? ddClosed.reduce((a, e) => a + (e.dd ?? 0), 0) / ddClosed.length : null;

  return (
    <div className="space-y-1.5">
      <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
        Canary episodes on TASI (2007–2026)
      </h2>
      <div className="tblwrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Start</th>
              <th>Close</th>
              <th>End</th>
              <th>Close</th>
              <th>% Change</th>
              <th>Days</th>
              <th>Max reading</th>
              <th>Max 5d sum</th>
              <th>Lowest low</th>
              <th>% Max DD</th>
            </tr>
          </thead>
          <tbody>
            {episodes.map((e, k) => (
              <tr key={`${e.start}-${k}`} style={e.open ? { fontWeight: 700 } : undefined}>
                <td>{k + 1}</td>
                <td>{e.start}</td>
                <td>{fmt(e.c0)}</td>
                <td>
                  {e.end}
                  {e.open ? (
                    <>
                      {' '}
                      <Tag color="var(--critical)">ACTIVE</Tag>
                    </>
                  ) : null}
                </td>
                <td>{fmt(e.c1)}</td>
                <td className={signClass(e.pct ?? 0)}>{e.pct == null ? '—' : e.pct.toFixed(1)}</td>
                <td>{e.days}</td>
                <td>{e.max_read}</td>
                <td>{e.sum5}</td>
                <td>{fmt(e.low)}</td>
                <td className="neg">{e.dd == null ? '—' : e.dd.toFixed(1)}</td>
              </tr>
            ))}
            <tr>
              <th>Avg (closed)</th>
              <th colSpan={4} />
              <th>{avgPct == null ? '—' : avgPct.toFixed(1)}</th>
              <th>{avgDays == null ? '—' : Math.round(avgDays)}</th>
              <th>{avgMax == null ? '—' : Math.round(avgMax)}</th>
              <th />
              <th />
              <th>{avgDd == null ? '—' : avgDd.toFixed(1)}</th>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="note">
        Reading: on TASI the episode usually ends <b>above</b> its start (extreme NH−NL readings
        arrive late — the sell-off is mostly done), but the average max drawdown inside an episode
        is ≈ −11% and 12/15 episodes fell ≥3%. Use it as a risk-management flag, not an exit signal.
      </p>
    </div>
  );
}

function NhnlBody() {
  const events = useBreadthStore((s) => s.events);
  const canary = (events?.canary ?? []) as BreadthEventsCanaryItem[];
  return (
    <div className="space-y-3">
      <PageHead
        title="New 52-week Highs / Lows — the canary in the coal mine"
        note="Rule (Hisham Naser, US): NH−NL below zero for 5 consecutive days with the 5-day sum ≤ −180/−200 → raise caution; episode ends after 5 consecutive positive days. TASI calibration: 5-day sum ≤ −75% of the eligible universe (dashed line). NH/NL are strict: close above/below the prior 252-day range, adjusted prices, ≥1 year of history."
      />
      <RangeToolbar />
      <StackMount panels={PANELS} />
      <CanaryTable episodes={canary} />
    </div>
  );
}

export default function NhnlPage() {
  return (
    <BreadthView keys={KEYS}>
      <NhnlBody />
    </BreadthView>
  );
}
