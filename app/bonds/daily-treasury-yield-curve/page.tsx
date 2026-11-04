'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/api/config';
import { USWDS, BONDS_FONT } from '../_data/bondsDesign';
import BondsSourceAttribution from '../_components/BondsSourceAttribution';

interface YCRow {
  report_date: string;
  month_1: number | null; month_1_5: number | null; month_2: number | null; month_3: number | null;
  month_4: number | null; month_6: number | null; year_1: number | null; year_2: number | null;
  year_3: number | null; year_5: number | null; year_7: number | null; year_10: number | null;
  year_20: number | null; year_30: number | null;
}

type SortKey = 'report_date' | keyof Omit<YCRow, 'report_date'>;
type SortDir = 'asc' | 'desc';

// Column order + labels exactly as the official Treasury.gov Daily Rates table.
const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'month_1', label: '1 Mo' },
  { key: 'month_1_5', label: '1.5 Mo' },
  { key: 'month_2', label: '2 Mo' },
  { key: 'month_3', label: '3 Mo' },
  { key: 'month_4', label: '4 Mo' },
  { key: 'month_6', label: '6 Mo' },
  { key: 'year_1', label: '1 Yr' },
  { key: 'year_2', label: '2 Yr' },
  { key: 'year_3', label: '3 Yr' },
  { key: 'year_5', label: '5 Yr' },
  { key: 'year_7', label: '7 Yr' },
  { key: 'year_10', label: '10 Yr' },
  { key: 'year_20', label: '20 Yr' },
  { key: 'year_30', label: '30 Yr' },
];

