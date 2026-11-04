'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Legend
} from 'recharts';
import { API_BASE_URL } from '@/lib/api/config';
import { BONDS_FONT, SHAPE_COLORS } from '../_data/bondsDesign';
import BondsSourceAttribution from './BondsSourceAttribution';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface YCRow {
  report_date: string;
  month_1: number | null; month_3: number | null; month_6: number | null;
  year_1: number | null; year_2: number | null; year_3: number | null;
  year_5: number | null; year_7: number | null; year_10: number | null;
  year_20: number | null; year_30: number | null;
}

/** GET /api/economic-indicators/yield-curve/summary (backend _shape rules:
 *  inverted < 0 ≤ flat < 0.20 ≤ normal). Nothing here is derived client-side —
 *  the badge shows exactly what the API computed from scraped rows. */
interface CurveSummary {
  as_of: string;
  last_updated: string | null;
  curve_shape: 'normal' | 'flat' | 'inverted' | 'unknown';
  spreads: {
    '10Y2Y': { value: number | null; shape: string; inverted: boolean };
    '10Y3M': { value: number | null; shape: string; inverted: boolean };
  };
}

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

const CustomToggleLegend = ({ payload, onClick, hiddenKeys, wrapperStyle }: any) => {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', justifyContent: 'center', gap: '15px 30px', flexWrap: 'wrap', ...wrapperStyle }}>
      {payload.map((entry: any, index: number) => {
        const isHidden = hiddenKeys[entry.dataKey] || hiddenKeys[entry.id]; // fallback to id if dataKey is missed in some recharts versions
        const actionKey = entry.dataKey || entry.id;
        return (
          <li key={`legend-item-${index}`}
            onClick={() => onClick(actionKey)}
            style={{
              cursor: 'pointer', opacity: isHidden ? 0.35 : 1, display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, color: '#374151', fontWeight: 600, transition: 'all 0.2s', userSelect: 'none'
            }}>
            <div style={{ width: 14, height: entry.type === 'circle' ? 8 : 2, borderRadius: entry.type === 'circle' ? '4px' : 0, background: entry.color, position: 'relative' }}>
              {entry.type !== 'circle' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: entry.color, position: 'absolute', top: -2, left: 4 }} />}
            </div>
            <span>{entry.value}</span>
          </li>
        );
      })}
    </ul>
  );
};

/* US Recession periods for shading (NBER) */
const RECESSIONS = [
  { start: '1960-04-01', end: '1961-02-01' },
  { start: '1969-12-01', end: '1970-11-01' },
  { start: '1973-11-01', end: '1975-03-01' },
  { start: '1980-01-01', end: '1980-07-01' },
  { start: '1981-07-01', end: '1982-11-01' },
  { start: '1990-07-01', end: '1991-03-01' },
  { start: '2001-03-01', end: '2001-11-01' },
  { start: '2007-12-01', end: '2009-06-01' },
  { start: '2020-02-01', end: '2020-04-01' },
];

const ZOOM_OPTIONS = ['1m', '3m', '6m', 'YTD', '1y', '5y', '10y', 'All'];

function extractCurve(row: YCRow) {
  const pts: { maturity: string; yield: number; sort: number }[] = [];
  for (const m of MATURITIES) {
    const v = (row as any)[m.key];
    if (v !== null && v !== undefined) pts.push({ maturity: m.label, yield: v, sort: m.sort });
  }
  return pts;
}

function findClosestDate(data: YCRow[], target: string): YCRow | null {
  if (!data.length) return null;
  let best = data[0], bestDiff = Math.abs(new Date(data[0].report_date).getTime() - new Date(target).getTime());
  for (const d of data) {
    const diff = Math.abs(new Date(d.report_date).getTime() - new Date(target).getTime());
    if (diff < bestDiff) { best = d; bestDiff = diff; }
  }
  return best;
}

function filterByZoom(data: any[], range: string) {
  if (range === 'All' || data.length === 0) return data;
  const lastDate = new Date(data[data.length - 1].date);
  const start = new Date(lastDate);
  switch (range) {
    case '1m': start.setMonth(start.getMonth() - 1); break;
    case '3m': start.setMonth(start.getMonth() - 3); break;
    case '6m': start.setMonth(start.getMonth() - 6); break;
    case 'YTD': start.setFullYear(start.getFullYear(), 0, 1); break;
    case '1y': start.setFullYear(start.getFullYear() - 1); break;
    case '5y': start.setFullYear(start.getFullYear() - 5); break;
    case '10y': start.setFullYear(start.getFullYear() - 10); break;
  }
  return data.filter((d: any) => d.date >= start.toISOString().slice(0, 10));
}

/* ─── Style tokens ───────────────────────────────────────────────────── */
const KEY_YIELDS = [
  { key: 'month_1', label: '1-month yield' },
  { key: 'year_1', label: '1-year yield' },
  { key: 'year_2', label: '2-year yield' },
  { key: 'year_10', label: '10-year yield' },
  { key: 'year_30', label: '30-year yield' },
];

const SECTION = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '24px 28px', marginBottom: 24 } as const;
const H2 = { fontSize: 20, fontWeight: 700, color: '#111827', textAlign: 'center' as const, marginBottom: 16, fontFamily: 'Georgia, serif' };
const H3 = { fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 12, fontFamily: 'Georgia, serif' };
const TICK = { fontSize: 10, fill: '#9ca3af' };
const GRID = { stroke: '#f3f4f6', strokeDasharray: '3 3' };

