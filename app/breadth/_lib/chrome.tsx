'use client';
/**
 * Breadth module chrome (CR3 §3/§4/§12): ⇩ Export menu · ⚙ Customize drawer ·
 * theme toggle · ▶ Guided tour · ? help. Ported from the CR3 reference header
 * (pro_dashboard_template.html lines 153-165), drawer (326-346) and tour
 * (715-766). Mounted once in app/breadth/layout.tsx INSIDE the .breadth-root
 * scope so every CSS variable resolves; acts on the page that published itself
 * into `activeHub` (the React analogue of the reference's global lookups).
 */
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api/config';
import { authFetch } from '@/lib/api/authFetch';
import { getActivePage } from './activeHub';
import { BREADTH_PAGES } from './pageMap';
import { DEFAULT_PREFS, prefsStore, applyPrefs, type BreadthPrefs } from './prefs';
import {
  exportAllJSON,
  exportCSV,
  exportPine,
  exportPagePNG,
  exportPDF,
  pagePanels,
} from './exports';

/* ------------------------------- theme ------------------------------------- */
/** Reference #theme (lines 164, 179, 767-770): data-theme on <html> + tb-theme. */
function useTheme(): [boolean, () => void] {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem('tb-theme');
    const isDark = () => document.documentElement.dataset.theme === 'dark' || document.documentElement.classList.contains('dark');
    if (stored === 'dark' || stored === 'light') applyTheme(stored === 'dark');
    setDark(isDark());
  }, []);
  const applyTheme = (on: boolean) => {
    const root = document.documentElement;
    root.dataset.theme = on ? 'dark' : 'light';
    root.classList.toggle('dark', on);
    localStorage.setItem('tb-theme', on ? 'dark' : 'light');
    setDark(on);
    // re-ink heat cells + repaint canvases (ref re-ink on toggle)
    reinkHeat();
    getActivePage()?.hub.drawAll();
  };
  return [dark, () => applyTheme(!dark)];
}

function reinkHeat(): void {
  // reference stores t on data-heat and re-applies heatStyle after a theme flip
  import('./heat').then(({ heatStyle }) => {
    document.querySelectorAll<HTMLElement>('[data-heat]').forEach((el) => {
      const t = parseFloat(el.dataset.heat || '');
      if (!Number.isNaN(t)) el.style.cssText += heatStyle(t, (el.dataset.heatalpha ? parseFloat(el.dataset.heatalpha) : undefined));
    });
  });
}

/* ------------------------------ export menu -------------------------------- */
const ExportMenu = React.memo(function ExportMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const act = (fn: () => void) => {
    setOpen(false);
    const ap = getActivePage();
    if (!ap) return;
    fn();
  };

  return (
    <span ref={ref} className={`breadth-menu${open ? ' open' : ''}`} id="exp-menu">
      <button className="btn" onClick={() => setOpen((o) => !o)}>⇩ Export ▾</button>
      {open ? (
        <div className="dd">
          <a onClick={() => act(() => void exportPagePNG(getActivePage()!.hub, getActivePage()!.el, getActivePage()!.pageName, getActivePage()!.hub.todayDate))}>
            📷 This page → PNG<small>every chart and table of the open page in one image</small>
          </a>
          <a onClick={() => act(() => exportPDF())}>
            🖨 This page → PDF<small>print dialog → “Save as PDF” (charts stay vector-sharp)</small>
          </a>
          <a onClick={() => act(() => { const ap = getActivePage()!; exportCSV(ap.hub, pagePanels(ap.hub, ap.el), ap.pageName); })}>
            ⇩ This page → CSV (TradingView layout)<small>time, open, high, low, close, volume + every series on the page, current range</small>
          </a>
          <a onClick={() => act(() => { const ap = getActivePage()!; exportPine(ap.hub, pagePanels(ap.hub, ap.el), ap.pageName, ap.hub.todayDate); })}>
            📈 This page → TradingView Pine Script<small>.pine indicator plotting the page’s series on TADAWUL:TASI</small>
          </a>
          <a onClick={() => act(() => void exportAllJSON(getActivePage()!.hub, getActivePage()!.hub.todayDate))}>
            {'{ }'} All data → JSON<small>every stored series (125+) incl. derived, current date axis</small>
          </a>
        </div>
      ) : null}
    </span>
  );
});

