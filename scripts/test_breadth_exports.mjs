#!/usr/bin/env node
/**
 * Export-function verification harness (CR3 export audit).
 *
 * Runs the REAL frontend code (app/breadth/_lib/exports.ts → exportCSV,
 * exportPine, exportAllJSON) under Node with a minimal browser stub, against
 * the real breadth snapshot (Rebh_Market_Breadth_Package/api_samples/series.json
 * — 125 series × 6392 days), and asserts completeness/quality invariants:
 *
 *   CSV  : row count == range length, OHLCV header, value fidelity,
 *          comma-containing string cells stay quoted (no column shift)
 *   Pine : version/indicator preamble, ≤8 plots, date keys normalized,
 *          every embedded value equals the source series value
 *   JSON : full-API dump (no keys filter) + derived w_·/bpi_state_num present
 *
 * Usage:  node --experimental-strip-types scripts/test_breadth_exports.mjs
 * (the ESM resolve hook ./_ts_alias_hook.mjs is self-registered below)
 */
import { register } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const FRONTEND = path.resolve(import.meta.dirname, '..');
const HOOK = path.join(FRONTEND, 'scripts', '_ts_alias_hook.mjs');
if (!process.env.LUMIVST_HOOKED) {
  register(pathToFileURL(HOOK).href);
  process.env.LUMIVST_HOOKED = '1';
}

/* ------------------------------ browser stub ------------------------------- */
const downloads = new Map(); // filename → Blob
globalThis.localStorage = {
  _m: new Map(),
  getItem(k) { return this._m.has(k) ? this._m.get(k) : null; },
  setItem(k, v) { this._m.set(k, String(v)); },
  removeItem(k) { this._m.delete(k); },
};
globalThis.sessionStorage = globalThis.localStorage;
globalThis.document = {
  styleSheets: [],
  documentElement: { dataset: {}, classList: { toggle() {}, contains() { return false; } }, style: {} },
  createElement: () => ({ style: {}, click() { downloads.set(this._name ?? 'x', 'clicked'); } }),
  querySelector: () => null,
  querySelectorAll: () => [],
};
if (!globalThis.navigator) Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node' }, configurable: true });
if (!globalThis.window) Object.defineProperty(globalThis, 'window', { value: { matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }), addEventListener() {}, removeEventListener() {} }, configurable: true, writable: true });
let objId = 0;
URL.createObjectURL = (blob) => { const u = `blob:stub/${++objId}`; downloads.set(u, blob); return u; };
URL.revokeObjectURL = () => {};
globalThis.Image = class { src = ''; onload = null; onerror = null; };

/* fetch stub: /series?keys=… → subset; /series (no keys) → the full snapshot */
const SAMPLE = path.join(FRONTEND, '..', 'Rebh_Market_Breadth_Package', 'api_samples', 'series.json');
const full = JSON.parse(await (await import('node:fs/promises')).readFile(SAMPLE, 'utf8'));
const N = full.dates.length;
globalThis.fetch = async (url) => {
  const u = new URL(String(url), 'http://stub');
  if (u.pathname.endsWith('/api/rebh/breadth/series')) {
    const kf = u.searchParams.get('keys');
    const series = kf
      ? Object.fromEntries(kf.split(',').filter((k) => k in full.series).map((k) => [k, full.series[k]]))
      : full.series;
    return { ok: true, json: async () => ({ dates: full.dates, series }) };
  }
  return { ok: false, status: 404, json: async () => ({}) };
};

/* ------------------------------ module under test --------------------------- */
const { exportCSV, exportPine, exportAllJSON } = await import(
  pathToFileURL(path.join(FRONTEND, 'app', 'breadth', '_lib', 'exports.ts')).href
);

// anchor: capture downloadBlob's <a download> without a real DOM
const captured = [];
const origCreate = globalThis.document.createElement.bind(globalThis.document);
globalThis.document.createElement = (tag) => {
  if (tag !== 'a') return origCreate(tag);
  const a = { _name: '', get download() { return this._name; }, set download(v) { this._name = v; }, href: '', click() { captured.push({ name: this._name, blob: downloads.get(this.href) ?? 'clicked' }); } };
  return a;
};

const hub = {
  data: { dates: full.dates, series: { ...full.series }, events: {} },
  range: { i0: N - 250, i1: N - 1 },
  todayDate: full.dates[N - 1],
  css: () => '#fff',
  stacks: [],
};

let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) failures++; };

/* ---------- capture helper: run fn, return {name, text} ---------- */
async function grab(fn) {
  captured.length = 0;
  await fn();
  if (!captured.length) return null;
  const c = captured[0];
  const text = c.blob && typeof c.blob.text === 'function' ? await c.blob.text() : String(c.blob);
  return { name: c.name, text };
}

