'use client';

/**
 * /interest-rate/eurodollar-futures — replica of the Investing.com
 * "Eurodollar Contracts" grid (table#BarchartDataTable.genTbl.closedTbl.crossRatesTbl).
 *
 * Data: GET /api/economic-indicators/eurodollar-futures/latest, i.e. exactly
 * what eurodollar_scraper.py persisted for the newest scrape date.
 *
 * Structure and colours are transcribed from
 * ./_data/ratePageDesign.ts (measured by backend/scripts/extract_rate_pages_design.py
 * and backend/scripts/fetch_investing_css.py). Two deliberate deviations from
 * the source, both to avoid pretending we have data we do not:
 *   - the "Last" cell is printed without Investing's trailing "s" suffix
 *     (we store the number; the suffix is their quote-session marker);
 *   - sort arrows appear only on a column that is actually sorted, because the
 *     source header row is plain text and we still need the affordance visible.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '@/lib/api/config';
import RateSourceAttribution from '../_components/RateSourceAttribution';
import {
  INV_COLORS, INV_FONT, INV_FONT_SIZE, RATE_SOURCES,
  invTableStyle, invTdStyle, invThStyle,
} from '../_data/ratePageDesign';

type Row = {
  id: number;
  scrape_date: string;
  symbol: string | null;
  contract: string;
  last_price: number | null;
  change: number | null;
  open_price: number | null;
  high: number | null;
  low: number | null;
  previous: number | null;
  volume: number | null;
  open_interest: number | null;
  updated_time: string | null;
};

type SortDir = 'asc' | 'desc';
type SortRule = { key: keyof Row; dir: SortDir };

const COLUMNS: { key: keyof Row; label: string; align: 'left' | 'right' | 'center' }[] = [
  { key: 'contract', label: 'Month', align: 'left' },
  { key: 'last_price', label: 'Last', align: 'right' },
  { key: 'change', label: 'Chg.', align: 'right' },
  { key: 'open_price', label: 'Open', align: 'right' },
  { key: 'high', label: 'High', align: 'right' },
  { key: 'low', label: 'Low', align: 'right' },
  { key: 'volume', label: 'Volume', align: 'right' },
  { key: 'updated_time', label: 'Time', align: 'right' },
];

/** "Dec 26" -> 202612 so the ladder reads oldest-expiry first. */
const MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};
function contractSortKey(contract: string): number {
  const m = contract.trim().match(/^([A-Za-z]{3})\s*(\d{2,4})$/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const mon = MONTHS[m[1][0].toUpperCase() + m[1].slice(1, 3).toLowerCase()] ?? 0;
  const yy = m[2].length === 2 ? 2000 + parseInt(m[2], 10) : parseInt(m[2], 10);
  return yy * 100 + mon;
}

const price = (v: number | null) =>
  v == null ? '' : v.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
/** Investing prints the change at 2dp with an explicit sign only when it moved. */
const change = (v: number | null) => {
  if (v == null) return '0.00';
  if (v === 0) return '0.00';
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}`;
};
const integer = (v: number | null) => (v == null ? '0' : v.toLocaleString('en-US'));

/** The source's own per-contract links, rebased onto the live page URL. */
const invLink = (page: string, symbol: string | null) =>
  `${RATE_SOURCES.investing.url}?page=${page}&symbol=${encodeURIComponent(symbol ?? '')}`;

export default function EurodollarFuturesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortRules, setSortRules] = useState<SortRule[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/economic-indicators/eurodollar-futures/latest`)
      .then(r => {
        if (!r.ok) throw new Error(`Eurodollar feed returned ${r.status}`);
        return r.json() as Promise<Row[]>;
      })
      .then(json => setRows(Array.isArray(json) ? json : []))
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load Eurodollar futures'))
      .finally(() => setLoading(false));
  }, []);

  const handleHeaderClick = useCallback((key: keyof Row) => {
    setSortRules(prev => {
      const existing = prev.find(r => r.key === key);
      if (!existing) return [...prev, { key, dir: 'asc' }];
      if (existing.dir === 'asc') return prev.map(r => (r.key === key ? { ...r, dir: 'desc' } : r));
      return prev.filter(r => r.key !== key);
    });
  }, []);

  /** Default order = the source's own ladder order (nearest expiry first). */
  const sortedData = useMemo(() => {
    const base = [...rows].sort(
      (a, b) => contractSortKey(a.contract) - contractSortKey(b.contract),
    );
    if (!sortRules.length) return base;
    return base.sort((a, b) => {
      for (const { key, dir } of sortRules) {
        const av = a[key];
        const bv = b[key];
        if (av === null && bv === null) continue;
        if (av === null) return 1;
        if (bv === null) return -1;
        const cmp = typeof av === 'string' && typeof bv === 'string'
          ? av.localeCompare(bv)
          : (av as number) - (bv as number);
        if (cmp !== 0) return dir === 'asc' ? cmp : -cmp;
      }
      return 0;
    });
  }, [rows, sortRules]);

  const scrapeDate = rows[0]?.scrape_date ?? null;
  /** A 1-row snapshot is the documented Yahoo SOFR fallback, not the ladder. */
  const degraded = !loading && rows.length > 0 && rows.length < 8;

  return (
    <div style={{ background: '#fff', fontFamily: INV_FONT, fontSize: INV_FONT_SIZE, color: INV_COLORS.text }}>
      <div className="mx-auto" style={{ maxWidth: 1000, padding: '18px 12px 40px' }}>
        {/* ── page title + the source's (i) affordance ── */}
        <div className="flex items-start justify-between" style={{ marginBottom: 14 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: INV_COLORS.text, margin: 0 }}>
            Eurodollar Contracts
          </h1>
          <a
            href={RATE_SOURCES.investing.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open the Eurodollar Futures page on Investing.com"
            aria-label="Open the Eurodollar Futures page on Investing.com"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold"
            style={{ border: `1px solid ${INV_COLORS.link}`, color: INV_COLORS.link, textDecoration: 'none' }}
          >
            i
          </a>
        </div>

        {/* ── .bc-container-box > .bcPageTitle > .bcHeader ── */}
        <div style={{ paddingTop: 10 }}>
          <div style={{
            font: '12px Arial', textAlign: 'center', backgroundColor: '#fff',
            color: INV_COLORS.text, paddingBottom: 4,
          }}>
            Eurodollar Contracts
          </div>

          <div style={{
            borderTop: `1px solid ${INV_COLORS.strongBorder}`,
            borderBottom: `1px solid ${INV_COLORS.strongBorder}`,
            overflowX: 'auto',
          }}>
            <table id="BarchartDataTable" className="genTbl closedTbl crossRatesTbl" style={invTableStyle}>
              <thead>
                <tr>
                  {/* .genTbl .icon — the 26px expander column the source reserves */}
                  <th className="icon noWrap" style={{ ...invThStyle, width: 26, textAlign: 'center', paddingRight: 0 }} />
                  {COLUMNS.map(col => {
                    const rule = sortRules.find(r => r.key === col.key);
                    return (
                      <th
                        key={col.key}
                        onClick={() => handleHeaderClick(col.key)}
                        style={{
                          ...invThStyle,
                          textAlign: col.align === 'left' ? 'left' : 'right',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          {col.label}
                          {rule ? (
                            <span style={{ color: INV_COLORS.link, fontSize: 11 }}>
                              {rule.dir === 'asc' ? '▲' : '▼'}
                            </span>
                          ) : null}
                        </span>
                      </th>
                    );
                  })}
                  <th style={invThStyle}>Chart</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={COLUMNS.length + 2} style={{ ...invTdStyle, height: 220, textAlign: 'center' }}>
                      <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-b-2"
                        style={{ borderColor: INV_COLORS.link, maxWidth: 32 }} />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={COLUMNS.length + 2} style={{ ...invTdStyle, height: 120, textAlign: 'center', color: INV_COLORS.down }}>
                      {error}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length + 2} style={{ ...invTdStyle, height: 120, textAlign: 'center' }}>
                      No Eurodollar snapshot stored yet — run backend/app/scrapers/eurodollar_scraper.py --db --force
                    </td>
                  </tr>
                ) : (
                  sortedData.map((row, i) => (
                    <tr
                      key={row.id}
                      className="inv-row"
                      style={i === 0 ? { borderTop: `2px solid ${INV_COLORS.strongBorder}` } : undefined}
                    >
                      {/* span.grayArrowIcon is an 8x8 sprite triangle; the glyph is the
                          same triangle without borrowing their sprite sheet. */}
                      <td className="center" style={{ ...invTdStyle, width: 26, textAlign: 'center', paddingRight: 0 }}>
                        <span style={{ color: '#9b9b9b', fontSize: 8 }}>&#9656;</span>
                      </td>
                      <td className="bold left" style={{ ...invTdStyle, textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        <a href={invLink('chart', row.symbol)} target="_blank" rel="noopener noreferrer"
                          style={{ color: INV_COLORS.link, fontWeight: 700, textDecoration: 'none' }}>
                          {row.contract}
                        </a>
                      </td>
                      <td style={invTdStyle}>{price(row.last_price)}</td>
                      <td style={{
                        ...invTdStyle,
                        fontWeight: 700,
                        color: !row.change ? INV_COLORS.neutral : row.change > 0 ? INV_COLORS.up : INV_COLORS.down,
                      }} dir="ltr">
                        {change(row.change)}
                      </td>
                      <td style={invTdStyle}>{price(row.open_price)}</td>
                      <td style={invTdStyle}>{price(row.high)}</td>
                      <td style={invTdStyle}>{price(row.low)}</td>
                      <td style={invTdStyle}>{integer(row.volume)}</td>
                      <td style={invTdStyle}>{row.updated_time ?? ''}</td>
                      <td style={{ ...invTdStyle, whiteSpace: 'nowrap' }}>
                        <a href={invLink('extquote', row.symbol)} target="_blank" rel="noopener noreferrer" style={invChartLink}>Q</a>
                        {' / '}
                        <a href={invLink('chart', row.symbol)} target="_blank" rel="noopener noreferrer" style={invChartLink}>C</a>
                        {' / '}
                        <a href={invLink('optqte', row.symbol)} target="_blank" rel="noopener noreferrer" style={invChartLink}>O</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {degraded ? (
            <p style={{ fontSize: 11, color: INV_COLORS.neutral, marginTop: 8 }}>
              This snapshot holds {rows.length} contract row{rows.length === 1 ? '' : 's'} — fewer than the
              Investing.com ladder. It was served by the scraper&apos;s Yahoo SOFR fallback, so the table is
              intentionally thin rather than back-filled with invented expiries.
            </p>
          ) : null}

          <RateSourceAttribution
            source="investing"
            detail={scrapeDate ? `Snapshot stored ${scrapeDate}` : null}
          />
        </div>
      </div>

      {/* .genTbl TBODY TR:hover { background-color: #edf4fa } — measured rule */}
      <style jsx global>{`
        .inv-row:hover { background-color: ${INV_COLORS.rowHover}; }
      `}</style>
    </div>
  );
}

const invChartLink: React.CSSProperties = {
  color: INV_COLORS.link,
  textDecoration: 'none',
  fontWeight: 400,
};
