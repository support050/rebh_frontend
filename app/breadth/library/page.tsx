'use client';
/**
 * /breadth/library — Classic breadth library.
 * Port of the reference #p-library: the 13-row verdict table (TASI test result
 * + percentiles per indicator, sortable) above the #lib-stack charts.
 * Percentile bands and verdicts come from /meta (classic_q / verdicts), the
 * "Today" column reads the last stored value of each series.
 */
import React, { useMemo, useState } from 'react';
import { BreadthView, RangeToolbar, StackMount, PageHead } from '../_lib/BreadthView';
import { idxPanel, IDX_KEYS } from '../_lib/panels';
import { useBreadthStore } from '../_lib/store';
import { fmt, lastVal, Tag, VERDICT_COLORS } from '../_lib/ui';
import type { PanelDef } from '../_engine/types';

const HEAD = idxPanel({
  events: [
    { key: 'hindenburg', color: '--red', pos: 'top' },
    { key: 'hindenburg_confirmed', color: '--red', dot: true, pos: 'top' },
    { key: 'titanic', color: '--text2', pos: 'top' },
    { key: 'zweig_double_91', color: '--aqua', dot: true },
  ],
});

const KEYS = [
  ...IDX_KEYS,
  'hlli', 'abi', 'sto_b', 'itbm', 'itbm_signal', 'mvo', 'cvi', 'cvi_ma50',
  'nh_pct_10', 'ad_pct_21', 'haurlan_st', 'titanic', 'zweig_91', 'bpi',
];

/** One rendered row of the reference #tbl-lib verdict table. */
interface LibRow {
  key: string;
  label: string;
  v: number | null;
  dec: number;
  author: string;
  result: string;
  tag: string;
  q: string;
}

const LIB_COLS: { label: string; get: (r: LibRow) => string | number }[] = [
  { label: 'Indicator', get: (r) => r.label },
  { label: 'Author', get: (r) => r.author },
  { label: 'Today', get: (r) => r.v ?? Number.NEGATIVE_INFINITY },
  { label: 'p5 / median / p95', get: (r) => r.q },
  { label: 'TASI test result', get: (r) => r.result },
  { label: 'Verdict', get: (r) => r.tag },
];

