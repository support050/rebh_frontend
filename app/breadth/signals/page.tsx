'use client';
/**
 * /breadth/signals — Signals & regimes.
 *
 * Reference #p-signals ported 1:1: the rule-stats table (every rule judged by
 * its own TASI record), the sortable/filterable/CSV signal log with forward
 * returns, the latest-40 regime-change ledger with regime badges, and the
 * verified #sg-stack chart column underneath.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { BreadthView, PageHead, RangeToolbar, StackMount } from '../_lib/BreadthView';
import { idxPanel, IDX_KEYS } from '../_lib/panels';
import { REGIME_COLORS, REGIME_ICONS, type PanelDef } from '../_engine/types';
import { useBreadthStore } from '../_lib/store';
import { fetchSignals, useTableData } from '../_lib/tableApi';
import { fmt, statusColor } from '../_lib/ui';
import { num, pct, signClass } from '../_lib/format';
import type { BreadthSignals } from '@/types/breadth';

type SigRow = BreadthSignals['signals_table'][number];
type StatRow = BreadthSignals['signal_stats'][number];

export const PANELS: PanelDef[] = [
  idxPanel({
    episodes: true,
    events: [
      { key: 'zweig', color: '--aqua' },
      { key: 'whaley', color: '--yellow' },
      { key: 'pct50', color: '--blue' },
      { key: 'lowry_down', color: '--red', pos: 'top' },
      { key: 'bear_div', color: '--orange', pos: 'top' },
      { key: 'zweig_rare', color: '--violet', dot: true, pos: 'top' },
      { key: 'deemer_rare', color: '--magenta', dot: true, pos: 'top' },
    ],
  }),
  {
    title: 'Zweig breadth thrust EMA10 of A/(A+D): <0.40 → >0.615 within 10 days (aqua ▲) · rare variant >0.66 (violet ●, no edge)',
    height: 130,
    series: [{ key: 'zweig_value', color: '--aqua', label: 'ZBT EMA', dec: 3 }],
    ylim: [0.2, 0.8],
    hlines: [{ y: 0.4, color: '--red' }, { y: 0.615, color: '--aqua' }, { y: 0.66, color: '--violet', label: '0.66 rare' }],
  },
  {
    title: 'Whaley 5-day A/D ratio (≥3 = thrust) · Deemer 10-day (1.97 dropped · 2.6 rare, magenta ●)',
    height: 110,
    series: [
      { key: 'whaley_value', color: '--yellow', label: '5d A/D' },
      { key: 'deemer_value', color: '--text2', label: '10d A/D', width: 1 },
    ],
    ylim: [0, 5],
    hlines: [{ y: 3, color: '--yellow' }, { y: 2.6, color: '--magenta' }, { y: 1 }],
  },
  {
    title: 'Breadth Score & oversold overlay',
    height: 140,
    series: [
      { key: 'score_smooth', color: '--orange', label: 'Score EMA5' },
      { key: 'overlay', color: '--violet', label: 'Overlay' },
    ],
    ylim: [0, 100],
    hlines: [{ y: 45, color: '--serious' }, { y: 75, color: '--violet' }],
  },
];

const KEYS = [...IDX_KEYS, 'zweig_value', 'whaley_value', 'deemer_value', 'score_smooth', 'overlay'];

/** Signed, one-decimal forward-return cell (reference cell()). */
function FwdCell({ v }: { v: number | null }) {
  if (v == null) return <td>—</td>;
  return <td className={signClass(v)}>{v >= 0 ? '+' : ''}{v.toFixed(1)}</td>;
}

