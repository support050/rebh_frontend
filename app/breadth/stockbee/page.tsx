'use client';
/**
 * /breadth/stockbee — Stockbee Market Monitor (adapted to TASI).
 *
 * Reference #p-stockbee ported 1:1: the last-15-day colour grid (Stockbee's
 * Market Monitor reading — green = bullish, red = bearish/panic), click any
 * count to list the stocks behind it (name panel built from /stockbee +
 * /stocks), and the verified #sb-stack chart column underneath. Symbol clicks
 * in the name list open the stock chart modal.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BreadthView, PageHead, RangeToolbar, StackMount } from '../_lib/BreadthView';
import { idxPanel, IDX_KEYS } from '../_lib/panels';
import { useBreadthStore } from '../_lib/store';
import { fetchStockbee, fetchStocks, useTableData } from '../_lib/tableApi';
import StockTable from '../_lib/StockTable';
import StockChartModal from '../_lib/StockChartModal';
import { Card, fmt, indexBySymbol, num, useStockModal, type StockRow } from '../_lib/ui';
import type { PanelDef } from '../_engine/types';

export const PANELS: PanelDef[] = [
  idxPanel(),
  {
    title: 'Stocks up ≥4% (green) / down ≥4% (red) with volume',
    height: 130,
    series: [
      { key: 'up_x', type: 'bar', color: '--up', label: '↑4%' },
      { key: 'down_x', type: 'bar', color: '--down', label: '↓4%' },
    ],
    zero: true,
  },
  {
    title: '5-day and 10-day up/down ratio (capped at 8) — ≥2 bullish · ≤0.5 panic',
    height: 120,
    series: [
      { key: 'ratio_5', color: '--orange', label: '5d' },
      { key: 'ratio_10', color: '--blue', label: '10d' },
    ],
    ylim: [0, 8],
    zones: [
      { from: 0, to: 0.5, color: '--zone-lo' },
      { from: 2, to: 8, color: '--zone-hi' },
    ],
    hlines: [{ y: 1 }, { y: 2 }],
  },
  {
    title: '% of stocks down ≥4% today (panic days >20)',
    height: 100,
    series: [{ key: 'pct_down_x', type: 'bar', color: '--down', label: '% down 4%' }],
    zero: true,
    hlines: [{ y: 20, color: '--aqua', label: '20%' }],
  },
  {
    title: 'Net ≥25% in a quarter (up − down) and ±13% in 34 days',
    height: 120,
    series: [
      { key: 'up_25_q', color: '--up', label: '↑25% qtr' },
      { key: 'down_25_q', color: '--down', label: '↓25% qtr' },
      { key: 'up_13_34', color: '--aqua', label: '↑13%/34d', width: 1 },
      { key: 'down_13_34', color: '--orange', label: '↓13%/34d', width: 1 },
    ],
    zero: true,
  },
];

const KEYS = [
  ...IDX_KEYS,
  'up_x', 'down_x', 'ratio_5', 'ratio_10', 'pct_down_x',
  'up_25_q', 'down_25_q', 'up_25_m', 'down_25_m', 'up_50_m', 'down_50_m',
  'up_13_34', 'down_13_34', 'n_mom',
];

/** Grid columns — [series key, header] (reference cols list). */
const SB_COLS: [string, string][] = [
  ['up_x', '↑4%'],
  ['down_x', '↓4%'],
  ['ratio_5', '5d ratio'],
  ['ratio_10', '10d ratio'],
  ['up_25_q', '↑25% qtr'],
  ['down_25_q', '↓25% qtr'],
  ['up_25_m', '↑25% mo'],
  ['down_25_m', '↓25% mo'],
  ['up_50_m', '↑50% mo'],
  ['down_50_m', '↓50% mo'],
  ['up_13_34', '↑13%/34d'],
  ['down_13_34', '↓13%/34d'],
  ['n_mom', 'n'],
];

