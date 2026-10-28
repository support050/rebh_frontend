'use client';
/**
 * /breadth/custom — ★ Custom Dashboard (CR3 §2).
 * Koyfin / Deepvue-style 12-column grid of any widget from any page, ported
 * from the reference cd* block (pro_dashboard_template.html lines 658-713):
 * tabs, drag-reorder, ◧◨ width (3–12 cols), ▲▼ height, ⤢ maximize, 📷 PNG,
 * ✕ remove, + Add widget catalog (search · grouped), Present, Export / Import
 * layout JSON, Reset to the reference default layout.
 *
 * Persistence is per-account via GET/PUT/DELETE /api/rebh/breadth/dashboards
 * (table `user_dashboards`); localStorage `tb-custom` mirrors every save as the
 * offline fallback, exactly like the reference.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { BreadthView, PageHead, RangeToolbar, useHub } from '../_lib/BreadthView';
import { Stack, cloneSpec } from '../_engine/Stack';
import type { PanelDef } from '../_engine/types';
import { useBreadthStore } from '../_lib/store';
import { registerCatalog } from '../_lib/pageCatalog';
import { getWidget, widgetsByGroup, catalogSeriesKeys, type WidgetItem } from '../_lib/widgets';
import { exportNodePNG, exportPNG, downloadBlob } from '../_lib/exports';
import { OverviewKpis, FiveQuestions, LeadersCard } from '../page';
import { CanaryTable } from '../nhnl/page';
import { BpiKpis } from '../bpi/page';
import { WidgetCard } from '../widget/page';
import type { BreadthEventsCanaryItem } from '@/types/breadth';
import { API_BASE_URL } from '@/lib/api/config';
import { authFetch } from '@/lib/api/authFetch';

registerCatalog();

/* --------------------------- layout + state model --------------------------- */
/** Reference DEFAULT layout (template line 676), verbatim. */
const DEFAULT: WidgetItem[] = [
  { w: 'kpi:overview', c: 12 }, { w: 'q5', c: 12 }, { w: 'panel:overview:0', c: 8, h: 300 },
  { w: 'leaders:card', c: 4 }, { w: 'panel:overview:1', c: 6, h: 190 }, { w: 'panel:nhnl:3', c: 6, h: 190 },
  { w: 'panel:mcclellan:1', c: 6, h: 190 }, { w: 'panel:stockbee:2', c: 6, h: 190 }, { w: 'tbl:stockbee', c: 12 },
];
const WIDTHS = [3, 4, 6, 8, 9, 12];
const LS_KEY = 'tb-custom';

interface ST { dashboards: Record<string, WidgetItem[]>; current: string }

function loadLocal(): ST | null {
  try {
    const sv = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    if (sv && sv.dashboards && sv.dashboards[sv.current]) return sv;
  } catch { /* ignore */ }
  return null;
}

/* ------------------------------ API wrappers -------------------------------- */
const hdr = { Accept: 'application/json', 'Content-Type': 'application/json' };

