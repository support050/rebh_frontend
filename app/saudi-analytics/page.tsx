'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Star } from 'lucide-react';
import { authFetch } from '@/lib/api/authFetch';
import { API_BASE_URL } from '@/lib/api/config';
import AporiaChartModal from './_components/AporiaChartModal';

interface AporiaRow {
  ticker: string;
  name: string;
  sector: string;
  market_cap: string;
  val_avg_3mo: string;
  trailingPE: string;
  last: string;
  mtd_rtn: string;
  mo3_rtn: string;
  year_rtn: string;
  daily_trend: string;
  weekly_trend: string;
  monthly_trend: string;
  trend_rank: string;
  pfh_250: string;
  days_since_high_250: string;
  breakout: string;
  longest_consolidation_window: string;
  position: string;
  price_extreme: string;
  vol_5_day_chng: string;
  vol_20_day_chng: string;
}

type SortKey = keyof AporiaRow;
type SortDirection = 'asc' | 'desc';
interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const FILTER_OPTIONS = [
  { value: 'all_analytics', label: 'All Analytics' },
  { value: 'largest_market_cap', label: 'Largest Market Cap' },
  { value: 'strongest_uptrends', label: 'Strongest Uptrends' },
  { value: 'strongest_downtrends', label: 'Strongest Downtrends' },
  { value: 'breakouts', label: 'Breakouts' },
  { value: 'consolidations', label: 'Consolidations' },
];

const VISIBLE_ROWS = 16;
const ROW_HEIGHT_PX = 32;
const HEADER_HEIGHT_PX = 56;

function toComparable(raw: string | undefined): { num: number | null; str: string } {
  if (raw === undefined || raw === null || raw === '' || raw === '-') {
    return { num: null, str: '' };
  }

  const directionMatch = raw.match(/^(up|down):(.+)$/i);
  if (directionMatch) {
    const sign = directionMatch[1].toLowerCase() === 'up' ? 1 : -1;
    const firstNum = parseFloat(directionMatch[2].split(',')[0]);
    return { num: Number.isNaN(firstNum) ? null : sign * firstNum, str: raw.toLowerCase() };
  }

  const cleaned = raw.replace(/[%,]/g, '').trim();
  const num = parseFloat(cleaned);
  return { num: Number.isNaN(num) ? null : num, str: cleaned.toLowerCase() };
}

function compareRows(a: AporiaRow, b: AporiaRow, key: SortKey, direction: SortDirection): number {
  const av = toComparable(a[key]);
  const bv = toComparable(b[key]);
  let result: number;

  if (av.num !== null && bv.num !== null) {
    result = av.num - bv.num;
  } else if (av.num !== null) {
    result = -1;
  } else if (bv.num !== null) {
    result = 1;
  } else {
    result = av.str.localeCompare(bv.str);
  }

  return direction === 'asc' ? result : -result;
}

