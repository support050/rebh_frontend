'use client';
/**
 * /breadth/widget — Market Breadth widget (TradingView-style gauges).
 * Port of the reference #w-stack page: the live widget card on the left (it
 * re-renders for the hovered day, like the template's 120 ms poll over
 * wStack.hover), the share panels, and the Weinstein stage panel with the
 * Daily (150d MA) / Weekly (30-week MA — Weinstein original) switch from the
 * template's setStageMode. The share gauges (w_nh/w_ad/w_open/w_vol/w_4 and
 * their _10 means) are computed in the browser by _engine/derive.
 */
import React, { useEffect, useState } from 'react';
import { BreadthView, PageHead, RangeToolbar, StackMount, useHub } from '../_lib/BreadthView';
import { idxPanel, IDX_KEYS } from '../_lib/panels';
import { useBreadthStore } from '../_lib/store';
import { fmt, num } from '../_lib/format';
import type { PanelDef, SeriesDef } from '../_engine/types';

/* ------------------------------------------------------------------ widget card */

/** The five up/down gauge rows (template widgetHTML rows, label order verbatim). */
const GAUGES: { title: string; up: string; dn: string; upLabel: string; dnLabel: string }[] = [
  { title: 'New Highs vs New Lows', up: 'new_highs', dn: 'new_lows', upLabel: 'Highs', dnLabel: 'Lows' },
  { title: 'Advance vs Decline', up: 'advances', dn: 'declines', upLabel: 'Advance', dnLabel: 'Decline' },
  { title: 'Up from Open vs Down from Open', up: 'up_from_open', dn: 'down_from_open', upLabel: 'Up', dnLabel: 'Down' },
  { title: 'Up on Volume vs Down on Volume', up: 'up_on_volume', dn: 'down_on_volume', upLabel: 'Up', dnLabel: 'Down' },
  { title: 'Up 4% vs Down 4%', up: 'up_x', dn: 'down_x', upLabel: '4%', dnLabel: '4%' },
];

/** Stage swatch colours (reference STCOL order). */
const STAGE_COLS = ['var(--text2)', 'var(--blue)', 'var(--yellow)', 'var(--magenta)'];

function GaugeRow({ title, upV, dnV, upLabel, dnLabel }: {
  title: string; upV: number | null; dnV: number | null; upLabel: string; dnLabel: string;
}) {
  const tot = (upV || 0) + (dnV || 0);
  const pct = tot && upV != null ? (100 * upV) / tot : null;
  const good = pct != null && pct >= 50;
  const col = pct == null ? 'var(--text2)' : good ? 'var(--blue)' : 'var(--magenta)';
  return (
    <div className="wrow">
      <div className="h">
        <span>{title}</span>
        <span className="p" style={{ color: col }}>{pct == null ? '—' : `${pct.toFixed(0)}%`}</span>
      </div>
      <div className="wbar">
        <i style={{ width: `${pct == null ? 0 : pct}%`, background: col }} />
      </div>
      <div className="c">
        <span>{fmt(upV)} {upLabel}</span>
        <span>{fmt(dnV)} {dnLabel}</span>
      </div>
    </div>
  );
}

/** #stage-mini — the '% in each stage' strip inside the widget card. */
export const MINI_PANELS: PanelDef[] = [
  {
    title: '% in each stage',
    height: 150,
    series: [
      { key: 'pct_stage1', color: '--text2', label: 'S1', width: 1 },
      { key: 'pct_stage2', color: '--blue', label: 'S2' },
      { key: 'pct_stage3', color: '--yellow', label: 'S3', width: 1 },
      { key: 'pct_stage4', color: '--magenta', label: 'S4' },
    ],
    ylim: [0, 100],
  },
];

