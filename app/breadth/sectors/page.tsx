'use client';
/**
 * /breadth/sectors — Sector breadth.
 *
 * Reference #p-sectors ported 1:1: the Theme Tracker (diverging equal-weight
 * return bars, period switch), Industry Ranks (rank + rank-change superscripts),
 * the 30-day sector heat table whose rows expand into that group's stock list,
 * and the verified #sec-stack chart column underneath. Symbol clicks open the
 * stock chart modal, exactly as in the client build.
 */
import React, { useMemo, useRef, useState } from 'react';
import { BreadthView, PageHead, RangeToolbar, StackMount } from '../_lib/BreadthView';
import { idxPanel, IDX_KEYS } from '../_lib/panels';
import { useBreadthStore } from '../_lib/store';
import { fetchSectors, fetchStocks, useTableData } from '../_lib/tableApi';
import StockTable from '../_lib/StockTable';
import StockChartModal from '../_lib/StockChartModal';
import {
  Card,
  TableStatus,
  fmt,
  heatColor,
  sectorStocks,
  useStockModal,
  type SectorHeatRow,
  type SectorPerfRow,
  type StockRow,
} from '../_lib/ui';
import { num } from '../_lib/format';
import type { PanelDef } from '../_engine/types';

const PANELS: PanelDef[] = [
  idxPanel(),
  {
    title: '% of sectors healthy (score ≥ 60) vs weak (≤ 40)',
    height: 150,
    series: [
      { key: 'pct_healthy', type: 'area', color: '--up', label: '% healthy' },
      { key: 'n_weak', color: '--down', label: '# weak', width: 1 },
    ],
    zero: true,
    zones: [{ from: 50, to: 70, color: '--zone-lo' }],
  },
  {
    title: 'Median sector score',
    height: 120,
    series: [{ key: 'median_score', color: '--orange', label: 'median' }],
    ylim: [0, 100],
    zones: [
      { from: 60, to: 75, color: '--zone-lo' },
      { from: 75, to: 100, color: '--zone-hi' },
    ],
    hlines: [{ y: 40 }, { y: 60 }],
  },
];

const KEYS = [...IDX_KEYS, 'pct_healthy', 'n_weak', 'median_score'];

/** Drill-down columns = the reference stockTable cols minus 'group'. */
const DRILL_COLS = ['sym', 'name', 'close', 'd1', 'm1', 'm3', 'rs', 'vs50', 'vs200', 'hi52', 'lo52', 'stage', 'rvol', 'bo', 'flags'];
const RANK_COLS = ['1M', '3M', '6M', '12M'];

