/**
 * Stock chart modal — the React port of the reference dashboard's
 * `openStock()` + `drawLocal()`.
 *
 * It is deliberately a standalone canvas renderer: the shared Stack engine
 * paints candles only for the TASI keys (tasi_o/h/l), so per-symbol price,
 * volume and RS panels are drawn here instead of bending the engine. Geometry,
 * margins, tick logic and colours follow pro_dashboard_template.html
 * line-for-line.
 */
'use client';
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cssVar, ticks } from '../_engine/helpers';
import { fmt, pct } from './format';
import { StageBadge, StockRow, useOhlcSymbol } from './ui';

interface LocalSeries {
  dates: string[];
  c: number[]; o: number[]; h: number[]; l: number[]; v: number[];
  m50: number[]; m150: number[]; m200: number[];
  rs: (number | null)[];
  chg: number[];
}

type Tri = [key: keyof LocalSeries, color: string, type: 'candle' | 'line' | 'bar'];

const PANELS: { h: number; series: Tri[]; title: string }[] = [
  {
    h: 300,
    series: [['c', '--text', 'candle'], ['m50', '--red', 'line'], ['m150', '--orange', 'line'], ['m200', '--text2', 'line']],
    title: 'Price · MA50 · MA150 · MA200',
  },
  { h: 90, series: [['v', '--blue', 'bar']], title: 'Volume' },
  { h: 110, series: [['rs', '--violet', 'line']], title: 'Relative strength vs TASI (rebased 100)' },
];

/** drawLocal(): three fixed panels on one canvas each, own index space. */
function drawLocal(el: HTMLElement, scope: HTMLElement, L: LocalSeries) {
  el.replaceChildren();
  el.classList.add('breadth-stack');
  const css = (name: string) => cssVar(name, scope);
  const n = L.c.length;

  PANELS.forEach((p, k) => {
    const dv = document.createElement('div');
    dv.className = 'breadth-panel';
    dv.style.height = `${p.h}px`;
    const canvas = document.createElement('canvas');
    dv.appendChild(canvas);
    const ttl = document.createElement('div');
    ttl.className = 'breadth-ttl';
    const b = document.createElement('b');
    b.textContent = p.title;
    ttl.appendChild(b);
    dv.appendChild(ttl);
    el.appendChild(dv);

    const dpr = window.devicePixelRatio || 1;
    const W = el.clientWidth || 900;
    const H = p.h;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    const g = canvas.getContext('2d');
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    const Lm = 62, R = 12, T = 22;
    const B = k === PANELS.length - 1 ? 20 : 6;
    const pw = W - Lm - R;
    const ph = H - T - B;
    const X = (i: number) => Lm + (i / Math.max(1, n - 1)) * pw;

    let lo = Infinity, hi = -Infinity;
    p.series.forEach(([key]) => {
      const a = key === 'c' ? L.l : (L[key] as number[]);
      const a2 = key === 'c' ? L.h : (L[key] as number[]);
      for (let i = 0; i < n; i++) {
        if (a[i] != null && a[i] < lo) lo = a[i];
        if (a2[i] != null && a2[i] > hi) hi = a2[i];
      }
    });
    if (!Number.isFinite(lo)) { lo = 0; hi = 1; }
    if (p.series[0][2] === 'bar') lo = 0;
    const pad = (hi - lo) * 0.06 || 1;
    if (p.series[0][2] !== 'bar') lo -= pad;
    hi += pad;
    const Y = (v: number) => T + ph - ((v - lo) / (hi - lo)) * ph;

    g.fillStyle = css('--surface');
    g.fillRect(0, 0, W, H);
    g.strokeStyle = css('--grid');
    g.fillStyle = css('--text2');
    g.font = '10px sans-serif';
    g.textAlign = 'right';
    ticks(lo, hi, 4).forEach((v) => {
      const y = Y(v);
      g.beginPath();
      g.moveTo(Lm, y);
      g.lineTo(Lm + pw, y);
      g.stroke();
      const lab =
        p.series[0][2] === 'bar'
          ? v >= 1e6
            ? `${(v / 1e6).toFixed(1)}M`
            : v >= 1e3
              ? `${(v / 1e3).toFixed(0)}K`
              : fmt(v)
          : fmt(v, Math.abs(hi - lo) < 5 ? 2 : 0);
      g.fillText(lab, Lm - 6, y + 3);
    });

    if (k === PANELS.length - 1) {
      g.textAlign = 'center';
      let last = '';
      for (let i = 0; i < n; i++) {
        const lab = (L.dates[i] || '').slice(0, 7);
        if (lab !== last) {
          last = lab;
          g.fillText(lab, X(i), H - 6);
        }
      }
    }

    const bw = Math.max(1, pw / n - 1);
    p.series.forEach(([key, col, type]) => {
      if (type === 'candle') {
        for (let i = 0; i < n; i++) {
          const o = L.o[i], h = L.h[i], l = L.l[i], cl = L.c[i];
          if (cl == null) continue;
          const up = o == null ? true : cl >= o;
          g.strokeStyle = g.fillStyle = css(up ? '--up' : '--down');
          const x = X(i);
          if (h != null && l != null) {
            g.beginPath();
            g.moveTo(x, Y(h));
            g.lineTo(x, Y(l));
            g.stroke();
          }
          if (o != null) {
            const y1 = Y(Math.max(o, cl));
            const y2 = Y(Math.min(o, cl));
            g.fillRect(x - bw / 2, y1, bw, Math.max(1, y2 - y1));
          }
        }
      } else if (type === 'bar') {
        const arr = L[key] as number[];
        for (let i = 0; i < n; i++) {
          const v = arr[i];
          if (v == null) continue;
          g.fillStyle = css(L.chg[i] >= 0 ? '--up' : '--down');
          g.fillRect(X(i) - bw / 2, Y(v), bw, Math.max(1, Y(0) - Y(v)));
        }
      } else {
        const arr = L[key] as (number | null)[];
        g.strokeStyle = css(col);
        g.lineWidth = 1.3;
        g.beginPath();
        let pen = false;
        for (let i = 0; i < n; i++) {
          const v = arr[i];
          if (v == null) { pen = false; continue; }
          if (!pen) { g.moveTo(X(i), Y(v)); pen = true; } else g.lineTo(X(i), Y(v));
        }
        g.stroke();
      }
    });

    g.strokeStyle = css('--border');
    g.strokeRect(Lm + 0.5, T + 0.5, pw - 1, ph - 1);
  });
}

