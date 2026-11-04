'use client';

/**
 * /interest-rate/cme-fedwatch — replica of the CME Group FedWatch Tool
 * (QuikStrike "IntegratedFedWatchTool"), Current + Probabilities views.
 *
 * Data: GET /api/economic-indicators/cme-fedwatch/dashboard, which is served
 * entirely from what cmefedwatch_scraper.py persisted (nothing is invented
 * here). See backend/app/api/routes/economic_indicators.py for the derivation
 * of the per-meeting Ease/No Change/Hike aggregates and contract pairings.
 *
 * Styling: every colour, font size and border below comes from
 * ./_data/ratePageDesign.ts, which is transcribed from measured output — do not
 * "improve" a value without re-running backend/scripts/extract_rate_pages_design.py.
 */

import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { API_BASE_URL } from '@/lib/api/config';
import RateSourceAttribution from '../_components/RateSourceAttribution';
import {
  QS_CELL_PADDING, QS_COLORS, QS_FONT, QS_FONT_SIZE, QS_TABLE_FONT_SIZE,
  qsCenterStyle, qsNumberStyle, qsTableStyle, qsTdStyle, qsThStyle,
} from '../_data/ratePageDesign';

/* ───────────────────────────── payload types ───────────────────────────── */

type Snapshot = {
  meeting_label: string | null;
  contract: string | null;
  expires: string | null;
  mid_price: number | null;
  prior_volume: number | null;
  prior_oi: number | null;
  prob_ease: number | null;
  prob_no_change: number | null;
  prob_hike: number | null;
};

type HorizonBlock = {
  columns: string[];
  labels: Record<string, string | null>;
  rows: { rate_range: string; is_current: boolean; values: Record<string, number> }[];
};

type Meeting = {
  meeting_date: string;
  meeting_label: string | null;
  buckets: Record<string, number>;
  rate_ranges: string[];
  prob_ease: number;
  prob_no_change: number;
  prob_hike: number;
  contract: string | null;
  mid_price: number | null;
  /* every field below comes from that meeting's OWN tab postback replay —
     see backend/app/scrapers/cmefedwatch_scraper.py Step 3. */
  expires: string | null;
  prior_volume: number | null;
  prior_oi: number | null;
  horizon: HorizonBlock;
};

type DotCell = { count: number | null; bg_color: string | null };
type DotRow = { target_rate: number; is_median: boolean; cells: Record<string, DotCell> };
type DotPlot = { years: string[]; rows: DotRow[] };

type Dashboard = {
  scrape_date: string;
  data_as_of: string | null;
  current_target_range: string | null;
  chart_title: string | null;
  chart_labels: string[] | null;
  snapshot: Snapshot | null;
  /** top-level horizon = nearest meeting block (kept for backward compat). */
  horizon: HorizonBlock;
  futures: { contract: string; price: number | null; contract_month: string | null }[];
  meetings: Meeting[];
  dotplot: DotPlot;
  all_rate_ranges: string[];
};

type FedwatchView = 'current' | 'probabilities' | 'compare' | 'dot-table';

/* ───────────────────────────── view navigation ───────────────────────────── */

/** The QuikStrike left-hand tree, exactly as the tool labels it. Only two of
 *  the nodes are fed by our scrape; the rest stay visible (the layout is part
 *  of what we are replicating) but are disabled rather than faked. */
const NAV_GROUPS: { title: string; items: { key: string; label: string }[] }[] = [
  {
    title: 'Target Rate',
    items: [
      { key: 'current', label: 'Current' },
      { key: 'compare', label: 'Compare' },
      { key: 'probabilities', label: 'Probabilities' },
      { key: 'aggregated', label: 'Aggregated' },
    ],
  },
  {
    title: 'Historical',
    items: [
      { key: 'historical', label: 'Historical' },
      { key: 'downloads', label: 'Downloads' },
      { key: 'prior-hikes', label: 'Prior Hikes' },
    ],
  },
  { title: 'Dot Plot', items: [{ key: 'dot-chart', label: 'Chart' }, { key: 'dot-table', label: 'Table' }] },
  {
    title: 'Tools',
    items: [
      { key: 'cvol', label: 'CVOL' },
      { key: 'sofr-watch', label: 'SOFR Watch' },
      { key: 'estr-watch', label: 'ESTR Watch' },
    ],
  },
];