/* ------------------------------ ⚙ drawer ----------------------------------- */
const RANGES: [number | null, string][] = [
  [126, '6M'], [252, '1Y'], [504, '2Y'], [1260, '5Y'], [2520, '10Y'], [null, 'All'],
];

function CustomizeDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [, force] = useState(0);
  // The drawer is always mounted (CSS slides it off-screen), so its numeric
  // read-outs render during SSR too. prefsStore boots from localStorage on the
  // client only → gate on mounted so the first paint matches the server
  // (DEFAULT_PREFS) and avoids a hydration mismatch on P.font / P.chart ….
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return prefsStore.subscribe(() => force((x) => x + 1));
  }, []);
  const P = mounted ? prefsStore.prefs : DEFAULT_PREFS;
  const set = (patch: Partial<BreadthPrefs>) => prefsStore.set(patch);
  const pc = BREADTH_PAGES.filter((p) => p.id !== 'overview' && p.id !== 'custom');

  const exportSetup = async () => {
    let custom: unknown = null;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/rebh/breadth/dashboards`);
      if (res.ok) custom = await res.json();
    } catch { /* signed out — prefs+panels still export */ }
    const blob = new Blob(
      [JSON.stringify({ prefs: P, panels: prefsStore.ph, custom }, null, 1)],
      { type: 'application/json' },
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'breadth_setup.json';
    a.click();
  };

  const importSetup = (file: File) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(String(r.result));
        if (j.prefs) localStorage.setItem('tb-prefs', JSON.stringify(j.prefs));
        if (j.panels) localStorage.setItem('tb-ph', JSON.stringify(j.panels));
        if (j.custom?.dashboards) localStorage.setItem('tb-custom', JSON.stringify(j.custom));
        location.reload();
      } catch {
        alert('invalid file');
      }
    };
    r.readAsText(file);
  };

  return (
    <>
      {/* click-anywhere-outside closes the drawer (user request 2026-10-27) */}
      {open ? <div className="breadth-drawer-backdrop" onClick={onClose} /> : null}
      <div className={`breadth-drawer${open ? ' open' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h3>⚙ Customize</h3>
        <span style={{ flex: 1 }} />
        <button className="btn" onClick={onClose}>✕</button>
      </div>
      <h4>Size</h4>
      <div className="row">
        <label>Text size</label>
        <input type="range" min={0.8} max={1.4} step={0.05} value={P.font}
          onInput={(e) => set({ font: +(e.target as HTMLInputElement).value })} />
        <span>{Math.round(P.font * 100)}%</span>
      </div>
      <div className="row">
        <label>Chart height (new panels)</label>
        <input type="range" min={0.6} max={2} step={0.1} value={P.chart}
          onInput={(e) => { set({ chart: +(e.target as HTMLInputElement).value }); getActivePage()?.hub.relayout(); }} />
        <span>{P.chart}×</span>
      </div>
      <div className="row">
        <label>Line thickness</label>
        <input type="range" min={0.5} max={3} step={0.25} value={P.lw}
          onInput={(e) => set({ lw: +(e.target as HTMLInputElement).value })} />
        <span>{P.lw}×</span>
      </div>
      <div className="row">
        <label>Sidebar width</label>
        <input type="range" min={0} max={260} step={10} value={P.nav}
          onInput={(e) => set({ nav: +(e.target as HTMLInputElement).value })} />
        <span>{P.nav}px</span>
      </div>
      <div className="row">
        <label>Show legends</label>
        <input type="checkbox" checked={P.legend} onChange={(e) => { set({ legend: e.target.checked }); getActivePage()?.hub.relayout(); }} />
      </div>
      <div className="row">
        <label>RS column: heat colour + 30-day sparkline + Δ21d arrow</label>
        <input type="checkbox" checked={P.rscolor} onChange={(e) => { set({ rscolor: e.target.checked }); location.reload(); }} />
      </div>
      <div className="row">
        <label>Compact mode (tighter cards &amp; tables)</label>
        <input type="checkbox" checked={P.compact} onChange={(e) => set({ compact: e.target.checked })} />
      </div>
      <div className="row">
        <label>Reset every panel height / collapse</label>
        <button className="btn" onClick={() => { prefsStore.resetPanelSizes(); location.reload(); }}>reset</button>
      </div>
      <h4>Colours &amp; defaults</h4>
      <div className="row">
        <label>Up colour</label>
        <input type="color" value={P.up || '#1baf7a'} onInput={(e) => set({ up: (e.target as HTMLInputElement).value })} />
        <button className="btn" onClick={() => set({ up: '' })}>default</button>
      </div>
      <div className="row">
        <label>Down colour</label>
        <input type="color" value={P.down || '#e34948'} onInput={(e) => set({ down: (e.target as HTMLInputElement).value })} />
        <button className="btn" onClick={() => set({ down: '' })}>default</button>
      </div>
      <div className="row">
        <label>Default range</label>
        <select value={String(P.range)} onChange={(e) => {
          const v = e.target.value === 'null' ? null : +e.target.value;
          set({ range: v });
          getActivePage()?.hub.setRange(v);
        }}>
          {RANGES.map(([v, l]) => <option key={l} value={String(v)}>{l}</option>)}
        </select>
      </div>
      <div className="row">
        <label>Dashboard title</label>
        <input type="text" value={P.title} onChange={(e) => set({ title: e.target.value })} />
      </div>
      <div className="row">
        <label>TradingView export: bars</label>
        <select value={P.tvbars} onChange={(e) => set({ tvbars: +e.target.value })}>
          {[250, 500, 1000, 2000].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
      <h4>Pages in the sidebar</h4>
      {pc.map((p) => (
        <div className="row" key={p.id}>
          <label>{p.name}</label>
          <input type="checkbox" checked={!P.hidden.includes(p.id)}
            onChange={(e) => {
              const hidden = P.hidden.filter((x) => x !== p.id);
              if (!e.target.checked) hidden.push(p.id);
              set({ hidden });
            }} />
        </div>
      ))}
      <h4>Save / share my setup</h4>
      <div className="row">
        <button className="btn" onClick={() => void exportSetup()}>⇩ export setup</button>
        <label className="btn" style={{ display: 'inline-block' }}>
          ⇧ import
          <input type="file" accept=".json" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importSetup(f); }} />
        </label>
        <button className="btn" onClick={() => {
          localStorage.removeItem('tb-prefs');
          localStorage.removeItem('tb-ph');
          prefsStore.prefs = { ...DEFAULT_PREFS };
          prefsStore.ph = { h: {}, c: {} };
          location.reload();
        }}>reset all</button>
      </div>
      <p className="note">
        Everything here is saved to your REBH account (table <code>user_prefs</code>) and this browser, so it
        follows you across devices. Per-panel height (drag the bottom edge) and collapse state are remembered
        per chart.
      </p>
      </div>
    </>
  );
}