export function WidgetCard({ i, date }: { i: number; date: string }) {
  const series = useBreadthStore((s) => s.series);
  const val = (k: string): number | null => num(series[k]?.[i]);
  const st = [1, 2, 3, 4].map((k) => val(`stage${k}`) || 0);
  const n = st.reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="widget" id="w-widget">
      <h3>Market Breadth · {date || '—'}</h3>
      {GAUGES.map((g) => (
        <GaugeRow
          key={g.title}
          title={g.title}
          upV={val(g.up)}
          dnV={val(g.dn)}
          upLabel={g.upLabel}
          dnLabel={g.dnLabel}
        />
      ))}
      <div className="wrow">
        <div className="h">
          <span>Stage Analysis</span>
          <span className="p" style={{ color: 'var(--text2)' }}>{n} stocks</span>
        </div>
        <div className="stg">
          {st.map((v, k) => (
            <i key={k} style={{ width: `${(100 * v) / n}%`, background: STAGE_COLS[k] }} />
          ))}
        </div>
        <div className="stgl">
          {st.map((v, k) => (
            <div key={k}>
              <span className="sw" style={{ background: STAGE_COLS[k] }} />
              Stage {k + 1}
              <b>
                {v} · {((100 * v) / n).toFixed(0)}%
              </b>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <StackMount panels={MINI_PANELS} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ panels */

function sharePanel(title: string, daily: string, avg: string, color: string, label: string): PanelDef {
  const series: SeriesDef[] = [
    { key: daily, color: '--grid', label: `${label} daily`, width: 1 },
    { key: avg, color, label: `${label} 10d`, width: 1.8 },
  ];
  return { title, height: 100, series, ylim: [0, 100], hlines: [{ y: 50 }] };
}

const stageSeries = (sfx: string, wk: boolean): SeriesDef[] =>
  [1, 2, 3, 4].map((k) => ({
    key: `pct_stage${k}${sfx}`,
    color: ['--text2', '--blue', '--yellow', '--magenta'][k - 1],
    label: `Stage ${k}${wk ? ' (wk)' : ''}`,
    width: k === 2 || k === 4 ? 1.5 : 1,
  }));

/** Main column: head panel + the five share gauges (template wStack panels 0–5). */
export const MAIN_PANELS: PanelDef[] = [
  idxPanel({ regimeStrip: true }),
  sharePanel('New highs share — NH/(NH+NL) %', 'w_nh', 'w_nh_10', '--blue', 'NH %'),
  sharePanel('Advance share — A/(A+D) %', 'w_ad', 'w_ad_10', '--blue', 'Adv %'),
  { ...sharePanel('Up-from-open share %', 'w_open', 'w_open_10', '--violet', 'Up open %'), height: 90 },
  { ...sharePanel('Up-on-volume share %', 'w_vol', 'w_vol_10', '--aqua', 'Up vol %'), height: 90 },
  { ...sharePanel('Up ≥4% share of 4% movers %', 'w_4', 'w_4_10', '--orange', 'Up 4% %'), height: 90 },
];

/** Stage column, swapped by the Daily/Weekly toggle (template setStageMode, panels[6]). */
const STAGE_PANELS_DAILY: PanelDef[] = [
  {
    title: 'Weinstein stages — daily proxy (150-day MA, slope 20 days)',
    height: 160,
    series: stageSeries('', false),
    ylim: [0, 100],
  },
];
const STAGE_PANELS_WEEKLY: PanelDef[] = [
  {
    title: 'Weinstein stages — WEEKLY bars, 30-week MA, slope 4 weeks (his original setting)',
    height: 160,
    series: stageSeries('_w', true),
    ylim: [0, 100],
  },
];

const KEYS = [
  ...IDX_KEYS,
  'new_highs', 'new_lows', 'advances', 'declines',
  'up_from_open', 'down_from_open', 'up_on_volume', 'down_on_volume', 'up_x', 'down_x',
  'stage1', 'stage2', 'stage3', 'stage4',
  'pct_stage1', 'pct_stage2', 'pct_stage3', 'pct_stage4',
  'pct_stage1_w', 'pct_stage2_w', 'pct_stage3_w', 'pct_stage4_w',
];

/* ------------------------------------------------------------------ page */

/**
 * Hover index across the hub's stacks, polled every 120 ms — the React mirror
 * of the template's `setInterval(() => wStack.hover …)` widget refresh.
 */
function useHoverIndex(): number | null {
  const hub = useHub();
  const [idx, setIdx] = useState<number | null>(null);
  useEffect(() => {
    if (!hub) return;
    const t = setInterval(() => {
      let h: number | null = null;
      for (const s of hub.stacks) {
        if (s.hover != null) { h = s.hover; break; }
      }
      setIdx((cur) => (cur === h ? cur : h));
    }, 120);
    return () => clearInterval(t);
  }, [hub]);
  return idx;
}

function WidgetBody() {
  const dates = useBreadthStore((s) => s.dates);
  const hover = useHoverIndex();
  const [stageMode, setStageMode] = useState<'daily' | 'weekly'>('daily');
  const i = hover ?? Math.max(0, dates.length - 1);

  return (
    <div className="space-y-3">
      <PageHead
        title="Market Breadth widget — the at-a-glance panel"
        note={
          <>
            Same six gauges as the TradingView / Deepvue market-breadth widget, computed on the TASI
            universe: New Highs vs New Lows (52w), Advance vs Decline, Up vs Down from the open, Up
            vs Down on above-average volume (volume &gt; prior 20-day average), Up 4% vs Down 4%
            (with volume above the prior day), and the Weinstein stage split. Grey = today&apos;s raw
            share, coloured = 10-day mean; blue = bulls ≥ 50%, magenta = bears.{' '}
            <b>Hover any chart and the widget re-renders for that day.</b>
          </>
        }
      />
      <div className="ovgrid">
        <WidgetCard i={i} date={dates[i] ?? ''} />
        <div className="space-y-3" id="w-stack">
          <RangeToolbar />
          <div className="breadth-toolbar">
            <span className="lbl">Stages</span>
            <button
              className={`btn${stageMode === 'daily' ? ' active' : ''}`}
              onClick={() => setStageMode('daily')}
            >
              Daily (150d MA)
            </button>
            <button
              className={`btn${stageMode === 'weekly' ? ' active' : ''}`}
              onClick={() => setStageMode('weekly')}
            >
              Weekly (30-week MA — Weinstein original)
            </button>
          </div>
          <StackMount panels={MAIN_PANELS} />
          <StackMount panels={stageMode === 'weekly' ? STAGE_PANELS_WEEKLY : STAGE_PANELS_DAILY} />
        </div>
      </div>
    </div>
  );
}

export default function WidgetPage() {
  return (
    <BreadthView keys={KEYS}>
      <WidgetBody />
    </BreadthView>
  );
}
