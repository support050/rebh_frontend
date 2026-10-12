'use client';
/**
 * /breadth — Overview.
 * Reproduces the reference dashboard's #ov-stack (4 synced canvas panels) plus
 * the headline KPI row, the canary / split-market alerts, and the five-question
 * breadth reading — all driven by the live /api/rebh/breadth/* snapshot.
 */
import React from 'react';
import { useRouter } from 'next/navigation';
import { BreadthView, StackMount, RangeToolbar } from './_lib/BreadthView';
import { useBreadthStore } from './_lib/store';
import { fetchStocks, useTableData } from './_lib/tableApi';
import StockChartModal from './_lib/StockChartModal';
import { Card, TableStatus, useStockModal, type StockRow } from './_lib/ui';
import { REGIME_ICONS, REGIME_COLORS, type PanelDef } from './_engine/types';
import { fmt, num } from './_engine/helpers';

/** #ov-stack panels — verbatim from breadth-panel-spec.json (page: overview). */
const OV_PANELS: PanelDef[] = [
  {
    title: 'TASI (candles when zoomed in; line otherwise)',
    height: 260,
    series: [
      { key: 'tasi', type: 'candle', color: '--text', label: 'TASI' },
      { key: 'tasi', type: 'line', color: '--blue', label: 'TASI close', width: 1.2 },
    ],
    regimeStrip: true,
    episodes: true,
    events: [
      { key: 'zweig', color: '--aqua' },
      { key: 'pct50', color: '--blue' },
      { key: 'lowry_down', color: '--red', pos: 'top' },
    ],
  },
  {
    title: 'Breadth Score (0–100) and regime bands',
    height: 150,
    series: [
      { key: 'score', color: '--orange', label: 'Score' },
      { key: 'score_smooth', color: '--blue', label: 'EMA5' },
    ],
    ylim: [0, 100],
    zones: [
      { from: 0, to: 40, color: '--zone-hi' },
      { from: 60, to: 100, color: '--zone-lo' },
    ],
    hlines: [{ y: 40 }, { y: 60 }, { y: 75 }],
  },
  {
    title: 'Net 52w highs − lows (daily) — Hisham\u2019s canary',
    height: 130,
    series: [{ key: 'net_nh_nl', type: 'hist', color: '--blue', label: 'net NH−NL' }],
    zero: true,
    episodes: true,
  },
  {
    title: 'McClellan Oscillator (ratio-adjusted)',
    height: 130,
    series: [{ key: 'mcclellan_osc', type: 'hist', color: '--blue', label: 'McClellan' }],
    zero: true,
    hlines: [
      { y: 85, color: '--red', label: '+85 (95th pct)' },
      { y: -85, color: '--aqua', label: '−85 (5th pct)' },
    ],
  },
];

const OV_KEYS = [
  'tasi', 'score', 'score_smooth', 'net_nh_nl', 'mcclellan_osc',
  'pct_above_sma200', 'pct_above_sma50', 'pct_stage2', 'pct_minervini', 'n_minervini',
  'new_highs', 'new_lows', 'nhnl_sum5', 'nhnl_thr', 'overlay', 'spread_60',
  'ad_line', 'trin_10', 'ratio_10', 'zweig_value', 'hlli', 'n_sectors', 'n_healthy', 'bpi',
];

/** last numeric value of a series (skips trailing nulls). */
function last(series: Record<string, (number | string | null)[]>, key: string): number | null {
  const a = series[key];
  if (!a) return null;
  for (let i = a.length - 1; i >= 0; i--) {
    const v = num(a[i]);
    if (v != null) return v;
  }
  return null;
}

const signed = (v: number | null, d = 0) =>
  v == null ? '—' : `${v >= 0 ? '+' : ''}${fmt(v, d)}`;

function KpiCard({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: React.ReactNode; accent?: string }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-[var(--text2)]">{label}</div>
      <div className="text-2xl font-bold mt-0.5" style={accent ? { color: accent } : undefined}>{value}</div>
      {sub ? <div className="text-xs text-[var(--text2)] mt-0.5">{sub}</div> : null}
    </div>
  );
}

