/**
 * Interactive stock table — the React port of the reference dashboard's
 * `stockTable()` + `makeSortable()` + `filterTable()` + `tableCSV()` trio.
 *
 * Behaviour kept 1:1 with the client build: every header sorts (numbers
 * numerically, text lexically, missing values last), the filter box matches any
 * visible cell, ⇩ CSV dumps exactly what the reference dumps (the rendered
 * table text, BOM-prefixed, named after the snapshot date), and clicking the
 * symbol opens the stock chart modal. Rows that did not trade are dimmed.
 */
'use client';
import React, { useCallback, useMemo, useState } from 'react';
import { fmt, num, pct, signClass } from './format';
import {
  COL_HEADERS,
  DEFAULT_COLS,
  StageBadge,
  StockRow,
  TableStatus,
  stockCellText,
  stockSortValue,
} from './ui';

export interface StockTableProps {
  rows: StockRow[];
  /** column ids from COL_HEADERS; default = the reference column set */
  cols?: string[];
  /** show the filter input (reference tblBar's `filter` flag) */
  filterable?: boolean;
  /** file stem for the CSV export */
  csvName?: string;
  /** date stamped into the CSV filename (snapshot date) */
  csvDate?: string;
  /** called when a symbol is clicked — omit to render plain symbol text */
  onSymbol?: (sym: number) => void;
  /** keeps sort/filter state per instance across re-renders */
  id?: string;
}

/** Cell text used for filter matching (same strings the DOM would expose). */
function rowText(r: StockRow, cols: string[]): string {
  return cols.map((c) => stockCellText(r, c)).join(' ').toLowerCase();
}

function exportCsv(rows: StockRow[], cols: string[], name: string, date: string) {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = [
    cols.map((c) => esc(COL_HEADERS[c] ?? c)).join(','),
    ...rows.map((r) => cols.map((c) => esc(stockCellText(r, c))).join(',')),
  ];
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name}_${date}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export default function StockTable({
  rows,
  cols = DEFAULT_COLS,
  filterable = true,
  csvName = 'table',
  csvDate = '',
  onSymbol,
}: StockTableProps) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [asc, setAsc] = useState(true);
  const [q, setQ] = useState('');

  const view = useMemo(() => {
    let out = rows;
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      out = out.filter((r) => rowText(r, cols).includes(needle));
    }
    if (sortCol) {
      const col = sortCol;
      out = out.slice().sort((a, b) => {
        const x = stockSortValue(a, col);
        const y = stockSortValue(b, col);
        if (typeof x === 'number' && typeof y === 'number') return asc ? x - y : y - x;
        if (x === '—' || x === '') return 1;
        if (y === '—' || y === '') return -1;
        return asc ? String(x).localeCompare(String(y)) : String(y).localeCompare(String(x));
      });
    }
    return out;
  }, [rows, cols, q, sortCol, asc]);

  const clickHeader = useCallback((col: string) => {
    if (sortCol === col) setAsc((v) => !v);
    else {
      setSortCol(col);
      setAsc(false);
    }
  }, [sortCol]);

  const renderCell = (r: StockRow, col: string) => {
    const pc = (v: number | null | undefined) => (
      <td className={signClass(v)}>{v == null ? '—' : pct(v)}</td>
    );
    switch (col) {
      case 'sym':
        return (
          <td>
            {onSymbol ? (
              <span className="sym" title="open chart" onClick={() => onSymbol(r.sym)}>
                {r.sym}
              </span>
            ) : (
              r.sym
            )}
          </td>
        );
      case 'name':
        return <td>{r.name}{r.traded === false ? ' (no trade)' : ''}</td>;
      case 'group':
        return <td>{r.group}</td>;
      case 'close':
        return <td>{fmt(r.close ?? null, 2)}</td>;
      case 'rs':
        return (
          <td style={{ fontWeight: 700, color: r.rs == null ? 'inherit' : r.rs >= 80 ? 'var(--up)' : r.rs <= 30 ? 'var(--down)' : 'inherit' }}>
            {r.rs ?? '—'}
          </td>
        );
      case 'stage':
        return <td>{r.stage == null ? '—' : <StageBadge stage={r.stage} />}</td>;
      case 'rvol':
        return <td>{fmt(r.rvol ?? null, 2)}</td>;
      case 'bo':
        return <td>{r.bo == null ? '—' : `${fmt(r.bo, 1)}×`}</td>;
      case 'flags':
        return (
          <td>
            {r.tt ? <span className="tag" style={{ background: 'var(--good)' }}>TT</span> : null}
            {r.nhv ? (
              <span className="tag" style={{ background: 'var(--blue)' }}>NH·vol</span>
            ) : r.nh ? (
              <span className="tag" style={{ background: 'var(--text2)' }}>NH</span>
            ) : null}
          </td>
        );
      default:
        return pc(num((r as unknown as Record<string, unknown>)[col]));
    }
  };

  return (
    <>
      <div className="tblbar">
        {filterable ? (
          <input value={q} placeholder="filter…" onChange={(e) => setQ(e.target.value)} />
        ) : null}
        <button className="btn" onClick={() => exportCsv(view, cols, csvName, csvDate)}>
          ⇩ CSV
        </button>
        <span className="note" style={{ margin: 0 }}>click a header to sort</span>
        <span className="note" style={{ margin: 0 }}>{fmt(view.length)} / {fmt(rows.length)}</span>
      </div>
      <div className="drill">
        <table>
          <thead>
            <tr>
              {cols.map((c) => (
                <th
                  key={c}
                  className={`sortable${sortCol === c ? (asc ? ' asc' : ' desc') : ''}`}
                  onClick={() => clickHeader(c)}
                >
                  {COL_HEADERS[c] ?? c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={`${r.sym}`} style={r.traded === false ? { opacity: 0.5 } : undefined}>
                {cols.map((c) => (
                  <React.Fragment key={c}>{renderCell(r, c)}</React.Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Compact read-only drill table used under a sector row (reference stockRows). */
export function SectorDrill({ list }: { list: StockRow[] }) {
  const cols = ['sym', 'name', 'close', 'd1', 'm1', 'm3', 'vs50', 'vs200', 'hi52', 'lo52', 'stage', 'rvol'];
  if (!list.length) return <p className="note">No stocks in this group.</p>;
  return (
    <div className="drill">
      <table>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c}>{COL_HEADERS[c] ?? c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.sym} style={r.traded === false ? { opacity: 0.5 } : undefined}>
              <td>{r.sym}</td>
              <td>{r.name}{r.traded === false ? ' (no trade)' : ''}</td>
              <td>{fmt(r.close ?? null, 2)}</td>
              {(['d1', 'm1', 'm3', 'vs50', 'vs200', 'hi52', 'lo52'] as const).map((k) => {
                const v = r[k];
                return (
                  <td key={k} className={v == null ? '' : v >= 0 ? 'pos' : 'neg'}>
                    {v == null ? '—' : pct(v)}
                  </td>
                );
              })}
              <td>{r.stage == null ? '—' : <StageBadge stage={r.stage} />}</td>
              <td>{fmt(r.rvol ?? null, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Loading/error wrapper so pages can gate a table on one fetch. */
export function TableGate({
  loading,
  error,
  loadingText,
  children,
}: {
  loading: boolean;
  error: string | null;
  loadingText: string;
  children: React.ReactNode;
}) {
  const st = <TableStatus loading={loading} error={error} loadingText={loadingText} />;
  if (loading || error) return <>{st}</>;
  return <>{children}</>;
}
