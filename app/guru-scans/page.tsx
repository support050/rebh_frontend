'use client';
/**
 * /guru-scans — "Guru Stock Scans" leaderboard for the Saudi market (Tadawul/TASI).
 *
 * An INDEPENDENT page by client decision: it does NOT live under /breadth and does NOT
 * use the BreadthView/chart store wrapper. It renders the multi-scanner layout from the
 * reference image — nine coloured filter columns side by side — as a plain Tailwind grid
 * with horizontal scroll, and per stock only the two badges the client asked for:
 * RS Rating (1-99) and Weinstein Stage (1/2/3/4). No earnings-countdown badge exists
 * because Tadawul publishes no forward earnings calendar.
 *
 * Data source: the nightly breadth snapshot, served by GET /api/rebh/breadth/guru. This
 * page never recomputes anything — it renders the payload as returned, including the
 * stock order inside each column (the API already sorts by occurrence ↓ then RS ↓).
 */
import React from 'react';
import useSWR from 'swr';
import { useTheme } from 'next-themes';
import { authFetch } from '@/lib/api/authFetch';

// ── API contract (mirrors breadth_data["guru"] built by pro_dashboard.compute_guru) ──
interface GuruRow {
  name?: string;
  chg_pct: number | null;
  rs: number | null;      // RS Rating 1-99 (relative strength percentile vs market)
  stage: number | null;   // Weinstein Stage 1/2/3/4
  count: number;          // how many of the 9 scans this name passed
}
interface GuruPayload {
  date: string;
  columns: Record<string, number[]>;      // scan key -> ordered symbols
  rows: Record<string, GuruRow>;          // "symbol" -> badges
  counts: Record<string, number>;         // scan key -> membership size
  error?: string;
}

/** Carry the HTTP status so the board can tell 404 (not built yet) from 503 (build failed). */
class GuruApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'GuruApiError';
  }
}

async function fetchGuru(): Promise<GuruPayload> {
  const res = await authFetch('/api/rebh/breadth/guru', { headers: { Accept: 'application/json' } });
  if (res.status === 404) {
    throw new GuruApiError(404, 'The Guru board is not in the current breadth snapshot yet — it lands after the next nightly breadth job.');
  }
  if (res.status === 503) {
    // FastAPI wraps HTTPException bodies as {"detail": "..."}; unwrap when possible.
    const raw = await res.text().catch(() => '');
    let detail = raw;
    try {
      detail = (JSON.parse(raw) as { detail?: string }).detail || raw;
    } catch {
      /* keep raw text */
    }
    throw new GuruApiError(503, `The board failed to build at the source${detail ? `: ${detail}` : '.'}`);
  }
  if (!res.ok) throw new GuruApiError(res.status, `${res.status} ${res.statusText || 'request failed'}`);
  return (await res.json()) as GuruPayload;
}

// ── Column definitions: fixed order + label + accent colour (static Tailwind strings so
//    the JIT compiler keeps them). Order matches the reference scanner image. ──
interface ColDef {
  key: string;
  label: string;
  hint: string;
  bar: string;   // left accent bar background
  head: string;  // header text colour
  chip: string;  // count pill colours
}