/** #ov-leaders — "Leaders — Trend Template pass, by RS" card (template top-12 table). */
function LeadersCard() {
  const router = useRouter();
  const stocksQ = useTableData(fetchStocks);
  const leaders = (stocksQ.data?.leaders ?? []) as unknown as StockRow[];
  const modal = useStockModal(leaders);
  const lead = leaders.slice(0, 12);

  return (
    <div className="space-y-2">
      <Card
        title="Leaders — Trend Template pass, by RS"
        actions={
          <button className="btn" onClick={() => router.push('/breadth/leaders')}>
            all {leaders.length} →
          </button>
        }
      >
        <TableStatus loading={stocksQ.loading} error={stocksQ.error} loadingText="loading leaders" />
        {!stocksQ.loading && !stocksQ.error && (
          lead.length ? (
            <table>
              <thead>
                <tr>
                  <th>Sym</th>
                  <th style={{ textAlign: 'left' }}>Name</th>
                  <th>RS</th>
                  <th>52w hi</th>
                  <th>Rvol</th>
                </tr>
              </thead>
              <tbody>
                {lead.map((r) => (
                  <tr key={r.sym}>
                    <td><span className="sym" onClick={() => modal.open(r.sym)}>{r.sym}</span></td>
                    <td style={{ textAlign: 'left', whiteSpace: 'nowrap', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</td>
                    <td>{r.rs ?? '—'}</td>
                    <td className={r.hi52 == null ? '' : r.hi52 >= 0 ? 'pos' : 'neg'}>{r.hi52 == null ? '—' : `${r.hi52.toFixed(1)}%`}</td>
                    <td>{fmt(r.rvol, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="note">No stock passes the full template today.</p>
          )
        )}
        <p className="note" style={{ margin: '8px 0 0' }}>
          Minervini: breadth is a permission gauge — when few names pass the template, the market is
          not rewarding trend-following. Click a symbol for its chart.
        </p>
        <div style={{ marginTop: 10 }}>
          <button className="btn" onClick={() => router.push('/breadth/widget')}>Market Breadth widget →</button>
        </div>
      </Card>
      <StockChartModal sym={modal.sym} row={modal.row} onClose={modal.close} />
    </div>
  );
}

function OverviewBody() {
  const today = useBreadthStore((s) => s.today);
  const series = useBreadthStore((s) => s.series);
  const status = useBreadthStore((s) => s.status);

  if (!today) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-[var(--surface2)] animate-pulse" />
          ))}
        </div>
        <div className="h-[700px] rounded-lg bg-[var(--surface2)] animate-pulse" />
        {status === 'idle' || status === 'loading' ? null : (
          <div className="text-sm text-[var(--serious)]">No data yet — make sure the daily breadth job has run.</div>
        )}
      </div>
    );
  }

  const sum5 = last(series, 'nhnl_sum5');
  const thr = last(series, 'nhnl_thr');
  const hlli = last(series, 'hlli');
  const pct200 = last(series, 'pct_above_sma200');
  const tt = last(series, 'pct_minervini');
  const nh = last(series, 'new_highs');
  const nl = last(series, 'new_lows');
  const ad20 = (() => {
    const a = series['ad_line'];
    if (!a) return null;
    const i = a.length - 1;
    const cur = num(a[i]);
    const prev = num(a[Math.max(0, i - 20)]);
    return cur != null && prev != null ? cur - prev : null;
  })();

  const inCanary = sum5 != null && thr != null && sum5 <= thr;
  const nearCanary = sum5 != null && thr != null && sum5 > thr && sum5 <= 0.6 * thr;
  const split = hlli != null && hlli > 1;
  const omen = today.hindenburg_recent > 0;

  const regimeColor = `var(${REGIME_COLORS[today.regime] || '--text2'})`;

  const q: [string, string, string][] = [
    ['1. Is participation broad or narrow?', `%>200DMA ${fmt(pct200)}% · Stage 2 ${fmt(last(series, 'pct_stage2'))}% · Trend Template ${fmt(tt, 1)}% · healthy sectors ${today.fam.E}`, pct200 != null && pct200 > 60 ? 'Broad' : pct200 != null && pct200 < 40 ? 'Narrow' : 'Mixed'],
    ['2. Is it improving or deteriorating?', `A/D line 20d ${fmt(ad20)} · McClellan ${fmt(last(series, 'mcclellan_osc'))} · Score ${today.score} (${signed(today.score_chg)} vs yesterday)`, ad20 != null && ad20 > 0 ? 'Improving' : ad20 != null && ad20 < 0 ? 'Deteriorating' : 'Mixed'],
    ['3. Does breadth confirm the index?', `TASI ${signed(today.tasi_chg, 1)}% · EW−TASI 60d spread ${fmt(last(series, 'spread_60'), 1)} · highs ${fmt(nh)} / lows ${fmt(nl)}`, (last(series, 'spread_60') ?? 0) < -5 ? 'Mega-caps masking weakness' : 'Consistent'],
    ['4. Oversold / overbought? A thrust?', `Oversold overlay ${today.overlay} · TRIN-10 ${fmt(last(series, 'trin_10'), 2)} · NH−NL 5d sum ${fmt(sum5)} (canary ${fmt(thr)})`, today.overlay >= 75 ? 'Oversold' : inCanary ? 'Canary alert' : nearCanary ? 'Near canary' : split ? 'Split market' : 'No extreme'],
    ['5. Regime & score', `Score ${today.score}/100 · EMA5 ${today.smooth} · driver: ${today.driver} · since ${today.regime_since}`, `${REGIME_ICONS[today.regime] || ''} ${today.regime}`],
  ];

  return (
    <div className="space-y-3">
      {/* headline KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        <KpiCard label="Breadth Score" value={`${today.score}`} sub={`${signed(today.score_chg)} yesterday · EMA5 ${today.smooth}`} />
        <KpiCard label="Regime" value={<span className="text-base font-bold px-2.5 py-1 rounded-full text-white" style={{ background: regimeColor }}>{REGIME_ICONS[today.regime]} {today.regime}</span>} sub={`since ${today.regime_since}`} />
        <KpiCard label="TASI" value={fmt(today.tasi)} sub={today.index_stale ? <b style={{ color: 'var(--serious)' }}>index file stale</b> : `${signed(today.tasi_chg, 1)}% · ${today.date}`} />
        <KpiCard label="Families (A/B/E)" value={`${today.fam.A} / ${today.fam.B} / ${today.fam.E}`} sub="participation · advance/decline · sectors" />
        <KpiCard label="Oversold overlay" value={`${today.overlay}`} sub="≥75 with score ≤45 = Washout" />
        <KpiCard label="Highs / Lows" value={`${fmt(nh)} / ${fmt(nl)}`} sub={`5d sum ${fmt(sum5)} · canary ≤ ${fmt(thr)}`} accent={inCanary ? 'var(--critical)' : undefined} />
        <KpiCard label="Trend Template (Minervini)" value={`${fmt(tt, 1)}%`} sub={`${today.n_universe} stocks`} />
        <KpiCard label="BPI (P&F)" value={`${fmt(today.bpi)}`} sub={today.bpi_status} />
      </div>

      {/* alerts */}
      {(split || omen) && (
        <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderLeft: '4px solid var(--critical)', background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <b style={{ color: 'var(--critical)' }}>
            {split ? `Split market — Fosback HLLI ${fmt(hlli, 2)} > 1` : ''}
            {split && omen ? ' · ' : ''}
            {omen ? `Hindenburg Omen in the last 36 days (${today.hindenburg_recent})` : ''}
          </b>{' '}
          — many highs and lows at once = absent leadership.
        </div>
      )}
      {inCanary ? (
        <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderLeft: '4px solid var(--critical)', background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <b style={{ color: 'var(--critical)' }}>Canary ring active</b> — NH−NL 5-day sum {fmt(sum5)} is below the {fmt(thr)} threshold.
        </div>
      ) : nearCanary ? (
        <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderLeft: '4px solid var(--serious)', background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <b>Near canary</b> — the NH−NL 5-day sum passed 60% of the threshold ({fmt(thr)}).
        </div>
      ) : null}

      {/* five-question reading */}
      <div className="grid gap-0 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        {q.map(([a, b, c], i) => (
          <div key={i} className="grid sm:grid-cols-[260px_1fr_160px] items-stretch" style={{ borderBottom: i < q.length - 1 ? '1px solid var(--border)' : undefined }}>
            <div className="font-semibold px-3 py-2 text-sm" style={{ background: 'var(--surface2)' }}>{a}</div>
            <div className="px-3 py-2 text-xs text-[var(--text2)]">{b}</div>
            <div className="px-3 py-2 text-sm font-bold">{c}</div>
          </div>
        ))}
      </div>

      {/* #ov-leaders card beside the #ov-stack canvas column (template .ovgrid) */}
      <div className="ovgrid">
        <LeadersCard />
        <div className="space-y-3">
          <RangeToolbar />
          <StackMount panels={OV_PANELS} />
        </div>
      </div>

      <p className="text-xs text-[var(--text2)] leading-relaxed">
        The strip under the index colours the regime: green = Healthy/Strong, grey = Neutral, orange = Weak,
        violet = Washout. Red bands = canary episodes (NH−NL). Markers: ▲ Zweig thrust, ▲ %&gt;50DMA thrust,
        ▼ 95% down day.
      </p>
    </div>
  );
}

export default function BreadthOverviewPage() {
  return (
    <BreadthView keys={OV_KEYS}>
      <OverviewBody />
    </BreadthView>
  );
}
