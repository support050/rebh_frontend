'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Line, Bar, Area, ComposedChart, LineChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea,
} from 'recharts';
import { API_BASE_URL } from '@/lib/api/config';
import EditGraphSidebar, {
  defaultFormatSettings,
  GraphFormatSettings,
  UserDefinedLine,
} from './EditGraphSidebar';
import IndicatorHeader from './IndicatorHeader';
import IndicatorFooter from './IndicatorFooter';
import {
  DataPoint,
  applyUnitsTransform,
  applyFrequencyTransform,
  applyOutputUnitsTransform,
  getTransformedYAxisLabel,
  calculateXAxisTicks,
  formatXAxisLabel,
  calculateYAxisTicks,
} from './dataTransforms';
import { IndicatorMetadata } from '../_data/indicatorMetadata';
import { FRED_FONT, FRED_COLORS, FRED_CHART_HEIGHT, NBER_RECESSIONS, fredLinkStyle } from '../_data/fredDesign';

/* ── DB metadata shape (GET /api/economic-indicators/{code}/metadata) ── */
interface FredSeriesMetadataDto {
  indicator_code: string;
  series_id?: string | null;
  title?: string | null;
  units?: string | null;
  frequency?: string | null;
  seasonal_adjustment?: string | null;
  source_agency?: string | null;
  fred_url?: string | null;
  latest_observation_date?: string | null;
  latest_observation_value?: number | null;
  last_updated_time?: string | null;
  next_release_date?: string | null;
  release_id?: number | null;
  release_calendar_url?: string | null;
  notes?: string | null;
}

/* "2026-11-06" -> "Nov 6, 2026" (matches FRED's Next Release Date display). */
function formatDisplayDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    const d = new Date(iso + 'T00:00:00Z');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

/* Last-resort fallback for "Updated" when neither the DB nor the static file
   has FRED's own stamp: renders OUR ingestion time, which is not what FRED
   shows. Used only when nothing else is available. */
function formatUpdatedTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
}

/* Format the latest observation value the way FRED shows it: UNRATE 1dp,
   percent series (e.g. ICE BofA spreads) 2dp, otherwise grouped integers. */
function formatObservationValue(value: number | null | undefined, code: string, units?: string): string {
  if (value === null || value === undefined) return '';
  if (code === 'UNRATE') return value.toFixed(1);
  if (/percent/i.test(units || '') || !Number.isInteger(value)) return value.toFixed(2);
  return Math.round(value).toLocaleString('en-US');
}

/* FRED defaults the graph to the series' own frequency. */
function baseFrequencyOf(frequency?: string): string {
  const f = (frequency || '').toLowerCase();
  if (f.startsWith('daily')) return 'Daily';
  if (f.startsWith('weekly')) return 'Weekly';
  if (f.startsWith('quarterly')) return 'Quarterly';
  if (f.startsWith('semiannual')) return 'Semiannual';
  if (f.startsWith('annual') || f.startsWith('yearly')) return 'Annual';
  return 'Monthly';
}

/* "Percent, Not Seasonally Adjusted" -> "Not Seasonally Adjusted". */
function seasonalAdjustmentOf(units?: string): string {
  return (units || '').toLowerCase().includes('not seasonally adjusted')
    ? 'Not Seasonally Adjusted'
    : 'Seasonally Adjusted';
}

interface EconomicIndicatorProps {
  indicatorCode: string;
  title: string;
  yAxisLabel: string;
  metadata?: IndicatorMetadata;
  showHeader?: boolean;
}