function csvDump(rows: string[][], name: string, date: string) {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const body = [rows[0].map(esc).join(','), ...rows.slice(1).map((r) => r.map(esc).join(','))];
  const blob = new Blob(['\ufeff' + body.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name}_${date}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const LOG_COLS: { key: keyof SigRow | string; label: string; get: (r: SigRow) => string | number | null }[] = [
  { key: 'signal', label: 'Rule', get: (r) => r.signal },
  { key: 'date', label: 'Date', get: (r) => r.date },
  { key: 'tasi', label: 'TASI', get: (r) => r.tasi },
  { key: 'f5', label: '5d', get: (r) => r.f5 },
  { key: 'f20', label: '20d', get: (r) => r.f20 },
  { key: 'f60', label: '60d', get: (r) => r.f60 },
  { key: 'f120', label: '120d', get: (r) => r.f120 },
  { key: 'horizon', label: 'Horizon', get: (r) => r.horizon },
];

function SignalsBody() {
  const { data, loading, error } = useTableData(fetchSignals);
  const events = useBreadthStore((s) => s.events);
  const scopeRef = useRef<HTMLDivElement>(null);

  const [sort, setSort] = useState<{ col: string; asc: boolean } | null>(null);
  const [q, setQ] = useState('');

  const stats = useMemo(() => (data?.signal_stats ?? []) as StatRow[], [data]);
  const log = useMemo(() => (data?.signals_table ?? []) as SigRow[], [data]);

  const logView = useMemo(() => {
    let rows = log;
    if (q.trim()) {
      const n = q.trim().toLowerCase();
      rows = rows.filter((r) => LOG_COLS.some((c) => String(c.get(r) ?? '').toLowerCase().includes(n)));
    }
    if (sort) {
      const col = LOG_COLS.find((c) => c.key === sort.col);
      if (col) {
        rows = rows.slice().sort((a, b) => {
          const x = col.get(a);
          const y = col.get(b);
          const xn = typeof x === 'number' ? x : num(x as string);
          const yn = typeof y === 'number' ? y : num(y as string);
          if (xn != null && yn != null) return sort.asc ? xn - yn : yn - xn;
          return sort.asc ? String(x ?? '').localeCompare(String(y ?? '')) : String(y ?? '').localeCompare(String(x ?? ''));
        });
      }
    }
    return rows;
  }, [log, q, sort]);

  const regimeChanges = useMemo(
    () => (events?.regime_changes ?? []).slice().reverse().slice(0, 40),
    [events],
  );
  const regimeCss = useCallback(
    (regime: string) => {
      const varName = REGIME_COLORS[regime] ?? '--text2';
      const scope = scopeRef.current?.closest('.breadth-root') as HTMLElement | null;
      if (!scope) return undefined;
      return getComputedStyle(scope).getPropertyValue(varName).trim();
    },
    [],
  );

  const toggleSort = (col: string) =>
    setSort((s) => (s?.col === col ? { col, asc: !s.asc } : { col, asc: false }));

  return (
    <div ref={scopeRef} className="space-y-3">
      <PageHead
        title="Signals & regimes"
        note="Every rule is judged by its own record on TASI (2007–2026, independent signals after cooldown). Fewer than 30 independent events is not a statistical proof — rows tagged n<30 are indicative. Validated out-of-sample (2018–2026): Zweig +1.8%/20d, %>50DMA thrust +2.2%/60d, Lowry 95% down day +3.2%/60d (75%), Whaley on the 20-day horizon only."
      />

      {loading ? <p className="note">loading signals table…</p> : null}
      {error ? <div className="breadth-error">Failed to load signals — {error}</div> : null}

      {!loading && !error && data ? (
        <>
          <div>
            <h2 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>
              Every rule, judged by its own record on TASI
            </h2>
            <div className="tblwrap">
              <table>
                <thead>
                  <tr>
                    <th>Rule</th>
                    <th>n</th>
                    <th>20d mean</th>
                    <th>hit</th>
                    <th>60d mean</th>
                    <th>hit</th>
                    <th>120d mean</th>
                    <th>hit</th>
                    <th>Valid horizon</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((r) => (
                    <tr key={r.signal}>
                      <td>{r.signal}</td>
                      <td>
                        {r.n}
                        {r.n < 10 ? <span className="tag" style={{ background: 'var(--warn)' }}>n&lt;10</span> : r.n < 30 ? <span className="tag" style={{ background: 'var(--text2)' }}>n&lt;30</span> : null}
                      </td>
                      <FwdCell v={r.mean20} />
                      <td>{fmt(r.hit20)}%</td>
                      <FwdCell v={r.mean60} />
                      <td>{fmt(r.hit60)}%</td>
                      <FwdCell v={r.mean120} />
                      <td>{fmt(r.hit120)}%</td>
                      <td>{r.horizon}</td>
                      <td>
                        <span className="tag" style={{ background: statusColor(r.status) }}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="note">
              Read this honestly — fewer than 30 independent events is not proof. The expert-review tests: making
              Zweig &quot;rare&quot; (≥0.66, 9 signals) <b>destroys</b> its edge on TASI — the classic 0.615
              calibration (≈1.4 signals a year) is the version that works, valid on a 20-day horizon; Deemer at
              ≥2.6 fires 4 times with +6.6% / 60d — too few to trust; the Lowry sequence (95% down → 90% up) has
              no edge here.
            </p>
          </div>

          <div className="grid2">
            <div>
              <h2 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>
                Signal log with TASI forward returns
              </h2>
              <div className="tblbar">
                <input value={q} placeholder="filter…" onChange={(e) => setQ(e.target.value)} />
                <button
                  className="btn"
                  onClick={() =>
                    csvDump(
                      [
                        LOG_COLS.map((c) => c.label),
                        ...logView.map((r) => LOG_COLS.map((c) => {
                          const v = c.get(r);
                          if (typeof v === 'number') return String(v);
                          if (c.key === 'tasi') return fmt(num(v as string));
                          if (typeof v === 'string' && v.includes('.')) return v;
                          return v == null ? '' : String(v);
                        })),
                      ],
                      'signals',
                      logView[0]?.date ?? '',
                    )
                  }
                >
                  ⇩ CSV
                </button>
                <span className="note" style={{ margin: 0 }}>click a header to sort</span>
              </div>
              <div className="tblwrap">
                <table>
                  <thead>
                    <tr>
                      {LOG_COLS.map((c) => (
                        <th
                          key={c.key as string}
                          className={`sortable${sort?.col === c.key ? (sort.asc ? ' asc' : ' desc') : ''}`}
                          onClick={() => toggleSort(c.key as string)}
                        >
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logView.map((r, i) => (
                      <tr key={`${r.signal}-${r.date}-${i}`} style={r.status === 'scored' ? undefined : { opacity: 0.6 }}>
                        <td>{r.signal}</td>
                        <td>{r.date}</td>
                        <td>{fmt(r.tasi)}</td>
                        <FwdCell v={r.f5} />
                        <FwdCell v={r.f20} />
                        <FwdCell v={r.f60} />
                        <FwdCell v={r.f120} />
                        <td>{r.horizon}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="note">Greyed rows = tested variants and dropped rules, shown for audit.</p>
            </div>

            <div>
              <h2 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>
                Regime changes (latest 40)
              </h2>
              <div className="tblwrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>New regime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regimeChanges.map((r) => (
                      <tr key={r.date}>
                        <td>{r.date}</td>
                        <td>
                          <span className="badge" style={{ background: regimeCss(r.regime) || 'var(--text2)', fontSize: 11 }}>
                            {REGIME_ICONS[r.regime] ?? ''} {r.regime}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="note">
                Walk-forward 2014–2026: Washout +2.4%/20d &amp; +4.1%/60d (72%); Healthy/Strong (score ≥60)
                consistently positive; Weak −0.2%/60d vs +0.8% base — the regime tells you when <b>not</b> to
                press more than when to sell. Hysteresis 8 pts, min 5 days, on a 5-day EMA of the score.
              </p>
            </div>
          </div>
        </>
      ) : null}

      <RangeToolbar />
      <StackMount panels={PANELS} />
    </div>
  );
}

export default function SignalsPage() {
  return (
    <BreadthView keys={KEYS}>
      <SignalsBody />
    </BreadthView>
  );
}