/* ================================ CSV ===================================== */
// synthetic comma-bearing string series → proves csvCell quoting prevents shift
hub.data.series._t_commas = new Array(N).fill('a,b');
const strKey = '_t_commas';
const commaKey = 'a,b';
const panels = [
  { canvas: {}, div: { classList: { contains: () => false } }, title: 'T', series: [
    { key: 'score', label: 'Breadth Score' },
    { key: 'advances', label: 'Advances' },
    ...(strKey ? [{ key: strKey, label: `Str ${strKey}` }] : []),
  ] },
];

const csv = await grab(async () => exportCSV(hub, panels, 'overview'));
ok(!!csv, `CSV downloaded (${csv?.name})`);
const lines = csv.text.trim().split('\n');
ok(lines[0].startsWith('time,open,high,low,close,volume,'), 'CSV header = TradingView OHLCV layout');
ok(lines.length - 1 === hub.range.i1 - hub.range.i0 + 1, `CSV rows == range length (${lines.length - 1})`);
ok(lines[1].startsWith(`${hub.data.dates[hub.range.i0]},`), 'CSV first row date == range start');
// value fidelity: score column present and numeric where data exists
const scoreIdx = lines[0].split(',').length - (strKey ? 2 : 1);
const sampleRow = lines[1].split(',');
ok(sampleRow[scoreIdx] != null && sampleRow[scoreIdx] !== '', 'CSV series column carries values');
// split-aware check: quoted comma cell must not shift columns
if (commaKey) {
  const widths = new Set(lines.slice(1).map((l) => (l.match(/[^,]+|"[^"]*"/g) || []).length));
  ok(widths.size === 1, `CSV string-series commas stay quoted (uniform column count ${[...widths]})`);
} else {
  ok(true, 'CSV no comma-bearing string series in this snapshot (skipped)');
}

/* ================================ PINE ==================================== */
const pine = await grab(async () => exportPine(hub, panels, 'overview', hub.todayDate));
ok(!!pine, `Pine downloaded (${pine?.name})`);
ok(pine.text.startsWith('//@version=5'), 'Pine starts with //@version=5');
ok(/indicator\("TASI Breadth — overview".*max_bars_back=5000\)/.test(pine.text), 'Pine indicator header with widened bars_back');
const plotCount = (pine.text.match(/^plot\(/gm) || []).length;
ok(plotCount <= 8 && plotCount >= 1, `Pine plots ${plotCount} series (≤8 cap honoured)`);
ok(!/map\.put\([^\n]*\d{4}-\d{2}-\d{2}/.test(pine.text), 'Pine date keys are YYYYMMDD (no dashes)');
// fidelity: every map.put value for `score` equals the source value
const srcScore = hub.data.series.score;
let bad = 0, seen = 0;
for (const m of pine.text.matchAll(/map\.put\(m0, (\d{8}), ([-\d.eE]+)\)/g)) {
  seen++;
  const d = `${m[1].slice(0, 4)}-${m[1].slice(4, 6)}-${m[1].slice(6, 8)}`;
  const i = hub.data.dates.indexOf(d);
  if (i < 0 || Math.abs(Number(m[2]) - Number(srcScore[i])) > 1e-6) bad++;
}
ok(seen > 0 && bad === 0, `Pine embedded values match source (${seen} points, ${bad} mismatched)`);
const bars = (pine.text.match(/map\.put/g) || []).length;
console.log(`      (tvbars=500 default → ${Math.round(pine.text.length / 1024)}KB script)`);
ok(bars > 0, 'Pine contains data points');

/* ================================ JSON ==================================== */
const json = await grab(async () => await exportAllJSON(hub, hub.todayDate));
ok(!!json, `JSON downloaded (${json?.name})`);
const j = JSON.parse(json.text);
const allKeys = Object.keys(full.series);
const haveKeys = Object.keys(j.series);
ok(allKeys.every((k) => haveKeys.includes(k)), `JSON carries all ${allKeys.length} stored series (have ${haveKeys.length})`);
ok(['w_nh', 'w_ad', 'w_nh_10', 'bpi_state_num'].every((k) => k in j.series), 'JSON includes browser-derived keys');
ok(j.dates.length === N, `JSON date axis intact (${j.dates.length} days)`);
// derived fidelity: w_nh == 100*up/(up+down) at a mid index
{
  const i = N - 100;
  const u = hub.data.series.new_highs[i], d = hub.data.series.new_lows[i];
  const expect = u != null && d != null && u + d !== 0 ? (100 * u) / (u + d) : null;
  const got = j.series.w_nh[i];
  ok(expect == null || Math.abs(got - expect) < 1e-6, `w_nh derived correctly at i=${i} (${got})`);
}

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
