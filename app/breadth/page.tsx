'use client';
/**
 * /breadth — Overview.
 * Reproduces the reference dashboard's #ov-stack (4 synced canvas panels) plus
 * the headline KPI row, the canary / split-market alerts, and the five-question
 * breadth reading — all driven by the live /api/rebh/breadth/* snapshot.
 *
 * CR3 §2: the KPI row (kpi:overview), the five questions (q5), the leaders card
 * (leaders:card) and the panel column (panel:overview:0..3) are exported so the
 * ★ Custom Dashboard can mount them as widgets.
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
export const OV_PANELS: PanelDef[] = [
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
  // reference overview lines also read these (CR3 v5 §1–§4)
  'nhnl_sum10', 'n_nhnl', 'new_highs_vol', 'pct_up_x',
];

const signed = (v: number | null, d = 0) =>
  v == null ? '—' : `${v >= 0 ? '+' : ''}${fmt(v, d)}`;

const chgNode = (v: number | null, d = 1) =>
  v == null ? <>—</> : <span className={v >= 0 ? 'pos' : 'neg'}>{`${v >= 0 ? '+' : ''}${fmt(v, d)}`}</span>;

function KpiCard({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: React.ReactNode; accent?: string }) {
  return (
    <div className="kpi bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-[var(--text2)]">{label}</div>
      <div className="text-2xl font-bold mt-0.5" style={accent ? { color: accent } : undefined}>{value}</div>
      {sub ? <div className="text-xs text-[var(--text2)] mt-0.5">{sub}</div> : null}
    </div>
  );
}

/**
 * All reference #p-overview computations (v5, lines 419–432) in one hook — every
 * number mirrors the template's expression exactly, off the full-resolution
 * series arrays held in the store. Shared by the KPI row and the five questions
 * (CR3 §2 widget reuse).
 */
export function useOverviewReadings() {
  const today = useBreadthStore((s) => s.today);
  const series = useBreadthStore((s) => s.series);
  const dates = useBreadthStore((s) => s.dates);
  const stocksQ = useTableData(fetchStocks);
  if (!today) return null;

  const i = dates.length - 1;
  const arr = (k: string) => series[k] ?? [];
  const at = (k: string, idx = i) => num(arr(k)[idx]);
  const pct200 = at('pct_above_sma200');
  const pct50 = at('pct_above_sma50');
  const st2 = at('pct_stage2');
  const nh = at('new_highs');
  const nl = at('new_lows');
  const mc = at('mcclellan_osc');
  const sum5 = at('nhnl_sum5');
  const thr = at('nhnl_thr');
  const nNhnl = at('n_nhnl');
  const nhnl10 = at('nhnl_sum10');
  const sp60 = at('spread_60');
  const trin = at('trin_10');
  const r10 = at('ratio_10');
  const zb = at('zweig_value');
  const nheal = at('n_healthy');
  const nsec = at('n_sectors');
  const tt = at('pct_minervini');
  const ntt = at('n_minervini');
  const nhv = at('new_highs_vol');
  const pctUpx = at('pct_up_x');
  const hlli = at('hlli');
  const curAd = at('ad_line');
  const prevAd = num(arr('ad_line')[Math.max(0, i - 20)]);
  const adl20 = curAd != null && prevAd != null ? curAd - prevAd : null;
  // index 20d change, skipping leading nulls like the reference `li` scan
  const tasiArr = arr('tasi');
  let li = i;
  while (li > 0 && num(tasiArr[li]) == null) li--;
  const tCur = num(tasiArr[li]);
  const tPast = num(tasiArr[Math.max(0, li - 20)]);
  const idx20 = tCur != null && tPast != null ? 100 * (tCur / tPast - 1) : null;

  // Q3 confirmation vote — reference: bUp/bDn over A/D 20d · NH−NL 10d · EW−TASI 60d
  const gt = (v: number | null) => (v != null && v > 0 ? 1 : 0);
  const lt = (v: number | null) => (v != null && v < 0 ? 1 : 0);
  const bUp = gt(adl20) + gt(nhnl10) + gt(sp60);
  const bDn = lt(adl20) + lt(nhnl10) + lt(sp60);
  const brDir = bUp >= 2 ? 'up' : bDn >= 2 ? 'down' : 'mixed';
  const ixDir = idx20 != null && idx20 > 1 ? 'up' : idx20 != null && idx20 < -1 ? 'down' : 'flat';
  const conf =
    (sp60 ?? 0) < -5 ? 'Mega-caps masking weakness'
      : ixDir === 'up' && brDir === 'down' ? 'Bearish divergence'
      : ixDir === 'down' && brDir === 'up' ? 'Bullish divergence'
      : ixDir === 'up' && brDir === 'up' ? 'Confirmed (up)'
      : ixDir === 'down' && brDir === 'down' ? 'Confirmed (down)'
      : 'Mixed';

  const inCanary = sum5 != null && thr != null && sum5 <= thr;
  const nearCanary = sum5 != null && thr != null && sum5 > thr && sum5 <= 0.6 * thr;
  const split = hlli != null && hlli > 1;
  const omen = today.hindenburg_recent > 0;

  const q4Verdict =
    today.overlay >= 75 ? 'Oversold'
      : (pctUpx ?? 0) > 20 || (mc ?? 0) > 100 ? 'Exhaustion'
      : split ? 'Split market (HLLI>1)'
      : inCanary ? 'Canary warning'
      : nearCanary ? 'Near canary' : 'No extreme';

  const leadersN = (stocksQ.data?.leaders ?? []).length;

  return {
    today, dates, i, stocksQ,
    pct200, pct50, st2, nh, nl, mc, sum5, thr, nNhnl, nhnl10, sp60, trin, r10, zb,
    nheal, nsec, tt, ntt, nhv, pctUpx, hlli, adl20, idx20, li,
    conf, inCanary, nearCanary, split, omen, q4Verdict, leadersN,
  };
}

