'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import {
  Download,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { NBER_RECESSIONS } from '../../economic-indicators/_data/fredDesign';
import GuruFocusReferenceBubble from './GuruFocusReferenceBubble';

export interface IndicatorRow {
  report_date: string;
  indicator_code: string;
  value: number;
  yoy_pct: number | null;
}

interface GuruFocusViewProps {
  title: string;
  code: string;
  metricLabel: string;
  isPercent?: boolean;
  valueDecimals?: number;
  data: IndicatorRow[];
  loading: boolean;
  sourceUrl?: string;
  description?: string;
}

export default function GuruFocusIndicatorView({
  title,
  code,
  metricLabel,
  isPercent = true,
  valueDecimals = 3,
  data,
  loading,
  sourceUrl,
  description,
}: GuruFocusViewProps) {
  // Chart controls
  const [timeRange, setTimeRange] = useState<string>('All');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const chartWrapperRef = useRef<HTMLDivElement>(null);

  // Pagination for Historical Data table
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 14; // Match GuruFocus default (14 rows per page)

  // Latest observation
  const latestRow = useMemo(() => {
    return data.length > 0 ? data[data.length - 1] : null;
  }, [data]);

  // Overall Historical Mean for summary and lines
  const overallMean = useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, curr) => acc + curr.value, 0);
    return sum / data.length;
  }, [data]);

  // Historical Min and Max
  const { minVal, maxVal } = useMemo(() => {
    if (data.length === 0) return { minVal: 0, maxVal: 0 };
    let min = data[0].value;
    let max = data[0].value;
    for (const d of data) {
      if (d.value < min) min = d.value;
      if (d.value > max) max = d.value;
    }
    return { minVal: min, maxVal: max };
  }, [data]);

  // Relative percentage difference from the long-term average: (|Val - Avg| / Avg) * 100
  const pctDiffFromMean = useMemo(() => {
    if (!latestRow || !overallMean) return '0.0';
    const diff = (Math.abs(latestRow.value - overallMean) / overallMean) * 100;
    return diff.toFixed(1);
  }, [latestRow, overallMean]);

  // Filtered data by range
  const filteredData = useMemo(() => {
    if (data.length === 0) return [];
    if (timeRange === 'All') return data;

    const latestDate = new Date(data[data.length - 1].report_date);
    let cutoffDate = new Date(latestDate);

    if (timeRange === '3M') cutoffDate.setMonth(cutoffDate.getMonth() - 3);
    else if (timeRange === 'YTD') cutoffDate = new Date(latestDate.getFullYear(), 0, 1);
    else if (timeRange === '1Y') cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
    else if (timeRange === '3Y') cutoffDate.setFullYear(cutoffDate.getFullYear() - 3);
    else if (timeRange === '5Y') cutoffDate.setFullYear(cutoffDate.getFullYear() - 5);
    else if (timeRange === '10Y') cutoffDate.setFullYear(cutoffDate.getFullYear() - 10);
    else if (timeRange === '20Y') cutoffDate.setFullYear(cutoffDate.getFullYear() - 20);

    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    return data.filter((d) => d.report_date >= cutoffStr);
  }, [data, timeRange]);

  // Mean & StdDev for currently viewed filtered dataset (for +1σ and -1σ bands)
  const { mean, stdDev } = useMemo(() => {
    if (filteredData.length === 0) return { mean: 0, stdDev: 0 };
    const values = filteredData.map((d) => d.value);
    const m = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - m, 2), 0) / values.length;
    return { mean: m, stdDev: Math.sqrt(variance) };
  }, [filteredData]);

  // Historical table data sorted newest first
  // Re-compute YOY client-side using the nearest-trading-day convention
  // (±7 days around the same calendar date in the prior year), matching GuruFocus.
  const tableData = useMemo(() => {
    if (data.length === 0) return [];

    // Build a date→value lookup from the full dataset
    const lookup = new Map<string, number>();
    for (const row of data) {
      lookup.set(row.report_date, row.value);
    }

    // Helper: find nearest trading day value within ±7 days of a target date
    const getNearestYearAgoValue = (dateStr: string): number | null => {
      const d = new Date(dateStr);
      const prevYear = new Date(d);
      prevYear.setFullYear(prevYear.getFullYear() - 1);

      // Search order: 0, +1, -1, +2, -2, … up to ±7 (matches gurufocus_scraper.py)
      const offsets = [0, ...Array.from({ length: 7 }, (_, i) => [i + 1, -(i + 1)]).flat()];
      for (const offset of offsets) {
        const candidate = new Date(prevYear);
        candidate.setDate(candidate.getDate() + offset);
        const key = candidate.toISOString().split('T')[0];
        if (lookup.has(key)) return lookup.get(key)!;
      }
      return null;
    };

    return [...data].reverse().map((row) => {
      const prevVal = getNearestYearAgoValue(row.report_date);
      let yoy_pct = row.yoy_pct;
      if (prevVal !== null && prevVal !== 0) {
        yoy_pct = parseFloat(
          (((row.value - prevVal) / Math.abs(prevVal)) * 100).toFixed(2)
        );
      }
      return { ...row, yoy_pct };
    });
  }, [data]);

  const totalPages = Math.ceil(tableData.length / rowsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return tableData.slice(start, start + rowsPerPage);
  }, [tableData, currentPage, rowsPerPage]);

  // Helper formatting for main metrics (3 decimals)
  const formatVal = (val: number | null | undefined, dec = valueDecimals) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return isPercent ? `${val.toFixed(dec)}%` : val.toFixed(dec);
  };

  // Helper formatting for min/max/average to match GuruFocus (trims trailing unnecessary zeros up to 3 dec)
  const formatRangeVal = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    // Format up to 3 decimals, trimming trailing zeros (e.g. 5.31 instead of 5.310, but keeping 6.483)
    const formatted = parseFloat(val.toFixed(3)).toString();
    return isPercent ? `${formatted}%` : formatted;
  };

  // Full native fullscreen toggle with fallback
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (chartWrapperRef.current && chartWrapperRef.current.requestFullscreen) {
        chartWrapperRef.current.requestFullscreen().catch(() => setIsFullscreen(true));
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => setIsFullscreen(false));
      }
      setIsFullscreen(false);
    }
  };

  // Export functions (CSV, XLSX, TXT)
  const exportData = (format: 'csv' | 'xlsx' | 'txt') => {
    if (tableData.length === 0) return;
    const rows = tableData.map((r) => ({
      Date: r.report_date,
      Value: r.value,
      'YOY (%)': r.yoy_pct !== null && r.yoy_pct !== undefined ? r.yoy_pct : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveBlob(blob, `${code}_${new Date().toISOString().split('T')[0]}.csv`);
    } else if (format === 'xlsx') {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveBlob(blob, `${code}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else if (format === 'txt') {
      const txt = XLSX.utils.sheet_to_txt(worksheet);
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
      saveBlob(blob, `${code}_${new Date().toISOString().split('T')[0]}.txt`);
    }
    setIsExportOpen(false);
  };

  const saveBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-5 font-sans text-gray-900 [color-scheme:light]">
      {/* 1. Header: Title + Latest Value + Date */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <div className="flex items-center flex-wrap gap-2.5">
          <h1 className="text-2xl md:text-[28px] font-bold text-gray-950 tracking-tight flex items-center gap-2">
            <span>{title}</span>
            {latestRow && (
              <span className="text-[#0052cc] font-extrabold">: {formatVal(latestRow.value)}</span>
            )}
          </h1>
          {latestRow && (
            <span className="text-xs md:text-sm text-gray-500 font-normal">
              (As of {latestRow.report_date})
            </span>
          )}
        </div>
      </div>

      {/* 2. Summary Callout Sentence (Matching GuruFocus exact wording & formatting) */}
      {latestRow && (
        <p className="text-xs md:text-[13px] text-gray-600 mb-4 leading-relaxed max-w-4xl">
          {title} is currently <strong>{formatVal(latestRow.value)}</strong>,{' '}
          {pctDiffFromMean}% {latestRow.value >= overallMean ? 'above' : 'below'} its long-term average of{' '}
          <strong>{formatVal(overallMean, 2)}</strong>.{' '}
          <span>
            Historically, {title} has ranged from <strong>{formatRangeVal(minVal)}</strong> to{' '}
            <strong>{formatRangeVal(maxVal)}</strong>.
          </span>
        </p>
      )}

      {/* 3. Main Chart Card */}
      <div
        ref={chartWrapperRef}
        className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-xs mb-6 relative"
      >
        {/* Top Control Toolbar (Timeframe Buttons) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3 mb-3">
          <div className="flex flex-wrap items-center gap-1">
            {['3M', 'YTD', '1Y', '3Y', '5Y', '10Y', '20Y', 'All'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition ${
                  timeRange === range
                    ? 'bg-[#0052cc] text-white shadow-xs'
                    : 'bg-[#F3F4F6] text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Canvas with exact Gurufocus background styling */}
        <div className="h-[460px] w-full relative bg-[#ffffff]">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0052cc]"></div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              No observation data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={filteredData}
                margin={{ top: 15, right: 40, left: 10, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="0"
                  vertical={false}
                  horizontal={true}
                  stroke="#EBF0F5"
                />

                {/* U.S. Recession Shading Bands (Grey vertical stripes like Gurufocus) */}
                {filteredData.length > 0 &&
                  NBER_RECESSIONS.map((rec, i) => {
                    const firstDate = filteredData[0].report_date;
                    const lastDate = filteredData[filteredData.length - 1].report_date;
                    if (rec.end < firstDate || rec.start > lastDate) return null;
                    const bandStart = rec.start < firstDate ? firstDate : rec.start;
                    const bandEnd = rec.end > lastDate ? lastDate : rec.end;
                    return (
                      <ReferenceArea
                        key={i}
                        x1={bandStart}
                        x2={bandEnd}
                        fill="#ECF0F4"
                        fillOpacity={0.8}
                        stroke="none"
                      />
                    );
                  })}

                {/* Standard Deviation Band (±1σ) — semi-transparent soft blue band */}
                {filteredData.length > 0 && (
                  <>
                    <ReferenceArea
                      y1={mean - stdDev}
                      y2={mean + stdDev}
                      fill="#3B82F6"
                      fillOpacity={0.22}
                    />
                    <ReferenceLine
                      y={mean + stdDev}
                      stroke="#3B82F6"
                      strokeDasharray="4 4"
                      label={{
                        position: 'insideTop',
                        value: '+1σ',
                        fill: '#1E40AF',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    />
                    <ReferenceLine
                      y={mean}
                      stroke="#3B82F6"
                      strokeDasharray="4 4"
                      label={{
                        position: 'insideRight',
                        value: `${mean.toFixed(2)}%`,
                        fill: '#1E40AF',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    />
                    <ReferenceLine
                      y={mean - stdDev}
                      stroke="#3B82F6"
                      strokeDasharray="4 4"
                      label={{
                        position: 'insideBottom',
                        value: '-1σ',
                        fill: '#1E40AF',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    />
                  </>
                )}

                <XAxis
                  dataKey="report_date"
                  tickFormatter={(val) => {
                    if (!val) return '';
                    return val.split('-')[0];
                  }}
                  minTickGap={50}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={{ stroke: '#CBD5E1' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickMargin={8}
                />

                <YAxis
                  orientation="right"
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => (isPercent ? `${val}%` : `${val}`)}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={{ stroke: '#CBD5E1' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  width={45}
                />

                <Tooltip
                  labelFormatter={(val) => `Date: ${val}`}
                  formatter={(value: any) => [formatVal(Number(value)), metricLabel]}
                  contentStyle={{
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px',
                    backgroundColor: '#ffffff',
                  }}
                />

                {/* Main Curve in Gurufocus royal blue */}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0052cc"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {/* Current Value Pin on Axis (Blue tag on right axis like screenshot) */}
          {latestRow && !loading && (
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#0052cc] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-l shadow-sm z-10"
              style={{ pointerEvents: 'none' }}
            >
              {formatVal(latestRow.value)}
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 text-gray-500 text-xs">
          {/* Download Chart data directly as CSV */}
          <button
            onClick={() => exportData('csv')}
            title="Download CSV"
            className="p-1 hover:text-gray-900 transition flex items-center gap-1"
          >
            <Download size={15} />
          </button>
          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-1 hover:text-gray-900 transition"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </div>

      {/* 4. Historical Data Table Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-base md:text-lg font-bold text-gray-950">Historical Data</h2>

          {/* Export Dropdown with clean arrows & options */}
          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition"
            >
              <Download size={14} className="text-gray-500" />
              <span>Export</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 text-gray-500 ${
                  isExportOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isExportOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 text-xs">
                <button
                  onClick={() => exportData('csv')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 font-medium"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>CSV (.csv)</span>
                </button>
                <button
                  onClick={() => exportData('xlsx')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 font-medium"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => exportData('txt')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 font-medium"
                >
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  <span>Text (.txt)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-[#FAFAFA]">
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Value</th>
                <th className="py-2.5 px-4 text-right">YOY (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-400">
                    No rows to display.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/40 transition">
                    <td className="py-2 px-4 text-gray-800 font-medium">{row.report_date}</td>
                    <td className="py-2 px-4 text-gray-900 font-semibold">{formatVal(row.value)}</td>
                    <td
                      className={`py-2 px-4 text-right font-medium ${
                        row.yoy_pct !== null && row.yoy_pct !== undefined
                          ? row.yoy_pct >= 0
                            ? 'text-emerald-600'
                            : 'text-red-500'
                          : 'text-gray-400'
                      }`}
                    >
                      {row.yoy_pct !== null && row.yoy_pct !== undefined
                        ? `${row.yoy_pct > 0 ? '+' : ''}${row.yoy_pct.toFixed(2)}%`
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Advanced Pagination Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100 text-xs text-gray-600 mt-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page numbers */}
            {[1, 2, 3, 4, 5, 6].map((num) => {
              if (num > totalPages) return null;
              return (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num)}
                  className={`w-6 h-6 rounded flex items-center justify-center font-medium ${
                    currentPage === num
                      ? 'text-[#0052cc] font-bold underline'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {num}
                </button>
              );
            })}

            {totalPages > 6 && (
              <>
                <span className="px-1 text-gray-400">—</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`px-1.5 py-0.5 rounded font-medium ${
                    currentPage === totalPages
                      ? 'text-[#0052cc] font-bold underline'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="text-gray-500 font-medium">Total {tableData.length}</div>
        </div>
      </div>

      {/* Fallback Fullscreen Modal if native fullscreen not supported */}
      {isFullscreen && !document.fullscreenElement && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] p-6 flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="font-bold text-lg text-gray-900">{title} — Fullscreen View</h3>
              <button
                onClick={() => setIsFullscreen(false)}
                className="px-3 py-1 bg-gray-800 text-white text-xs font-semibold rounded hover:bg-gray-700"
              >
                Close (ESC)
              </button>
            </div>
            <div className="flex-1 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#E2E8F0" />
                  <XAxis dataKey="report_date" tick={{ fontSize: 11 }} />
                  <YAxis orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => [formatVal(Number(v)), metricLabel]} />
                  <Line type="monotone" dataKey="value" stroke="#0052cc" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Floating Reference Bubble with link to official GuruFocus source */}
      <GuruFocusReferenceBubble sourceUrl={sourceUrl} title={title} />
    </div>
  );
}