const COLUMNS: ColDef[] = [
  { key: 'qullamaggie', label: 'Qullamaggie Breakouts', hint: 'Fresh breakout through the PRIOR 52-wk high on ≥1.5× volume', bar: 'bg-violet-500', head: 'text-violet-700 dark:text-violet-300', chip: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200' },
  { key: 'minervini', label: 'Minervini Trend Template', hint: 'All 8 trend-template conditions met', bar: 'bg-blue-500', head: 'text-blue-700 dark:text-blue-300', chip: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' },
  { key: 'sb_9m', label: 'Stockbee 9% Movers', hint: 'Up ≥9% today on higher volume (adapted to TASI)', bar: 'bg-cyan-500', head: 'text-cyan-700 dark:text-cyan-300', chip: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200' },
  { key: 'sb_4pct', label: 'Stockbee 4% Daily', hint: 'Up ≥4% today on higher volume', bar: 'bg-teal-500', head: 'text-teal-700 dark:text-teal-300', chip: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-200' },
  { key: 'sb_weekly', label: 'Stockbee 20% Weekly', hint: 'Up ≥20% over the last 5 sessions', bar: 'bg-emerald-500', head: 'text-emerald-700 dark:text-emerald-300', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' },
  { key: 'canslim', label: "O'Neil CANSLIM", hint: 'Trend template + RS ≥80 + 3-month momentum ≥20%', bar: 'bg-amber-500', head: 'text-amber-700 dark:text-amber-300', chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200' },
  { key: 'tml', label: 'TML / Liquid Growth', hint: 'Trend template + latest-quarter EPS growth ≥25% YoY (XBRL)', bar: 'bg-orange-500', head: 'text-orange-700 dark:text-orange-300', chip: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200' },
  { key: 'club_97', label: '97 Club', hint: 'Within 3% of the 52-wk high, high made recently', bar: 'bg-rose-500', head: 'text-rose-700 dark:text-rose-300', chip: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200' },
  { key: 'hvc', label: 'Highest Volume', hint: 'Top relative-volume names on the day', bar: 'bg-slate-500', head: 'text-slate-700 dark:text-slate-300', chip: 'bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200' },
];

// ── tiny self-contained formatters (kept local so this page stays decoupled from the
//    /breadth module) ──
const fmtPct = (v: number | null | undefined): string =>
  v == null || Number.isNaN(v) ? '—' : `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}%`;

function chgClass(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return 'text-gray-400 dark:text-gray-500';
  return v >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
}

/** RS percentile → colour. High RS is the point of the badge, so it reads green. */
function rsClass(rs: number): string {
  if (rs >= 80) return 'bg-emerald-600 text-white';
  if (rs >= 60) return 'bg-emerald-500/85 text-white';
  if (rs >= 40) return 'bg-amber-500 text-white';
  return 'bg-rose-500 text-white';
}

/** Weinstein stage → a fixed, meaningful colour per stage. */
function stageStyle(stage: number): { cls: string; label: string } {
  switch (stage) {
    case 1: return { cls: 'border-sky-500/60 text-sky-600 dark:text-sky-400', label: 'S1' };             // Stage 1 · forming base
    case 2: return { cls: 'border-emerald-500/60 text-emerald-600 dark:text-emerald-400', label: 'S2' }; // Stage 2 · uptrend (buy zone)
    case 3: return { cls: 'border-amber-500/60 text-amber-600 dark:text-amber-400', label: 'S3' };       // Stage 3 · distribution/top
    case 4: return { cls: 'border-rose-500/60 text-rose-600 dark:text-rose-400', label: 'S4' };          // Stage 4 · downtrend (avoid)
    default: return { cls: 'border-gray-400 text-gray-500 dark:text-gray-400', label: `S${stage}` };
  }
}

// ── per-stock row: symbol · name · change% · the two requested badges ──
function StockRow({ sym, row }: { sym: number; row: GuruRow | undefined }) {
  const name = row?.name?.trim() || '—';
  const rs = row?.rs ?? null;
  const stage = row?.stage ?? null;
  return (
    <li className="flex items-center justify-between gap-2 px-2 py-2">
      {/* left: ticker (black/white per mode) + directional change%, name on a subtle second line */}
      <div className="flex min-w-0 flex-col">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[13px] font-bold uppercase tracking-wide text-gray-900 dark:text-gray-50">{sym}</span>
          <span className={`text-[11px] font-medium tabular-nums ${chgClass(row?.chg_pct)}`}>{fmtPct(row?.chg_pct)}</span>
        </div>
        {name && name !== '—' ? (
          <span className="truncate text-[10px] text-gray-400 dark:text-gray-500" title={name}>{name}</span>
        ) : null}
      </div>
      {/* right: outline stage pill + filled RS circle (mirrors the reference image) */}
      <div className="flex shrink-0 items-center gap-1.5">
        {stage == null ? (
          <span className="rounded-full border border-gray-300 px-1.5 py-0.5 text-[10px] font-bold text-gray-400 dark:border-gray-600 dark:text-gray-500" title="Weinstein Stage">—</span>
        ) : (
          <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${stageStyle(stage).cls}`} title={`Weinstein Stage ${stage}`}>{stageStyle(stage).label}</span>
        )}
        {rs == null ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-[10px] font-bold text-gray-400 dark:border-gray-600 dark:text-gray-500" title="RS Rating">—</span>
        ) : (
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${rsClass(rs)}`} title="RS Rating (1-99 percentile)">{rs}</span>
        )}
      </div>
    </li>
  );
}

// ── one scanner column ──
function Column({ def, syms, rows }: { def: ColDef; syms: number[]; rows: Record<string, GuruRow> }) {
  return (
    <section className="flex min-w-0 flex-col border border-gray-200 bg-gray-50/70 shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
      <header className="sticky top-14 z-30 flex shrink-0 items-stretch border-b border-gray-200 bg-white px-2.5 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-1">
            <h3 className={`truncate text-xs font-bold ${def.head}`} title={def.label}>{def.label}</h3>
            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${def.chip}`}>{syms.length}</span>
          </div>
          <p className="mt-0.5 truncate text-[10px] text-gray-400 dark:text-gray-500" title={def.hint}>{def.hint}</p>
        </div>
      </header>
      <ul className="divide-y divide-gray-200/80 dark:divide-gray-700/50">
        {syms.length === 0 ? (
          <li className="flex h-24 items-center justify-center rounded-md border border-dashed border-gray-200 text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
            None today
          </li>
        ) : (
          syms.map((sym) => <StockRow key={sym} sym={sym} row={rows[String(sym)]} />)
        )}
      </ul>
    </section>
  );
}

export default function GuruScansPage() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<GuruPayload, GuruApiError>(
    'rebh:breadth:guru',
    fetchGuru,
    { revalidateOnFocus: false, dedupingInterval: 15_000 },
  );

  const totalNames = data ? Object.keys(data.rows).length : 0;
  const refreshing = isValidating && !!data;

  // Theme toggle — next-themes class strategy. Guard `mounted` so the SSR HTML and the
  // first client render agree (avoids a hydration mismatch when the persisted theme is dark).
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isDark = mounted && theme === 'dark';

  return (
    <div dir="ltr" className="min-h-screen bg-gray-100 p-3 sm:p-4 dark:bg-gray-950">
      {/* header chrome */}
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Guru Stock Scans · Tadawul</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Nine momentum scanners, side by side. Each name carries only the two badges you asked for:{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-300">RS Rating (1-99)</span> and{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-300">Weinstein Stage (1-4)</span>.
            {data ? <> As of <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{data.date}</span>.</> : null}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold tabular-nums text-gray-700 dark:text-gray-300">{totalNames}</span> unique names
            </span>
          ) : null}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label="Toggle color theme"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {isDark ? (
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="10" cy="10" r="3.2" />
                <path d="M10 2v1.5M10 16.5V18M18 10h-1.5M3.5 10H2M15.4 4.6l-1 1M5.6 14.4l-1 1M15.4 15.4l-1-1M5.6 5.6l-1-1" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M17.3 12.5a6.5 6.5 0 0 1-8.8-8.8 7 7 0 1 0 8.8 8.8z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => mutate()}
            disabled={isLoading || refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <svg className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 10a6 6 0 1 0 1.8-4.3M4 4v3h3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* error states — 404 (not built yet) and 503 (build failed) read differently */}
      {error ? (
        <div
          role="alert"
          className={`mb-3 rounded-lg border px-4 py-3 text-sm ${
            error.status === 404
              ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-200'
              : 'border-red-300 bg-red-50 text-red-800 dark:border-red-700/60 dark:bg-red-900/30 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            <span>
              {error.status === 404 ? 'Not available yet' : error.status === 503 ? 'Board build failed' : 'Failed to load'}
              {error.status ? ` (${error.status})` : ''}
            </span>
          </div>
          <p className="mt-1 opacity-90">{error.message}</p>
          <button onClick={() => mutate()} className="mt-2 rounded border border-current/40 px-2 py-0.5 text-xs font-medium hover:opacity-80">
            Try again
          </button>
        </div>
      ) : null}

      {/* loading skeleton (only on first load with no data) */}
      {isLoading && !data ? (
        <div className="grid grid-cols-[repeat(9,minmax(0,1fr))] items-start gap-2">
          {COLUMNS.map((c) => (
            <div key={c.key} className="min-w-0 rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="mb-3 h-5 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="mb-2 h-14 animate-pulse rounded-md bg-gray-100 dark:bg-gray-700/40" />
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {/* the board */}
      {data && !error ? (
        <div className="grid grid-cols-[repeat(9,minmax(0,1fr))] items-start gap-2">
          {COLUMNS.map((def) => (
            <Column key={def.key} def={def} syms={data.columns[def.key] ?? []} rows={data.rows} />
          ))}
        </div>
      ) : null}

      {/* legend / honesty footer */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400 dark:text-gray-500">
        <span className="font-semibold text-gray-500 dark:text-gray-400">Stage:</span>
        {[1, 2, 3, 4].map((s) => (
          <span key={s} className="inline-flex items-center gap-1">
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${stageStyle(s).cls}`}>{stageStyle(s).label}</span>
            {s === 1 ? 'base' : s === 2 ? 'uptrend' : s === 3 ? 'top' : 'decline'}
          </span>
        ))}
        <span className="ml-2">RS badge = 1-99 percentile · order within a column = occurrences ↓ then RS ↓ (as returned by the API).</span>
      </div>
    </div>
  );
}