/** Keys whose cell opens the name list (reference LIST). */
const SB_LIST = new Set([
  'up_x', 'down_x', 'up_25_q', 'down_25_q', 'up_25_m', 'down_25_m',
  'up_50_m', 'down_50_m', 'up_13_34', 'down_13_34',
]);

/** Stockbee colour rules (reference RULES), thresholds on the numeric series. */
function sbRules(S: Record<string, (number | null)[]>): Record<string, (i: number) => 'g' | 'r' | null> {
  const v = (k: string, i: number) => S[k]?.[i] ?? 0;
  return {
    up_x: (i) => (v('up_x', i) >= 25 ? 'g' : null),
    down_x: (i) => (v('down_x', i) >= 25 ? 'r' : null),
    ratio_5: (i) => (v('ratio_5', i) >= 2 ? 'g' : v('ratio_5', i) <= 0.5 ? 'r' : null),
    ratio_10: (i) => (v('ratio_10', i) >= 2 ? 'g' : v('ratio_10', i) <= 0.5 ? 'r' : null),
    up_25_q: (i) => (v('up_25_q', i) > v('down_25_q', i) ? 'g' : null),
    down_25_q: (i) => (v('down_25_q', i) > v('up_25_q', i) ? 'r' : null),
    up_25_m: (i) => (v('up_25_m', i) > v('down_25_m', i) ? 'g' : null),
    down_25_m: (i) => (v('down_25_m', i) > v('up_25_m', i) ? 'r' : null),
    up_50_m: (i) => (v('up_50_m', i) > 0 ? 'g' : null),
    down_50_m: (i) => (v('down_50_m', i) > 0 ? 'r' : null),
    up_13_34: (i) => (v('up_13_34', i) > v('down_13_34', i) ? 'g' : null),
    down_13_34: (i) => (v('down_13_34', i) > v('up_13_34', i) ? 'r' : null),
  };
}

/** Columns of the reference name-list table. */
const NAME_COLS = ['sym', 'name', 'group', 'close', 'd1', 'm1', 'm3', 'rs', 'vs50', 'hi52', 'stage', 'rvol', 'flags'];

interface SbSel {
  date: string;
  key: string;
  label: string;
}