/** Why each sidebar node is / isn't clickable, measured against the live tool
 *  on 2026-11-01 (probe captures under backend/_tmp_cme_dumps/):
 *    - Current, Probabilities: scrapable via a direct GET / one postback.
 *    - Compare: no server dataset — the official tool just overlays two meeting
 *      tabs. We have all nine tabs stored, so we compose it client-side from
 *      the SAME real data the Current tab shows.
 *    - Dot Plot Table: lbDotPlotTable postback returns the full grid (rate ×
 *      year counts with the tool's own heat colours) — scraped as-is.
 *    - Dot Plot Chart: same numbers but rendered as a Highcharts canvas; the
 *      Table view is the accessible HTML representation of it.
 *    - Historical: lbHistorical returns only a five-dropdown date-range form;
 *      no data comes back until the form is submitted through a browser (see
 *      probe_lbHistorical.html). We do not fake the endpoint.
 *    - Aggregated, Downloads, Prior Hikes, CVOL, SOFR Watch, ESTR Watch:
 *      separate datasets/tools, not covered by the FedWatch scrape. */
const IMPLEMENTED = new Set(['current', 'probabilities', 'compare', 'dot-table']);
const VIEW_KEYS = ['current', 'probabilities', 'compare', 'dot-table'] as const;

/** Hover tooltip for a disabled sidebar node — tells the user exactly why the
 *  view isn't populated, without pretending we have data we don't. */
const NOT_SCRAPED_REASON: Record<string, string> = {
  aggregated: 'Aggregated view is a separate QuikStrike dataset, not covered by the FedWatch scrape.',
  historical: 'CME renders Historical only through a date-range form; no data comes back until the form is submitted via browser. Not faked.',
  downloads: 'Downloads tab serves file artefacts, not table data.',
  'prior-hikes': 'Prior Hikes is a separate dataset (historical hiking cycles), not part of the FedWatch matrix.',
  'dot-chart': 'Dot Plot Chart is the same data as Dot Plot Table but rendered as a Highcharts canvas. Use the Table view.',
  cvol: 'CVOL is a separate QuikStrike tool (options-implied volatility), not FedWatch.',
  'sofr-watch': 'SOFR Watch is a separate QuikStrike tool.',
  'estr-watch': 'ESTR Watch is a separate QuikStrike tool.',
};

/* ───────────────────────────── formatting ───────────────────────────── */

const pct = (v: number | null | undefined) => (v == null ? '' : `${v.toFixed(1)}%`);
const num = (v: number | null | undefined, dp: number) =>
  v == null ? '' : v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
const int = (v: number | null | undefined) => (v == null ? '' : v.toLocaleString('en-US'));

/** "2026-12-09" -> "9 Dec 2026" (card) / "9 Dec26" (tab), as the tool prints them. */
const longDate = (iso: string) => {
  try { return format(parseISO(iso), 'd MMM yyyy'); } catch { return iso; }
};
const tabDate = (iso: string) => {
  try { return format(parseISO(iso), 'd MMMyy'); } catch { return iso; }
};

/** "1 Day 30 Oct 2026" -> two header lines, like the source table. */
function splitHorizonLabel(label: string | null): [string, string | null] {
  if (!label) return ['', null];
  const m = label.match(/^(.*?\d?\s*\*?)\s+(\d{1,2}\s+\w{3}\s+\d{4})$/);
  return m ? [m[1].trim(), m[2]] : [label, null];
}

const rangeSort = (a: string, b: string) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0);

/* ───────────────────────────── chart ───────────────────────────── */

/**
 * Hand-drawn SVG of the QuikStrike column chart. Geometry is from the capture:
 * 100% = 360px of plot, bars 120px wide (measured .highcharts-series path
 * rect width), fill #2980B9 with a white stroke, 13px black data labels above
 * the bar, dotted gridlines, grey (#8C8C8C) axis titles.
 */