/** kpi:overview — headline cards + split-market / canary alerts (CR3 §2). */
export function OverviewKpis() {
  const o = useOverviewReadings();
  if (!o) return null;
  const { today, pct200, pct50, st2, nh, nl, sum5, thr, tt, ntt, nhv, hlli, inCanary, nearCanary, split, omen } = o;
  return (
    <>
      <div className="kpis grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        <KpiCard label="Breadth Score" value={<>{today.score} <span className="text-sm text-[var(--text2)]">/100</span></>} sub={<>{chgNode(today.score_chg)} vs yesterday · EMA5 {today.smooth}</>} />
        <KpiCard label="Regime" value={<span className="text-base font-bold px-2.5 py-1 rounded-full text-white" style={{ background: `var(${REGIME_COLORS[today.regime] || '--text2'})` }}>{REGIME_ICONS[today.regime]} {today.regime}</span>} sub={`since ${today.regime_since}`} />
        <KpiCard label="TASI" value={fmt(today.tasi)} sub={today.index_stale ? <b style={{ color: 'var(--serious)' }}>index file stale · last close {today.tasi_last_date}</b> : `${signed(today.tasi_chg, 1)}% · ${today.date}`} />
        <KpiCard label="Families (A/B/E)" value={`${today.fam.A} / ${today.fam.B} / ${today.fam.E}`} sub="participation / advance-decline / sectors · F, G context only" />
        <KpiCard label="Oversold overlay" value={`${today.overlay}`} sub="≥75 with score ≤45 = Washout" />
        <KpiCard label="Highs / Lows" value={`${fmt(nh)} / ${fmt(nl)}`} sub={<>5d sum {fmt(sum5)} · canary ≤ {fmt(thr)}{inCanary ? <b style={{ color: 'var(--critical)' }}> · CANARY</b> : nearCanary ? <b style={{ color: 'var(--serious)' }}> · near canary</b> : null}</>} accent={inCanary ? 'var(--critical)' : undefined} />
        <KpiCard label="Trend Template (Minervini)" value={<>{fmt(tt, 1)}% <span className="text-sm text-[var(--text2)]">{o.leadersN} of {fmt(ntt)}</span></>} sub={`new 52w highs on volume today: ${fmt(nhv)}`} />
        <KpiCard label="BPI (P&F)" value={`${fmt(today.bpi)}`} sub={today.bpi_status} />
      </div>

      {(split || omen) && (
        <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderLeft: '4px solid var(--critical)', background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <b style={{ color: 'var(--critical)' }}>
            {split ? `Split market — Fosback High-Low Logic Index ${fmt(hlli, 2)} > 1` : ''}
            {split && omen ? ' · ' : ''}
            {omen ? `Hindenburg Omen in the last 36 days (${today.hindenburg_recent})` : ''}
          </b>{' '}
          — the strongest negative state on TASI (HLLI &gt; 1: −3.2% / 60d, 33% hit). Many new highs AND new
          lows at once = no leadership.
        </div>
      )}
      {inCanary ? (
        <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderLeft: '4px solid var(--critical)', background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <b style={{ color: 'var(--critical)' }}>Canary episode active</b> — NH−NL 5-day sum {fmt(sum5)} is
          below the TASI threshold {fmt(thr)}. Historically: avg max drawdown inside an episode −11%, 12/15
          episodes fell ≥3%. Risk-management flag, not an exit.
        </div>
      ) : nearCanary ? (
        <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderLeft: '4px solid var(--serious)', background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <b>Near canary</b> — NH−NL 5-day sum {fmt(sum5)} is past 60% of the threshold ({fmt(thr)}). One more
          heavy new-lows day would trigger an episode.
        </div>
      ) : null}
    </>
  );
}