async function apiList(): Promise<ST | null> {
  const res = await authFetch(`${API_BASE_URL}/api/rebh/breadth/dashboards`, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const j = (await res.json()) as { dashboards: { name: string; items: WidgetItem[] }[] };
  if (!j.dashboards?.length) return null;
  const dashboards: Record<string, WidgetItem[]> = {};
  j.dashboards.forEach((d) => { dashboards[d.name] = (d.items || []).map((x) => ({ w: x.w, c: x.c, h: x.h })); });
  const first = j.dashboards.find((d) => (d as { is_default?: boolean }).is_default)?.name ?? j.dashboards[0].name;
  return { dashboards, current: first };
}
const apiPut = (name: string, items: WidgetItem[], isDefault = false) =>
  authFetch(`${API_BASE_URL}/api/rebh/breadth/dashboards`, { method: 'PUT', headers: hdr, body: JSON.stringify({ name, items, is_default: isDefault }) }).catch(() => undefined);
const apiDelete = (name: string) =>
  authFetch(`${API_BASE_URL}/api/rebh/breadth/dashboards/${encodeURIComponent(name)}`, { method: 'DELETE', headers: { Accept: 'application/json' } }).then((r) => r.ok, () => false);

/* ------------------------------- panel widget -------------------------------- */
/** One chart-panel widget: a noctl Stack clone mounted on the page hub (ref cdRender make()). */
function PanelWidget({ id, h, onStack }: { id: string; h?: number; onStack: (s: Stack | null) => void }) {
  const hub = useHub();
  const ref = useRef<HTMLDivElement>(null);
  const spec = useMemo<PanelDef | null>(() => {
    const W = getWidget(id);
    if (!W || W.kind !== 'panel' || !W.panel) return null;
    const sp = cloneSpec(W.panel);
    if (h) sp.height = h;
    return sp;
  }, [id, h]);

  useEffect(() => {
    if (!hub || !ref.current || !spec) return;
    const st = new Stack(ref.current, hub, [spec], { noctl: true });
    onStack(st);
    return () => { st.destroy(); onStack(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hub, spec]);

  if (!spec) return <p className="note">error: panel spec missing</p>;
  return <div ref={ref} />;
}

/* -------------------------------- dom widgets ------------------------------- */
/** Live store.today for the Arabic read (reference summary:ar, template line 675). */
function SummaryAr() {
  const today = useBreadthStore((s) => s.today);
  if (!today) return <p className="note">not available</p>;
  const phrase =
    today.regime === 'Washout' ? 'تشبّع بيع تاريخي — أفضل سياق دخول'
      : today.regime === 'Weak' ? 'اتساع ضعيف بلا تشبّع بيع — الانتظار حتى Washout أو ثرست'
      : today.regime === 'Neutral' ? 'لا ميزة — حياد'
      : 'مشاركة صحية — الاتجاه مدعوم';
  return (
    <div style={{ direction: 'rtl', textAlign: 'right', fontSize: 14, lineHeight: 1.8 }}>
      <b>{today.date}</b> · Breadth Score <b>{today.score}</b> / 100 · النظام <b>{today.regime}</b> منذ {today.regime_since}
      <br />
      {phrase}
    </div>
  );
}

function WidgetTv() {
  const dates = useBreadthStore((s) => s.dates);
  const i = Math.max(0, dates.length - 1);
  if (!dates.length) return <p className="note">not available</p>;
  return <WidgetCard i={i} date={dates[i]} />;
}

function CanaryWidget() {
  const events = useBreadthStore((s) => s.events);
  const canary = ((events as { canary?: BreadthEventsCanaryItem[] } | null)?.canary) ?? [];
  return <CanaryTable episodes={canary} />;
}

/** Fallback for dom widgets whose source page renders inline (the reference
 *  dom() shows "not available" when the node is missing; we add the page link). */
function DomFallback({ page, path }: { page: string; path: string }) {
  return (
    <p className="note">
      not available yet — <Link href={path} style={{ color: 'var(--blue)', textDecoration: 'underline' }}>open the {page} page</Link> to load this element (it lives on that page).
    </p>
  );
}

const DOM_RENDERERS: Record<string, { el: React.ReactNode; link: [string, string] }> = {
  'kpi:overview': { el: <OverviewKpis />, link: ['Overview', '/breadth'] },
  q5: { el: <FiveQuestions />, link: ['Overview', '/breadth'] },
  'leaders:card': { el: <LeadersCard />, link: ['Overview', '/breadth'] },
  'summary:ar': { el: <SummaryAr />, link: ['Daily Read', '/breadth/summary'] },
  'widget:tv': { el: <WidgetTv />, link: ['Breadth Widget', '/breadth/widget'] },
  'tbl:canary': { el: <CanaryWidget />, link: ['New Highs / New Lows', '/breadth/nhnl'] },
  'kpi:bpi': { el: <BpiKpis />, link: ['Bullish Percent', '/breadth/bpi'] },
  'kpi:leaders': { el: <DomFallback page="Leaders & Trend Template" path="/breadth/leaders" />, link: ['Leaders', '/breadth/leaders'] },
  'tbl:leaders': { el: <DomFallback page="Leaders & Trend Template" path="/breadth/leaders" />, link: ['Leaders', '/breadth/leaders'] },
  'tbl:stockbee': { el: <DomFallback page="Stockbee Monitor" path="/breadth/stockbee" />, link: ['Stockbee', '/breadth/stockbee'] },
  theme: { el: <DomFallback page="Sectors" path="/breadth/sectors" />, link: ['Sectors', '/breadth/sectors'] },
  ranks: { el: <DomFallback page="Sectors" path="/breadth/sectors" />, link: ['Sectors', '/breadth/sectors'] },
  heat: { el: <DomFallback page="Sectors" path="/breadth/sectors" />, link: ['Sectors', '/breadth/sectors'] },
  'tbl:sigstats': { el: <DomFallback page="Signals & Regimes" path="/breadth/signals" />, link: ['Signals', '/breadth/signals'] },
  'tbl:signals': { el: <DomFallback page="Signals & Regimes" path="/breadth/signals" />, link: ['Signals', '/breadth/signals'] },
  'tbl:lib': { el: <DomFallback page="Classic breadth library" path="/breadth/library" />, link: ['Library', '/breadth/library'] },
  thr: { el: <DomFallback page="Thresholds & Method" path="/breadth/thresholds" />, link: ['Thresholds', '/breadth/thresholds'] },
};

/* --------------------------------- the page --------------------------------- */
const KEYS = Array.from(new Set([...catalogSeriesKeys(), 'tasi', 'new_highs', 'new_lows', 'advances', 'declines', 'up_from_open', 'down_from_open', 'up_on_volume', 'down_on_volume', 'up_x', 'down_x', 'bpi_status', 'stage1', 'stage2', 'stage3', 'stage4']));

function CustomBody() {
  const hub = useHub();
  const today = useBreadthStore((s) => s.today);
  const [st, setSt] = useState<ST>(() => loadLocal() ?? { dashboards: { 'My dashboard': DEFAULT.map((x) => ({ ...x })) }, current: 'My dashboard' });
  const [loaded, setLoaded] = useState(false);
  const [catalog, setCatalog] = useState(false);
  const [search, setSearch] = useState('');
  const [maxIdx, setMaxIdx] = useState(-1);
  const dragFrom = useRef<number | null>(null);
  const stacksRef = useRef<Record<number, Stack | null>>({});
  const nodesRef = useRef<Record<number, HTMLDivElement | null>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // server is the source of truth once it answers (signed-in); localStorage is
  // the offline mirror (reference behaviour)
  useEffect(() => {
    let live = true;
    apiList()
      .then((remote) => { if (live && remote) setSt(remote); })
      .finally(() => live && setLoaded(true));
    return () => { live = false; };
  }, []);

  const items = st.dashboards[st.current] ?? [];

  const setItems = useCallback(
    (next: (list: WidgetItem[]) => WidgetItem[]) => {
      setSt((cur) => {
        const list = next(cur.dashboards[cur.current] ?? []);
        const nv: ST = { ...cur, dashboards: { ...cur.dashboards, [cur.current]: list } };
        try { localStorage.setItem(LS_KEY, JSON.stringify(nv)); } catch { /* ignore */ }
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => void apiPut(nv.current, list), 800);
        return nv;
      });
    },
    [],
  );

  /* cd* actions — reference names in comments (template lines 694-712) */
  const cdSwitch = (name: string) => setSt((cur) => ({ ...cur, current: name }));
  const cdNew = () => {
    const n = window.prompt('Dashboard name');
    if (!n) return;
    setSt((cur) => {
      const nv = { dashboards: { ...cur.dashboards, [n]: [] }, current: n };
      try { localStorage.setItem(LS_KEY, JSON.stringify(nv)); } catch { /* ignore */ }
      void apiPut(n, []);
      return nv;
    });
  };
  const cdRename = () => {
    const n = window.prompt('New name', st.current);
    if (!n || n === st.current) return;
    setSt((cur) => {
      const nv: ST = { dashboards: { ...cur.dashboards, [n]: cur.dashboards[cur.current] }, current: n };
      delete nv.dashboards[cur.current];
      try { localStorage.setItem(LS_KEY, JSON.stringify(nv)); } catch { /* ignore */ }
      void apiPut(n, nv.dashboards[n]);
      void apiDelete(cur.current);
      return nv;
    });
  };
  const cdDup = () => {
    const n = window.prompt('Name of the copy', `${st.current} copy`);
    if (!n) return;
    const copy = items.map((x) => ({ w: x.w, c: x.c, h: x.h }));
    setSt((cur) => {
      const nv = { dashboards: { ...cur.dashboards, [n]: copy }, current: n };
      try { localStorage.setItem(LS_KEY, JSON.stringify(nv)); } catch { /* ignore */ }
      void apiPut(n, copy);
      return nv;
    });
  };
  const cdDelete = () => {
    const names = Object.keys(st.dashboards);
    if (names.length === 1) { alert('Keep at least one dashboard'); return; } // ref cdDelete
    if (!window.confirm(`Delete "${st.current}"?`)) return;
    const victim = st.current;
    const rest = names.filter((n) => n !== victim);
    setSt((cur) => {
      const nv: ST = { dashboards: { ...cur.dashboards }, current: rest[0] };
      delete nv.dashboards[victim];
      try { localStorage.setItem(LS_KEY, JSON.stringify(nv)); } catch { /* ignore */ }
      void apiDelete(victim);
      return nv;
    });
  };
  const cdReset = () => {
    if (!window.confirm('Reset this dashboard to the default layout?')) return;
    setItems(() => DEFAULT.map((x) => ({ ...x })));
  };
  const cdSize = (i: number, d: number) =>
    setItems((l) => l.map((it, k) => {
      if (k !== i) return it;
      const w = WIDTHS[Math.max(0, Math.min(WIDTHS.length - 1, WIDTHS.indexOf(it.c || 6) + d))];
      return { ...it, c: w };
    }));
  const cdH = (i: number, d: number) =>
    setItems((l) => l.map((it, k) => (k === i ? { ...it, h: Math.max(100, (it.h || 200) + d) } : it)));
  const cdRemove = (i: number) => setItems((l) => l.filter((_, k) => k !== i));
  const cdAdd = (id: string) => {
    const W = getWidget(id);
    setItems((l) => [...l, { w: id, c: W?.kind === 'panel' ? 6 : 12, h: W?.kind === 'panel' ? 200 : undefined }]);
    setCatalog(false);
    setTimeout(() => document.querySelectorAll('#cgrid .cw')[items.length]?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 60);
  };
  const cdPresent = () => document.body.classList.toggle('present');
  const cdExport = () => {
    const blob = new Blob([JSON.stringify({ name: st.current, items: items.map((x) => ({ w: x.w, c: x.c, h: x.h })) }, null, 1)], { type: 'application/json' });
    downloadBlob(blob, `breadth_dashboard_${st.current.replace(/[^a-z0-9]+/gi, '_')}.json`);
  };
  const cdImport = (file: File) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(String(r.result)) as { name?: string; items?: WidgetItem[] };
        const n = j.name || 'Imported';
        const list = (j.items || []).map((x) => ({ w: x.w, c: x.c, h: x.h }));
        setSt((cur) => {
          const nv = { dashboards: { ...cur.dashboards, [n]: list }, current: n };
          try { localStorage.setItem(LS_KEY, JSON.stringify(nv)); } catch { /* ignore */ }
          void apiPut(n, list);
          return nv;
        });
      } catch { alert('invalid file'); }
    };
    r.readAsText(file);
  };
  const cdPng = (i: number) => {
    if (!hub) return;
    const it = items[i];
    const W = getWidget(it.w);
    const title = W?.title ?? it.w;
    const stt = stacksRef.current[i];
    if (stt) exportPNG(hub, stt.exportPanels(), title, hub.todayDate || today?.date || '');
    else if (nodesRef.current[i]) exportNodePNG(hub, nodesRef.current[i]!, title, hub.todayDate || today?.date || '');
  };

  const groups = useMemo(() => widgetsByGroup(search), [search]);
  const maxWidget = maxIdx >= 0 ? items[maxIdx] : null;

  if (!loaded) return <p className="note">loading your dashboards…</p>;

  return (
    <div className="space-y-3">
      {/* #custom-bar (reference cdRender) — tabs + toolbar */}
      <div id="custom-bar" className="space-y-2">
        <div className="tabs">
          {Object.keys(st.dashboards).map((n) => (
            <span key={n} className={`tab${n === st.current ? ' active' : ''}`} onClick={() => cdSwitch(n)}>{n}</span>
          ))}
          <button className="btn" onClick={cdNew}>+ new</button>
          <button className="btn" onClick={cdRename}>rename</button>
          <button className="btn" onClick={cdDup}>duplicate</button>
          <button className="btn" onClick={cdDelete}>delete</button>
        </div>
        <div className="breadth-toolbar" style={{ flexWrap: 'wrap', gap: 6 }}>
          <button className="btn" style={{ background: 'var(--blue)', color: '#fff', borderColor: 'var(--blue)' }} onClick={() => setCatalog(true)}>+ Add widget</button>
          <span style={{ flex: 1 }} />
          <button className="btn" onClick={cdPresent}>⛶ Present</button>
          <button className="btn" onClick={cdExport}>⇩ Export layout</button>
          <label className="btn" style={{ display: 'inline-block' }}>
            ⇧ Import
            <input type="file" accept=".json" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) cdImport(f); }} />
          </label>
          <button className="btn" onClick={cdReset}>Reset</button>
        </div>
        <RangeToolbar />
        <p className="note">
          Drag a widget by its header to reorder · ◧ / ◨ change width (3–12 columns) · ▲ / ▼ change height ·
          ⤢ maximize · 📷 export PNG · ✕ remove. Everything here is any panel, table or card from any page;
          layouts are saved to <b>your REBH account</b> (table <code>user_dashboards</code>) and this browser.
        </p>
      </div>

      {/* .cgrid — 12-column grid (reference cdRender) */}
      <div className="cgrid" id="cgrid">
        {items.map((it, i) => {
          const W = getWidget(it.w);
          const title = W ? W.title : `${it.w} (missing)`;
          const isPanel = W?.kind === 'panel';
          return (
            <div
              key={`${it.w}-${i}`}
              className={`cw w${it.c || 6}`}
              draggable
              onDragStart={(e) => { dragFrom.current = i; (e.currentTarget as HTMLElement).style.opacity = '0.5'; e.dataTransfer.setData('text/plain', String(i)); }}
              onDragEnd={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
              onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('dragover');
                const from = Number(e.dataTransfer.getData('text/plain'));
                if (Number.isNaN(from) || from === i) return;
                setItems((l) => { const a = [...l]; const [m] = a.splice(from, 1); a.splice(i, 0, m); return a; });
              }}
            >
              <div className="cwh">
                ≡ <b title={title}>{title}</b>
                <button title="narrower" onClick={() => cdSize(i, -1)}>◧</button>
                <button title="wider" onClick={() => cdSize(i, 1)}>◨</button>
                {isPanel ? (
                  <>
                    <button title="shorter" onClick={() => cdH(i, -60)}>▲</button>
                    <button title="taller" onClick={() => cdH(i, 60)}>▼</button>
                    <button title="maximize" onClick={() => setMaxIdx(i)}>⤢</button>
                  </>
                ) : null}
                <button title="export PNG" onClick={() => cdPng(i)}>📷</button>
                <button title="remove" onClick={() => cdRemove(i)}>✕</button>
              </div>
              <div className="cwb" ref={(el) => { nodesRef.current[i] = el; }}>
                {isPanel ? (
                  <PanelWidget id={it.w} h={it.h} onStack={(s) => { stacksRef.current[i] = s; }} />
                ) : W?.kind === 'dom' ? (
                  DOM_RENDERERS[it.w]?.el ?? <p className="note">not available</p>
                ) : (
                  <p className="note">widget “{it.w}” is missing — open its page once, or remove it.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* + Add widget catalog modal (reference cdCatalog) */}
      {catalog ? (
        <>
          <div className="breadth-modal-dim" style={{ display: 'block' }} onClick={() => setCatalog(false)} />
          <div className="breadth-modal" style={{ display: 'block' }}>
            <div className="hd">
              <h3>Add a widget</h3>
              <input
                placeholder="search…"
                autoFocus
                style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="sp" />
              <button className="btn" onClick={() => setCatalog(false)}>✕ close</button>
            </div>
            {Object.entries(groups).map(([g, ws]) => (
              <div key={g}>
                <h2 style={{ fontSize: 13, margin: '10px 0 6px', color: 'var(--text)' }}>{g}</h2>
                <div className="cat">
                  {ws.map((w) => (
                    <div key={w.id} className="it" onClick={() => cdAdd(w.id)}>
                      <b>{w.title}</b>
                      <small>{w.kind === 'panel' ? 'chart panel' : 'table / cards'}</small>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* ⤢ widget maximize (reference cdMax → maximizePanel) */}
      {maxWidget && getWidget(maxWidget.w)?.kind === 'panel' ? (
        <>
          <div className="breadth-modal-dim" style={{ display: 'block' }} onClick={() => setMaxIdx(-1)} />
          <div className="breadth-modal" style={{ display: 'block' }}>
            <div className="hd">
              <h3>{getWidget(maxWidget.w)!.title}</h3>
              <span className="sp" />
              <button className="btn" onClick={() => setMaxIdx(-1)}>✕ close</button>
            </div>
            <PanelWidget id={maxWidget.w} h={Math.max(380, (typeof window !== 'undefined' ? window.innerHeight : 800) - 260)} onStack={() => undefined} />
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function CustomDashboardPage() {
  return (
    <BreadthView keys={KEYS}>
      <PageHead
        title="★ Custom Dashboard — your own grid of any widget from any page"
        note="Koyfin / Deepvue-style builder. Everything the reference dashboard shows (charts, tables, cards, the Arabic read) can be dropped here, arranged on a 12-column grid and saved to your account."
      />
      <CustomBody />
    </BreadthView>
  );
}
