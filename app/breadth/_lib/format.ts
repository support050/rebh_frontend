/**
 * Numeric/cell formatting shared by the /breadth interactive tables.
 * Ported verbatim from pro_dashboard_template.html so the tables render the
 * exact same strings as the reference (fmt default 0 decimals, em-dash on null).
 */

/** Latin digits, thousands separators, fixed fraction digits; '—' when null. */
export function fmt(v: number | null | undefined, d = 0): string {
  if (v == null || Number.isNaN(v)) return '—';
  return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** Coerce a stored series value (number | string | null) to a number or null. */
export function num(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Signed percent cell text: '+3.2%' / '−1.5%' / '—'. */
export function pct(v: number | null | undefined, d = 1): string {
  if (v == null || Number.isNaN(v)) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(d)}%`;
}

/** CSS class for a signed value ('pos' green / 'neg' red / '' neutral). */
export function signClass(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '';
  return v >= 0 ? 'pos' : 'neg';
}