/* -------------------------------- tour ------------------------------------- */
interface TourStep { page: string; sel: string; title: string; text: string }

/** The 24-step guided tour — text ported verbatim from the reference TOUR array
 *  (template lines 715-755); selectors retargeted to the Next.js DOM. */
export const TOUR: TourStep[] = [
  { page: 'overview', sel: '.kpis', title: 'Welcome — how to read this dashboard', text: 'This is a market-breadth engine for TASI: it measures the health under the index, not the index itself. Start here: the Breadth Score (0–100) and the Regime (Washout · Weak · Neutral · Healthy · Strong) summarise everything. Use → / ← to move through the tour, Esc to leave.' },
  { page: 'overview', sel: '.kpis .kpi:nth-child(1)', title: 'Breadth Score', text: '⅓ participation (%>200DMA, %>50DMA, High-Low Index) + ⅓ advance/decline (McClellan, A/D line change) + ⅓ sectors (% healthy, median sector score). Every metric is ranked against its own last 5 years, so 80 means “top 20% of the last five years”. Weights were tested out-of-sample and equal weights won — nothing is fitted.' },
  { page: 'overview', sel: '.kpis .kpi:nth-child(2)', title: 'Regime', text: 'Bands 40/60/75 on a 5-day EMA of the score, with hysteresis (8 points, min 5 days) so it does not flip daily. Validated 2014–2026 walk-forward: Washout +2.4%/20d, Healthy/Strong consistently positive, Weak ≈ −0.2%/60d (the only regime below the market average).' },
  { page: 'overview', sel: '.kpis .kpi:nth-child(5)', title: 'Oversold overlay', text: 'Kept outside the score on purpose. It averages TRIN-10, the 4% up/down ratio, panic-day share, a recent 95% down day and a recent thrust. Overlay ≥ 75 while the score ≤ 45 = Washout — historically the best entry context on TASI.' },
  { page: 'overview', sel: '.kpis .kpi:nth-child(7)', title: 'Trend Template & leaders (Minervini)', text: 'How many stocks pass Minervini’s 8-point trend template, plus today’s new 52-week highs on volume. A low number means the market is not rewarding trend-following, whatever the index does. The card on the left lists the leaders by RS rating; click a symbol for its chart or open the Leaders page for the full, sortable screener.' },
  { page: 'overview', sel: '.kpis .kpi:nth-child(6)', title: 'NH / NL and the canary alert', text: 'The card turns orange when the 5-day NH−NL sum passes 60% of the TASI canary threshold (“near canary”) and red when an episode is active. The threshold is shown in absolute terms (−75% of the eligible universe) so you can see how far away it is.' },
  { page: 'overview', sel: '.q', title: 'The five questions', text: 'Each row answers one question the engine was built for: participation, direction, confirmation, extremes/thrust, and the final verdict. The right column is the one-word answer; the middle column shows the numbers behind it.' },
  { page: 'overview', sel: '#ov-leaders', title: 'Leaders card', text: 'Top names passing the trend template, ranked by RS (1–99, IBD-style: 2×3M + 6M + 9M + 12M return ranked across the universe), with distance from the 52-week high and relative volume. This is the bridge from “how healthy is the market” to “which stocks are leading it”.' },
  { page: 'custom', sel: '#custom-bar', title: '★ Custom Dashboard — build your own', text: 'Koyfin / Deepvue-style: any chart panel, table or card from any page can be added here as a widget. Drag by the header to reorder, ◧ ◨ for width (3–12 columns), ▲ ▼ for height, ⤢ to maximize, 📷 to export a PNG, ✕ to remove. Keep several dashboards (tabs), export / import them as JSON, and press Present for a clean full-screen view. Every chart on every page also has its own ⤢ maximize, − collapse, drag-to-resize handle at its bottom edge, and the stack has ⛶ fullscreen and 📷 PNG.' },
  { page: 'widget', sel: '#w-widget', title: 'Market Breadth widget — its own page', text: 'The classic at-a-glance panel: New Highs vs New Lows (52-week), Advance vs Decline, Up vs Down from the open, Up vs Down on above-average volume (volume > prior 20-day average), Up 4% vs Down 4% (with volume above the prior day), and the Weinstein stage split with its history. Blue = bulls ≥ 50%, magenta = bears. Hover any chart on the right and the widget re-renders for that day.' },
  { page: 'widget', sel: '#w-stack', title: 'History of every gauge', text: 'Each gauge as a daily share (grey) with its 10-day average (coloured) — the 50% line is the bull/bear divide. The bottom panel switches between Weinstein’s daily proxy and his original weekly 30-week-MA stages.' },
  { page: 'leaders', sel: '#p-leaders .kpis', title: 'Leaders & Trend Template', text: 'Template pass count, new 52-week highs on volume, and Stage-2 share on daily vs weekly bars. Below: the leaders table, the new-highs-on-volume list and a screener of every active stock — every table sorts by column, filters, exports to CSV, and a click on the symbol opens the stock chart with MA50/150/200, volume and the RS line vs TASI.' },
  { page: 'overview', sel: '#p-overview .breadth-panel:nth-child(1)', title: 'Index panel — how to read the marks', text: 'Coloured strip under the price = regime history (green Healthy/Strong, grey Neutral, orange Weak, violet Washout). Red shading = NH−NL canary episodes. Triangles: ▲ Zweig thrust (aqua), ▲ %>50DMA thrust (blue), ▼ 95% down day (red). Zoom in and the line becomes candles.' },
  { page: 'overview', sel: '#exp-menu', title: 'Export anything', text: 'The ⇩ Export menu exports the open page as PNG, PDF (print → Save as PDF), CSV in TradingView’s layout (time, OHLCV + every series), a TradingView Pine Script indicator that plots the page’s series on TADAWUL:TASI, or the whole DATA object as JSON. Every single chart also has its own 📷 / CSV / TV buttons on hover.' },
  { page: 'overview', sel: '#settings-btn', title: '⚙ Customize everything', text: 'Text size, chart height, line thickness, sidebar width, legends, compact mode, up/down colours, default range, the dashboard title, which pages show in the sidebar — and you can export your whole setup (preferences + panel sizes + custom dashboards) as one JSON file to reuse on another computer.' },
  { page: 'overview', sel: '.breadth-toolbar', title: 'Navigation on every chart', text: 'Range buttons set the window. Drag to pan, mouse-wheel to zoom around the cursor, hover for a crosshair with the value of every panel on that day. All panels of a page stay synchronised.' },
  { page: 'nhnl', sel: '#p-nhnl .note', title: 'New Highs / New Lows — Hisham Naser’s canary', text: 'His rule: NH−NL below zero for 5 consecutive days and a 5-day sum ≤ −180/−200 → raise caution; the episode ends only after 5 consecutive positive days. On TASI the threshold is −75% of the eligible universe (same rarity: 15 episodes in 20 years).' },
  { page: 'nhnl', sel: '#p-nhnl .breadth-stack .breadth-panel:nth-child(4)', title: '5-day sum vs the canary line', text: 'When the red histogram pierces the dashed canary line after 5 negative days, an episode starts (shaded). On TASI the average max drawdown inside an episode is ≈ −11% and 12/15 episodes fell ≥ 3% — but the episode usually ends above its start, because extreme readings arrive late here. Treat it as a risk flag, not an exit.' },
  { page: 'nhnl', sel: '#p-nhnl .tblwrap', title: 'Episode table', text: 'Same columns as Hisham’s US table: start/end closes, % change, trading days, max reading, lowest low and max drawdown. Compare: US average −11.3% end-to-end; TASI +2.3% end-to-end but −11% max drawdown.' },
  { page: 'mcclellan', sel: '#p-mcclellan .breadth-stack .breadth-panel:nth-child(2)', title: 'McClellan Oscillator', text: 'Ratio-adjusted: 1000·(A−D)/(A+D), EMA19 − EMA39. TASI extremes are wider than the US (±85 at the 5/95th percentiles, ±105 at 2/98). Below −100 has been an oversold bounce (+4.4%/60d); above +100 an exhaustion zone (−1.4%/60d). The zero line matters: positive vs negative separates +1.8% from +1.1% over 60 days.' },
  { page: 'ma', sel: '#p-ma .breadth-stack .breadth-panel:nth-child(2)', title: '% above 200 DMA — the most reliable participation gauge', text: 'Hisham’s bands: 80 = optimism peak, 20 = pessimism peak. TASI adds a twist found in the walk-forward: the 60–80 band is the topping zone (−2.9%/60d, 39% hit) while >80 is the best state (+5.5%, 82% hit, 3% false signals) and <20 is a washout bounce. Broad-but-not-broad-enough after a long rally is the danger, not extreme breadth.' },
  { page: 'sectors', sel: '#p-sectors .tblwrap', title: 'Sector heatmap — click to drill down', text: 'Each industry group gets a health score (mean of %>50DMA, %>200DMA, normalised NH−NL and 10-day A/(A+D)). Green ≥ 60 healthy, red ≤ 40 weak. When 50–70% of sectors are healthy the market averaged +3.8% over 60 days (82% hit); a median above 75 has been exhaustion.' },
  { page: 'signals', sel: '#p-signals .tblwrap', title: 'Every rule judged by its own record', text: 'One row per rule: independent signal count, mean forward return and hit rate at 20/60/120 days, the horizon on which it is valid, and its status (scored · indicative · tested-no-edge · dropped). Rows with fewer than 30 events are flagged — they are not proof.' },
  { page: 'thr', sel: '#p-thr .tblwrap', title: 'Method in one screen — and you are done', text: 'Universe, adjustments, scoring, regimes and validation are summarised here. Press Esc to close, or restart the tour any time from the header.' },
];