const MONTHS = [
  { value: 'ALL', label: 'All Months' },
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' }, { value: '04', label: 'April' },
  { value: '05', label: 'May' }, { value: '06', label: 'June' },
  { value: '07', label: 'July' }, { value: '08', label: 'August' },
  { value: '09', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const PAGE_SIZES = [10, 25, 50, 100];

/* ── Measured colours (backend/_tmp_color_sample.py, pixel-sampled off the
   official Treasury.gov Daily Rates screenshots) ──
   header bar   #005ea2  (white text)      zebra even row  #f2f2f2
   column rule  #dededf                     active page     #124373 (white text)
   date cell    #005ea2 bold                number cell     #1b1b1b
   N/A cell     #6b7280                     idle page btn   #ffffff / #005ea2 text */
const HEADER_BLUE = '#005ea2';
const ACTIVE_PAGE = '#124373';
const COL_RULE = '#dededf';
const ZEBRA = '#f2f2f2';

/** DataTables-style ⇅ sort glyph — white on the blue header. */
function SortGlyph({ dir }: { dir: SortDir | null }) {
  return (
    <span className="ml-1.5 inline-flex flex-col items-center leading-none">
      <svg width="8" height="6" viewBox="0 0 8 6" aria-hidden="true">
        <path d="M4 0L8 6H0Z" fill="#ffffff" opacity={dir === 'asc' ? 1 : 0.45} />
      </svg>
      <svg width="8" height="6" viewBox="0 0 8 6" aria-hidden="true" style={{ marginTop: 1 }}>
        <path d="M4 6L0 0H8Z" fill="#ffffff" opacity={dir === 'desc' ? 1 : 0.45} />
      </svg>
    </span>
  );
}

/** Robust DataTables-style page list: 1 … window … N (never NaN / empty). */
function buildPages(current: number, total: number): (number | '…')[] {
  if (total <= 1) return [];
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  let start = Math.max(2, current - 1);
  let end = Math.min(total - 1, current + 1);
  if (current <= 3) { start = 2; end = 5; }
  if (current >= total - 2) { start = total - 4; end = total - 1; }
  if (start > 2) out.push('…');
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push('…');
  out.push(total);
  return out;
}

export default function DailyTreasuryYieldRatesPage() {
  const [data, setData] = useState<YCRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [summaryAsOf, setSummaryAsOf] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  // Single-column sort, matching the official table (click header → asc → desc).
  const [sortKey, setSortKey] = useState<SortKey>('report_date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Pagination
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/economic-indicators/yield-curve?limit=20000`)
      .then(r => { if (!r.ok) throw new Error('bad'); return r.json(); })
      .then((json: YCRow[]) => { setData(json); setLoading(false); })
      .catch(() => { setLoadError(true); setLoading(false); });
    fetch(`${API_BASE_URL}/api/economic-indicators/yield-curve/summary`)
      .then(r => (r.ok ? r.json() : null))
      .then(s => { if (s?.as_of) setSummaryAsOf(s.as_of); })
      .catch(() => {});
  }, []);

  const availableYears = useMemo(
    () => Array.from(new Set(data.map(d => d.report_date.substring(0, 4)))).sort((a, b) => +b - +a),
    [data],
  );

  const filteredData = useMemo(() => data.filter(d => {
    if (selectedYear !== 'ALL' && !d.report_date.startsWith(selectedYear)) return false;
    if (selectedMonth !== 'ALL' && d.report_date.substring(5, 7) !== selectedMonth) return false;
    return true;
  }), [data, selectedYear, selectedMonth]);

  const sortedData = useMemo(() => {
    const arr = [...filteredData];
    arr.sort((a, b) => {
      let valA: string | number | null, valB: string | number | null;
      if (sortKey === 'report_date') { valA = a.report_date; valB = b.report_date; }
      else { valA = (a as any)[sortKey] as number | null; valB = (b as any)[sortKey] as number | null; }
      if (valA === null && valB === null) return 0;
      if (valA === null) return 1;   // nulls last, always
      if (valB === null) return -1;
      const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filteredData, sortKey, sortDir]);

  // ── Pagination math (clamped so a filter shrink can never strand a page) ──
  const totalRows = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pageRows = useMemo(() => sortedData.slice(startIdx, startIdx + pageSize), [sortedData, startIdx, pageSize]);
  const from = totalRows === 0 ? 0 : startIdx + 1;
  const to = Math.min(startIdx + pageSize, totalRows);

  const handleSort = useCallback((key: SortKey) => {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  }, [sortKey]);

  // Any filter / page-size change resets to page 1.
  useEffect(() => { setPage(1); }, [selectedYear, selectedMonth, pageSize]);

  // ── Exports (whole filtered+sorted set, not just the visible page) ──────────
  const periodTag = `${selectedYear === 'ALL' ? 'all' : selectedYear}${selectedMonth === 'ALL' ? '' : '-' + selectedMonth}`;
  const download = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  const handleExportCsv = () => {
    const head = ['Date', ...COLUMNS.map(c => c.label)];
    const lines = [head.join(',')];
    for (const r of sortedData) {
      lines.push([r.report_date, ...COLUMNS.map(c => {
        const v = (r as any)[c.key] as number | null;
        return v === null || v === undefined ? '' : v.toFixed(4);
      })].join(','));
    }
    download(`treasury_yield_curve_${periodTag}.csv`, '\uFEFF' + lines.join('\r\n'), 'text/csv;charset=utf-8;');
  };
  const handleExportExcel = () => {
    const thead = `<tr><th>Date</th>${COLUMNS.map(c => `<th>${c.label}</th>`).join('')}</tr>`;
    const tbody = sortedData.map(r => {
      const cells = COLUMNS.map(c => {
        const v = (r as any)[c.key] as number | null;
        return `<td>${v === null || v === undefined ? 'N/A' : v.toFixed(2)}</td>`;
      }).join('');
      return `<tr><td style="mso-number-format:'\\@'">${r.report_date}</td>${cells}</tr>`;
    }).join('');
    const html =
      `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">` +
      `<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>` +
      `<x:Name>YieldCurve</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>` +
      `</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>` +
      `<body><table border="1">${thead}${tbody}</table></body></html>`;
    download(`treasury_yield_curve_${periodTag}.xls`, html, 'application/vnd.ms-excel');
  };

  const fmtDate = (iso: string) => {
    const [y, m, d] = iso.split('-');
    return `${m}/${d}/${y}`;
  };

  const thBase: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 20,
    backgroundColor: HEADER_BLUE, color: '#ffffff',
    fontWeight: 700, fontSize: 12, lineHeight: 1.3,
    padding: '9px 12px', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
    borderRight: `1px solid ${COL_RULE}`, textAlign: 'center',
  };
  const selectStyle: React.CSSProperties = {
    height: 32, borderRadius: 6, border: '1px solid #a9aeb1',
    background: '#ffffff', padding: '0 10px', fontSize: 13, color: '#1b1b1b',
    fontFamily: BONDS_FONT, cursor: 'pointer',
  };
  // Longhand border props only — the active-page style below overrides
  // borderColor, and mixing the `border` shorthand with `borderColor` across
  // rerenders trips React's conflicting-style warning.
  const pageBtn: React.CSSProperties = {
    minWidth: 32, height: 32, borderRadius: 4, padding: '0 8px',
    borderWidth: 1, borderStyle: 'solid', borderColor: '#d6d7d9',
    background: '#ffffff', color: HEADER_BLUE,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: BONDS_FONT,
  };
  const pageBtnActive: React.CSSProperties = {
    ...pageBtn, background: ACTIVE_PAGE, color: '#ffffff', borderColor: ACTIVE_PAGE,
  };

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6" style={{ fontFamily: BONDS_FONT }}>

      {/* ── Title ─ */}
      <h1 className="mb-5 text-[22px] font-bold" style={{ color: '#162e51' }}>
        Daily Treasury Par Yield Curve Rates
      </h1>

      {/* ── Toolbar: exports (left) + period filters + show-entries (right) ── */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button
          onClick={handleExportCsv}
          className="inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold text-white"
          style={{ background: HEADER_BLUE }}
        >
          Download CSV
        </button>
        <button
          onClick={handleExportExcel}
          className="inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold"
          style={{ background: '#e7f2fb', color: HEADER_BLUE, border: `1px solid ${HEADER_BLUE}` }}
        >
          Download Excel
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={selectStyle}>
            <option value="ALL">All Years</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={selectStyle}>
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-gray-600">
            Show
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              style={{ ...selectStyle, height: 30 }}
            >
              {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            entries
          </label>
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        // Spinner ONLY — no caption text (per request).
        <div className="flex items-center justify-center py-28">
          <svg className="h-9 w-9 animate-spin" viewBox="0 0 24 24" fill="none" style={{ color: HEADER_BLUE }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
          </svg>
        </div>
      ) : loadError ? (
        <div className="py-24 text-center text-sm" style={{ color: '#b91c1c' }}>
          Could not reach the yield-curve service. Refresh to retry.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md" style={{ border: `1px solid ${COL_RULE}` }}>
          <table className="w-full border-collapse" style={{ fontFamily: BONDS_FONT, fontSize: 13 }}>
            <thead>
              <tr>
                <th
                  onClick={() => handleSort('report_date')}
                  aria-sort={sortKey === 'report_date' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                  style={{ ...thBase, textAlign: 'center', borderLeft: `1px solid ${COL_RULE}` }}
                >
                  <span className="inline-flex items-center">Date<SortGlyph dir={sortKey === 'report_date' ? sortDir : null} /></span>
                </th>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                    style={thBase}
                  >
                    <span className="inline-flex items-center">{col.label}<SortGlyph dir={sortKey === col.key ? sortDir : null} /></span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="py-16 text-center text-sm" style={{ color: '#6b7280' }}>
                    No data available for the selected period.
                  </td>
                </tr>
              ) : (
                pageRows.map((row, i) => (
                  <tr key={row.report_date} style={{ backgroundColor: i % 2 === 1 ? ZEBRA : '#ffffff' }}>
                    <td
                      className="font-bold"
                      style={{
                        color: HEADER_BLUE, padding: '7px 12px', textAlign: 'center',
                        borderRight: `1px solid ${COL_RULE}`, borderLeft: `1px solid ${COL_RULE}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fmtDate(row.report_date)}
                    </td>
                    {COLUMNS.map(col => {
                      const val = (row as any)[col.key] as number | null;
                      const isNA = val === null || val === undefined;
                      return (
                        <td
                          key={col.key}
                          style={{
                            padding: '7px 12px', textAlign: 'center', whiteSpace: 'nowrap',
                            borderRight: `1px solid ${COL_RULE}`,
                            color: isNA ? '#6b7280' : '#1b1b1b',
                          }}
                        >
                          {isNA ? 'N/A' : val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination footer ── */}
      {!loading && !loadError && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-gray-600">
            Showing {from.toLocaleString()} to {to.toLocaleString()} of {totalRows.toLocaleString()} entries
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              style={{ ...pageBtn, opacity: safePage <= 1 ? 0.45 : 1, cursor: safePage <= 1 ? 'default' : 'pointer' }}
            >
              Previous
            </button>
            {buildPages(safePage, totalPages).map((p, idx) =>
              p === '…' ? (
                <span key={`gap-${idx}`} className="px-1 text-gray-500">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  style={p === safePage ? pageBtnActive : pageBtn}
                >
                  {p}
                </button>
              ),
            )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              style={{ ...pageBtn, opacity: safePage >= totalPages ? 0.45 : 1, cursor: safePage >= totalPages ? 'default' : 'pointer' }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <BondsSourceAttribution detail={summaryAsOf ? `Data as of ${summaryAsOf}.` : null} />
    </div>
  );
}