export default function SaudiAnalyticsPage() {
  const [data, setData] = useState<AporiaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState('all_analytics');
  const [lastUpdated, setLastUpdated] = useState<string>(
    new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  );
  const [selectedStock, setSelectedStock] = useState<{ ticker: string; name: string } | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const [tickerWidth, setTickerWidth] = useState<number>(70);
  const tickerRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    fetchData(filterBy);
  }, [filterBy]);

  useEffect(() => {
    if (!loading && data.length > 0) {
      requestAnimationFrame(() => {
        if (tickerRef.current) {
          const width = tickerRef.current.getBoundingClientRect().width;
          if (width > 0) setTickerWidth(width);
        }
      });
    }
  }, [loading, data]);

  const fetchData = async (filter: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/aporia/saudi-analytics?filter_by=${filter}`);
      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    const { key, direction } = sortConfig;
    return [...data].sort((a, b) => compareRows(a, b, key, direction));
  }, [data, sortConfig]);

  const sortIndicator = (key: SortKey) => {
    if (sortConfig?.key !== key) {
      return <span className="text-gray-400 text-[7px]">◆</span>;
    }
    return (
      <span className="text-gray-700 text-[7px]">
        {sortConfig.direction === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  const renderTrendBadge = (trendStr: string) => {
    if (!trendStr || trendStr === '-' || trendStr === 'flat') {
      return (
        <div className="flex justify-center items-center h-5 bg-gray-200 rounded px-1 w-full max-w-[55px] mx-auto">
        </div>
      );
    }

    const [direction, valuesStr] = trendStr.split(':');
    const values = valuesStr ? valuesStr.split(',') : [];

    const isUp = direction === 'up';
    const bgColor = isUp ? 'bg-green-600' : 'bg-red-600';

    return (
      <div className={`flex justify-between items-center h-5 ${bgColor} text-white rounded px-1 w-full max-w-[60px] mx-auto text-[9px] font-bold`}>
        {isUp ? <ArrowUpCircle size={10} className="text-white fill-green-600 bg-white rounded-full" /> : <ArrowDownCircle size={10} className="text-white fill-red-600 bg-white rounded-full" />}
        {values.map((v, i) => (
          <span key={i} className="mx-0.5">
            {v === '*' ? <Star size={8} className="fill-current" /> : v}
          </span>
        ))}
      </div>
    );
  };

  const formatPercentage = (val: string) => {
    if (!val || val === '-') return <span className="text-gray-400">-</span>;
    const isNegative = val.startsWith('-');
    return (
      <span className={isNegative ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
        {val}
      </span>
    );
  };

  const renderPriceExtreme = (val: string) => {
    if (!val || val === '-') return <span className="text-gray-300">–</span>;
    const tokens = val.split(',').map((t) => t.trim()).filter(Boolean);
    return (
      <span className="inline-flex items-center justify-center gap-1">
        {tokens.map((t, i) => {
          const key = t.toLowerCase();
          if (key === 'green') {
            return (
              <span key={i} className="text-green-600 font-bold text-[11px]" title="Price Extreme (Green)">
                ▲
              </span>
            );
          }
          if (key === 'red') {
            return (
              <span key={i} className="text-red-600 font-bold text-[11px]" title="Price Extreme (Red)">
                ▼
              </span>
            );
          }
          return (
            <span key={i} className="font-semibold text-gray-900">
              {t}
            </span>
          );
        })}
      </span>
    );
  };

  const renderBreakout = (val: string) => {
    if (!val || val === '-') return <span className="text-gray-300">–</span>;
    const key = val.trim().toLowerCase();
    if (key === 'up' || key === 'green') {
      return <span className="text-green-600 font-bold">▲</span>;
    }
    if (key === 'down' || key === 'red') {
      return <span className="text-red-600 font-bold">▼</span>;
    }
    return <span className="text-gray-900 font-medium">{val}</span>;
  };

  const renderConsolidationBadge = (val: string) => {
    if (!val || val === '-') return <span className="text-gray-300">–</span>;
    return (
      <span className="inline-block bg-gray-700 text-white text-[9px] font-bold rounded px-1.5 py-0.5 min-w-[28px]">
        {val}
      </span>
    );
  };

  const renderPositionBar = (val: string) => {
    if (!val || val === '-') return <span className="text-gray-300">–</span>;
    const pct = parseFloat(val.replace('%', ''));
    if (Number.isNaN(pct)) return <span className="text-gray-900 font-medium">{val}</span>;
    const clamped = Math.max(0, Math.min(100, pct));
    const isHigh = clamped >= 50;
    return (
      <div className="flex items-center justify-center gap-1">
        <div className="relative w-8 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full ${isHigh ? 'bg-green-600' : 'bg-red-600'}`}
            style={{ width: `${clamped}%` }}
          />
        </div>
        <span className={`text-[9px] font-semibold ${isHigh ? 'text-green-600' : 'text-red-600'}`}>{val}</span>
      </div>
    );
  };

  const SortableTh = ({
    sortKey,
    className,
    children,
  }: {
    sortKey: SortKey;
    className?: string;
    children: React.ReactNode;
  }) => {
    const isLeft = className?.includes('text-left');
    return (
      <th
        className={`py-2 px-2.5 cursor-pointer select-none hover:bg-gray-100 text-[10px] whitespace-normal leading-tight border-r border-gray-100 ${className ?? ''}`}
        onClick={() => handleSort(sortKey)}
      >
        <div className={`flex items-center gap-1 ${isLeft ? 'justify-start' : 'justify-center'}`}>
          <span>{children}</span>
          {sortIndicator(sortKey)}
        </div>
      </th>
    );
  };

  const tableMaxHeight = HEADER_HEIGHT_PX + VISIBLE_ROWS * ROW_HEIGHT_PX;

  return (
    <div className="p-6 bg-white min-h-screen text-[10px]" style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>

      {/* Header section */}
      <div className="mb-6 border-b pb-4">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-normal text-slate-800">Saudi Stock Analytics</h1>
        </div>

        <div className="text-gray-600 text-[11px] mb-4 flex gap-2">
          <span>Last updated: {lastUpdated}</span>
          <span className="text-gray-400">|</span>
          <span>Number of monitored stocks: {data.length}</span>
        </div>

        <div className="text-gray-600 text-[11px] italic mb-4">
          Click on asset/metric to view chart.
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <span className="text-gray-700 font-medium text-[11px]">Filter By:</span>
          <select
            className="border border-gray-300 rounded px-2 py-1 text-[11px] bg-gray-100 shadow-sm outline-none focus:border-gray-400"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
          >
            {FILTER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table section */}
      <div className="rounded shadow-sm border border-gray-200 overflow-hidden">
        <div
          className="overflow-auto"
          style={{ maxHeight: `${tableMaxHeight}px` }}
        >
          <table className="w-full text-center whitespace-nowrap bg-white border-collapse min-w-[1400px]">
            <thead className="sticky top-0 z-40">
              <tr className="bg-white font-bold text-gray-900 border-b-2 border-gray-200">
                <th
                  ref={tickerRef}
                  className="w-[75px] min-w-[75px] py-2 px-2.5 text-left sticky left-0 z-50 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] cursor-pointer select-none hover:bg-gray-100 text-[10px] border-r border-gray-200"
                  onClick={() => handleSort('ticker')}
                >
                  <div className="flex items-center justify-start gap-1">
                    <span>Ticker</span>
                    {sortIndicator('ticker')}
                  </div>
                </th>
                <th
                  className="w-[170px] min-w-[170px] py-2 px-2.5 text-left sticky z-40 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] cursor-pointer select-none hover:bg-gray-100 text-[10px] border-r border-gray-200"
                  style={{ left: `75px` }}
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center justify-start gap-1">
                    <span>Asset Name</span>
                    {sortIndicator('name')}
                  </div>
                </th>
                <SortableTh sortKey="sector" className="text-left w-[120px] min-w-[120px]">Sector</SortableTh>
                <SortableTh sortKey="market_cap" className="w-[80px] min-w-[80px]">Market Cap</SortableTh>
                <SortableTh sortKey="val_avg_3mo" className="w-[85px] min-w-[85px]">Value Traded</SortableTh>
                <SortableTh sortKey="trailingPE" className="w-[70px] min-w-[70px]">PE Ratio</SortableTh>
                <SortableTh sortKey="last" className="w-[70px] min-w-[70px]">Last Price</SortableTh>
                <th className="py-1 px-2 border-x border-gray-200 w-[160px] min-w-[160px]" colSpan={3}>
                  <div className="border-b border-gray-200 pb-0.5 mb-0.5 text-[10px] font-bold">Performance</div>
                  <div className="grid grid-cols-3 gap-1 text-[9px]">
                    <div className="cursor-pointer select-none hover:text-gray-900 flex items-center justify-center gap-0.5" onClick={() => handleSort('mtd_rtn')}>MTD {sortIndicator('mtd_rtn')}</div>
                    <div className="cursor-pointer select-none hover:text-gray-900 flex items-center justify-center gap-0.5" onClick={() => handleSort('mo3_rtn')}>3-Month {sortIndicator('mo3_rtn')}</div>
                    <div className="cursor-pointer select-none hover:text-gray-900 flex items-center justify-center gap-0.5" onClick={() => handleSort('year_rtn')}>1-Year {sortIndicator('year_rtn')}</div>
                  </div>
                </th>
                <SortableTh sortKey="daily_trend" className="w-[80px] min-w-[80px]">Daily Trend</SortableTh>
                <SortableTh sortKey="weekly_trend" className="w-[80px] min-w-[80px]">Weekly Trend</SortableTh>
                <SortableTh sortKey="monthly_trend" className="w-[80px] min-w-[80px]">Monthly Trend</SortableTh>
                <SortableTh sortKey="trend_rank" className="w-[70px] min-w-[70px]">Trend Rank</SortableTh>
                <SortableTh sortKey="pfh_250" className="w-[90px] min-w-[90px]">% Below 250D High</SortableTh>
                <SortableTh sortKey="days_since_high_250" className="w-[85px] min-w-[85px]">Days Since High</SortableTh>
                <SortableTh sortKey="breakout" className="w-[70px] min-w-[70px]">Breakout</SortableTh>
                <SortableTh sortKey="longest_consolidation_window" className="w-[85px] min-w-[85px]">Longest Cons.</SortableTh>
                <SortableTh sortKey="position" className="w-[75px] min-w-[75px]">Position</SortableTh>
                <SortableTh sortKey="price_extreme" className="w-[85px] min-w-[85px]">Price Extreme</SortableTh>
                <SortableTh sortKey="vol_5_day_chng" className="w-[75px] min-w-[75px]">Vol 5D Chng</SortableTh>
                <SortableTh sortKey="vol_20_day_chng" className="w-[75px] min-w-[75px]">Vol 20D Chng</SortableTh>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={22} className="py-10 text-center text-gray-500">Loading data...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={22} className="py-10 text-center text-red-500">Error: {error}</td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={22} className="py-10 text-center text-gray-500">No data available for this filter.</td>
                </tr>
              ) : (
                sortedData.map((row, idx) => {
                  const isActive = selectedStock?.ticker === row.ticker;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedStock({ ticker: row.ticker, name: row.name })}
                      className={`border-b border-gray-200 text-gray-900 h-8 cursor-pointer transition-colors text-[10px] ${isActive ? 'bg-sky-200 hover:bg-sky-200' : 'hover:bg-gray-50'
                        }`}
                    >
                      <td
                        className={`w-[75px] min-w-[75px] py-1 px-2.5 text-left sticky left-0 z-30 font-medium shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-gray-200 ${isActive ? 'bg-sky-200' : 'bg-white'}`}
                      >
                        {row.ticker}
                      </td>
                      <td
                        className={`w-[170px] min-w-[170px] py-1 px-2.5 text-left sticky z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] break-words whitespace-normal leading-tight border-r border-gray-200 ${isActive ? 'bg-sky-200' : 'bg-white'}`}
                        style={{ left: `75px` }}
                      >
                        {row.name}
                      </td>
                      <td className="w-[120px] min-w-[120px] py-1 px-2.5 text-left truncate" title={row.sector}>{row.sector}</td>
                      <td className="w-[80px] min-w-[80px] py-1 px-2">{row.market_cap}</td>
                      <td className="w-[85px] min-w-[85px] py-1 px-2">{row.val_avg_3mo}</td>
                      <td className="w-[70px] min-w-[70px] py-1 px-2 text-orange-600 font-medium">{row.trailingPE}</td>
                      <td className="w-[70px] min-w-[70px] py-1 px-2">{row.last}</td>

                      {/* Performance */}
                      <td className="w-[53px] min-w-[53px] py-1 px-1.5 border-l border-gray-200">{formatPercentage(row.mtd_rtn)}</td>
                      <td className="w-[53px] min-w-[53px] py-1 px-1.5">{formatPercentage(row.mo3_rtn)}</td>
                      <td className="w-[54px] min-w-[54px] py-1 px-1.5 border-r border-gray-200">{formatPercentage(row.year_rtn)}</td>

                      {/* Trends */}
                      <td className="w-[80px] min-w-[80px] py-1 px-1.5">{renderTrendBadge(row.daily_trend)}</td>
                      <td className="w-[80px] min-w-[80px] py-1 px-1.5">{renderTrendBadge(row.weekly_trend)}</td>
                      <td className="w-[80px] min-w-[80px] py-1 px-1.5">{renderTrendBadge(row.monthly_trend)}</td>

                      <td className="w-[70px] min-w-[70px] py-1 px-2">{row.trend_rank}</td>
                      <td className="w-[90px] min-w-[90px] py-1 px-2">{row.pfh_250}</td>
                      <td className="w-[85px] min-w-[85px] py-1 px-2">{row.days_since_high_250}</td>

                      <td className="w-[70px] min-w-[70px] py-1 px-2">{renderBreakout(row.breakout)}</td>
                      <td className="w-[85px] min-w-[85px] py-1 px-2">{renderConsolidationBadge(row.longest_consolidation_window)}</td>
                      <td className="w-[75px] min-w-[75px] py-1 px-2">{renderPositionBar(row.position)}</td>
                      <td className="w-[85px] min-w-[85px] py-1 px-2">{renderPriceExtreme(row.price_extreme)}</td>
                      <td className="w-[75px] min-w-[75px] py-1 px-2">{formatPercentage(row.vol_5_day_chng)}</td>
                      <td className="w-[75px] min-w-[75px] py-1 px-2">{formatPercentage(row.vol_20_day_chng)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedStock && (
        <AporiaChartModal
          ticker={selectedStock.ticker}
          name={selectedStock.name}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  );
}