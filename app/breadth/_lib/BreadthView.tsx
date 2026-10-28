'use client';
/**
 * Breadth view harness — wires the zustand store to the canvas engine.
 *
 * <BreadthView keys={[...]}> boots the data, creates ONE ChartHub for the page
 * (so every stack shares hover/pan/zoom like the reference dashboard's global
 * `stacks[]`), and exposes it via context. <StackMount> attaches a panel column
 * to that hub; <RangeToolbar> drives the shared 6M/1Y/…/All window.
 *
 * The `.breadth-root` scope div is what the engine resolves CSS variables from,
 * so a page only needs to wrap its content in <BreadthView> to get the theme.
 */
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import '../breadth.css';
import { ChartHub, Stack } from '../_engine/Stack';
import { applyDerived } from '../_engine/derive';
import type { PanelDef, StackOptions } from '../_engine/types';
import type { DataSource } from '../_engine/types';
import { useBreadthStore } from './store';
import { pageByPath } from './pageMap';
import { registerPanelWidget } from './widgets';
import { applyPrefs, getPrefs, prefsStore } from './prefs';
import { setActivePage } from './activeHub';

const HubCtx = createContext<ChartHub | null>(null);
export const useHub = (): ChartHub | null => useContext(HubCtx);

const RANGES: [number | null, string][] = [
  [126, '6M'],
  [252, '1Y'],
  [504, '2Y'],
  [1260, '5Y'],
  [2520, '10Y'],
  [null, 'All'],
];

export function BreadthView({
  keys,
  children,
  className = '',
}: {
  keys: string[];
  children: React.ReactNode;
  className?: string;
}) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const [hub, setHub] = useState<ChartHub | null>(null);

  const pathname = usePathname();
  const page = useMemo(() => pageByPath(pathname), [pathname]);

  const load = useBreadthStore((s) => s.load);
  const status = useBreadthStore((s) => s.status);
  const error = useBreadthStore((s) => s.error);
  const dates = useBreadthStore((s) => s.dates);
  const series = useBreadthStore((s) => s.series);
  const events = useBreadthStore((s) => s.events);
  const today = useBreadthStore((s) => s.today);

  // request only what this page draws (store merges + caches across pages)
  const keySig = keys.join(',');
  useEffect(() => {
    load(keySig.split(',').filter(Boolean));
  }, [keySig, load]);

  const data = useMemo<DataSource | null>(() => {
    if (!dates.length || !Object.keys(series).length) return null;
    // shallow-clone so the browser-derived gauges (w_*, bpi_state_num) never
    // mutate the shared store slice; applyDerived is a no-op for pages that
    // don't pull the base keys.
    const merged = { ...series };
    applyDerived(merged);
    return { dates, series: merged, events: (events as unknown as DataSource['events']) || {} };
  }, [dates, series, events]);

  // create the hub once the scope node + first data slice are both ready.
  // Page identity comes from the route (widget ids + PH keys); every panel
  // self-registers into the ★ Custom Dashboard catalog via registerPanelWidget.
  useEffect(() => {
    if (data && scopeRef.current && !hub) {
      setHub(
        new ChartHub(data, scopeRef.current, {
          pageId: page?.id ?? '',
          pageName: page?.name ?? '',
          todayDate: today?.date,
          registerWidget: (id, title, group, panel) => registerPanelWidget(id, title, group, panel),
        }),
      );
    }
  }, [data, hub, page, today?.date]);

  // feed newer snapshots into the live hub
  useEffect(() => {
    if (hub && data) hub.setData(data);
  }, [hub, data]);

  // CR3 §4: boot prefs from localStorage (constructor did), reconcile with the
  // server, and re-apply on every change; the hub re-scales panels live.
  useEffect(() => {
    applyPrefs();
    void prefsStore.hydrate();
    return prefsStore.subscribe(() => {
      applyPrefs();
      hub?.relayout();
    });
  }, [hub]);

  // CR3 §3: publish this page so the layout-level Export/Drawer/Tour chrome can
  // act on the live hub (reference `activePage()`).
  useEffect(() => {
    const el = scopeRef.current;
    if (hub && el && page) {
      setActivePage({ hub, el, pageId: page.id, pageName: page.name });
      return () => setActivePage(null);
    }
    return undefined;
  }, [hub, page]);

  useEffect(() => () => hub?.destroy(), [hub]);

  return (
    <div ref={scopeRef} id={page ? `p-${page.id}` : undefined} className={`breadth-root ${className}`}>
      {status === 'error' ? (
        <div className="breadth-error">Failed to load breadth data — {error}</div>
      ) : null}
      <HubCtx.Provider value={hub}>{children}</HubCtx.Provider>
    </div>
  );
}

/** Mount a column of canvas panels onto the page hub. `panels` must be a stable ref. */
export function StackMount({ panels, opts }: { panels: PanelDef[]; opts?: StackOptions }) {
  const hub = useHub();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hub || !ref.current) return;
    const stack = new Stack(ref.current, hub, panels, opts);
    return () => stack.destroy();
  }, [hub, panels, opts]);

  return <div ref={ref} style={{ opacity: hub ? 1 : 0, transition: 'opacity .2s' }} />;
}

/** Page title + explanatory note (LTR), styled off the theme variables. */
export function PageHead({ title, note }: { title: string; note?: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{title}</h1>
      {note ? <p className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>{note}</p> : null}
    </div>
  );
}

/**
 * Chart-only page scaffold: theme + data boot, title/note, the shared range
 * toolbar, and one stack of canvas panels. `panels` must be a stable
 * (module-scope) reference. Pass `extra` for KPI rows / tables above the chart.
 */
export function ChartPage({
  title,
  note,
  keys,
  panels,
  extra,
}: {
  title: string;
  note?: React.ReactNode;
  keys: string[];
  panels: PanelDef[];
  extra?: React.ReactNode;
}) {
  return (
    <BreadthView keys={keys}>
      <div className="space-y-3">
        <PageHead title={title} note={note} />
        {extra}
        <RangeToolbar />
        <StackMount panels={panels} />
      </div>
    </BreadthView>
  );
}

/** Shared range control — drives every stack on the hub at once. */
export function RangeToolbar() {
  const hub = useHub();
  const [active, setActive] = useState<number | null>(() => getPrefs().range ?? 500);
  if (!hub) return <div className="breadth-toolbar" />;
  return (
    <div className="breadth-toolbar">
      <span className="lbl">Range</span>
      {RANGES.map(([d, l]) => (
        <button
          key={l}
          className={`btn${active === d ? ' active' : ''}`}
          onClick={() => {
            setActive(d);
            prefsStore.set({ range: d });
            hub.setRange(d);
          }}
        >
          {l}
        </button>
      ))}
      <span className="hint">drag to pan · wheel to zoom · hover for values</span>
    </div>
  );
}