/** q5 — the five-question breadth reading (CR3 §2 widget). */
export function FiveQuestions() {
  const o = useOverviewReadings();
  if (!o) return null;
  const { today, dates, pct200, pct50, st2, nh, nl, mc, sum5, thr, nNhnl, nhnl10, sp60, trin, r10, zb, nheal, nsec, tt, hlli, adl20, idx20, li, conf, q4Verdict } = o;
  const q: [string, React.ReactNode, string][] = [
    ['1. Is participation broad or narrow?', `%>200DMA ${fmt(pct200)}% · %>50DMA ${fmt(pct50)}% · Stage 2 ${fmt(st2)}% · Trend Template ${fmt(tt, 1)}% · healthy sectors ${fmt(nheal)}/${fmt(nsec)}`, pct200 != null && pct200 > 60 ? 'Broad' : pct200 != null && pct200 < 40 ? 'Narrow' : 'Mixed'],
    ['2. Is it improving or deteriorating?', <>A/D line 20d {fmt(adl20)} · McClellan {fmt(mc)} · Score {today.score} ({chgNode(today.score_chg)} vs yesterday)</>, adl20 != null && adl20 > 0 && mc != null && mc > 0 ? 'Improving' : adl20 != null && adl20 < 0 && mc != null && mc < 0 ? 'Deteriorating' : 'Mixed'],
    ['3. Does breadth confirm the index?', <>TASI 20d {chgNode(idx20)}%{li !== o.i ? ` (to ${dates[li]})` : ''} vs breadth 20d: A/D line {fmt(adl20)} · NH−NL 10d {fmt(nhnl10)} · EW−TASI 60d {fmt(sp60, 1)} pts · NH {fmt(nh)} / NL {fmt(nl)}</>, conf],
    ['4. Oversold / overbought? A thrust?', `Overlay ${today.overlay} · TRIN-10 ${fmt(trin, 2)} · 4% ratio 10d ${fmt(r10, 2)} · Zweig EMA ${fmt(zb, 3)} · NH−NL 5d sum ${fmt(sum5)} (canary line ${fmt(thr)} = −75% of ${fmt(nNhnl)}) · HLLI ${fmt(hlli, 2)} · Hindenburg 36d: ${today.hindenburg_recent} · BPI ${fmt(today.bpi)} (${today.bpi_status})`, q4Verdict],
    ['5. Regime & score', `Score ${today.score}/100 · EMA5 ${today.smooth} · driver: ${today.driver} · since ${today.regime_since}`, `${REGIME_ICONS[today.regime] || ''} ${today.regime}`],
  ];
  return (
    <div className="q grid gap-0 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      {q.map(([a, b, c], i) => (
        <div key={i} className="grid sm:grid-cols-[260px_1fr_160px] items-stretch" style={{ borderBottom: i < q.length - 1 ? '1px solid var(--border)' : undefined }}>
          <div className="font-semibold px-3 py-2 text-sm" style={{ background: 'var(--surface2)' }}>{a}</div>
          <div className="px-3 py-2 text-xs text-[var(--text2)]">{b}</div>
          <div className="px-3 py-2 text-sm font-bold">{c}</div>
        </div>
      ))}
    </div>
  );
}

/** #ov-leaders — "Leaders — Trend Template pass, by RS" card (template top-12 table). */
export function LeadersCard() {
  const router = useRouter();
  const stocksQ = useTableData(fetchStocks);
  const leaders = (stocksQ.data?.leaders ?? []) as unknown as StockRow[];
  const modal = useStockModal(leaders);
  const lead = leaders.slice(0, 12);

  return (
    <div className="space-y-2" id="ov-leaders">
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
  const status = useBreadthStore((s) => s.status);
  const today = useBreadthStore((s) => s.today);

  if (!today) {
    return (
      <div className="space-y-3">
        <div className="kpis grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="kpi h-20 rounded-lg bg-[var(--surface2)] animate-pulse" />
          ))}
        </div>
        <div className="h-[700px] rounded-lg bg-[var(--surface2)] animate-pulse" />
        {status === 'idle' || status === 'loading' ? null : (
          <div className="text-sm text-[var(--serious)]">No data yet — make sure the daily breadth job has run.</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <OverviewKpis />
      <FiveQuestions />

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
