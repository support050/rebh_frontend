/**
 * Pure helpers for the breadth canvas engine — ported verbatim from the client
 * reference dashboard (Rebh_Market_Breadth_Package/dashboard/pro_dashboard_template.html)
 * so number/tick formatting stays pixel-identical.
 */

/** Read a CSS custom property resolved on a scope element (theme vars live on .breadth-root). */
export function cssVar(name: string, scope: HTMLElement): string {
  return getComputedStyle(scope).getPropertyValue(name).trim();
}

/** Round a raw step to a "nice" 1/2/5·10^n value (nice axis ticks). */
export function nice(v: number): number {
  const e = Math.pow(10, Math.floor(Math.log10(Math.abs(v) || 1)));
  const f = v / e;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * e;
}

/** Generate evenly spaced, nice axis tick values between lo..hi. */
export function ticks(lo: number, hi: number, n = 5): number[] {
  const st = nice((hi - lo) / n);
  const a = Math.ceil(lo / st) * st;
  const out: number[] = [];
  for (let v = a; v <= hi + 1e-9; v += st) out.push(+v.toFixed(10));
  return out;
}

/** Locale number formatter with fixed fraction digits; null → em dash. */
export function fmt(v: number | null | undefined, d = 0): string {
  return v == null ? '—' : v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** Coerce a series point (number|string|null) to a number for math, or null. */
export function num(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}