const ZoomBtn = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} style={{
    padding: '2px 7px', fontSize: 11, borderRadius: 3, cursor: 'pointer',
    border: active ? '1px solid #1d4ed8' : '1px solid transparent',
    background: active ? '#eff6ff' : 'transparent',
    color: active ? '#1d4ed8' : '#6b7280', fontWeight: active ? 700 : 400,
  }}>{label}</button>
);

/* ════════════════════════════════════════════════════════════════════════ */
export default function YieldCurveAnalysis() {
  const [ycData, setYcData] = useState<YCRow[]>([]);
  const [sp500Data, setSp500Data] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CurveSummary | null>(null);

  /* ── Historical section states ──────────────────────────────────────── */
  const [histIndex, setHistIndex] = useState(-1);
  const [zoomRange, setZoomRange] = useState('All');
  const [zoom2Range, setZoom2Range] = useState('1m');

  // Interactive Legend states
  const [hidden1, setHidden1] = useState<Record<string, boolean>>({});
  const [hidden2, setHidden2] = useState<Record<string, boolean>>({});
  const [hidden4, setHidden4] = useState<Record<string, boolean>>({});
  const [hidden5, setHidden5] = useState<Record<string, boolean>>({});

  // Spread chart zoom states
  const [spread1Zoom, setSpread1Zoom] = useState('All');
  const [spread2Zoom, setSpread2Zoom] = useState('All');
  const [spread3Zoom, setSpread3Zoom] = useState('All');

  useEffect(() => {
    (async () => {
      try {
        const [resYC, resSP] = await Promise.all([
          fetch(`${API_BASE_URL}/api/economic-indicators/yield-curve?limit=25000`),
          fetch(`${API_BASE_URL}/api/economic-indicators/SP500?limit=25000`),
        ]);
        if (resYC.ok) {
          const json = await resYC.json();
          setYcData([...json].sort((a: YCRow, b: YCRow) => a.report_date.localeCompare(b.report_date)));
        }
        if (resSP.ok) {
          const json = await resSP.json();
          setSp500Data([...json].sort((a: any, b: any) => a.trade_date.localeCompare(b.trade_date)));
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
    // Shape badge source — one-call summary (curve_shape + the two FRED spreads)
    fetch(`${API_BASE_URL}/api/economic-indicators/yield-curve/summary`)
      .then(r => (r.ok ? r.json() : null))
      .then(s => setSummary(s))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (ycData.length > 0 && histIndex < 0) setHistIndex(ycData.length - 1);
  }, [ycData, histIndex]);

  /* ── Derived data ──────────────────────────────────────────────────── */
  const latest = ycData.length ? ycData[ycData.length - 1] : null;
  const latestDate = latest?.report_date ?? '';

  const oneYearAgo = useMemo(() => {
    if (!latestDate) return null;
    const d = new Date(latestDate); d.setFullYear(d.getFullYear() - 1);
    return findClosestDate(ycData, d.toISOString().slice(0, 10));
  }, [ycData, latestDate]);

  const twoYearsAgo = useMemo(() => {
    if (!latestDate) return null;
    const d = new Date(latestDate); d.setFullYear(d.getFullYear() - 2);
    return findClosestDate(ycData, d.toISOString().slice(0, 10));
  }, [ycData, latestDate]);

  const comparisonData = useMemo(() => {
    if (!latest) return [];
    const cur = extractCurve(latest);
    const ago1 = oneYearAgo ? extractCurve(oneYearAgo) : [];
    const ago2 = twoYearsAgo ? extractCurve(twoYearsAgo) : [];
    return MATURITIES.map(m => {
      const c = cur.find(x => x.maturity === m.label);
      const a1 = ago1.find(x => x.maturity === m.label);
      const a2 = ago2.find(x => x.maturity === m.label);
      return { maturity: m.label, sort: m.sort, current: c?.yield ?? null, oneYearAgo: a1?.yield ?? null, twoYearsAgo: a2?.yield ?? null };
    }).filter(x => x.current !== null);
  }, [latest, oneYearAgo, twoYearsAgo]);

  const spreadData = useMemo(() => {
    // 10Y is the common leg; each short leg is computed independently so a row
    // missing one maturity still feeds the other two series (Recharts skips
    // nulls rather than the whole row being dropped, as the old filter did).
    return ycData
      .filter(d => d.year_10 !== null)
      .map(d => ({
        date: d.report_date,
        spread10y1y: d.year_1 !== null ? +(d.year_10! - d.year_1).toFixed(2) : null,
        spread10y2y: d.year_2 !== null ? +(d.year_10! - d.year_2).toFixed(2) : null,
        spread10y3m: d.month_3 !== null ? +(d.year_10! - d.month_3).toFixed(2) : null,
      }));
  }, [ycData]);

  const filteredSpread1 = useMemo(() => filterByZoom(spreadData, spread1Zoom), [spreadData, spread1Zoom]);
  const filteredSpread2 = useMemo(() => filterByZoom(spreadData, spread2Zoom), [spreadData, spread2Zoom]);
  const filteredSpread3 = useMemo(() => filterByZoom(spreadData, spread3Zoom), [spreadData, spread3Zoom]);

  const demoCurves = useMemo(() => {
    const normal = findClosestDate(ycData, '2021-04-15');
    const flat = findClosestDate(ycData, '2007-05-15');
    const inverted = findClosestDate(ycData, '2000-08-15');
    if (!normal || !flat || !inverted) return [];
    const cn = extractCurve(normal), cf = extractCurve(flat), ci = extractCurve(inverted);
    return MATURITIES.map(m => ({
      maturity: m.label, sort: m.sort,
      normal: cn.find(x => x.maturity === m.label)?.yield ?? null,
      flat: cf.find(x => x.maturity === m.label)?.yield ?? null,
      inverted: ci.find(x => x.maturity === m.label)?.yield ?? null,
    })).filter(x => x.normal !== null || x.flat !== null || x.inverted !== null);
  }, [ycData]);

  /* ── Historical overlay: S&P 500 + 1Y yield + 10Y yield ────────────── */
  const histRow = ycData[histIndex] ?? null;
  const histCurveData = useMemo(() => histRow ? extractCurve(histRow) : [], [histRow]);
  const histDateStr = histRow?.report_date ?? '';

  const overlayData = useMemo(() => {
    const ycMap = new Map(ycData.map(d => [d.report_date, d]));
    return sp500Data.map(s => {
      const yc = ycMap.get(s.trade_date);
      return { date: s.trade_date, sp500: s.close, pe_ratio: (s as any).pe_ratio ?? null, yield1y: yc?.year_1 ?? null, yield10y: yc?.year_10 ?? null };
    });
  }, [ycData, sp500Data]);

  const filteredOverlay = useMemo(() => filterByZoom(overlayData, zoomRange), [overlayData, zoomRange]);

  const filteredBottom = useMemo(() => {
    // GuruFocus uses strictly monthly data for this specific chart since PE is monthly!
    // Extract only the rows that have a pe_ratio.
    const monthlyData = overlayData.filter(d => d.pe_ratio !== null);

    if (zoom2Range === 'All') return monthlyData;

    // Custom filter to ensure we keep 1 point *before* the cutoff so lines draw from the left edge
    const now = new Date(monthlyData[monthlyData.length - 1]?.date || Date.now());
    let cutoff = new Date();
    if (zoom2Range === '1m') cutoff = new Date(now.setMonth(now.getMonth() - 1));
    else if (zoom2Range === '3m') cutoff = new Date(now.setMonth(now.getMonth() - 3));
    else if (zoom2Range === '6m') cutoff = new Date(now.setMonth(now.getMonth() - 6));
    else if (zoom2Range === 'YTD') cutoff = new Date(now.getFullYear(), 0, 1);
    else if (zoom2Range === '1y') cutoff = new Date(now.setFullYear(now.getFullYear() - 1));
    else if (zoom2Range === '5y') cutoff = new Date(now.setFullYear(now.getFullYear() - 5));
    else if (zoom2Range === '10y') cutoff = new Date(now.setFullYear(now.getFullYear() - 10));

    let firstIndex = monthlyData.findIndex(d => new Date(d.date) >= cutoff);
    if (firstIndex > 0) firstIndex -= 1; // Include one off-screen point for drawing

    return monthlyData.slice(firstIndex > -1 ? firstIndex : 0);
  }, [overlayData, zoom2Range]);

  const curMonth = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const fmtTick = (v: number) => { const m = MATURITIES.find(x => x.sort === v); return m ? m.label : ''; };

  const histSp500 = sp500Data.find(s => s.trade_date === histDateStr)?.close ?? null;
  const histY1 = histRow?.year_1 ?? null;
  const histY10 = histRow?.year_10 ?? null;

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Loading yield curve data…</div>;
  if (!ycData.length) return <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>No data available. Run the scraper.</div>;

  const getPeDomain = ([dataMin, dataMax]: any): [number, number] => {
    if (zoom2Range === 'All') return [0, 150];
    const range = dataMax - dataMin;
    if (range < 4) {
      const mid = (dataMax + dataMin) / 2;
      return [Number((mid - 2).toFixed(2)), Number((mid + 2).toFixed(2))];
    }
    return [Number((dataMin - range * 0.1).toFixed(2)), Number((dataMax + range * 0.1).toFixed(2))];
  };

  const getYieldDomain = ([dataMin, dataMax]: any): [number, number] => {
    if (zoom2Range === 'All') return [0, 20];
    const range = dataMax - dataMin;
    if (range < 0.8) {
      const mid = (dataMax + dataMin) / 2;
      return [Number(Math.max(0, mid - 0.4).toFixed(3)), Number((mid + 0.4).toFixed(3))];
    }
    return [Number(Math.max(0, dataMin - range * 0.1).toFixed(3)), Number((dataMax + range * 0.1).toFixed(3))];
  };

  const shapeKey = (summary?.curve_shape ?? 'unknown') as keyof typeof SHAPE_COLORS;
  const shapeC = SHAPE_COLORS[shapeKey] ?? SHAPE_COLORS.unknown;

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', fontFamily: BONDS_FONT }}>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: Current Treasury Yield Curve                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={SECTION}>
        <h2 style={H2}>US Treasury Yield Curve (updated daily)</h2>
        {/* Shape badge — straight off /yield-curve/summary (backend-computed
            from the two FRED spreads; never derived from substituted data) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
          <span>
            Updated: {new Date(latestDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase',
            color: shapeC.fg, background: shapeC.bg, border: `1px solid ${shapeC.border}`,
            borderRadius: 999, padding: '2px 10px',
          }}>
            Curve shape: {shapeKey}
          </span>
          {summary?.spreads?.['10Y2Y']?.value != null && (
            <span style={{ fontSize: 11, color: summary.spreads['10Y2Y'].inverted ? '#b91c1c' : '#374151' }}>
              10Y−2Y {summary.spreads['10Y2Y'].value! > 0 ? '+' : ''}{summary.spreads['10Y2Y'].value!.toFixed(2)}%
            </span>
          )}
          {summary?.spreads?.['10Y3M']?.value != null && (
            <span style={{ fontSize: 11, color: summary.spreads['10Y3M'].inverted ? '#b91c1c' : '#374151' }}>
              10Y−3M {summary.spreads['10Y3M'].value! > 0 ? '+' : ''}{summary.spreads['10Y3M'].value!.toFixed(2)}%
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 260px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <tbody>
                {KEY_YIELDS.map(({ key, label }) => {
                  const val = (latest as any)?.[key];
                  return (
                    <tr key={key} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 0', fontWeight: 600, color: '#374151' }}>{label}</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', color: '#111827', fontWeight: 700 }}>
                        {val !== null && val !== undefined ? `${val.toFixed(3)}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ flex: 1, minWidth: 340 }}>
            <h3 style={{ ...H3, textAlign: 'center' }}>Current Treasury Yield Curve</h3>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid {...GRID} />
                  <XAxis type="number" dataKey="sort" domain={[0, 360]}
                    ticks={[1, 3, 6, 12, 24, 36, 60, 84, 120, 240, 360]} tickFormatter={fmtTick}
                    tick={TICK} tickLine={false} axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis domain={[0, 7.5]} ticks={[0, 2.5, 5.0, 7.5]} tickFormatter={v => v % 1 === 0 ? `${v}%` : `${v.toFixed(1)}%`}
                    tick={TICK} tickLine={false} axisLine={false} width={42}
                    label={{ value: 'Treasury Yield %', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#9ca3af' } }}
                  />
                  <Tooltip formatter={(v: any) => v != null ? `${Number(v).toFixed(3)}%` : '—'} labelFormatter={() => ''} />
                  <Legend content={
                    <CustomToggleLegend
                      hiddenKeys={hidden1}
                      onClick={(key: string) => setHidden1(p => ({ ...p, [key]: !p[key] }))}
                      wrapperStyle={{ paddingTop: 10 }}
                      payload={[
                        { value: 'Current', type: 'line', dataKey: 'current', color: '#1d4ed8' },
                        { value: oneYearAgo ? curMonth(oneYearAgo.report_date) : '1yr ago', type: 'line', dataKey: 'oneYearAgo', color: '#9ca3af' },
                        { value: twoYearsAgo ? curMonth(twoYearsAgo.report_date) : '2yr ago', type: 'line', dataKey: 'twoYearsAgo', color: '#d1d5db' }
                      ]}
                    />
                  } />
                  <Line type="monotone" dataKey="current" name="Current" hide={hidden1['current']} stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 3, fill: '#1d4ed8' }} activeDot={{ r: 5 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="oneYearAgo" name={oneYearAgo ? curMonth(oneYearAgo.report_date) : '1yr ago'} hide={hidden1['oneYearAgo']} stroke="#9ca3af" strokeWidth={1.5} dot={{ r: 2.5, fill: '#9ca3af' }} activeDot={{ r: 5 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="twoYearsAgo" name={twoYearsAgo ? curMonth(twoYearsAgo.report_date) : '2yr ago'} hide={hidden1['twoYearsAgo']} stroke="#d1d5db" strokeWidth={1.5} dot={{ r: 2.5, fill: '#d1d5db' }} activeDot={{ r: 5 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: What is Yield Curve?                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={SECTION}>
        <h2 style={H2}>What is Yield Curve?</h2>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 380px', minWidth: 320 }}>
            <h3 style={H3}>Demo: Yield Curves in Three Shapes</h3>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={demoCurves} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid {...GRID} />
                  <XAxis type="number" dataKey="sort" domain={[0, 360]}
                    ticks={[1, 3, 6, 12, 24, 36, 60, 84, 120, 240, 360]} tickFormatter={fmtTick}
                    tick={TICK} tickLine={false} axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis domain={[0, 7.5]} ticks={[0, 2.5, 5.0, 7.5]} tickFormatter={v => v % 1 === 0 ? `${v}%` : `${v.toFixed(1)}%`}
                    tick={TICK} tickLine={false} axisLine={false} width={42}
                  />
                  <Tooltip formatter={(v: any) => v != null ? `${Number(v).toFixed(2)}%` : '—'} labelFormatter={() => ''} />
                  <Legend content={
                    <CustomToggleLegend
                      hiddenKeys={hidden2}
                      onClick={(key: string) => setHidden2(p => ({ ...p, [key]: !p[key] }))}
                      wrapperStyle={{ paddingTop: 10 }}
                      payload={[
                        { value: 'Apr. 2021', type: 'line', dataKey: 'normal', color: '#16a34a' },
                        { value: 'May 2007', type: 'line', dataKey: 'flat', color: '#9ca3af' },
                        { value: 'Aug. 2000', type: 'line', dataKey: 'inverted', color: '#dc2626' }
                      ]}
                    />
                  } />
                  <Line type="monotone" dataKey="normal" name="Apr. 2021" hide={hidden2['normal']} stroke="#16a34a" strokeWidth={2} dot={{ r: 3, fill: '#16a34a' }} activeDot={{ r: 5 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="flat" name="May 2007" hide={hidden2['flat']} stroke="#9ca3af" strokeWidth={2} dot={{ r: 3, fill: '#9ca3af' }} activeDot={{ r: 5 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="inverted" name="Aug. 2000" hide={hidden2['inverted']} stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3.5, fill: '#dc2626' }} activeDot={{ r: 5 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ flex: '1 1 300px', fontSize: 14, color: '#374151', lineHeight: 1.75 }}>
            <p>According to Investopedia, the yield curve graphs the relationship between bond yields and bond maturity. As bonds with longer maturities usually carry higher risk, such bonds have higher yields than the bonds with shorter maturities.</p>
            <p style={{ marginTop: 12 }}>Due to this, a <strong>normal yield curve</strong> reflects increasing bond yields as maturity increases. However, the yield curve can sometimes become <strong>flat</strong> or <strong>inverted</strong>.</p>
            <p style={{ marginTop: 12 }}>The left graph selects three different time periods to show the three different yield curve shapes: <span style={{ color: '#16a34a', fontWeight: 600 }}>April 2021</span> shows the normal upward sloping yield curve, <span style={{ color: '#6b7280', fontWeight: 600 }}>May 2007</span> shows a flat yield curve, and <span style={{ color: '#dc2626', fontWeight: 600 }}>August 2000</span> shows an inverted yield curve.</p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: Inverted Yield Curve — Spread Charts                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={SECTION}>
        <h2 style={H2}>Inverted Yield Curve</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28 }}>

          {/* ── LEFT: Charts ── */}
          <div style={{ minWidth: 0 }}>
            {/* Chart 1: 10Y-1Y */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 4 }}>
              <h3 style={{ ...H3, margin: 0 }}>Historical Treasury Yield Spread (10Y–1Y)</h3>
              <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#6b7280', marginRight: 4 }}>Zoom</span>
                {['1m', '3m', '6m', 'YTD', '1y', '5y', '10y', 'All'].map(z => (
                  <button key={z} onClick={() => setSpread1Zoom(z)}
                    style={{ padding: '2px 7px', fontSize: 11, fontWeight: spread1Zoom === z ? 700 : 400, color: spread1Zoom === z ? '#111827' : '#6b7280',
                      background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: spread1Zoom === z ? 'underline' : 'none', textUnderlineOffset: 3 }}>
                    {z}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative', height: 220, marginBottom: 4 }}>
              {(() => {
                const v = [...filteredSpread1].reverse().find(d => d.spread10y1y !== null)?.spread10y1y;
                return v != null ? (
                  <div style={{ position: 'absolute', right: 28, top: '40%', zIndex: 10, fontSize: 13, fontWeight: 700, color: '#1d4ed8' }}>
                    {v.toFixed(2)}%
                  </div>
                ) : null;
              })()}
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredSpread1} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid {...GRID} />
                  {RECESSIONS.map((r, i) => <ReferenceArea key={i} x1={r.start} x2={r.end} fill="#d1d5db" fillOpacity={0.45} />)}
                  <ReferenceLine y={0} stroke="#ef4444" strokeWidth={1.5} />
                  <XAxis dataKey="date" minTickGap={80} tickFormatter={v => new Date(v).getFullYear().toString()} tick={TICK} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                  <YAxis domain={[-5, 5]} ticks={[-5, -2.5, 0, 2.5, 5]} tickFormatter={v => v % 1 === 0 ? `${v}%` : `${v.toFixed(1)}%`} tick={TICK} tickLine={false} axisLine={false} width={38} />
                  <Tooltip formatter={(v: any) => v != null ? `${Number(v).toFixed(2)}%` : '—'} labelFormatter={(l: any) => new Date(l).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} />
                  <Line type="monotone" dataKey="spread10y1y" name="10Y − 1Y" stroke="#1d4ed8" strokeWidth={1.2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#6b7280', marginBottom: 20 }}>━ Treasury Yield Spread (10Y-1Y)</div>

            {/* Chart 2: 10Y-2Y */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 4 }}>
              <h3 style={{ ...H3, margin: 0 }}>Historical Treasury Yield Spread (10Y–2Y)</h3>
              <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#6b7280', marginRight: 4 }}>Zoom</span>
                {['1m', '3m', '6m', 'YTD', '1y', '5y', '10y', 'All'].map(z => (
                  <button key={z} onClick={() => setSpread2Zoom(z)}
                    style={{ padding: '2px 7px', fontSize: 11, fontWeight: spread2Zoom === z ? 700 : 400, color: spread2Zoom === z ? '#111827' : '#6b7280',
                      background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: spread2Zoom === z ? 'underline' : 'none', textUnderlineOffset: 3 }}>
                    {z}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative', height: 220, marginBottom: 4 }}>
              {(() => {
                const v = [...filteredSpread2].reverse().find(d => d.spread10y2y !== null)?.spread10y2y;
                return v != null ? (
                  <div style={{ position: 'absolute', right: 28, top: '40%', zIndex: 10, fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>
                    {v.toFixed(2)}%
                  </div>
                ) : null;
              })()}
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredSpread2} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid {...GRID} />
                  {RECESSIONS.map((r, i) => <ReferenceArea key={i} x1={r.start} x2={r.end} fill="#d1d5db" fillOpacity={0.45} />)}
                  <ReferenceLine y={0} stroke="#ef4444" strokeWidth={1.5} />
                  <XAxis dataKey="date" minTickGap={80} tickFormatter={v => new Date(v).getFullYear().toString()} tick={TICK} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                  <YAxis domain={[-5, 5]} ticks={[-5, -2.5, 0, 2.5, 5]} tickFormatter={v => v % 1 === 0 ? `${v}%` : `${v.toFixed(1)}%`} tick={TICK} tickLine={false} axisLine={false} width={38} />
                  <Tooltip formatter={(v: any) => v != null ? `${Number(v).toFixed(2)}%` : '—'} labelFormatter={(l: any) => new Date(l).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} />
                  <Line type="monotone" dataKey="spread10y2y" name="10Y − 2Y" stroke="#7c3aed" strokeWidth={1.2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#6b7280', marginBottom: 20 }}>━ Treasury Yield Spread (10Y-2Y)</div>

            {/* Chart 3: 10Y-3M — the second spread FRED tracks (T10Y3M) and the
                one the brief benchmarks the inversion call against */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 4 }}>
              <h3 style={{ ...H3, margin: 0 }}>Historical Treasury Yield Spread (10Y–3M)</h3>
              <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#6b7280', marginRight: 4 }}>Zoom</span>
                {['1m', '3m', '6m', 'YTD', '1y', '5y', '10y', 'All'].map(z => (
                  <button key={z} onClick={() => setSpread3Zoom(z)}
                    style={{ padding: '2px 7px', fontSize: 11, fontWeight: spread3Zoom === z ? 700 : 400, color: spread3Zoom === z ? '#111827' : '#6b7280',
                      background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: spread3Zoom === z ? 'underline' : 'none', textUnderlineOffset: 3 }}>
                    {z}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative', height: 220, marginBottom: 4 }}>
              {(() => {
                const v = [...filteredSpread3].reverse().find(d => d.spread10y3m !== null)?.spread10y3m;
                return v != null ? (
                  <div style={{ position: 'absolute', right: 28, top: '40%', zIndex: 10, fontSize: 13, fontWeight: 700, color: '#0f766e' }}>
                    {v.toFixed(2)}%
                  </div>
                ) : null;
              })()}
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredSpread3} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid {...GRID} />
                  {RECESSIONS.map((r, i) => <ReferenceArea key={i} x1={r.start} x2={r.end} fill="#d1d5db" fillOpacity={0.45} />)}
                  <ReferenceLine y={0} stroke="#ef4444" strokeWidth={1.5} />
                  <XAxis dataKey="date" minTickGap={80} tickFormatter={v => new Date(v).getFullYear().toString()} tick={TICK} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                  <YAxis domain={[-5, 5]} ticks={[-5, -2.5, 0, 2.5, 5]} tickFormatter={v => v % 1 === 0 ? `${v}%` : `${v.toFixed(1)}%`} tick={TICK} tickLine={false} axisLine={false} width={38} />
                  <Tooltip formatter={(v: any) => v != null ? `${Number(v).toFixed(2)}%` : '—'} labelFormatter={(l: any) => new Date(l).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} />
                  <Line type="monotone" dataKey="spread10y3m" name="10Y − 3M" stroke="#0f766e" strokeWidth={1.2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#6b7280', marginBottom: 6 }}>━ Treasury Yield Spread (10Y-3M)</div>
            <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>* The grey zones indicate US recessions.</p>
          </div>

          {/* ── RIGHT: Description ── */}
          <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>
            <p>An <strong>inverted yield curve</strong> occurs when yields on short-term bonds rise above the yields on longer-term bonds of the same credit quality, which has proven to be a relatively reliable indicator of an economic recession. The inverted yield curve can be observed when the yield spread between long-term yield and short-term yield is less than zero, as shown in the graphs on the left.</p>

            <p style={{ marginTop: 16 }}>The gray bars throughout the charts indicate the past U.S. recessions since 1967. A quick look at the &quot;Historical Treasury Yield Spread (10Y-1Y)&quot; graph suggests that historically, an economic recession generally follows once the yield spread drops below 0% (the red Y-axis). This is especially true for recessions during the late 1900s. The yield spread reached an all-time low of -3.10% around April 1980, during the economic recession of the early 1980s.</p>

            <p style={{ marginTop: 16 }}>An inverted yield curve has predicted the past <strong>7 recessions</strong>.</p>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: Historical Yield Curve  (GuruFocus style)              */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* This section displays: (1) A yield curve snapshot for a user-selected */}
      {/* date using an interactive slider, and (2) An overlay chart comparing   */}
      {/* S&P 500 index with 1Y and 10Y Treasury yields over time. Both charts */}
      {/* help visualize historical relationships between equity markets and    */}
      {/* bond yields, with clickable date selection for detailed analysis.     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {false && <div style={SECTION}>
        <h2 style={H2}>Historical Yield Curve</h2>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>

          {/* LEFT: Yield curve snapshot for selected date */}
          <div style={{ width: 240, flexShrink: 0 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Treasury Yield Curve {histDateStr ? new Date(histDateStr).toLocaleDateString('en-US', { month: 'short' }) + '. ' + new Date(histDateStr).getFullYear() : ''}
            </h3>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={histCurveData} margin={{ top: 10, right: 8, left: 0, bottom: 5 }}>
                  <CartesianGrid {...GRID} />
                  <XAxis type="number" dataKey="sort" domain={[0, 360]}
                    ticks={[1, 3, 6, 12, 24, 36, 60, 84, 120, 240, 360]} tickFormatter={fmtTick}
                    tick={{ ...TICK, fontSize: 8 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis domain={[0, 7.5]} ticks={[0, 2.5, 5.0, 7.5]} tickFormatter={v => v % 1 === 0 ? `${v}%` : `${v.toFixed(1)}%`}
                    tick={TICK} tickLine={false} axisLine={false} width={34}
                    label={{ value: 'Treasury yield %', angle: -90, position: 'insideLeft', style: { fontSize: 8, fill: '#9ca3af' } }}
                  />
                  <Tooltip formatter={(v: any) => v != null ? `${Number(v).toFixed(2)}%` : '—'} labelFormatter={() => ''} />
                  <Line type="monotone" dataKey="yield" stroke="#1d4ed8" strokeWidth={2}
                    dot={{ r: 3, fill: '#1d4ed8', strokeWidth: 0 }} isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Timeline slider & Date boundaries */}
            <div style={{ marginTop: 6 }}>
              <div style={{ position: 'relative' }}>
                <input type="range" min={0} max={ycData.length - 1} value={histIndex >= 0 ? histIndex : 0}
                  onChange={e => {
                    setHistIndex(parseInt(e.target.value));
                  }}
                  style={{ width: '100%', accentColor: '#1d4ed8', cursor: 'ew-resize' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af', marginBottom: 12 }}>
                <span>{ycData[0]?.report_date.slice(0, 4)}</span>
                <span>{ycData[ycData.length - 1]?.report_date.slice(0, 4)}</span>
              </div>
            </div>
          </div>

          {/* RIGHT: S&P 500 vs Treasury Yield (1Y + 10Y) */}
          <div style={{ flex: 1, minWidth: 400 }}>
            <h3 style={{ ...H3, textAlign: 'center', fontSize: 14 }}>S&P 500 Index vs Treasury Yield</h3>

            {/* Info + zoom */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
              <div style={{ fontSize: 10, lineHeight: 1.6 }}>
                <div>{histDateStr ? new Date(histDateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}</div>
                <div><span style={{ color: '#000', fontWeight: 600 }}>S&P 500</span>: <span style={{ color: '#1d4ed8' }}>{histSp500 ? histSp500.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}</span></div>
                <div><span style={{ color: '#1d4ed8', fontWeight: 600 }}>1-Year Constant Maturity Rate</span>: <span>{histY1?.toFixed(2) ?? '—'}</span></div>
                <div><span style={{ color: '#16a34a', fontWeight: 600 }}>10-Year Constant Maturity Rate</span>: <span>{histY10?.toFixed(2) ?? '—'}</span></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 11, color: '#6b7280', marginRight: 4 }}>Zoom</span>
                {ZOOM_OPTIONS.map(z => <ZoomBtn key={z} label={z} active={zoomRange === z} onClick={() => setZoomRange(z)} />)}
              </div>
            </div>

            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredOverlay} margin={{ top: 5, right: 45, left: 10, bottom: 5 }}
                  onClick={(e: any) => {
                    if (e && e.activeLabel) {
                      const idx = ycData.findIndex(d => d.report_date >= e.activeLabel);
                      if (idx !== -1) setHistIndex(idx);
                    }
                  }}
                >
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="date" minTickGap={40}
                    tickFormatter={v => new Date(v).getFullYear().toString()}
                    tick={TICK} tickLine={false} axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis yAxisId="sp" scale="log" domain={zoomRange === 'All' ? [10, 10000] : ['auto', 'auto']}
                    ticks={zoomRange === 'All' ? [10, 100, 1000, 10000] : undefined}
                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                    tick={TICK} tickLine={false} axisLine={false} width={38}
                    label={{ value: 'S&P 500', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: '#9ca3af' } }}
                  />
                  <YAxis yAxisId="yd" orientation="right" domain={zoomRange === 'All' ? [0, 18] : ['auto', 'auto']}
                    ticks={zoomRange === 'All' ? [0, 6, 12, 18] : undefined}
                    tickFormatter={v => `${v}%`}
                    tick={TICK} tickLine={false} axisLine={false} width={38}
                    label={{ value: 'Treasury Yield', angle: 90, position: 'insideRight', style: { fontSize: 9, fill: '#9ca3af' } }}
                  />
                  <Tooltip formatter={(v: any, name: any) => {
                    if (v == null) return '—';
                    if (name === 'S&P 500' || name === 'sp500') return Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 });
                    return `${Number(v).toFixed(2)}%`;
                  }} labelFormatter={(l: any) => new Date(l).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} />
                  <Legend content={
                    <CustomToggleLegend
                      hiddenKeys={hidden4}
                      onClick={(key: string) => setHidden4(p => ({ ...p, [key]: !p[key] }))}
                      wrapperStyle={{ paddingBottom: 10 }}
                      payload={[
                        { value: 'S&P 500', type: 'line', dataKey: 'sp500', color: '#000000' },
                        { value: '1-Year Constant Maturity Rate', type: 'line', dataKey: 'yield1y', color: '#1d4ed8' },
                        { value: '10-Year Constant Maturity Rate', type: 'line', dataKey: 'yield10y', color: '#16a34a' }
                      ]}
                    />
                  } />
                  <Line yAxisId="sp" type="monotone" dataKey="sp500" name="S&P 500" hide={hidden4['sp500']} stroke="#000000" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
                  <Line yAxisId="yd" type="monotone" dataKey="yield1y" name="1-Year Constant Maturity Rate" hide={hidden4['yield1y']} stroke="#1d4ed8" strokeWidth={1} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
                  <Line yAxisId="yd" type="monotone" dataKey="yield10y" name="10-Year Constant Maturity Rate" hide={hidden4['yield10y']} stroke="#16a34a" strokeWidth={1} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
                  {histDateStr && <ReferenceLine x={histDateStr} stroke="#eab308" strokeWidth={2.5} yAxisId="sp" />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: Historical 10Y Treasury Yield vs S&P 500              */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* This section displays a dual-axis chart comparing the 10-Year         */}
      {/* Treasury Yield with S&P 500 P/E ratio (TTM) over time. The section   */}
      {/* includes zoom controls to analyze different time periods and helps    */}
      {/* investors understand the inverse relationship between Treasury yields */}
      {/* and stock market valuations. Higher yields typically correlate with   */}
      {/* lower P/E multiples as discount rates rise.                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {false && <div style={SECTION}>
        <h2 style={H2}>Historical Treasury Yield vs. S&P 500 P/E</h2>
        <h3 style={{ ...H3, textAlign: 'center' }}>Historical 10Y Treasury Yield vs. S&P 500 P/E(TTM)</h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: '#6b7280', marginRight: 4 }}>Zoom</span>
          {ZOOM_OPTIONS.map(z => <ZoomBtn key={z} label={z} active={zoom2Range === z} onClick={() => setZoom2Range(z)} />)}
        </div>

        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredBottom} margin={{ top: 10, right: 50, left: 10, bottom: 10 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="date" minTickGap={40}
                tickFormatter={v => {
                  const d = new Date(v);
                  if (zoom2Range === '1m' || zoom2Range === '3m') {
                    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                  } else if (zoom2Range === '6m' || zoom2Range === 'YTD' || zoom2Range === '1y') {
                    return `${d.toLocaleDateString('en-US', { month: 'short' })} '${d.getFullYear().toString().slice(-2)}`;
                  }
                  return d.getFullYear().toString();
                }}
                tick={TICK} tickLine={false} axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis yAxisId="pe" domain={getPeDomain}
                ticks={zoom2Range === 'All' ? [0, 30, 60, 90, 120, 150] : undefined}
                tickCount={6}
                tickFormatter={v => zoom2Range === 'All' ? String(Math.round(v)) : Number(v).toFixed(1)}
                tick={TICK} tickLine={false} axisLine={false} width={42}
                label={{ value: 'S&P 500', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#111827' } }}
              />
              <YAxis yAxisId="yd" orientation="right" domain={getYieldDomain}
                ticks={zoom2Range === 'All' ? [0, 4, 8, 12, 16, 20] : undefined}
                tickCount={6}
                tickFormatter={v => zoom2Range === 'All' ? `${Number(v).toFixed(0)}%` : `${Number(v).toFixed(2)}%`}
                tick={TICK} tickLine={false} axisLine={false} width={42}
                label={{ value: 'Treasury Yield', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: '#3b82f6' } }}
              />
              <Tooltip formatter={(v: any, name: any) => {
                if (v == null) return '—';
                if (name === 'S&P 500 P/E(TTM)' || name === 'pe_ratio') return Number(v).toFixed(2);
                return `${Number(v).toFixed(2)}%`;
              }} labelFormatter={(l: any) => new Date(l).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} />
              <Legend content={
                <CustomToggleLegend
                  hiddenKeys={hidden5}
                  onClick={(key: string) => setHidden5(p => ({ ...p, [key]: !p[key] }))}
                  wrapperStyle={{ paddingTop: 10 }}
                  payload={[
                    { value: '10-Year Constant Maturity Rate', type: 'line', dataKey: 'yield10y', color: '#3b82f6' },
                    { value: 'S&P 500 P/E(TTM)', type: 'line', dataKey: 'pe_ratio', color: '#111827' }
                  ]}
                />
              } />
              <Line yAxisId="yd" type="linear" dataKey="yield10y" name="10-Year Constant Maturity Rate" hide={hidden5['yield10y']} stroke="#3b82f6" strokeWidth={2} dot={['1m', '3m', '6m', 'YTD', '1y'].includes(zoom2Range) ? { r: 3 } : false} activeDot={{ r: 5 }} isAnimationActive={false} />
              <Line yAxisId="pe" connectNulls={true} type="linear" dataKey="pe_ratio" name="S&P 500 P/E(TTM)" hide={hidden5['pe_ratio']} stroke="#111827" strokeWidth={1.5} dot={['1m', '3m', '6m', 'YTD', '1y'].includes(zoom2Range) ? { r: 3 } : false} activeDot={{ r: 5 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>}

      <BondsSourceAttribution
        detail={summary
          ? `Curve as of ${summary.as_of}${summary.last_updated ? ` · last fetched ${new Date(summary.last_updated).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}.`
          : null}
      />

    </div>
  );
}
