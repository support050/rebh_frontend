/**
 * Heat palette + Relative-Strength colour helpers — ported verbatim from the
 * CR3 reference (Rebh_CR3_reference/pro_dashboard_template.html lines 203-207).
 *
 * The reference exposes these as globals so both the canvas engine and the DOM
 * tables share one definition; here they are a module both React cells and the
 * imperative Stack engine import. Everything keys off the ACTIVE theme so a
 * cell stays legible after the ⚙ theme toggle re-inks `[data-heat]` nodes.
 */

/** True when the app is in dark mode (next-themes `html.dark`, or the breadth
 *  scope's own data-theme attribute). Mirrors the reference's
 *  `document.documentElement.dataset.theme==='dark'` check. */
export function isDark(): boolean {
  if (typeof document === 'undefined') return false;
  const root = document.documentElement;
  if (root.dataset.theme === 'dark') return true;
  if (root.classList.contains('dark')) return true;
  const scope = document.querySelector('.breadth-root[data-theme]');
  return !!scope && scope.getAttribute('data-theme') === 'dark';
}

/** Linear interpolation helper (reference lerp). */
const lerp = (a: number, b: number, u: number): number => Math.round(a + (b - a) * u);

/**
 * heatRGB(t): t in 0..1 → [r,g,b]. 0 = deep red (214,69,69), .5 = amber
 * (240,210,110), 1 = green (46,158,91). Exact reference gradient.
 */
export function heatRGB(t: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, t));
  const A: [number, number, number] = [214, 69, 69];
  const M: [number, number, number] = [240, 210, 110];
  const B: [number, number, number] = [46, 158, 91];
  const c = x < 0.5
    ? ([0, 1, 2] as const).map((i) => lerp(A[i], M[i], x / 0.5))
    : ([0, 1, 2] as const).map((i) => lerp(M[i], B[i], (x - 0.5) / 0.5));
  return [c[0], c[1], c[2]];
}

/**
 * heatStyle(t, alpha): a full CSS declaration string — a semi-transparent heat
 * fill blended toward the theme base, with the text colour auto-flipped to keep
 * contrast (white when the blended cell is dark, near-black otherwise). Matches
 * the reference exactly (dark base [26,26,25] α=.55, light [255,255,255] α=.7).
 */
export function heatStyle(t: number, alpha?: number): string {
  const c = heatRGB(t);
  const dark = isDark();
  const a = alpha ?? (dark ? 0.55 : 0.7);
  const base = dark ? [26, 26, 25] : [255, 255, 255];
  const bl = c.map((v, i) => v * a + base[i] * (1 - a));
  const L = (0.2126 * bl[0] + 0.7152 * bl[1] + 0.0722 * bl[2]) / 255;
  return `background:rgba(${c[0]},${c[1]},${c[2]},${a});color:${L < 0.55 ? '#fff' : '#111'};font-variant-numeric:tabular-nums;`;
}

/** rsColor(v): the 1..99 RS rating mapped onto the heat scale (reference). */
export function rsColor(v: number): string {
  return heatStyle((v - 1) / 98, isDark() ? 0.5 : 0.65);
}

/**
 * Build the `data-heat` style string for a cell the theme toggle can re-ink.
 * The reference stores heatRGB t on `data-heat` and re-applies heatStyle on
 * theme change; we surface t so callers set the attribute consistently.
 */
export function rsHeatT(v: number | null | undefined): number | undefined {
  if (v == null) return undefined;
  return (v - 1) / 98;
}
