// Shared formatting utilities for sector-templates
import type { RowData } from "./types";

/** Format a value in thousands to display in millions with parentheses for negatives */
export function fmtM(v: number): string {
  const m = v / 1000;
  const a = Math.abs(m);
  const s =
    a >= 100
      ? Math.round(a).toLocaleString("en-US")
      : a >= 1
        ? a.toLocaleString("en-US", { maximumFractionDigits: 1 })
        : a.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return v < 0 ? `(${s})` : s;
}

/** Format EPS with 2-3 decimal places, parentheses for negatives */
export function fmtEPS(v: number): string {
  return v < 0 ? `(${Math.abs(v).toFixed(2)})` : v.toFixed(v < 1 ? 3 : 2);
}

/** Format a percentage change with +/− sign */
export function fmtPct(v: number): string {
  return (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(1) + "%";
}

/** Compute YoY series: for each index >= 4, compares to index-4 */
export function yoySeries(v: (number | null)[]): (number | null)[] {
  return v.map((x, i) =>
    i >= 4 && v[i - 4] && x != null && Math.sign(v[i - 4]!) === Math.sign(x)
      ? (Math.abs(x) / Math.abs(v[i - 4]!) - 1) * 100
      : null
  );
}

/** Get last YoY: compares last value to value 4 positions before */
export function lastYoY(v: (number | null)[]): number | null {
  const n = v.length;
  const a = v[n - 5];
  const b = v[n - 1];
  if (a == null || !a || b == null || Math.sign(a) !== Math.sign(b)) return null;
  return (Math.abs(b) / Math.abs(a) - 1) * 100;
}

/** Convert cumulative values to discrete quarterly values */
export function toDiscrete(v: number[]): number[] {
  return [v[0], v[1] - v[0], v[2] - v[1], v[3] - v[2], v[4]];
}


/** Generate an SVG sparkline string for inline rendering */
export function sparklinePath(vals: (number | null)[], w = 100, h = 24): { pts: string; last: [number, number]; zero: number | null } {
  const vs = vals.filter((v): v is number => v != null);
  if (vs.length < 2) return { pts: "", last: [0, 0], zero: null };
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  const rng = max - min || 1;
  const y = (v: number) => h - 3 - ((v - min) / rng) * (h - 8);
  const points = vs.map((v, i) => `${(i / (vs.length - 1)) * (w - 4) + 2},${y(v)}`);
  const lastPt = points[points.length - 1].split(",").map(Number) as [number, number];
  const hasZero = min < 0 && max > 0 ? y(0) : null;
  return { pts: points.join(" "), last: lastPt, zero: hasZero };
}