const PAGE_PATH: Record<string, string> = Object.fromEntries(BREADTH_PAGES.map((p) => [p.id, p.path]));

/** Controlled tour: parent bumps `startTick` to (re)open at step 0. */
function GuidedTour({ startTick }: { startTick: number }) {
  const router = useRouter();
  const [step, setStep] = useState(-1);
  const [box, setBox] = useState<{ left: number; top: number } | null>(null);
  const hlRef = useRef<HTMLElement | null>(null);

  const stop = () => {
    hlRef.current?.classList.remove('tour-hl');
    hlRef.current = null;
    setStep(-1);
    setBox(null);
  };

  const position = (i: number) => {
    const st = TOUR[i];
    const el = document.querySelector<HTMLElement>(st.sel);
    hlRef.current?.classList.remove('tour-hl');
    hlRef.current = el;
    if (el) {
      el.classList.add('tour-hl');
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    setTimeout(() => {
      if (!el) { setBox({ left: window.innerWidth / 2 - 190, top: window.innerHeight * 0.2 }); return; }
      const r = el.getBoundingClientRect();
      let left = r.right + 14;
      let top = r.top;
      if (left + 380 > window.innerWidth - 10) { left = Math.max(10, r.left); top = r.bottom + 12; }
      if (top + 260 > window.innerHeight - 10) top = Math.max(10, window.innerHeight - 270);
      setBox({ left: Math.max(10, left), top });
    }, 350);
  };

  const go = (i: number) => {
    if (i < 0 || i >= TOUR.length) return stop();
    const st = TOUR[i];
    const onPage = PAGE_PATH[st.page] && PAGE_PATH[st.page].replace(/\/$/, '') === location.pathname.replace(/\/$/, '');
    setStep(i);
    if (!onPage && PAGE_PATH[st.page]) {
      // ref tourGo: switch(page) then position on the next tick
      router.push(PAGE_PATH[st.page]);
      setTimeout(() => position(i), 700);
      return;
    }
    position(i);
  };

  // (re)open on demand
  useEffect(() => { if (startTick > 0) go(0); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [startTick]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (step < 0) return;
      if (e.key === 'Escape') stop();
      else if (e.key === 'ArrowRight') go(step + 1);
      else if (e.key === 'ArrowLeft') go(step - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (step < 0) return null;
  const st = TOUR[step];
  return (
    <>
      <div className="breadth-tour-dim" onClick={stop} />
      <div className="breadth-tour" style={{ left: box?.left ?? '50%', top: box?.top ?? '20%' }}>
        <div className="step">Step {step + 1} of {TOUR.length} · {BREADTH_PAGES.find((p) => p.id === st.page)?.name ?? ''}</div>
        <h4>{st.title}</h4>
        <div>{st.text}</div>
        <div className="btns">
          <button className="btn" onClick={() => go(step - 1)} disabled={step === 0}>← Back</button>
          <button className="btn" style={{ background: 'var(--blue)', color: '#fff', borderColor: 'var(--blue)' }} onClick={() => go(step + 1)}>
            {step === TOUR.length - 1 ? 'Finish' : 'Next →'}
          </button>
          <span className="sp" style={{ flex: 1 }} />
          <button className="btn" onClick={stop}>Skip</button>
        </div>
      </div>
    </>
  );
}

/* ------------------------------ root chrome -------------------------------- */
export default function BreadthChrome() {
  const [drawer, setDrawer] = useState(false);
  const [tourTick, setTourTick] = useState(0);
  const [dark, toggleTheme] = useTheme();

  // first visit: offer the tour once (ref tb-toured)
  useEffect(() => {
    applyPrefs();
    void prefsStore.hydrate();
    if (!localStorage.getItem('tb-toured')) {
      localStorage.setItem('tb-toured', '1');
      setTourTick((t) => t + 1);
    }
  }, []);

  return (
    <>
      <div id="breadth-chrome-bar" className="flex items-center gap-2 flex-wrap px-3 sm:px-4 pt-3 max-w-[1400px] mx-auto w-full">
        <button
          className="btn"
          id="tour-btn"
          style={{ background: 'var(--blue)', color: '#fff', borderColor: 'var(--blue)' }}
          onClick={() => setTourTick((t) => t + 1)}
        >
          ▶ Guided tour
        </button>
        <span style={{ flex: 1 }} />
        <ExportMenu />
        <button className="btn" id="settings-btn" onClick={() => setDrawer((o) => !o)}>⚙ Customize</button>
        <button className="btn" id="theme" onClick={toggleTheme}>{dark ? 'Light theme' : 'Dark theme'}</button>
        <span
          className="breadth-help"
          title="start the guided tour"
          onClick={() => setTourTick((t) => t + 1)}
        >
          ?
        </span>
      </div>
      <CustomizeDrawer open={drawer} onClose={() => setDrawer(false)} />
      <GuidedTour startTick={tourTick} />
    </>
  );
}
