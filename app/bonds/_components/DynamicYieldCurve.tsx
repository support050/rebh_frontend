'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ComposedChart,
} from 'recharts';
import { API_BASE_URL } from '@/lib/api/config';
import { STOCKCHARTS } from '../_data/bondsDesign';
import BondsSourceAttribution from './BondsSourceAttribution';

/* Maturity ladder plotted on the X axis (positions in months, like the tool). */
const MATURITIES = [
  { key: 'month_1', label: '1M', sort: 1 },
  { key: 'month_3', label: '3M', sort: 3 },
  { key: 'month_6', label: '6M', sort: 6 },
  { key: 'year_1', label: '1Y', sort: 12 },
  { key: 'year_2', label: '2Y', sort: 24 },
  { key: 'year_3', label: '3Y', sort: 36 },
  { key: 'year_5', label: '5Y', sort: 60 },
  { key: 'year_7', label: '7Y', sort: 84 },
  { key: 'year_10', label: '10Y', sort: 120 },
  { key: 'year_20', label: '20Y', sort: 240 },
  { key: 'year_30', label: '30Y', sort: 360 },
] as const;

// X-axis tick set matches the reference screenshot: 3M 2Y 5Y 7Y 10Y 20Y 30Y
const CURVE_TICKS = [3, 24, 60, 84, 120, 240, 360];
const labelForSort = (s: number) => MATURITIES.find(m => m.sort === s)?.label ?? '';

type CurveMap = Record<number, number | null>;
function curveBySort(row: any): CurveMap {
  const o: CurveMap = {};
  for (const m of MATURITIES) o[m.sort] = row?.[m.key] ?? null;
  return o;
}

function fmtLongDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* 4 evenly-spaced ticks between min & max (StockCharts axis style). */
function fourTicks(min: number, max: number): number[] {
  if (!isFinite(min) || !isFinite(max) || min === max) return [min, min, min, min];
  const step = (max - min) / 3;
  return [min, min + step, min + step * 2, max];
}

interface Snapshot { id: number; color: string; bySort: CurveMap; date: string; }

const SNAP_COLORS = ['#000000', '#0f766e', '#7c3aed', '#b45309', '#be123c'];