function StockbeeBody() {
  const series = useBreadthStore((s) => s.series);
  const dates = useBreadthStore((s) => s.dates);

  const sbQ = useTableData(fetchStockbee);
  const stocksQ = useTableData(fetchStocks);

  const [sel, setSel] = useState<SbSel | null>(null);
  const namesRef = useRef<HTMLDivElement>(null);

  const S = useMemo(() => {
    const out: Record<string, (number | null)[]> = {};
    for (const [k, arr] of Object.entries(series)) out[k] = (arr ?? []).map(num);
    return out;
  }, [series]);
  const rules = useMemo(() => sbRules(S), [S]);

  const N = dates.length;
  const gridIdx = useMemo(() => {
    const out: number[] = [];
    for (let i = N - 1; i >= Math.max(0, N - 15); i--) out.push(i);
    return out;
  }, [N]);

  const allRows = useMemo<StockRow[]>(() => {
    const g = stocksQ.data?.stocks as unknown as Record<string, StockRow[]> | undefined;
    return g ? Object.keys(g).reduce<StockRow[]>((a, k) => a.concat(g[k] ?? []), []) : [];
  }, [stocksQ.data]);
  const bySym = useMemo(() => indexBySymbol(stocksQ.data?.stocks), [stocksQ.data]);
  const modal = useStockModal(allRows);

  /** Rows behind one grid cell (reference window.sbNames). */
  const nameRows = useMemo<StockRow[]>(() => {
    if (!sel) return [];
    const syms = (((sbQ.data?.[sel.date] as Record<string, unknown> | undefined)?.[sel.key] ?? []) as unknown[]).map(Number);
    return syms.map(
      (sym) =>
        bySym.get(sym) ?? { sym, name: stocksQ.data?.names?.[String(sym)] ?? '', group: '', traded: true },
    );
  }, [sel, sbQ.data, bySym, stocksQ.data]);

  useEffect(() => {
    if (sel) namesRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [sel]);

  const r10 = S.ratio_10?.[N - 1] ?? null;
  const todayRead =
    r10 != null && r10 >= 2 ? (
      <b className="pos">risk-on — 4% breakouts dominating</b>
    ) : r10 != null && r10 <= 0.5 ? (
      <b className="neg">breakdowns dominating (contrarian bounce zone on TASI)</b>
    ) : (
      <b>neutral — no momentum edge either way</b>
    );

  return (
    <div className="space-y-3">
      <PageHead
        title="Stockbee Market Monitor (adapted to TASI)"
        note={
          <>
            ≥4% moves counted only with volume above the prior day (4% ≈ 1.8σ of a typical TASI stock; 3%/5%
            tested in Phase 3). <b>Cell colours follow Stockbee&apos;s reading</b>: green = bullish (↑4% ≥ 25
            names ≈ 10% of the universe, 5/10-day ratio ≥ 2, more 25%-in-a-quarter/month gainers than losers),
            red = bearish / panic (↓4% ≥ 25, ratio ≤ 0.5, more losers). <b>Click any count to list the stocks
            behind it.</b> On TASI these counts behave as <b>contrarian extremes</b>: &gt;20% of stocks down ≥4%
            in a day → +5.1% / 60d (77% hit); 10d ratio &lt; 0.5 → +2.0% / 60d; &gt;20% up ≥4% → exhaustion.
            Today&apos;s read: {todayRead}
          </>
        }
      />

      {sbQ.error ? <div className="breadth-error">Failed to load name lists — {sbQ.error}</div> : null}

      <div className="tblwrap" style={{ maxHeight: 380 }}>
        <table className="sb">
          <thead>
            <tr>
              <th>Date</th>
              {SB_COLS.map(([k, label]) => (
                <th key={k}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gridIdx.map((i) => (
              <tr key={dates[i]}>
                <td>{dates[i]}</td>
                {SB_COLS.map(([k, label]) => {
                  const cl = rules[k] ? rules[k](i) : null;
                  const clickable = SB_LIST.has(k);
                  return (
                    <td
                      key={k}
                      className={`${cl ?? ''}${clickable ? ' k' : ''}`}
                      title={clickable ? 'list stocks' : undefined}
                      onClick={clickable ? () => setSel({ date: dates[i], key: k, label }) : undefined}
                    >
                      {fmt(S[k]?.[i], k.startsWith('ratio') ? 2 : 0)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div ref={namesRef}>
        {sel ? (
          <Card
            title={`${sel.label} · ${sel.date} · ${fmt(nameRows.length)} stocks`}
            actions={
              <button className="btn" onClick={() => setSel(null)}>
                ✕
              </button>
            }
          >
            {stocksQ.loading ? (
              <p className="note">loading stocks…</p>
            ) : nameRows.length ? (
              <>
                <div className="tblwrap" style={{ maxHeight: 420 }}>
                  <StockTable
                    rows={nameRows}
                    cols={NAME_COLS}
                    filterable={false}
                    csvName={`stockbee_${sel.key}`}
                    csvDate={sel.date}
                    onSymbol={modal.open}
                  />
                </div>
                <p className="note" style={{ margin: '6px 0 0' }}>
                  Click a symbol to open its chart (candles + 50/150/200 MAs + volume + RS).
                </p>
              </>
            ) : (
              <p className="note">None today.</p>
            )}
          </Card>
        ) : null}
      </div>

      <RangeToolbar />
      <StackMount panels={PANELS} />

      <StockChartModal sym={modal.sym} row={modal.row} onClose={modal.close} />
    </div>
  );
}

export default function StockbeePage() {
  return (
    <BreadthView keys={KEYS}>
      <StockbeeBody />
    </BreadthView>
  );
}
