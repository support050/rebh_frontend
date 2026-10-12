/**
 * Browser-computed breadth series.
 *
 * The reference dashboard derives a handful of display-only series in JS (they
 * are NOT stored in /series, so requesting them from the API returns HTTP 400).
 * We reproduce those exact formulas here and merge them into the engine's
 * DataSource before any Stack draws — faithful to pro_dashboard_template.html:
 *   • widget share gauges  w_nh / w_ad / w_open / w_vol / w_4  = 100·up/(up+down)
 *   • their 10-day means     *_10 = trailing mean ignoring nulls
 *   • BPI status             bpi_state_num = numeric map of the bpi_status label
 */
import { num } from './helpers';
import type { SeriesVal } from './types';

type SeriesMap = Record<string, SeriesVal[]>;

/** 100·a/(a+b) element-wise; null when either side is null or the sum is zero. */
function pctS(S: SeriesMap, a: string, b: string): SeriesVal[] {
  const A = S[a] || [];
  const B = S[b] || [];
  const n = Math.max(A.length, B.length);
  const out: SeriesVal[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const u = num(A[i]);
    const d = num(B[i]);
    out[i] = u == null || d == null || u + d === 0 ? null : (100 * u) / (u + d);
  }
  return out;
}

/** trailing 10-day mean that skips nulls (matches the template's sm10). */
function sm10(a: SeriesVal[]): SeriesVal[] {
  const n = a.length;
  const out: SeriesVal[] = new Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    let c = 0;
    for (let j = Math.max(0, i - 9); j <= i; j++) {
      const v = num(a[j]);
      if (v != null) {
        s += v;
        c++;
      }
    }
    out[i] = c ? s / c : null;
  }
  return out;
}

const BPI_STATE: Record<string, number> = {
  'Bull Confirmed': 3,
  'Bull Alert': 2,
  'Bull Correction': 1,
  'Bear Correction': -1,
  'Bear Alert': -2,
  'Bear Confirmed': -3,
};

const SHARE_PAIRS: [string, string, string][] = [
  ['w_nh', 'new_highs', 'new_lows'],
  ['w_ad', 'advances', 'declines'],
  ['w_open', 'up_from_open', 'down_from_open'],
  ['w_vol', 'up_on_volume', 'down_on_volume'],
  ['w_4', 'up_x', 'down_x'],
];

/** Compute every derived series whose base keys are present (idempotent). */
export function applyDerived(S: SeriesMap): void {
  for (const [key, up, dn] of SHARE_PAIRS) {
    if (S[up] && S[dn] && !S[key]) S[key] = pctS(S, up, dn);
  }
  for (const [key] of SHARE_PAIRS) {
    if (S[key] && !S[`${key}_10`]) S[`${key}_10`] = sm10(S[key]);
  }
  if (S.bpi_status && !S.bpi_state_num) {
    S.bpi_state_num = S.bpi_status.map((v) => (v == null ? null : BPI_STATE[String(v)] ?? 0));
  }
}
