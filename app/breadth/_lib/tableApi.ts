/**
 * Table-endpoint fetchers + a tiny cached async hook for the /breadth pages.
 *
 * The chart store (store.ts) only boots today/series/events/meta. The
 * interactive tables need the heavier per-domain payloads (/stocks, /sectors,
 * /signals, /stockbee) and on-demand per-symbol /ohlc — so they fetch here,
 * through the same authFetch (session + CSRF + 401-refresh) the rest of the app
 * uses. Non-symbol endpoints are memoised module-level so navigating between
 * breadth pages never re-downloads them.
 */
'use client';
import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/api/authFetch';
import { API_BASE_URL } from '@/lib/api/config';
import type {
  BreadthStocks,
  BreadthSectors,
  BreadthSignals,
  BreadthStockbee,
  BreadthOhlc,
} from '@/types/breadth';

const BASE = `${API_BASE_URL}/api/rebh/breadth`;

async function getJSON<T>(url: string): Promise<T> {
  const res = await authFetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return (await res.json()) as T;
}

/** module-level in-flight cache; failures are evicted so a retry can succeed */
const memo: Record<string, Promise<unknown>> = {};
function cached<T>(key: string, factory: () => Promise<T>): Promise<T> {
  if (!memo[key]) {
    memo[key] = factory().catch((e) => {
      delete memo[key];
      throw e;
    });
  }
  return memo[key] as Promise<T>;
}

export const fetchStocks = () => cached<BreadthStocks>('stocks', () => getJSON(`${BASE}/stocks`));
export const fetchSectors = () => cached<BreadthSectors>('sectors', () => getJSON(`${BASE}/sectors`));
export const fetchSignals = () => cached<BreadthSignals>('signals', () => getJSON(`${BASE}/signals`));
export const fetchStockbee = () => cached<BreadthStockbee>('stockbee', () => getJSON(`${BASE}/stockbee`));
/** per-symbol OHLC window for the stock chart modal (not memoised — up to 250 keys) */
export const fetchOhlcSymbol = (sym: string | number) =>
  getJSON<{ symbol: string; dates: string[]; tasi: number[]; data: BreadthOhlc['ohlc'][string] }>(
    `${BASE}/ohlc/${sym}`,
  );

/** Full OHLC block for every symbol — heavy, so it is memoised. The stock modal
 *  prefers fetchOhlcSymbol (one symbol, ~260 rows) over this. */
export function fetchOhlcBlock() {
  return cached<BreadthOhlc>('ohlc', () => getJSON<BreadthOhlc>(`${BASE}/ohlc`));
}

export interface TableState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** Runs a (memoised) fetcher and tracks loading/error; `fetcher` must be stable. */
export function useTableData<T>(fetcher: () => Promise<T>): TableState<T> {
  const [state, setState] = useState<TableState<T>>({ data: null, loading: true, error: null });
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher()
      .then((d) => alive && setState({ data: d, loading: false, error: null }))
      .catch((e) => alive && setState({ data: null, loading: false, error: (e as Error).message }));
    return () => {
      alive = false;
    };
  }, [fetcher]);
  return state;
}