function ProbabilityChart({ points, title, subtitle }: {
  points: { label: string; value: number }[];
  title: string;
  subtitle: string | null;
}) {
  const W = 1160, H = 470;
  const left = 70, right = 30, top = 20, plotH = 360;
  const plotW = W - left - right;
  const baseY = top + plotH;
  const band = points.length ? plotW / points.length : plotW;
  const barW = Math.min(120, band * 0.5);
  const ticks = [0, 20, 40, 60, 80, 100];

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: W, fontFamily: QS_FONT }}>
        <div style={{ fontSize: 16, color: QS_COLORS.text, padding: '2px 0 0 10px' }}>
          {title}
        </div>
        <div style={{ textAlign: 'center', fontSize: '12.8px', color: QS_COLORS.subtitle, padding: '6px 0 2px' }}>
          {subtitle}
        </div>

        <svg width={W} height={H} role="img" aria-label="Target rate probabilities">
          {/* watermark-free plot background */}
          {ticks.map(t => {
            const y = baseY - (t / 100) * plotH;
            return (
              <g key={t}>
                <line x1={left} y1={y} x2={left + plotW} y2={y}
                  stroke={QS_COLORS.cellBorder} strokeWidth={1} strokeDasharray="1,3" />
                <text x={left - 8} y={y + 4} textAnchor="end" fontSize={13} fill={QS_COLORS.axisLabel}>
                  {t}%
                </text>
              </g>
            );
          })}

          {/* axis lines */}
          <line x1={left} y1={top} x2={left} y2={baseY} stroke="#C0C0C0" strokeWidth={1} />
          <line x1={left} y1={baseY} x2={left + plotW} y2={baseY} stroke="#C0C0C0" strokeWidth={1} />

          {points.map((p, i) => {
            const cx = left + band * (i + 0.5);
            const h = Math.max(0, (p.value / 100) * plotH);
            return (
              <g key={p.label}>
                <rect
                  x={cx - barW / 2} y={baseY - h} width={barW} height={h}
                  fill={QS_COLORS.barFill} stroke={QS_COLORS.barStroke} strokeWidth={1}
                />
                <text x={cx} y={baseY - h - 8} textAnchor="middle" fontSize={13} fill={QS_COLORS.text}>
                  {pct(p.value)}
                </text>
                <text x={cx} y={baseY + 20} textAnchor="middle" fontSize={13} fill={QS_COLORS.text}>
                  {p.label}
                </text>
              </g>
            );
          })}

          <text x={left + plotW / 2} y={baseY + 52} textAnchor="middle"
            fontSize={13} fill={QS_COLORS.axisLabel}>
            Target Rate (in bps)
          </text>
          <text x={18} y={top + plotH / 2} textAnchor="middle" fontSize={13}
            fill={QS_COLORS.axisLabel} transform={`rotate(-90 18 ${top + plotH / 2})`}>
            Probability
          </text>
        </svg>
      </div>
    </div>
  );
}

/* ───────────────────────────── page ───────────────────────────── */

