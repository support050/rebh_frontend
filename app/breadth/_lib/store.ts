/**
 * Breadth data store (zustand) — the single source for every /breadth page.
 *
 * Pulls the three snapshot endpoints the engine needs and assembles the
 * DataSource ({dates, series, events}) contract from _engine/types:
 *   GET /api/rebh/breadth/today    → headline fields (BreadthToday)
 *   GET /api/rebh/breadth/series   → {dates, series:{key:[...]}} sliced to requested keys
 *   GET /api/rebh/breadth/events   → event marker lists (BreadthEvents)
 *
 * Series are merged incrementally: each page requests only the keys it draws,
 * the store accumulates them against the shared `dates` axis. today/events are
 * fetched once and reused. All calls go through authFetch (session cookies +
 * CSRF + 401 refresh) exactly like the rest of the app.
 */
import { create } from 'zustand';
import { authFetch } from '@/lib/api/authFetch';
import { API_BASE_URL } from '@/lib/api/config';
import type { BreadthToday, BreadthEvents, BreadthMeta } from '@/types/breadth';
import type { DataSource, SeriesVal } from '../_engine/types';

const BASE = `${API_BASE_URL}/api/rebh/breadth`;

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface BreadthState {
  today: BreadthToday | null;
  events: BreadthEvents | null;
  meta: BreadthMeta | null;
  /** shared x-axis, present once the first series load succeeds */
  dates: string[];
  /** merged series map keyed by BreadthSeriesKey (plus 'regime') */
  series: Record<string, SeriesVal[]>;
  status: Status;
  error: string | null;
  /** true while today/events bootstrap is running */
  booting: boolean;
  loadedKeys: string[];
  load: (keys: string[]) => Promise<void>;
  reset: () => void;
}

/** regime is always pulled alongside the requested keys (needed by the strip/tooltip). */
const ALWAYS_KEYS = ['regime'];

async function getJSON<T>(url: string): Promise<T> {
  const res = await authFetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return (await res.json()) as T;
}

export const useBreadthStore = create<BreadthState>((set, get) => ({
  today: null,
  events: null,
  meta: null,
  dates: [],
  series: {},
  status: 'idle',
  error: null,
  booting: false,
  loadedKeys: [],

  load: async (keys: string[]) => {
    const want = Array.from(new Set([...keys, ...ALWAYS_KEYS])).filter(Boolean);
    const have = new Set(get().loadedKeys);
    const missing = want.filter((k) => !have.has(k));

    // bootstrap today+events+meta once, in parallel with the first series fetch
    let patch: Partial<BreadthState> = {};
    const bootNeeded = !get().today || !get().events || !get().meta;
    if (bootNeeded) set({ booting: true, status: 'loading', error: null });
    else if (missing.length === 0) return; // everything cached
    else set({ status: 'loading', error: null });

    try {
      const seriesUrl = `${BASE}/series?keys=${encodeURIComponent(missing.length ? missing.join(',') : want.join(','))}`;
      const seriesPromise = getJSON<{ dates: string[]; series: Record<string, SeriesVal[]> }>(seriesUrl);
      const tasks: Promise<unknown>[] = [seriesPromise];
      if (bootNeeded) {
        tasks.push(getJSON<BreadthToday>(`${BASE}/today`));
        tasks.push(getJSON<BreadthEvents>(`${BASE}/events`));
        tasks.push(getJSON<BreadthMeta>(`${BASE}/meta`));
      }
      const results = await Promise.all(tasks);
      const seriesRes = results[0] as { dates: string[]; series: Record<string, SeriesVal[]> };
      const today = results[1] as BreadthToday | undefined;
      const events = results[2] as BreadthEvents | undefined;
      const meta = results[3] as BreadthMeta | undefined;

      patch = bootNeeded ? { today: today ?? null, events: events ?? null, meta: meta ?? null } : {};

      const mergedSeries = { ...get().series, ...seriesRes.series };
      set({
        ...patch,
        dates: seriesRes.dates.length ? seriesRes.dates : get().dates,
        series: mergedSeries,
        loadedKeys: Array.from(new Set([...get().loadedKeys, ...want])),
        status: 'ready',
        booting: false,
        error: null,
      });
    } catch (err) {
      set({ status: 'error', booting: false, error: (err as Error).message });
    }
  },

  reset: () => set({ today: null, events: null, meta: null, dates: [], series: {}, loadedKeys: [], status: 'idle', error: null }),
}));

/** Build the engine DataSource from the current store slice. */
export function selectDataSource(state: Pick<BreadthState, 'dates' | 'series' | 'events'>): DataSource | null {
  if (!state.dates.length || !Object.keys(state.series).length) return null;
  const events = (state.events as unknown as Record<string, never>) || {};
  return { dates: state.dates, series: state.series, events: events as DataSource['events'] };
}