function LibraryBody() {
  const meta = useBreadthStore((s) => s.meta);
  const series = useBreadthStore((s) => s.series);
  const today = useBreadthStore((s) => s.today);

  const [sort, setSort] = useState<{ col: number; asc: boolean } | null>(null);

  const vRows = useMemo<LibRow[]>(() => {
    const V = meta?.verdicts ?? {};
    const Q = (meta?.classic_q ?? {}) as Record<string, Record<string, number>>;
    const diff = (a: string, b: string): number | null => {
      const x = lastVal(series, a);
      const y = lastVal(series, b);
      return x == null || y == null ? null : x - y;
    };
    const raw: { key: string; label: string; v: number | null; dec: number }[] = [
      { key: 'hlli', label: 'High-Low Logic Index (50d)', v: lastVal(series, 'hlli'), dec: 2 },
      { key: 'abi', label: 'Absolute Breadth Index (10d, %)', v: lastVal(series, 'abi'), dec: 1 },
      { key: 'hindenburg', label: 'Hindenburg Omen (last 36d)', v: today?.hindenburg_recent ?? null, dec: 0 },
      { key: 'titanic', label: 'Titanic Syndrome (today)', v: lastVal(series, 'titanic'), dec: 0 },
      { key: 'sto_b', label: 'Swenlin STO-Breadth', v: lastVal(series, 'sto_b'), dec: 0 },
      { key: 'itbm', label: 'ITBM vs signal', v: diff('itbm', 'itbm_signal'), dec: 1 },
      { key: 'mvo', label: 'McClellan Volume Oscillator', v: lastVal(series, 'mvo'), dec: 0 },
      { key: 'cvi', label: 'CVI − MA50 (M shares)', v: diff('cvi', 'cvi_ma50'), dec: 0 },
      { key: 'zweig_91', label: 'Zweig 9:1 up-volume day (today)', v: lastVal(series, 'zweig_91'), dec: 0 },
      { key: 'nh_pct_10', label: 'New highs % of issues (10d)', v: lastVal(series, 'nh_pct_10'), dec: 2 },
      { key: 'haurlan_st', label: 'Haurlan short-term (EMA3 of A−D)', v: lastVal(series, 'haurlan_st'), dec: 0 },
      { key: 'ad_pct_21', label: 'A/D % (21d)', v: lastVal(series, 'ad_pct_21'), dec: 1 },
      { key: 'bpi', label: 'Bullish Percent Index', v: lastVal(series, 'bpi'), dec: 1 },
    ];
    return raw.map((r) => {
      const verd = V[r.key];
      const qq = Q[r.key];
      return {
        ...r,
        author: verd?.author ?? '—',
        result: verd?.result ?? '—',
        tag: verd?.tag ?? '',
        q: qq ? `${fmt(qq['0.05'], 1)} / ${fmt(qq['0.5'], 1)} / ${fmt(qq['0.95'], 1)}` : '—',
      };
    });
  }, [meta, series, today]);

  const sortedRows = useMemo(() => {
    if (!sort) return vRows;
    const col = LIB_COLS[sort.col];
    return vRows.slice().sort((a, b) => {
      const x = col.get(a);
      const y = col.get(b);
      if (typeof x === 'number' && typeof y === 'number') return sort.asc ? x - y : y - x;
      return sort.asc ? String(x).localeCompare(String(y)) : String(y).localeCompare(String(x));
    });
  }, [vRows, sort]);

  const toggleSort = (ci: number) =>
    setSort((s) => (s?.col === ci ? { col: ci, asc: !s.asc } : { col: ci, asc: false }));

  const panels = useMemo<PanelDef[]>(() => {
    const Q = meta?.classic_q;
    const hlli95 = Q?.hlli?.['0.95'];
    const sto95 = Q?.sto_b?.['0.95'], sto05 = Q?.sto_b?.['0.05'];
    const mvo95 = Q?.mvo?.['0.95'], mvo05 = Q?.mvo?.['0.05'];
    return [
      HEAD,
      {
        title: 'Fosback High-Low Logic Index — 50-day mean of min(NH,NL)/issues, % · >1 = split market (warning)',
        height: 130,
        series: [{ key: 'hlli', color: '--red', label: 'HLLI', dec: 2 }],
        zero: true,
        zones: [{ from: 1, to: 5, color: '--zone-hi' }],
        hlines: [
          { y: 1, color: '--red', label: '1.0 split' },
          ...(hlli95 != null ? [{ y: hlli95, color: '--text2', label: '95th pct' }] : []),
        ],
      },
      {
        title: 'Fosback Absolute Breadth Index — 10-day mean of |A−D| / issues, %',
        height: 100,
        series: [{ key: 'abi', color: '--orange', label: 'ABI' }],
        zero: true,
        hlines: [{ y: 20 }, { y: 30 }],
      },
      {
        title: 'Swenlin STO-Breadth (EMA4 of 5-day ΣA−D) — 5/95 percentile bands',
        height: 110,
        series: [{ key: 'sto_b', type: 'hist', color: '--blue', label: 'STO-B' }],
        zero: true,
        hlines: [
          ...(sto95 != null ? [{ y: sto95, color: '--red' }] : []),
          ...(sto05 != null ? [{ y: sto05, color: '--aqua' }] : []),
        ],
      },
      {
        title: 'DecisionPoint ITBM (EMA20 of A/D %) and its 10-day signal',
        height: 110,
        series: [
          { key: 'itbm', color: '--violet', label: 'ITBM' },
          { key: 'itbm_signal', color: '--text2', label: 'signal', width: 1 },
        ],
        zero: true,
      },
      {
        title: 'McClellan Volume Oscillator (EMA19−EMA39 of 1000·(UV−DV)/(UV+DV))',
        height: 110,
        series: [{ key: 'mvo', type: 'hist', color: '--blue', label: 'MVO' }],
        zero: true,
        hlines: [
          ...(mvo95 != null ? [{ y: mvo95, color: '--red' }] : []),
          ...(mvo05 != null ? [{ y: mvo05, color: '--aqua' }] : []),
        ],
      },
      {
        title: 'Cumulative Volume Index (millions of shares) vs its 50-day MA',
        height: 100,
        series: [
          { key: 'cvi', color: '--aqua', label: 'CVI' },
          { key: 'cvi_ma50', color: '--text2', label: 'MA50', width: 1 },
        ],
      },
      {
        title: 'New highs as % of issues (10-day mean) — leadership breadth',
        height: 100,
        series: [{ key: 'nh_pct_10', color: '--up', label: 'NH %', dec: 2 }],
        zero: true,
        hlines: [{ y: 1 }, { y: 3 }, { y: 6 }],
      },
      {
        title: 'A/D % (21-day mean of 100·(A−D)/(A+D))',
        height: 100,
        series: [{ key: 'ad_pct_21', color: '--orange', label: 'A/D% 21d' }],
        zero: true,
        hlines: [{ y: 10 }, { y: -10 }],
      },
      {
        title: 'Haurlan short-term index (EMA3 of A−D)',
        height: 90,
        series: [{ key: 'haurlan_st', type: 'hist', color: '--blue', label: 'Haurlan ST' }],
        zero: true,
      },
    ];
  }, [meta]);

  return (
    <div className="space-y-3">
      <PageHead
        title="Classic breadth library — every indicator the literature uses, tested on TASI"
        note="Fosback, Miekka, Ohama, Swenlin/DecisionPoint, McClellan (volume), Zweig (9:1 days), Delwiche/Stack (new-high list), Haurlan, Appel and Dorsey. Nothing here is decoration: each row carries its TASI verdict from the 2007–2026 tests — warning = a negative state worth an alert, context = mild/confirming, no edge = kept only so the rule can be audited. Percentile columns are TASI's own (5th / median / 95th, 2007+). Markers on the index: ▼ red = Hindenburg Omen (first of a cluster), ◆ red = confirmed omen (second within 36 days), ▼ grey = Titanic Syndrome, ● aqua = Zweig double 9:1 day. The verdict table below sorts by clicking its headers."
      />

      <div className="tblwrap">
        <table>
          <thead>
            <tr>
              {LIB_COLS.map((c, ci) => (
                <th
                  key={c.label}
                  className={`sortable${sort?.col === ci ? (sort.asc ? ' asc' : ' desc') : ''}`}
                  onClick={() => toggleSort(ci)}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((r) => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td>{r.author}</td>
                <td><b>{fmt(r.v, r.dec)}</b></td>
                <td>{r.q}</td>
                <td style={{ textAlign: 'start' }}>{r.result}</td>
                <td>
                  {r.tag ? <Tag color={VERDICT_COLORS[r.tag] ?? 'var(--text2)'}>{r.tag}</Tag> : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RangeToolbar />
      <StackMount panels={panels} />

      <p className="note">
        Not implemented on purpose: Lowry Buying Power / Selling Pressure (proprietary construction — the 95% day
        and TRIN cover the same ground), Bolton-Tremblay / Hughes / Schultz A/T (redundant re-scalings of A−D).
      </p>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <BreadthView keys={KEYS}>
      <LibraryBody />
    </BreadthView>
  );
}