export default function CMEFedwatchPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<FedwatchView>('current');
  const [selected, setSelected] = useState<string | null>(null);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/economic-indicators/cme-fedwatch/dashboard`)
      .then(r => {
        if (!r.ok) throw new Error(`FedWatch dashboard returned ${r.status}`);
        return r.json() as Promise<Dashboard>;
      })
      .then(json => {
        setData(json);
        setSelected(json.meetings[0]?.meeting_date ?? null);
        setCompareA(json.meetings[0]?.meeting_date ?? null);
        setCompareB(json.meetings[1]?.meeting_date ?? json.meetings[0]?.meeting_date ?? null);
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load CME FedWatch data'))
      .finally(() => setLoading(false));
  }, []);

  const nearest = data?.meetings[0]?.meeting_date ?? null;
  const meeting = useMemo(
    () => data?.meetings.find(m => m.meeting_date === selected) ?? null,
    [data, selected],
  );

  /** Chart bars = the buckets the tool prints a column for, i.e. probability > 0. */
  const chartPoints = useMemo(() => {
    if (!meeting) return [];
    return Object.entries(meeting.buckets)
      .filter(([, v]) => v > 0)
      .sort((a, b) => rangeSort(a[0], b[0]))
      .map(([label, value]) => ({ label, value }));
  }, [meeting]);

  const matrixColumns = useMemo(
    () => [...(data?.all_rate_ranges ?? [])].sort(rangeSort),
    [data],
  );

  /* ── states that are not the page itself ── */
  if (loading) {
    return (
      <Shell>
        <div style={{ padding: 60, textAlign: 'center' }}>
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2"
            style={{ borderColor: QS_COLORS.barFill }} />
        </div>
      </Shell>
    );
  }
  if (error) {
    return (
      <Shell>
        <div style={{ padding: 40, color: '#b00000', fontFamily: QS_FONT, fontSize: QS_FONT_SIZE }}>
          {error}
          <div style={{ marginTop: 8, color: QS_COLORS.axisLabel }}>
            Run the CME FedWatch scraper (backend/app/scrapers/cmefedwatch_scraper.py) to populate
            cme_fedwatch / cme_fedwatch_snapshot / cme_fedwatch_horizon / cme_fedwatch_futures.
          </div>
        </div>
      </Shell>
    );
  }
  if (!data || !data.meetings.length) {
    return (
      <Shell>
        <div style={{ padding: 40, fontFamily: QS_FONT }}>No CME FedWatch snapshot stored yet.</div>
      </Shell>
    );
  }

  const isNearest = meeting?.meeting_date === nearest;
  void isNearest; // kept for potential future use; scraped meeting headers now cover every tab.

  return (
    <Shell>
      {/* ── tool header ── */}
      <div className="flex items-center justify-between"
        style={{ borderBottom: `1px solid ${QS_COLORS.cellBorder}`, padding: '10px 12px' }}>
        <span style={{ fontSize: 16, fontFamily: QS_FONT }}>FedWatch Tool</span>
        <span style={{ fontSize: 11, color: QS_COLORS.axisLabel, fontFamily: QS_FONT }}>
          {data.data_as_of ? `Data as of ${data.data_as_of}` : ''}
        </span>
      </div>

      <div className="flex flex-col md:flex-row" style={{ alignItems: 'flex-start' }}>
        {/* ── QuikStrike vertical-tab tree ── */}
        <nav style={{ width: 100, flex: '0 0 100px', padding: '8px 0 8px 10px', fontFamily: QS_FONT }}>
          {NAV_GROUPS.map(group => (
            <div key={group.title} style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: QS_TABLE_FONT_SIZE, padding: '4px 0' }}>
                {group.title}
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {group.items.map(item => {
                  const live = IMPLEMENTED.has(item.key);
                  const active = live && view === (item.key as FedwatchView);
                  return (
                    <li key={item.key} style={{ borderRadius: 3, marginBottom: 1 }}>
                      <button
                        type="button"
                        disabled={!live}
                        title={live ? undefined : NOT_SCRAPED_REASON[item.key]}
                        onClick={() => live && setView(item.key as FedwatchView)}
                        className={live && !active ? 'hover:bg-[#EEEEEE]' : ''}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '.25em .1em .25em .5em', fontSize: QS_TABLE_FONT_SIZE,
                          background: active ? QS_COLORS.vtabActiveBg : undefined,
                          color: live ? QS_COLORS.vtabLink : '#9B9B9B',
                          cursor: live ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── panel ── */}
        <div style={{ flex: 1, minWidth: 0, padding: '5px 10px' }}>
          {/* meeting-date strip */}
          <ul className="flex flex-wrap" style={{ listStyle: 'none', margin: '0 0 10px', padding: 0, gap: 2 }}>
            {data.meetings.map(m => {
              const active = m.meeting_date === selected;
              return (
                <li key={m.meeting_date}>
                  <button
                    type="button"
                    onClick={() => setSelected(m.meeting_date)}
                    style={{
                      border: `1px solid ${QS_COLORS.tabBorder}`,
                      background: active ? QS_COLORS.vtabActiveBg : '#fff',
                      color: active ? '#000' : QS_COLORS.vtabLink,
                      fontSize: QS_TABLE_FONT_SIZE,
                      padding: QS_CELL_PADDING,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tabDate(m.meeting_date)}
                  </button>
                </li>
              );
            })}
          </ul>

          {view === 'current' ? (
            <>
              {/* MEETING INFORMATION + PROBABILITIES */}
              <div className="flex flex-col gap-3 lg:flex-row" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                  <table style={qsTableStyle}>
                    <thead>
                      <tr>
                        <th colSpan={6} style={{ ...qsThStyle, textTransform: 'uppercase' }}>
                          Meeting Information
                        </th>
                      </tr>
                      <tr>
                        {['Meeting Date', 'Contract', 'Expires', 'Mid Price', 'Prior Volume', 'Prior OI']
                          .map(h => <th key={h} style={qsThStyle}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={qsCenterStyle}>{longDate(meeting?.meeting_date ?? '')}</td>
                        <td style={qsCenterStyle}>{meeting?.contract ?? ''}</td>
                        <td style={qsCenterStyle}>{meeting?.expires ?? ''}</td>
                        <td style={qsNumberStyle}>{num(meeting?.mid_price ?? null, 4)}</td>
                        <td style={qsNumberStyle}>{int(meeting?.prior_volume ?? null)}</td>
                        <td style={qsNumberStyle}>{int(meeting?.prior_oi ?? null)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ flex: '0 0 377px', maxWidth: 377 }}>
                  <table style={qsTableStyle}>
                    <thead>
                      <tr><th colSpan={3} style={qsThStyle}>Probabilities</th></tr>
                      <tr>
                        {['Ease', 'No Change', 'Hike'].map(h => <th key={h} style={qsThStyle}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={qsNumberStyle}>{num(meeting?.prob_ease ?? null, 1)} %</td>
                        <td style={qsNumberStyle}>{num(meeting?.prob_no_change ?? null, 1)} %</td>
                        <td style={qsNumberStyle}>{num(meeting?.prob_hike ?? null, 1)} %</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* chart */}
              <div style={{ marginTop: 12 }}>
                <ProbabilityChart
                  points={chartPoints}
                  title={`Target Rate Probabilities for ${longDate(meeting?.meeting_date ?? '')} Fed Meeting`}
                  subtitle={data.current_target_range
                    ? `Current target rate is ${data.current_target_range}` : null}
                />
              </div>

              {/* Target Rate / Probability table — every meeting tab is now
                  replayed via its own ASP.NET postback, so meeting.horizon is
                  the real CME-published Now/1D/1W/1M block for THAT meeting. */}
              {(() => {
                const hz = meeting?.horizon ?? { columns: [], labels: {}, rows: [] };
                if (!hz.columns.length) {
                  return (
                    <p style={{ fontSize: 11, color: QS_COLORS.axisLabel, marginTop: 10 }}>
                      Horizon data not available for {longDate(meeting?.meeting_date ?? '')}.
                    </p>
                  );
                }
                return (
                  <div style={{ marginTop: 8 }}>
                    <table style={qsTableStyle}>
                      <thead>
                        <tr>
                          <th rowSpan={2} style={{ ...qsThStyle, width: 210 }}>Target Rate (bps)</th>
                          <th colSpan={hz.columns.length} style={qsThStyle}>Probability(%)</th>
                        </tr>
                        <tr>
                          {hz.columns.map(c => {
                            const [name, when] = splitHorizonLabel(hz.labels[c]);
                            return (
                              <th key={c} style={qsThStyle}>
                                {name}
                                {when ? <><br /><span style={{ fontWeight: 400 }}>{when}</span></> : null}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {[...hz.rows]
                          .sort((a, b) => rangeSort(a.rate_range, b.rate_range))
                          .map(row => (
                            <tr key={row.rate_range}>
                              <td style={qsCenterStyle}>
                                {row.rate_range}{row.is_current ? ' (Current)' : ''}
                              </td>
                              {hz.columns.map(c => (
                                <td key={c} style={{
                                  ...qsNumberStyle,
                                  background: c === 'now' ? QS_COLORS.highlight : undefined,
                                }}>
                                  {row.values[c] == null ? '' : pct(row.values[c])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        <tr>
                          <td colSpan={hz.columns.length + 1}
                            style={{ ...qsTdStyle, border: 0, textAlign: 'center', color: QS_COLORS.axisLabel }}>
                            * Data as of {data.data_as_of}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </>
          ) : view === 'compare' ? (
            <CompareView
              data={data}
              a={compareA}
              b={compareB}
              onA={setCompareA}
              onB={setCompareB}
            />
          ) : view === 'dot-table' ? (
            <DotPlotView dotplot={data.dotplot} />
          ) : (
            <ProbabilitiesView data={data} columns={matrixColumns} />
          )}

          <RateSourceAttribution
            source="cme"
            detail={`Snapshot stored ${data.scrape_date}${data.data_as_of ? ` · CME data as of ${data.data_as_of}` : ''}`}
          />
        </div>
      </div>

      {/* tool footer, as in the capture */}
      <div style={{
        borderTop: `1px solid ${QS_COLORS.cellBorder}`, marginTop: 16, padding: '8px 12px',
        fontSize: 11, color: QS_COLORS.axisLabel, fontFamily: QS_FONT,
      }}>
        Powered by QuikStrike<sup>&reg;</sup>
      </div>
    </Shell>
  );
}

/* ───────────────────────────── Probabilities view ───────────────────────────── */

/**
 * The conditional matrix highlight rule, reverse-engineered from the classes
 * the source itself emits (td.highlight / td.highlight2 in the QuikStrike
 * payload) and verified against all nine rows of the live tool:
 *   highlight2 (cyan)  = the row's modal bucket
 *   highlight (yellow) = every bucket below the modal one at >= 1%
 */
function matrixCellClass(values: Record<string, number>, key: string, modalKey: string | null) {
  if (key === modalKey) return 'highlight2';
  const v = values[key];
  if (v == null || v < 1) return '';
  if (parseInt(key, 10) < parseInt(modalKey ?? '', 10)) return 'highlight';
  return '';
}

function ProbabilitiesView({ data, columns }: { data: Dashboard; columns: string[] }) {
  return (
    <div style={{ fontFamily: QS_FONT }}>
      {/* FED FUND FUTURES ladder */}
      <div className="flex justify-center">
        <table style={{ ...qsTableStyle, width: 'auto' }}>
          <thead>
            <tr><th colSpan={data.futures.length} style={qsThStyle}>Fed Fund Futures</th></tr>
            <tr>{data.futures.map(f => <th key={f.contract} style={qsThStyle}>{f.contract}</th>)}</tr>
          </thead>
          <tbody>
            <tr>
              {data.futures.map(f => (
                <td key={f.contract} style={{ ...qsTdStyle, textAlign: 'center' }}>
                  {num(f.price, 4)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* conditional meeting probabilities */}
      <div className="mt-5 flex justify-center" style={{ overflowX: 'auto' }}>
        <table style={{ ...qsTableStyle, width: 'auto' }}>
          <thead>
            <tr>
              <th style={qsThStyle} />
              <th colSpan={columns.length} style={qsThStyle}>
                CME FedWatch Tool - Conditional Meeting Probabilities
              </th>
            </tr>
            <tr>
              <th style={qsThStyle}>Meeting Date</th>
              {columns.map(c => <th key={c} style={qsThStyle}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.meetings.map(m => {
              const entries = Object.entries(m.buckets).filter(([, v]) => v > 0);
              const modalKey = entries.length
                ? entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0]
                : null;
              return (
                <tr key={m.meeting_date}>
                  <td style={qsCenterStyle}>{format(new Date(m.meeting_date), 'M/d/yyyy')}</td>
                  {columns.map(c => {
                    const cls = matrixCellClass(m.buckets, c, modalKey);
                    return (
                      <td key={c} style={{
                        ...qsNumberStyle,
                        background: cls === 'highlight' ? QS_COLORS.highlight
                          : cls === 'highlight2' ? QS_COLORS.highlight2 : undefined,
                      }}>
                        {m.buckets[c] == null ? '' : pct(m.buckets[c])}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 11, color: QS_COLORS.axisLabel, marginTop: 10, textAlign: 'center' }}>
        1/1/2028 and forward are projected meeting dates
      </p>
    </div>
  );
}

/* ───────────────────────────── Dot Plot (Table) view ───────────────────────────── */

/**
 * FOMC participants' year-end target-rate projections, exactly as printed by
 * lbDotPlotTable. The scraper stores the tool's own heat-cell background
 * colours (bg_color) plus the median flag (class 'highlight2' in the source
 * HTML) so this view mirrors the CME panel without inventing a palette.
 */
function DotPlotView({ dotplot }: { dotplot: DotPlot }) {
  if (!dotplot.rows.length) {
    return (
      <p style={{ fontSize: 11, color: QS_COLORS.axisLabel, marginTop: 10 }}>
        No dot-plot snapshot stored yet — the scraper populates this on the next run.
      </p>
    );
  }
  return (
    <div style={{ fontFamily: QS_FONT }}>
      <div style={{ padding: '4px 0 8px', fontSize: 14 }}>
        FOMC Summary of Economic Projections — Target Federal Funds Rate
      </div>
      <table style={qsTableStyle}>
        <thead>
          <tr>
            <th style={{ ...qsThStyle, textAlign: 'left' }}>Target Rate</th>
            {dotplot.years.map(y => <th key={y} style={qsThStyle}>{y}</th>)}
          </tr>
        </thead>
        <tbody>
          {dotplot.rows.map(row => (
            <tr key={row.target_rate}>
              <td style={{ ...qsCenterStyle, textAlign: 'left' }}>
                {row.target_rate.toFixed(3)}{row.is_median ? ' *' : ''}
              </td>
              {dotplot.years.map(y => {
                const cell = row.cells[y] ?? { count: null, bg_color: null };
                return (
                  <td key={y} style={{
                    ...qsCenterStyle,
                    background: cell.bg_color ?? undefined,
                    color: cell.bg_color ? '#000' : QS_COLORS.axisLabel,
                  }}>
                    {cell.count == null ? '' : cell.count}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 11, color: QS_COLORS.axisLabel, marginTop: 8 }}>
        * marks the row the CME tool highlights as the median projection. Empty cells mean the
        SEP did not print a count for that year/rate combination — nothing is invented here.
      </p>
    </div>
  );
}

/* ───────────────────────────── Compare view ───────────────────────────── */

/** Small styled selector that matches the QuikStrike form aesthetic. */
function MeetingSelect({
  value, onChange, meetings, label,
}: {
  value: string | null;
  onChange: (v: string) => void;
  meetings: Meeting[];
  label: string;
}) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: QS_TABLE_FONT_SIZE }}>
      <span style={{ fontWeight: 700 }}>{label}</span>
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        style={{
          border: `1px solid ${QS_COLORS.tabBorder}`, padding: '3px 6px',
          fontFamily: QS_FONT, fontSize: QS_TABLE_FONT_SIZE, background: '#fff',
        }}
      >
        {meetings.map(m => (
          <option key={m.meeting_date} value={m.meeting_date}>
            {longDate(m.meeting_date)}{m.contract ? ` (${m.contract})` : ''}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * The official Compare tab is a client-side overlay of two meeting tabs —
 * QuikStrike itself does not POST anything new when you open it (verified via
 * backend/_tmp_cme_dumps/probe_lbCompare.html). Now that every meeting tab is
 * stored with its own Meeting Information, probabilities and horizon table, we
 * compose the same view directly from that real scraped data.
 */
function CompareView({
  data, a, b, onA, onB,
}: {
  data: Dashboard;
  a: string | null;
  b: string | null;
  onA: (v: string) => void;
  onB: (v: string) => void;
}) {
  const ma = data.meetings.find(m => m.meeting_date === a) ?? null;
  const mb = data.meetings.find(m => m.meeting_date === b) ?? null;

  return (
    <div style={{ fontFamily: QS_FONT }}>
      <div className="flex flex-wrap items-center gap-4" style={{ padding: '4px 0 10px' }}>
        <MeetingSelect label="Meeting A" value={a} onChange={onA} meetings={data.meetings} />
        <MeetingSelect label="Meeting B" value={b} onChange={onB} meetings={data.meetings} />
      </div>

      {!ma || !mb ? (
        <p style={{ color: QS_COLORS.axisLabel, fontSize: 12 }}>
          Select two meetings to compare.
        </p>
      ) : (
        <>
          {/* Side-by-side Meeting Information + Probabilities */}
          <div className="flex flex-col gap-4 lg:flex-row" style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 0', minWidth: 0 }}>
              <table style={qsTableStyle}>
                <thead>
                  <tr>
                    <th rowSpan={2} style={qsThStyle} />
                    <th colSpan={3} style={qsThStyle}>{longDate(ma.meeting_date)}</th>
                    <th colSpan={3} style={qsThStyle}>{longDate(mb.meeting_date)}</th>
                  </tr>
                  <tr>
                    {['Ease', 'No Change', 'Hike', 'Ease', 'No Change', 'Hike'].map((h, i) => (
                      <th key={`${h}-${i}`} style={qsThStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={qsCenterStyle}>Probabilities</td>
                    <td style={qsNumberStyle}>{num(ma.prob_ease, 1)} %</td>
                    <td style={qsNumberStyle}>{num(ma.prob_no_change, 1)} %</td>
                    <td style={qsNumberStyle}>{num(ma.prob_hike, 1)} %</td>
                    <td style={qsNumberStyle}>{num(mb.prob_ease, 1)} %</td>
                    <td style={qsNumberStyle}>{num(mb.prob_no_change, 1)} %</td>
                    <td style={qsNumberStyle}>{num(mb.prob_hike, 1)} %</td>
                  </tr>
                  <tr>
                    <td style={qsCenterStyle}>Contract / Expires / Mid</td>
                    <td style={qsCenterStyle}>{ma.contract ?? ''}</td>
                    <td style={qsCenterStyle}>{ma.expires ?? ''}</td>
                    <td style={qsNumberStyle}>{num(ma.mid_price, 4)}</td>
                    <td style={qsCenterStyle}>{mb.contract ?? ''}</td>
                    <td style={qsCenterStyle}>{mb.expires ?? ''}</td>
                    <td style={qsNumberStyle}>{num(mb.mid_price, 4)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Horizon comparison: union of every rate bucket across the two
              meetings, with the 'now' column for each side. This mirrors the
              official Compare overlay, assembled from what CME actually printed
              for each tab. */}
          <CompareHorizonTable a={ma} b={mb} />
        </>
      )}

      <p style={{ fontSize: 11, color: QS_COLORS.axisLabel, marginTop: 10 }}>
        Compare is composed client-side from the two meeting tabs above — the same real,
        scraped numbers CME shows when you click Compare in the official tool.
      </p>
    </div>
  );
}

/**
 * Merged "Now" horizon table for two meetings. Uses each meeting's own
 * horizon block (scraped per tab) so no numbers are derived here.
 */
function CompareHorizonTable({ a, b }: { a: Meeting; b: Meeting }) {
  const allBuckets = useMemo(() => {
    const keys = new Set<string>();
    (a.horizon.rows ?? []).forEach(r => keys.add(r.rate_range));
    (b.horizon.rows ?? []).forEach(r => keys.add(r.rate_range));
    return [...keys].sort(rangeSort);
  }, [a, b]);

  if (!allBuckets.length) {
    return (
      <p style={{ fontSize: 11, color: QS_COLORS.axisLabel, marginTop: 10 }}>
        No horizon data stored for either meeting yet.
      </p>
    );
  }

  return (
    <div style={{ marginTop: 12, overflowX: 'auto' }}>
      <table style={{ ...qsTableStyle, width: 'auto' }}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ ...qsThStyle, width: 140 }}>Target Rate (bps)</th>
            <th colSpan={3} style={qsThStyle}>{longDate(a.meeting_date)}</th>
            <th colSpan={3} style={qsThStyle}>{longDate(b.meeting_date)}</th>
          </tr>
          <tr>
            {['1D', '1W', '1M', '1D', '1W', '1M'].map((h, i) => (
              <th key={`${h}-${i}`} style={qsThStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allBuckets.map(bucket => (
            <tr key={bucket}>
              <td style={qsCenterStyle}>{bucket}</td>
              {(['1d', '1w', '1m'] as const).map(h => cellFromHorizon(a, bucket, h))}
              {(['1d', '1w', '1m'] as const).map(h => cellFromHorizon(b, bucket, h))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function cellFromHorizon(m: Meeting, bucket: string, horizon: '1d' | '1w' | '1m') {
  const row = m.horizon.rows.find(r => r.rate_range === bucket);
  const v = row?.values?.[horizon];
  return (
    <td key={`${m.meeting_date}-${bucket}-${horizon}`} style={qsNumberStyle}>
      {v == null ? '' : pct(v)}
    </td>
  );
}

/* ───────────────────────────── shell ───────────────────────────── */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: QS_COLORS.pageBg, color: QS_COLORS.text,
      fontFamily: QS_FONT, fontSize: QS_FONT_SIZE,
    }}>
      <div className="mx-auto" style={{ maxWidth: 1440, padding: '0 8px 24px' }}>
        {children}
      </div>
    </div>
  );
}