/* ─────────────────────────────────────────────
   Safe formula evaluator
───────────────────────────────────────────── */
function safeEval(expr: string, vars: Record<string, number>): number | null {
  try {
    let e = expr.toLowerCase().replace(/\^/g, '**'); // FRED uses ^ for exponent
    Object.keys(vars).forEach((v) => {
      e = e.replace(new RegExp(`\\b${v}\\b`, 'g'), String(vars[v]));
    });
    if (!/^[0-9\s+\-*/.()e]+$/i.test(e)) return null;
    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${e})`)();
    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────────────
   Build interpolated data points for a user-defined
   straight line so it can be rendered on the chart.
───────────────────────────────────────────── */
function buildUDLPoints(
  udl: UserDefinedLine,
  chartDates: string[]
): { date: string; value: number }[] {
  const t0 = new Date(udl.dateStart).getTime();
  const t1 = new Date(udl.dateEnd).getTime();
  if (t0 >= t1) return [];
  const span = t1 - t0;

  return chartDates
    .filter((d) => d >= udl.dateStart && d <= udl.dateEnd)
    .map((d) => {
      const t = new Date(d).getTime();
      const ratio = (t - t0) / span;
      const value = udl.valueStart + ratio * (udl.valueEnd - udl.valueStart);
      return { date: d, value: Math.round(value * 10000) / 10000 };
    });
}

function getStrokeDasharrayForStyle(style: 'Solid' | 'Dashed' | 'Dotted'): string | undefined {
  if (style === 'Dashed') return '6 3';
  if (style === 'Dotted') return '2 3';
  return undefined;
}

/* Colors for series added on top of Line 1 (FRED's "add a line" palette). */
const SERIES_PALETTE = ['#e74c3c', '#27ae60', '#f39c12', '#8e44ad', '#16a085', '#2980b9'];

export default function EconomicIndicatorView({ indicatorCode, title, yAxisLabel, metadata, showHeader = true }: EconomicIndicatorProps) {
  const [data, setData] = useState<any[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);  // Keep full response with created_at
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ── Persisted FRED metadata (DB-backed, authoritative over the static file) ──
  const [dbMeta, setDbMeta] = useState<FredSeriesMetadataDto | null>(null);

  // ── Format settings ──
  const [formatSettings, setFormatSettings] = useState<GraphFormatSettings>({
    ...defaultFormatSettings,
    graphType: 'Line',
  });
    // Defaults from the measured .highcharts-container box (1320 x 465).
  const [chartHeight, setChartHeight] = useState(FRED_CHART_HEIGHT);
  const [chartWidth, setChartWidth] = useState(1320);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chartWrapRef = useRef<HTMLDivElement>(null);

  // ── Drag-to-zoom (FRED / Highcharts box selection) ──
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null);

  // ── Series baseline, read from the STATIC metadata prop on purpose: the
  //    sidebar mirrors lineInfo into its local state, so a value that changed
  //    when DB metadata landed would silently reset the user's selection. ──
  const baseFrequency = baseFrequencyOf(metadata?.frequency);

  // ── Data transformation state ──
  const [selectedUnits, setSelectedUnits] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState(baseFrequency);
  const [outputUnits, setOutputUnits] = useState('Select');

  // ── Multi-series + formula ──
  const [additionalSeries, setAdditionalSeries] = useState<Record<string, { data: DataPoint[]; label: string }>>({});
  const [seriesError, setSeriesError] = useState<string | null>(null);
  const [activeFormula, setActiveFormula] = useState('a');
  const [isFormulaActive, setIsFormulaActive] = useState(false);

  // ── User-defined lines (trend lines) ──
  const [userDefinedLines, setUserDefinedLines] = useState<UserDefinedLine[]>([]);

  // Keep `isFullscreen` in sync with the browser's native fullscreen state —
  // covers exit via the "Back" button, ESC, or the browser UI itself.
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(document.fullscreenElement === chartWrapRef.current);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  /* ── Fetch primary series ── */
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/economic-indicators/${indicatorCode}?limit=3000`);
        if (!res.ok) throw new Error('Data fetch failed');
        const json = await res.json();

        // Store raw data (with created_at) for metadata computation
        setRawData(json);

        // Create chart data by reversing and extracting date/value
        const chartData = json
          .map((item: any) => ({ date: item.report_date, value: item.value }))
          .reverse();
        setData(chartData);
        if (chartData.length > 0) {
          setStartDate(chartData[0].date);
          setEndDate(chartData[chartData.length - 1].date);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [indicatorCode]);

  /* ── Fetch persisted FRED series metadata (units, updated, next release, ...) ── */
  useEffect(() => {
    async function fetchMeta() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/economic-indicators/${indicatorCode}/metadata`);
        if (!res.ok) return; // 404 (not scraped yet) -> keep static fallback
        setDbMeta(await res.json());
      } catch {
        /* network hiccup -> static fallback remains */
      }
    }
    fetchMeta();
  }, [indicatorCode]);

  /* ── Fetch an additional series ── */
  const fetchNewSeries = async (code: string) => {
    if (additionalSeries[code]) {
      setSeriesError(`"${code}" is already on the graph.`);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/economic-indicators/${code}?limit=3000`);
      if (!res.ok) {
        setSeriesError(`No data available for "${code}" on this server.`);
        return;
      }
      const json = await res.json();
      if (!Array.isArray(json) || json.length === 0) {
        setSeriesError(`"${code}" returned no observations.`);
        return;
      }
      const chartData: DataPoint[] = json
        .map((item: any) => ({ date: item.report_date, value: item.value }))
        .reverse();
      setSeriesError(null);
      setAdditionalSeries((prev) => ({
        ...prev,
        [code]: { data: chartData, label: code },
      }));
    } catch {
      setSeriesError(`Failed to load "${code}" — check the connection.`);
    }
  };

  // Units label mapping
  const unitsMap: Record<string, string> = {
    UNRATE: 'Percent',
    PAYEMS: 'Thousands of Persons',
    IC4WSA: 'Number',
  };
  const defaultUnits = unitsMap[indicatorCode] ?? metadata?.units ?? yAxisLabel;
  const isPercentSeries = /percent/i.test(defaultUnits);

  useEffect(() => {
    if (!selectedUnits) setSelectedUnits(defaultUnits);
  }, [defaultUnits, selectedUnits]);

  /* ── Merge: static file (fallback) < DB metadata (authoritative) < dynamic obs ── */
  const computedMetadata = useMemo(() => {
    if (!metadata) return metadata;
    const merged: IndicatorMetadata = { ...metadata };

    // 1) DB-persisted metadata wins when present.
    if (dbMeta) {
      if (dbMeta.title) merged.title = dbMeta.title;
      if (dbMeta.units) {
        merged.units = [dbMeta.units, dbMeta.seasonal_adjustment].filter(Boolean).join(', ');
      }
      if (dbMeta.frequency) merged.frequency = dbMeta.frequency;
      if (dbMeta.source_agency) merged.source = dbMeta.source_agency;
      if (dbMeta.fred_url) merged.fredLink = dbMeta.fred_url;
      if (dbMeta.notes) merged.notes = dbMeta.notes;
      // "Updated:" is FRED's own stamp (e.g. "Oct 30, 2026 9:19 AM CDT"). It is
      // a different instant from when our scraper ran, so nothing downstream
      // may replace it.
      if (dbMeta.last_updated_time) merged.updated = dbMeta.last_updated_time;
      // The DB row is authoritative: if FRED gave us no upcoming release, drop
      // the date copied from the static file instead of presenting a stale one.
      merged.nextRelease = dbMeta.next_release_date ? formatDisplayDate(dbMeta.next_release_date) : undefined;
      merged.releaseCalendarUrl = dbMeta.release_calendar_url ?? undefined;
      if (dbMeta.latest_observation_value != null) {
        merged.observations = formatObservationValue(dbMeta.latest_observation_value, indicatorCode, merged.units);
      }
      if (dbMeta.latest_observation_date) merged.observationDate = dbMeta.latest_observation_date;
    }

    // 2) Values from the observations feed. The latest-observation block only
    //    wins when the loaded data is actually fresher than the static file —
    //    otherwise the header would contradict the right edge of the chart.
    if (rawData.length > 0) {
      const latestRecord = rawData[0]; // descending order from API
      const staticObsDate = metadata.observationDate;
      const liveIsFresher =
        !!latestRecord.report_date &&
        (!staticObsDate || latestRecord.report_date > staticObsDate);

      if (liveIsFresher) {
        if (latestRecord.value != null) {
          merged.observations = formatObservationValue(Number(latestRecord.value), indicatorCode, merged.units);
        }
        merged.observationDate = latestRecord.report_date;
        // Never replace a FRED "Updated:" stamp with our ingestion time — the
        // row's created_at is when the scraper ran, in the local timezone.
        if (!merged.updated && latestRecord.created_at) {
          merged.updated = formatUpdatedTimestamp(latestRecord.created_at);
        }
      } else {
        if (!merged.observations && latestRecord.value != null) {
          merged.observations = formatObservationValue(Number(latestRecord.value), indicatorCode, merged.units);
        }
        if (!merged.observationDate && latestRecord.report_date) {
          merged.observationDate = latestRecord.report_date;
        }
        if (!merged.updated && latestRecord.created_at) {
          merged.updated = formatUpdatedTimestamp(latestRecord.created_at);
        }
      }
    }

    // 3) Date range always reflects the data actually loaded.
    if (data.length > 0) {
      merged.dateRange = `${data[0].date} to ${data[data.length - 1].date}`;
    }

    return merged;
  }, [metadata, dbMeta, rawData, data, indicatorCode]);

  /* ── Transform pipeline ── */
  const transformedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // 1. Date filter
    let filtered = data;
    if (startDate && endDate) {
      filtered = data.filter((d) => d.date >= startDate && d.date <= endDate);
    }

    // 2. Build variable map for formula
    const seriesMap: Record<string, DataPoint[]> = {
      a: filtered.map((d) => ({ date: d.date, value: d.value })),
    };
    Object.values(additionalSeries).forEach(({ data: sd }, idx) => {
      const varName = String.fromCharCode(98 + idx);
      seriesMap[varName] = sd.filter((d) => d.date >= startDate && d.date <= endDate);
    });

    // 3. Apply formula or use raw primary
    let result: DataPoint[] = [];
    if (isFormulaActive && activeFormula.trim() !== 'a') {
      result = seriesMap['a'].map((p) => {
        const vars: Record<string, number> = {};
        Object.entries(seriesMap).forEach(([k, pts]) => {
          const match = pts.find((pt) => pt.date === p.date);
          vars[k] = match ? match.value : 0;
        });
        const computed = safeEval(activeFormula, vars);
        return { date: p.date, value: computed ?? p.value };
      });
    } else {
      result = seriesMap['a'];
    }

    // 4. Frequency aggregation
    result = applyFrequencyTransform(result, selectedFrequency);

    // 5. Units transformation
    if (selectedUnits && selectedUnits !== defaultUnits) {
      result = applyUnitsTransform(result, selectedUnits, selectedFrequency);
    }

    // 6. Output units transformation
    if (outputUnits && outputUnits !== 'Select') {
      result = applyOutputUnitsTransform(result, outputUnits, selectedFrequency);
    }

    return result;
  }, [data, additionalSeries, isFormulaActive, activeFormula, startDate, endDate, selectedUnits, selectedFrequency, outputUnits, defaultUnits]);

  /* ── Build UDL chart data keyed by line id ── */
  const udlChartData = useMemo(() => {
    const dates = transformedData.map((d) => d.date);
    const result: Record<string, { date: string; value: number }[]> = {};
    for (const udl of userDefinedLines) {
      result[udl.id] = buildUDLPoints(udl, dates);
    }
    return result;
  }, [userDefinedLines, transformedData]);

  /* ── Extra data series (added from the sidebar). They are only drawn as their
     own lines while no formula is combining them — with a formula the series are
     consumed into the single computed Line 1, exactly like FRED. ── */
  const showExtraSeries = !isFormulaActive || activeFormula.trim() === 'a';
  const extraSeries = useMemo(
    () =>
      Object.entries(additionalSeries).map(([code, s], i) => ({
        code,
        label: s.label,
        key: `ser_${code}`,
        color: SERIES_PALETTE[i % SERIES_PALETTE.length],
      })),
    [additionalSeries],
  );

  /* ── Merge UDL points + extra series into the chart rows under prefixed keys —
     recharts series components read from the chart-level data array, so each
     additional line is injected as an extra key on every date row. ── */
  const mergedChartData = useMemo(() => {
    // Final row key -> date/value lookup.
    const maps: Record<string, Map<string, number>> = {};
    Object.entries(udlChartData).forEach(([id, pts]) => {
      maps[`udl_${id}`] = new Map(pts.map((p) => [p.date, p.value]));
    });
    if (showExtraSeries) {
      Object.entries(additionalSeries).forEach(([code, s]) => {
        maps[`ser_${code}`] = new Map(s.data.map((p) => [p.date, p.value]));
      });
    }
    return transformedData.map((row) => {
      const extras: Record<string, number> = {};
      Object.entries(maps).forEach(([key, m]) => {
        const v = m.get(row.date);
        if (v != null) extras[key] = v;
      });
      return Object.keys(extras).length ? { ...row, ...extras } : row;
    });
  }, [transformedData, udlChartData, additionalSeries, showExtraSeries]);

  /* ── Sidebar callbacks ── */
  const handleAddSeries = (code: string) => fetchNewSeries(code);

  const handleRemoveSeries = (code: string) => {
    setAdditionalSeries((prev) => {
      const next = { ...prev };
      delete next[code];
      return next;
    });
  };

  const handleApplyFormula = (f: string) => {
    setActiveFormula(f);
    setIsFormulaActive(f.trim() !== '' && f.trim() !== 'a');
  };

  const handleRangeClick = (years: number | 'MAX') => {
    if (data.length === 0) return;
    const latestDateStr = data[data.length - 1].date;
    setEndDate(latestDateStr);
    if (years === 'MAX') {
      setStartDate(data[0].date);
    } else {
      const d = new Date(latestDateStr);
      d.setFullYear(d.getFullYear() - years);
      const newStart = d.toISOString().split('T')[0];
      const actualStart = data[0].date;
      setStartDate(newStart < actualStart ? actualStart : newStart);
    }
  };

  /* ── Download the current (transformed) series as CSV ── */
  const downloadCsv = () => {
    if (transformedData.length === 0) return;
    const rows = [['date', indicatorCode], ...transformedData.map((d) => [d.date, String(d.value)])];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${indicatorCode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Drag-to-zoom handlers: the selection just sets the date range, which the
        transformedData filter already consumes — so the date inputs stay in sync. ── */
  const fullStart = data.length ? data[0].date : '';
  const fullEnd = data.length ? data[data.length - 1].date : '';
  const isZoomed = data.length > 0 && (startDate !== fullStart || endDate !== fullEnd);

  const handleChartMouseDown = (e: any) => {
    if (e && e.activeLabel != null) {
      setRefAreaLeft(String(e.activeLabel));
      setRefAreaRight(null);
    }
  };
  const handleChartMouseMove = (e: any) => {
    if (refAreaLeft && e && e.activeLabel != null) {
      setRefAreaRight(String(e.activeLabel));
    }
  };
  const handleChartMouseUp = () => {
    if (refAreaLeft && refAreaRight && refAreaLeft !== refAreaRight) {
      // ISO "YYYY-MM-DD" sorts lexicographically == chronologically.
      const [lo, hi] = [refAreaLeft, refAreaRight].sort();
      setStartDate(lo);
      setEndDate(hi);
    }
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };
  const resetZoom = () => {
    if (data.length === 0) return;
    setStartDate(data[0].date);
    setEndDate(data[data.length - 1].date);
  };

  /* ── Native fullscreen on the chart container (FRED behavior) ── */
  const openFullscreen = () => {
    const el = chartWrapRef.current as HTMLElement | null;
    if (el && typeof el.requestFullscreen === 'function') {
      el.requestFullscreen().catch(() => setIsFullscreen(true));
    } else {
      setIsFullscreen(true); // fallback when the API is unavailable
    }
  };

  /* ── Y-axis config ── */
  const isTransformed = (selectedUnits && selectedUnits !== defaultUnits) || outputUnits !== 'Select' || isFormulaActive;

  let yAxisTicks: number[] | undefined = undefined;
  let yAxisDomain: [number | 'auto', number | 'auto'] = ['auto', 'auto'];

  if (transformedData.length > 0) {
    // Include UDL values in domain calculation
    const allValues = [
      ...transformedData.map(d => d.value),
      ...userDefinedLines.flatMap(udl => [udl.valueStart, udl.valueEnd]),
    ];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const { ticks, domain } = calculateYAxisTicks(min, max, 8);
    yAxisTicks = ticks;
    yAxisDomain = domain;
  }

  /* ── Log-scale config: plain 'log' cannot render 0/negative values, so fall
     back to recharts' symlog with an explicit floor. ── */
  const logHasNonPositive = transformedData.some((d) => d.value <= 0);
  const logCfg = {
    scale: (formatSettings.logScaleLeft ? (logHasNonPositive ? 'symlog' : 'log') : 'auto') as 'symlog' | 'log' | 'auto',
    domain: (formatSettings.logScaleLeft && logHasNonPositive ? [0, 'auto'] : yAxisDomain) as [number | 'auto', number | 'auto'],
  };

  /* ── X-axis ticks ── */
  const { ticks: xAxisTicks, formatType: xAxisFormatType } = useMemo(() => {
    return calculateXAxisTicks(transformedData);
  }, [transformedData]);

  const dynamicYAxisLabel = getTransformedYAxisLabel(yAxisLabel, selectedUnits, outputUnits);

  const formatYAxis = (value: number) => {
    if (isTransformed) {
      if (dynamicYAxisLabel.includes('Percent') || dynamicYAxisLabel.includes('Rate') || dynamicYAxisLabel.includes('Log')) return value.toFixed(1);
      if (dynamicYAxisLabel.includes('Index')) return value.toFixed(0);
    }
    if (indicatorCode === 'UNRATE') return value.toFixed(1);
    return value.toLocaleString();
  };

  const formatXAxis = (dateStr: string) => formatXAxisLabel(dateStr, xAxisFormatType);

  /* ── Derived style props from formatSettings ── */
  const getStrokeDasharray = (): string | undefined => {
    if (formatSettings.lineStyle === 'Dashed') return '6 3';
    if (formatSettings.lineStyle === 'Dotted') return '2 3';
    return undefined;
  };

  const getDotProps = (): false | object => {
    if (formatSettings.markType === 'None') return false;
    return { r: formatSettings.markWidth, fill: formatSettings.lineColor };
  };

  const yAxisOrientation = formatSettings.yAxisPosition === 'Right' ? 'right' : 'left';

  /* ── Custom Tooltip ── */
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!formatSettings.showTooltip) return null;
    if (!active || !payload || !payload.length) return null;
    const dateObj = new Date(label + 'T12:00:00');
    const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const fmtOne = (rawVal: number) => {
      if (isTransformed) {
        if (dynamicYAxisLabel.includes('Percent') || dynamicYAxisLabel.includes('Rate')) return rawVal.toFixed(2) + '%';
        if (dynamicYAxisLabel.includes('Index')) return rawVal.toFixed(1);
        if (dynamicYAxisLabel.includes('Log')) return rawVal.toFixed(4);
        return rawVal.toLocaleString();
      }
      if (indicatorCode === 'UNRATE') return rawVal.toFixed(1);
      if (isPercentSeries) return rawVal.toFixed(2);
      return rawVal.toLocaleString();
    };
    return (
      <div className="bg-[#f8fbff] text-xs px-2 py-1.5 border border-blue-400 rounded-sm shadow opacity-95">
        <span className="font-bold text-[#333]">{dateStr}</span>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-1.5 mt-0.5">
            <span style={{ width: 10, height: 3, background: p.stroke || p.color, display: 'inline-block', borderRadius: 2 }} />
            <span className="text-[#555]">{p.name ?? ''}:</span>
            <span className="font-bold text-[#333]">{typeof p.value === 'number' ? fmtOne(p.value) : p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  /* ── Chart renderer ── */
  const renderChart = () => {
    const commonXAxis = (
      <XAxis
        dataKey="date"
        ticks={xAxisTicks}
        tickFormatter={formatXAxis}
        tick={{ fontSize: 13, fill: '#64748b' }}
        tickMargin={12}
        interval={0}
      />
    );

    const commonYAxis = (
      <YAxis
        orientation={yAxisOrientation}
        domain={logCfg.domain}
        ticks={yAxisTicks}
        tickFormatter={formatYAxis}
        label={
          formatSettings.showAxisTitles
            ? { value: dynamicYAxisLabel, angle: -90, position: 'insideLeft', offset: -10, style: { textAnchor: 'middle', fill: '#64748b', fontSize: 13 } }
            : undefined
        }
        scale={logCfg.scale}
        tick={{ fontSize: 12, fill: '#64748b' }}
        width={85}
      />
    );

    const commonTooltip = (
      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1 }} />
    );

    /* Bar graphs want a band cursor (a translucent column) not a crosshair line */
    const barTooltip = (
      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 102, 204, 0.08)' }} />
    );

    /* ── Render user-defined lines from the merged `udl_<id>` keys ── */
    const udlLines = userDefinedLines.map((udl, ui) => {
      const pts = udlChartData[udl.id] ?? [];
      if (pts.length === 0) return null;
      const label = udl.label && udl.label !== 'Trend Line' ? udl.label : `Trend Line ${ui + 1}`;
      return (
        <Line
          key={udl.id}
          dataKey={`udl_${udl.id}`}
          name={label}
          stroke={udl.color}
          strokeWidth={udl.lineWidth}
          strokeDasharray={getStrokeDasharrayForStyle(udl.lineStyle)}
          dot={false}
          activeDot={false}
          isAnimationActive={false}
          connectNulls
        />
      );
    }).filter(Boolean);

    /* ── Secondary right axis + lines for added data series (FRED plots Line 2
       on its own axis so different magnitudes stay readable). Only rendered while
       such series exist. The primary axis keeps the default id, so every other
       element (grid, reference areas, main series) is untouched. ── */
    const hasExtras = showExtraSeries && extraSeries.length > 0;
    const secondaryYAxis = hasExtras ? (
      <YAxis
        key="secondary-y-axis"
        yAxisId="right"
        orientation="right"
        width={60}
        tick={{ fontSize: 12, fill: '#64748b' }}
        tickFormatter={(v: number) => (Math.abs(v) >= 1000 ? v.toLocaleString() : String(v))}
      />
    ) : null;

    const extraSeriesLines = hasExtras
      ? extraSeries.map((s) => (
          <Line
            key={s.key}
            yAxisId="right"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            connectNulls
          />
        ))
      : null;

    /* Everything drawn on top of the main series (trend lines + added series).
       Kept as a flat array — recharts flattens arrays reliably. */
    const seriesOverlays = [
      ...udlLines.filter(Boolean) as React.ReactElement[],
      ...(hasExtras ? (extraSeriesLines as React.ReactElement[]) : []),
    ];

    /* ── NBER recession bands (match FRED's default graph; FORMAT-tab toggleable) ── */
    const dates = transformedData.map((d) => d.date);
    const firstDate = dates[0] as string | undefined;
    const lastDate = dates[dates.length - 1] as string | undefined;
    const bandsLayers =
      formatSettings.showRecessionShading && firstDate && lastDate
        ? NBER_RECESSIONS.map((r, ri) => {
            const inr = dates.filter((d) => d >= r.start && d <= r.end);
            if (inr.length === 0) return null;
            return (
              <ReferenceArea
                key={`rec-${ri}`}
                x1={inr[0]}
                x2={inr[inr.length - 1]}
                fill={FRED_COLORS.recessionBand}
                fillOpacity={0.3}
                stroke="none"
              />
            );
          })
        : null;

    /* ── Live drag-selection rectangle (semi-transparent FRED blue) ── */
    const selectionArea =
      refAreaLeft && refAreaRight ? (
        <ReferenceArea
          x1={refAreaLeft}
          x2={refAreaRight}
          fill="#0066cc"
          fillOpacity={0.15}
          stroke="#0066cc"
          strokeOpacity={0.4}
        />
      ) : null;

    switch (formatSettings.graphType) {
      case 'Bar':
        return (
          <ComposedChart data={mergedChartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }} onMouseDown={handleChartMouseDown} onMouseMove={handleChartMouseMove} onMouseUp={handleChartMouseUp}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            {bandsLayers}
            {selectionArea}
            {commonXAxis}{commonYAxis}{secondaryYAxis}{barTooltip}
            <Bar dataKey="value" name={title} fill={formatSettings.lineColor} isAnimationActive={false} />
            {seriesOverlays}
          </ComposedChart>
        );

      case 'Area':
        return (
          <ComposedChart data={mergedChartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }} onMouseDown={handleChartMouseDown} onMouseMove={handleChartMouseMove} onMouseUp={handleChartMouseUp}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            {bandsLayers}
            {selectionArea}
            {commonXAxis}{commonYAxis}{secondaryYAxis}{commonTooltip}
            <Area
              type="monotone"
              dataKey="value"
              name={title}
              stroke={formatSettings.lineColor}
              fill={formatSettings.lineColor + '33'}
              strokeWidth={formatSettings.lineWidth}
              strokeDasharray={getStrokeDasharray()}
            />
            {seriesOverlays}
          </ComposedChart>
        );

      case 'Scatter':
        return (
          <LineChart data={mergedChartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }} onMouseDown={handleChartMouseDown} onMouseMove={handleChartMouseMove} onMouseUp={handleChartMouseUp}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            {bandsLayers}
            {selectionArea}
            {commonXAxis}{commonYAxis}{secondaryYAxis}{commonTooltip}
            <Line
              type="monotone"
              dataKey="value"
              name={title}
              stroke="transparent"
              dot={{ r: formatSettings.markWidth || 2, fill: formatSettings.lineColor }}
              activeDot={{ r: 5, fill: formatSettings.lineColor, stroke: '#cce0f5', strokeWidth: 8 }}
              isAnimationActive={false}
            />
            {seriesOverlays}
          </LineChart>
        );

      case 'Line':
      default:
        return (
          <LineChart data={mergedChartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }} onMouseDown={handleChartMouseDown} onMouseMove={handleChartMouseMove} onMouseUp={handleChartMouseUp}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            {bandsLayers}
            {selectionArea}
            {commonXAxis}{commonYAxis}{secondaryYAxis}{commonTooltip}
            <Line
              type="monotone"
              dataKey="value"
              name={title}
              stroke={formatSettings.lineColor}
              strokeWidth={formatSettings.lineWidth}
              strokeDasharray={getStrokeDasharray()}
              dot={getDotProps() as any}
              activeDot={{ r: 5, fill: formatSettings.lineColor, stroke: '#cce0f5', strokeWidth: 8 }}
              isAnimationActive={false}
            />
            {seriesOverlays}
          </LineChart>
        );
    }
  };

  /* ── Additional series labels map for sidebar ── */
  const additionalSeriesLabels = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(additionalSeries).forEach(([id, { label }]) => {
      map[id] = label;
    });
    return map;
  }, [additionalSeries]);

  /* ── Header controls column: range + dates (left) / Edit Graph + Download (right) ── */
  const controlsNode = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
      {/* Left: range shortcuts (top) + date range (bottom) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!loading && data.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 15, fontFamily: FRED_FONT }}>
            {[1, 5, 10].map((y) => (
              <button key={y} onClick={() => handleRangeClick(y)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: FRED_COLORS.link, fontSize: 15, padding: 0, fontFamily: FRED_FONT }}>{y}Y</button>
            ))}
            <button onClick={() => handleRangeClick('MAX')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: FRED_COLORS.link, fontSize: 15, padding: 0, fontFamily: FRED_FONT }}>Max</button>
          </div>
        )}
        {!loading && data.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} max={endDate}
              style={{ border: '1px solid #b8b8b8', borderRadius: 3, padding: '4px 6px', fontSize: 13, color: '#333', background: '#fff', fontFamily: FRED_FONT }} />
            <span style={{ fontSize: 13, color: '#333' }}>to</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate}
              style={{ border: '1px solid #b8b8b8', borderRadius: 3, padding: '4px 6px', fontSize: 13, color: '#333', background: '#fff', fontFamily: FRED_FONT }} />
          </div>
        )}
      </div>
      {/* Right: Edit Graph (top) + Download (bottom) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
        <EditGraphSidebar
          lineInfo={{
            seriesId: indicatorCode,
            label: title,
            units: defaultUnits,
            frequency: baseFrequency,
            seasonalAdjustment: seasonalAdjustmentOf(defaultUnits),
          }}
          formatSettings={formatSettings}
          onFormatChange={setFormatSettings}
          onSizeApply={(h, w) => { setChartHeight(h); setChartWidth(w); }}
          onUnitsChange={(u) => setSelectedUnits(u)}
          onFrequencyChange={(f) => setSelectedFrequency(f)}
          onOutputUnitsChange={(u) => setOutputUnits(u)}
          onAddSeries={handleAddSeries}
          onRemoveSeries={handleRemoveSeries}
          addSeriesError={seriesError}
          onFormulaApply={handleApplyFormula}
          userDefinedLines={userDefinedLines}
          onUserDefinedLinesChange={setUserDefinedLines}
          additionalSeriesLabels={additionalSeriesLabels}
          visibleRange={{ start: startDate || '', end: endDate || '' }}
          visibleValueRange={transformedData.length ? { min: Math.min(...transformedData.map((d) => d.value)), max: Math.max(...transformedData.map((d) => d.value)) } : undefined}
        />
        <button onClick={downloadCsv} style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 6, border: `1px solid ${FRED_COLORS.link}`, color: FRED_COLORS.link, background: '#fff', borderRadius: 3, padding: '5px 10px', fontSize: 13, cursor: 'pointer', fontFamily: FRED_FONT }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" /></svg>
          Download
        </button>
      </div>
    </div>
  );

  /* ── Render ── */
  return (
    <div className="bg-white" style={{ fontFamily: FRED_FONT, color: FRED_COLORS.bodyText }}>
      {/* Indicator Header with metadata */}
      {showHeader && computedMetadata && (
        <div className="px-6">
          <IndicatorHeader
            metadata={computedMetadata}
            controls={controlsNode}
          />
        </div>
      )}

      <div className={computedMetadata ? 'px-6 pt-6' : ''}>
        {/* Chart */}
        {loading ? (
          <div className="flex justify-center items-center h-64 text-gray-500">Loading data...</div>
        ) : error ? (
          <div className="text-red-500 bg-red-50 p-4 rounded-md">{error}</div>
        ) : transformedData.length === 0 ? (
          <div className="flex justify-center items-center h-64 text-gray-500">No data available or range too narrow.</div>
        ) : (
          <div className="overflow-x-auto">
            <div
              ref={chartWrapRef}
              className={isFullscreen ? 'fred-fullscreen' : undefined}
              style={{ position: 'relative', height: isFullscreen ? '100%' : chartHeight, width: isFullscreen ? '100%' : chartWidth, minWidth: '100%', cursor: 'crosshair' }}
            >
              {/* FRED wordmark + legend overlay — placed INSIDE the plot (left offset
                  clears the 85px YAxis + 20px margin) so it never collides with the
                  top Y-axis tick labels. */}
              <div style={{ position: 'absolute', top: 6, left: 110, display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, pointerEvents: 'none', zIndex: 2 }}>
                <span style={{ fontWeight: 800, letterSpacing: -0.5, color: '#000', fontFamily: FRED_FONT }}>
                  FRED<sup style={{ fontSize: 9 }}>®</sup>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#000', fontFamily: FRED_FONT }}>
                  <span style={{ width: 20, height: 3, background: FRED_COLORS.chartLine, display: 'inline-block', borderRadius: 2 }} />
                  {title}
                </span>
                {/* Trend-line / added-series legend entries (only while they exist) */}
                {showExtraSeries && extraSeries.map((s) => (
                  <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#000', fontFamily: FRED_FONT }}>
                    <span style={{ width: 20, height: 3, background: s.color, display: 'inline-block', borderRadius: 2 }} />
                    {s.label}
                  </span>
                ))}
                {userDefinedLines.map((udl, ui) => (
                  <span key={udl.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#000', fontFamily: FRED_FONT }}>
                    <span style={{ width: 20, height: 3, background: udl.color, display: 'inline-block', borderRadius: 2 }} />
                    {udl.label && udl.label !== 'Trend Line' ? udl.label : `Trend Line ${ui + 1}`}
                  </span>
                ))}
              </div>
              {/* FORMAT-tab "Title" toggle: chart title overlay */}
              {formatSettings.showTitle && (
                <div style={{ position: 'absolute', top: 6, left: 0, right: 0, textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#000', fontFamily: FRED_FONT, pointerEvents: 'none', zIndex: 2 }}>
                  {title} ({indicatorCode})
                </div>
              )}
              {/* Reset-zoom button (top-right), shown only while zoomed */}
              {isZoomed && (
                <button
                  onClick={resetZoom}
                  title="Reset zoom"
                  style={{ position: 'absolute', top: 6, right: 12, zIndex: 3, display: 'inline-flex', alignItems: 'center', gap: 5, border: '1px solid #b8b8b8', background: '#fff', color: '#333', borderRadius: 3, padding: '3px 8px', fontSize: 12, cursor: 'pointer', fontFamily: FRED_FONT, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
                  Reset zoom
                </button>
              )}
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>

              {/* In native fullscreen the under-chart row lives outside the
                  element, so re-render it as a pinned bottom strip (FRED does). */}
              {isFullscreen && (
                <div style={{ position: 'absolute', left: 20, right: 20, bottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 12, color: '#555', fontFamily: FRED_FONT, zIndex: 2 }}>
                  <div>
                    <div>
                      Source: {computedMetadata?.source || title}
                      {computedMetadata?.fredLink ? (
                        <> via <a href={computedMetadata.fredLink} target="_blank" rel="noopener noreferrer" style={fredLinkStyle}>FRED®</a></>
                      ) : null}
                    </div>
                    {formatSettings.showRecessionShading && (
                      <div style={{ fontStyle: 'italic', color: FRED_COLORS.link, marginTop: 2 }}>Shaded areas indicate U.S. recessions.</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span>fred.stlouisfed.org</span>
                    {/* FRED-style "Back" exit — must live INSIDE the fullscreen
                        element, otherwise the browser hides it while fullscreen. */}
                    <button
                      onClick={() => document.exitFullscreen().catch(() => setIsFullscreen(false))}
                      title="Exit fullscreen"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #b8b8b8', background: '#fff', color: '#1a3d6d', borderRadius: 4, padding: '3px 10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FRED_FONT, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Under-chart row: source + recession note (left) / FRED link + Fullscreen (right) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
              <div style={{ fontSize: 12, color: '#555', fontFamily: FRED_FONT }}>
                <div>
                  Source: {computedMetadata?.source || title}
                  {computedMetadata?.fredLink ? (
                    <> via <a href={computedMetadata.fredLink} target="_blank" rel="noopener noreferrer" style={fredLinkStyle}>FRED®</a></>
                  ) : (
                    ', via FRED®'
                  )}
                </div>
                {formatSettings.showRecessionShading && (
                  <div style={{ fontStyle: 'italic', color: FRED_COLORS.link, marginTop: 2 }}>Shaded areas indicate U.S. recessions.</div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <a href={computedMetadata?.fredLink || 'https://fred.stlouisfed.org'} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#555', textDecoration: 'none' }}>fred.stlouisfed.org</a>
                <button onClick={openFullscreen} title="View chart in fullscreen" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${FRED_COLORS.link}`, color: FRED_COLORS.link, background: '#fff', borderRadius: 3, padding: '4px 10px', fontSize: 13, cursor: 'pointer', fontFamily: FRED_FONT }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" /></svg>
                  Fullscreen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Indicator Footer with notes and metadata (always visible) */}
      {computedMetadata && (
        <div className="px-6">
          <IndicatorFooter metadata={computedMetadata} open />
        </div>
      )}
    </div>
  );
}