export default function DynamicYieldCurve() {
  const [ycData, setYcData] = useState<any[]>([]);       // ascending by date
  const [sp500Data, setSp500Data] = useState<any[]>([]);  // ascending by date
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryAsOf, setSummaryAsOf] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [trailLength, setTrailLength] = useState(0);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [playing, setPlaying] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const spRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const resYC = await fetch(`${API_BASE_URL}/api/economic-indicators/yield-curve?limit=25000`);
        if (!resYC.ok) throw new Error('Failed to fetch yield curve data');
        const jsonYC = await resYC.json();
        const sortedYC = [...jsonYC].reverse();          // API is desc → ascending
        setYcData(sortedYC);

        const resSP = await fetch(`${API_BASE_URL}/api/economic-indicators/SP500?limit=25000`);
        if (resSP.ok) {
          const jsonSP = await resSP.json();
          setSp500Data([...jsonSP].reverse());
        }

        if (sortedYC.length > 0) setSelectedDate(sortedYC[sortedYC.length - 1].report_date);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
    fetch(`${API_BASE_URL}/api/economic-indicators/yield-curve/summary`)
      .then(r => (r.ok ? r.json() : null))
      .then(s => { if (s?.as_of) setSummaryAsOf(s.as_of); })
      .catch(() => {});
  }, []);

  const selectedIndex = useMemo(() => ycData.findIndex(d => d.report_date === selectedDate), [ycData, selectedDate]);

  // Animate: step the selection forward one session at a time, looping.
  useEffect(() => {
    if (!playing || ycData.length === 0) return;
    const id = setInterval(() => {
      setSelectedDate(prev => {
        const i = ycData.findIndex(d => d.report_date === prev);
        const next = (i + 1) % ycData.length;
        return ycData[next]?.report_date ?? prev;
      });
    }, 350);
    return () => clearInterval(id);
  }, [playing, ycData]);

  /* ── Left chart data: current curve + fading trail + snapshots ────────── */
  const currentCurve = useMemo(
    () => (selectedIndex >= 0 ? curveBySort(ycData[selectedIndex]) : {}),
    [ycData, selectedIndex],
  );

  const trailCurves = useMemo(() => {
    const out: { offset: number; bySort: CurveMap }[] = [];
    for (let k = 1; k <= trailLength; k++) {
      const idx = selectedIndex - k;
      if (idx < 0) break;
      out.push({ offset: k, bySort: curveBySort(ycData[idx]) });
    }
    return out;
  }, [ycData, selectedIndex, trailLength]);

  const leftData = useMemo(() => {
    const sorts = MATURITIES.map(m => m.sort);
    const rows: any[] = [];
    for (const s of sorts) {
      const cur = currentCurve[s];
      if (cur == null) continue;                        // only maturities the day publishes
      const row: any = { sort: s, label: labelForSort(s), current: cur };
      trailCurves.forEach(t => { row[`trail${t.offset}`] = t.bySort[s] ?? null; });
      snapshots.forEach((sn, i) => { row[`snap${i}`] = sn.bySort[s] ?? null; });
      rows.push(row);
    }
    return rows;
  }, [currentCurve, trailCurves, snapshots]);

  const curveDomain = useMemo(() => {
    const vals: number[] = [];
    leftData.forEach(r => {
      if (r.current != null) vals.push(r.current);
      trailCurves.forEach(t => { if (r[`trail${t.offset}`] != null) vals.push(r[`trail${t.offset}`]); });
    });
    if (!vals.length) return { domain: [0, 5] as [number, number], ticks: [0, 1.67, 3.33, 5] };
    const min = Math.min(...vals), max = Math.max(...vals);
    const pad = (max - min) * 0.08 || 0.25;
    const lo = min - pad, hi = max + pad;
    return { domain: [lo, hi] as [number, number], ticks: fourTicks(lo, hi) };
  }, [leftData, trailCurves]);

  /* ── Right chart (S&P) ─────────────────────────────────────────────────── */
  const spDomain = useMemo(() => {
    const closes = sp500Data.map(d => d.close).filter((v: any) => v != null);
    if (!closes.length) return { domain: [0, 1000] as [number, number], ticks: [0, 333, 666, 1000] };
    const min = Math.min(...closes), max = Math.max(...closes);
    const pad = (max - min) * 0.05 || 10;
    const lo = min - pad, hi = max + pad;
    return { domain: [lo, hi] as [number, number], ticks: fourTicks(lo, hi) };
  }, [sp500Data]);

  const spTicks = useMemo(() => {
    // year ticks at ~3-year stride, matching the reference ('03 '07 '11 …)
    if (!sp500Data.length) return [];
    const years = sp500Data.map(d => new Date(d.trade_date).getFullYear());
    const first = years[0], last = years[years.length - 1];
    const stride = Math.max(1, Math.round((last - first) / 6));
    const out: string[] = [];
    for (let y = first; y <= last; y += stride) {
      const hit = sp500Data.find(d => new Date(d.trade_date).getFullYear() === y);
      if (hit) out.push(hit.trade_date);
    }
    return out;
  }, [sp500Data]);

  const getDateFromMouseX = useCallback((clientX: number) => {
    const el = spRef.current;
    if (!el || sp500Data.length === 0) return;
    const rect = el.getBoundingClientRect();
    const left = rect.left + 52;    // YAxis width gutter
    const right = rect.right - 12;
    let ratio = (clientX - left) / (right - left);
    ratio = Math.max(0, Math.min(1, ratio));
    const idx = Math.round(ratio * (sp500Data.length - 1));
    const d = sp500Data[idx]?.trade_date;
    if (d) {
      // snap to a date that actually has a treasury curve row
      const yc = ycData.find(r => r.report_date === d);
      setSelectedDate(yc ? d : (ycData.find(r => r.report_date >= d)?.report_date ?? selectedDate));
    }
  }, [sp500Data, ycData, selectedDate]);

  const onDown = (e: React.MouseEvent) => { setPlaying(false); setIsDragging(true); getDateFromMouseX(e.clientX); };
  const onMove = (e: React.MouseEvent) => { if (isDragging) getDateFromMouseX(e.clientX); };
  const onUp = useCallback(() => setIsDragging(false), []);
  useEffect(() => {
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [onUp]);

  const spClose = sp500Data.find(s => s.trade_date === selectedDate)?.close
    ?? [...sp500Data].reverse().find(s => s.trade_date <= selectedDate)?.close ?? null;

  const curveShape = useMemo(() => {
    const vals = leftData.map(r => r.current).filter((v: any) => v != null) as number[];
    if (vals.length < 2) return 'FLAT';
    const diff = vals[vals.length - 1] - vals[0];
    if (diff > 0.5) return 'NORMAL';
    if (diff < -0.3) return 'INVERTED';
    return 'FLAT';
  }, [leftData]);
  const shapeColor = curveShape === 'INVERTED' ? '#d40000' : curveShape === 'NORMAL' ? '#0a7c52' : '#92640a';

  const takeSnapshot = () => {
    if (!Object.keys(currentCurve).length) return;
    setSnapshots(prev => prev.length >= 5 ? prev : [
      ...prev,
      { id: Date.now(), color: SNAP_COLORS[prev.length % SNAP_COLORS.length], bySort: { ...currentCurve }, date: selectedDate },
    ]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-28">
        <svg className="h-9 w-9 animate-spin" viewBox="0 0 24 24" fill="none" style={{ color: STOCKCHARTS.spLine }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
        </svg>
      </div>
    );
  }

  const axisTick = { fontSize: 11, fill: STOCKCHARTS.axisText, fontFamily: 'Arial, sans-serif' };

  return (
    <div style={{ background: '#f4f4f4', borderRadius: 4, padding: '10px 12px 12px', maxWidth: 1000, margin: '0 auto', fontFamily: 'Arial, Helvetica, sans-serif' }}>

      {/* Title bar (StockCharts light header) */}
      <div style={{ textAlign: 'center', fontSize: 17, color: '#5b6b7a', fontWeight: 400, padding: '6px 0 12px', borderBottom: '1px solid #e2e2e2', marginBottom: 14 }}>
        Dynamic Yield Curve
      </div>

      {error && (
        <div style={{ color: '#b91c1c', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 4, padding: '6px 10px', marginBottom: 10, fontSize: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 0, justifyContent: 'center', alignItems: 'stretch' }}>

        {/* ── LEFT: Yield Curve ── */}
        <div style={{ width: 250, height: 380, position: 'relative', background: '#ffffff', border: '1px solid #d0d0d0', flexShrink: 0 }}>
          {showInfo && (
            <>
              <div style={{ position: 'absolute', bottom: 30, left: 40, zIndex: 10, fontSize: 10, color: '#333', pointerEvents: 'none' }}>
                {fmtLongDate(selectedDate)}
              </div>
              <div style={{ position: 'absolute', bottom: 30, right: 10, zIndex: 10, fontSize: 10, color: shapeColor, fontWeight: 700, pointerEvents: 'none' }}>
                {curveShape.charAt(0) + curveShape.slice(1).toLowerCase()}
              </div>
            </>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={leftData} margin={{ top: 14, right: 12, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={STOCKCHARTS.curveFillTop} stopOpacity={1} />
                  <stop offset="100%" stopColor={STOCKCHARTS.curveFillBottom} stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={STOCKCHARTS.grid} strokeOpacity={0.5} vertical horizontal />
              <XAxis
                type="number" dataKey="sort" domain={[1, 360]} ticks={CURVE_TICKS}
                tickFormatter={labelForSort} tick={axisTick} tickLine={false}
                axisLine={{ stroke: STOCKCHARTS.grid }} tickMargin={4} height={20}
              />
              <YAxis
                type="number" domain={curveDomain.domain} ticks={curveDomain.ticks}
                tickFormatter={(v) => `${Number(v).toFixed(2)}%`}
                tick={axisTick} tickLine={false} axisLine={{ stroke: STOCKCHARTS.grid }} width={44}
              />
              <Tooltip
                cursor={{ stroke: '#999' }}
                contentStyle={{ fontSize: 11, fontFamily: 'Arial', padding: '3px 8px', borderRadius: 3 }}
                formatter={(v: any, n: any) => [v == null ? '—' : `${Number(v).toFixed(2)}%`, n === 'current' ? 'Yield' : n]}
                labelFormatter={() => ''}
              />
              {/* fading trail (oldest → newest) */}
              {trailCurves.map(t => (
                <Line
                  key={`trail-${t.offset}`} type="linear" dataKey={`trail${t.offset}`}
                  stroke={STOCKCHARTS.curveLine} strokeOpacity={Math.max(0.12, 0.5 - t.offset * 0.05)}
                  strokeWidth={1} dot={false} activeDot={false} connectNulls isAnimationActive={false}
                />
              ))}
              {/* snapshots */}
              {snapshots.map((sn, i) => (
                <Line
                  key={`snap-${sn.id}`} type="linear" dataKey={`snap${i}`} name={fmtLongDate(sn.date)}
                  stroke={sn.color} strokeWidth={1.4} strokeDasharray="4 3" dot={false} connectNulls isAnimationActive={false}
                />
              ))}
              {/* current curve: red line over purple gradient area */}
              <Area
                type="linear" dataKey="current" name="Yield"
                stroke={STOCKCHARTS.curveLine} strokeWidth={2}
                fill="url(#curveGrad)" fillOpacity={1}
                dot={{ r: 2, fill: STOCKCHARTS.curveLine, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* ── RIGHT: S&P 500 ── */}
        <div
          ref={spRef}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          style={{ flex: 1, minWidth: 0, height: 380, position: 'relative', background: '#ffffff', border: '1px solid #d0d0d0', borderLeft: 'none', cursor: isDragging ? 'col-resize' : 'crosshair', userSelect: 'none' }}
        >
          {showInfo && (
            <>
              <div style={{ position: 'absolute', top: 6, left: 52, zIndex: 10, fontSize: 11, lineHeight: 1.35, pointerEvents: 'none' }}>
                <div style={{ color: '#333' }}>S&amp;P 500 ($SPX)</div>
                <div style={{ color: '#333' }}>{fmtLongDate(selectedDate)}</div>
                <div style={{ color: '#333' }}>Close: <span style={{ fontWeight: 700 }}>{spClose != null ? spClose.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</span></div>
              </div>
              <div style={{ position: 'absolute', top: 6, right: 10, zIndex: 10, fontSize: 10, color: '#9a9a9a', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                Design inspired by StockCharts.com | Data: U.S. Department of the Treasury
              </div>
            </>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sp500Data} margin={{ top: 14, right: 12, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="spGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={STOCKCHARTS.spFillTop} stopOpacity={1} />
                  <stop offset="100%" stopColor={STOCKCHARTS.spFillBottom} stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={STOCKCHARTS.grid} strokeOpacity={0.4} vertical horizontal />
              <XAxis
                dataKey="trade_date" ticks={spTicks}
                tickFormatter={(v) => `'${new Date(v).getFullYear().toString().slice(2)}`}
                tick={axisTick} tickLine={false} axisLine={{ stroke: STOCKCHARTS.grid }} tickMargin={4} height={20} interval={0}
              />
              <YAxis
                domain={spDomain.domain} ticks={spDomain.ticks}
                tickFormatter={(v) => Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                tick={axisTick} tickLine={false} axisLine={{ stroke: STOCKCHARTS.grid }} width={52}
              />
              <Tooltip
                cursor={{ stroke: '#999' }}
                contentStyle={{ fontSize: 11, fontFamily: 'Arial', padding: '3px 8px', borderRadius: 3 }}
                formatter={(v: any) => [v == null ? '—' : Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 }), 'Close']}
                labelFormatter={(l: any) => fmtLongDate(String(l))}
              />
              <Area
                type="linear" dataKey="close" name="Close"
                stroke={STOCKCHARTS.spLine} strokeWidth={1.3}
                fill="url(#spGrad)" fillOpacity={1}
                dot={false} activeDot={false} isAnimationActive={false}
              />
              {selectedDate && <ReferenceLine x={selectedDate} stroke={STOCKCHARTS.curveLine} strokeWidth={1.4} />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Control strip ── */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12, fontSize: 12, color: '#333' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Trail length:</span>
          <input
            type="range" min={0} max={12} step={1} value={trailLength}
            onChange={e => setTrailLength(parseInt(e.target.value, 10))}
            style={{ width: 120, accentColor: STOCKCHARTS.spLine }}
          />
          <span style={{ width: 18, textAlign: 'right' }}>{trailLength}</span>
        </label>

        {/* Date scrubber — the primary dynamic control */}
        <input
          type="range" min={0} max={Math.max(0, ycData.length - 1)} step={1}
          value={selectedIndex >= 0 ? selectedIndex : 0}
          onChange={e => { setPlaying(false); setSelectedDate(ycData[parseInt(e.target.value, 10)].report_date); }}
          style={{ flex: 1, minWidth: 160, accentColor: STOCKCHARTS.curveLine }}
        />

        <button onClick={takeSnapshot} style={scBtn}>Snapshot</button>
        <button onClick={() => setSnapshots([])} style={scBtn}>Clear</button>
        <button onClick={() => setPlaying(p => !p)} style={{ ...scBtn, background: playing ? '#e6e6e6' : '#ffffff' }}>
          {playing ? 'Stop' : 'Animate'}
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input type="checkbox" checked={showInfo} onChange={e => setShowInfo(e.target.checked)} style={{ accentColor: STOCKCHARTS.spLine }} />
          Show Info
        </label>
      </div>

      {/* Snapshot chips (dates captured) */}
      {snapshots.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {snapshots.map(sn => (
            <span key={sn.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, border: '1px solid #d0d0d0', borderRadius: 3, padding: '2px 6px', background: '#fff' }}>
              <span style={{ width: 10, height: 3, background: sn.color, display: 'inline-block' }} />
              {fmtLongDate(sn.date)}
              <button onClick={() => setSnapshots(prev => prev.filter(x => x.id !== sn.id))} style={{ border: 'none', background: 'transparent', color: '#999', cursor: 'pointer', fontSize: 12 }}>×</button>
            </span>
          ))}
        </div>
      )}

      <BondsSourceAttribution detail={summaryAsOf ? `Curve as of ${summaryAsOf}.` : null} />
    </div>
  );
}

const scBtn: React.CSSProperties = {
  fontSize: 12, padding: '3px 12px', border: '1px solid #b8b8b8', borderRadius: 3,
  background: '#f6f6f6', color: '#333', cursor: 'pointer', fontFamily: 'Arial, sans-serif',
};