/** Builds the modal's local index space (RS rebased to 100, daily deltas). */
function buildLocal(dates: string[], tasi: number[], d: { o: number[]; h: number[]; l: number[]; c: number[]; v: number[]; m50: number[]; m150: number[]; m200: number[] }): LocalSeries {
  let b: number | null = null;
  const rs = d.c.map((v, i) => {
    const t = tasi[i];
    if (v == null || t == null) return null;
    if (b == null) b = v / t;
    return (100 * (v / t)) / b;
  });
  const chg = d.c.map((v, i) => (i && v != null && d.c[i - 1] != null ? v - d.c[i - 1] : 0));
  return { dates, c: d.c, o: d.o, h: d.h, l: d.l, v: d.v, m50: d.m50, m150: d.m150, m200: d.m200, rs, chg };
}

const pc = (v: number | null | undefined) =>
  v == null ? '—' : <span className={v >= 0 ? 'pos' : 'neg'}>{pct(v)}</span>;

export default function StockChartModal({
  sym,
  row,
  onClose,
}: {
  sym: number | null;
  row: StockRow | null;
  onClose: () => void;
}) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const { data, loading, error } = useOhlcSymbol(sym);

  useEffect(() => {
    if (!sym) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sym, onClose]);

  useEffect(() => {
    if (!data || !stackRef.current || !scopeRef.current || sym == null) return;
    drawLocal(stackRef.current, scopeRef.current, buildLocal(data.dates, data.tasi, data.data));
  }, [data, sym]);

  if (sym == null) return null;

  return createPortal(
    <div className="breadth-root" ref={scopeRef} dir="ltr">
      <div className="breadth-modal-dim" onClick={onClose} />
      <div className="breadth-modal" role="dialog" aria-modal="true">
        <div className="hd">
          <h3>{sym} · {row?.name ?? ''}</h3>
          <span className="note" style={{ margin: 0 }}>
            {row?.group ?? ''} · close {fmt(row?.close ?? null, 2)} · 1D {pc(row?.d1)} · 1M {pc(row?.m1)} · 3M {pc(row?.m3)} · RS {row?.rs ?? '—'} · Stage {row?.stage != null ? <StageBadge stage={row.stage} /> : '—'}{' '}
            {row?.tt ? <span className="tag" style={{ background: 'var(--good)' }}>Trend Template</span> : null}
            {row?.nhv ? <span className="tag" style={{ background: 'var(--blue)' }}>52w high on volume</span> : null}
          </span>
          <span className="sp" />
          <button className="btn" onClick={onClose}>✕ close</button>
        </div>
        {loading && !data ? <p className="note">loading chart…</p> : null}
        {error ? <div className="breadth-error">Failed to load chart — {error}</div> : null}
        <div ref={stackRef} />
        <p className="note">
          Adjusted OHLC, last 260 trading days; MA50 red, MA150 orange, MA200 grey; volume coloured by direction;
          RS line = stock / TASI rebased to 100 (Weinstein: rising RS line confirms a Stage-2 breakout).
        </p>
      </div>
    </div>,
    document.body,
  );
}