function SectorsBody() {
  const sectorsQ = useTableData(fetchSectors);
  const stocksQ = useTableData(fetchStocks);

  const [period, setPeriod] = useState('Today');
  const [sortBy, setSortBy] = useState('1M');
  const [openSector, setOpenSector] = useState<string | null>(null);
  const heatRowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const today = useBreadthStore((s) => s.today);
  const snapshot = today?.date ?? '';

  const perfRows = (sectorsQ.data?.sector_perf?.rows ?? []) as SectorPerfRow[];
  const periods = sectorsQ.data?.sector_perf?.periods ?? [];
  const market = sectorsQ.data?.sector_perf?.market ?? {};
  const heatRows = (sectorsQ.data?.sectors?.rows ?? []) as SectorHeatRow[];
  const heatDates = sectorsQ.data?.sectors?.dates ?? [];
  const groups = stocksQ.data?.stocks;
  const pool = sectorsQ.data?.sector_pool;

  const allRows = useMemo<StockRow[]>(() => {
    const g = groups as unknown as Record<string, StockRow[]> | undefined;
    return g ? Object.keys(g).reduce<StockRow[]>((a, k) => a.concat(g[k] ?? []), []) : [];
  }, [groups]);
  const modal = useStockModal(allRows);

  const theme = useMemo(() => {
    const rows = perfRows.slice().sort((a, b) => num(b[period])! - num(a[period])!);
    const mx = Math.max(1, ...rows.map((r) => Math.abs(num(r[period]) ?? 0)));
    return { rows, mx };
  }, [perfRows, period]);

  const ranked = useMemo(() => perfRows.slice().sort((a, b) => (a.rank[sortBy] ?? 0) - (b.rank[sortBy] ?? 0)), [perfRows, sortBy]);

  const focusSector = (name: string) => {
    setOpenSector((cur) => (cur === name ? cur : name));
    const el = heatRowRefs.current[name];
    if (el) setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 30);
  };

  const head = (
    <PageHead
      title="Sector breadth — health score by industry group"
      note="Score = mean of %>50DMA, %>200DMA, normalised NH−NL and 10-day A/(A+D) inside the group. Healthy ≥ 60, weak ≤ 40; groups with fewer than 5 eligible names are pooled into Other. Click any sector row (or a name in the Theme Tracker / Industry Ranks) to list its stocks with close, moves, RS rating, stage, relative volume, breakout volume and flags."
    />
  );

  // Table fetch must never hide the #sec-stack charts below — show them with a
  // status line while /sectors is in flight or if it failed.
  if (sectorsQ.loading || sectorsQ.error) {
    return (
      <div className="space-y-3">
        {head}
        <TableStatus loading={sectorsQ.loading} error={sectorsQ.error} loadingText="loading sector data" />
        <RangeToolbar />
        <StackMount panels={PANELS} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {head}

      <div className="grid2">
        <Card
          title="Theme Tracker — industry groups, equal-weight return"
          actions={periods.map((p) => (
            <button key={p} className={`btn${period === p ? ' active' : ''}`} onClick={() => setPeriod(p)}>
              {p}
            </button>
          ))}
        >
          <div className="theme">
            {theme.rows.map((r) => {
              const v = num(r[period]) ?? 0;
              const w = (50 * Math.abs(v)) / theme.mx;
              return (
                <React.Fragment key={r.name}>
                  <div className="n" title={`${r.name} — click for stocks`} onClick={() => focusSector(r.name)}>
                    {r.name}
                  </div>
                  <div className="bar">
                    <i
                      style={
                        v >= 0
                          ? { insetInlineStart: '50%', width: `${w}%`, background: 'var(--blue)' }
                          : { insetInlineEnd: '50%', width: `${w}%`, background: 'var(--magenta)' }
                      }
                    />
                  </div>
                  <div className={`v ${v >= 0 ? 'pos' : 'neg'}`}>{v >= 0 ? '+' : ''}{v.toFixed(2)}%</div>
                </React.Fragment>
              );
            })}
          </div>
          <p className="note" style={{ margin: '8px 0 0' }}>
            Equal-weight market {period}: {num(market[period]) != null && num(market[period])! >= 0 ? '+' : ''}{fmt(num(market[period]), 2)}%
          </p>
        </Card>

        <Card
          title="Industry Ranks"
          actions={
            <>
              <span className="note" style={{ margin: 0 }}>sort by</span>
              {RANK_COLS.map((p) => (
                <button key={p} className={`btn${sortBy === p ? ' active' : ''}`} onClick={() => setSortBy(p)}>
                  {p}
                </button>
              ))}
            </>
          }
        >
          <div className="tblwrap" style={{ maxHeight: 420 }}>
            <table className="ranks">
              <thead>
                <tr>
                  <th>Name</th>
                  {RANK_COLS.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                  <th>Stocks</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((r) => {
                  const n = ranked.length;
                  return (
                    <tr key={r.name}>
                      <td title="click for stocks" onClick={() => focusSector(r.name)}>
                        {r.name}
                      </td>
                      {RANK_COLS.map((c) => {
                        const rk = r.rank[c];
                        const ch = r.rank_chg[c];
                        const cls = rk <= 3 ? `r${rk}` : rk > n - 3 ? 'rl' : '';
                        const ret = num(r[c]);
                        return (
                          <td key={c} className={cls} title={ret == null ? '' : `${ret >= 0 ? '+' : ''}${ret}%`}>
                            {rk}
                            {ch ? <sup className={ch > 0 ? 'up' : 'dn'}>{ch > 0 ? '+' : ''}{ch}</sup> : null}
                          </td>
                        );
                      })}
                      <td>{r.stocks ?? ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="note" style={{ margin: '6px 0 0' }}>
            Rank of each group&apos;s equal-weight return over the period (1 = best). Superscript = rank change
            versus one month ago. Green = top 3, red = bottom 3. Hover a cell for the return.
          </p>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>
          Sector breadth — health score by industry group (last 30 days)
        </h2>
        <p className="note">
          Click any sector row to list its stocks with close, 1D/1M/3M, RS rating, distance to the 50/200 DMA and
          the 52-week high/low, Weinstein stage, relative volume, breakout volume and flags (TT = passes the
          Minervini template, NH·vol = new 52-week high on volume). Every list sorts by column, filters, exports to
          CSV, and a click on the symbol opens the stock chart. Walk-forward: 50–70% of sectors healthy → +3.8% /
          60d (82% hit); median score &gt;75 → exhaustion.
        </p>
        <div className="tblwrap">
          <table className="heat">
            <thead>
              <tr>
                <th>Sector</th>
                {heatDates.map((d) => (
                  <th key={d}>{d}</th>
                ))}
                <th>%&gt;50</th>
                <th>%&gt;200</th>
                <th>NH−NL%</th>
                <th>A/D10</th>
                <th>Mom10</th>
                <th>n</th>
              </tr>
            </thead>
            <tbody>
              {heatRows.map((r) => {
                const open = openSector === r.sector;
                const list = sectorStocks(r.sector, groups, pool);
                return (
                  <React.Fragment key={r.sector}>
                    <tr
                      className={`secrow${open ? ' open' : ''}`}
                      ref={(el) => { heatRowRefs.current[r.sector] = el; }}
                      onClick={() => setOpenSector(open ? null : r.sector)}
                    >
                      <td style={{ whiteSpace: 'nowrap' }}>{r.sector}</td>
                      {r.scores.map((v, i) => (
                        <td key={i} style={{ background: heatColor(v) }}>
                          {v == null ? '' : v}
                        </td>
                      ))}
                      <td>{fmt(r.pct50)}</td>
                      <td>{fmt(r.pct200)}</td>
                      <td>{fmt(r.nhnl)}</td>
                      <td>{fmt(r.ad10)}</td>
                      <td>{fmt(r.mom10)}</td>
                      <td>{r.n ?? ''}</td>
                    </tr>
                    {open ? (
                      <tr className="drill">
                        <td colSpan={heatDates.length + 7}>
                          <div style={{ padding: '6px 8px' }}>
                            {stocksQ.loading ? (
                              <p className="note" style={{ margin: 0 }}>loading sector stocks…</p>
                            ) : stocksQ.error ? (
                              <div className="breadth-error">Failed to load stocks — {stocksQ.error}</div>
                            ) : list.length ? (
                              <StockTable
                                rows={list}
                                cols={DRILL_COLS}
                                csvName={`sector_${r.sector.replace(/[^a-z0-9]+/gi, '_')}`}
                                csvDate={snapshot}
                                onSymbol={modal.open}
                              />
                            ) : (
                              <p className="note" style={{ margin: 0 }}>No stocks in this group.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <RangeToolbar />
      <StackMount panels={PANELS} />

      <StockChartModal sym={modal.sym} row={modal.row} onClose={modal.close} />
    </div>
  );
}

export default function SectorsPage() {
  return (
    <BreadthView keys={KEYS}>
      <SectorsBody />
    </BreadthView>
  );
}
