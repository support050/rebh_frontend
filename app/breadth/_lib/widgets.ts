/**
 * Widget registry for the CR3 ★ Custom Dashboard.
 *
 * Mirrors the reference `WIDGETS` map + `regWidget` (template lines 208-209,
 * 658-675): every catalogued element is `{id,title,kind,group,...}`. Two kinds:
 *   - 'panel' : a single chart panel, identified by `panel:${pageId}:${k}`. It
 *               carries the PanelDef so the dashboard can re-mount it against
 *               its OWN ChartHub (a fresh Stack, noctl). Registered eagerly from
 *               `_lib/pageCatalog` (all pages, without visiting them) and again
 *               by Stack when a page mounts — first registration wins.
 *   - 'dom'   : a live element (Arabic read, breadth gauges, headline cards…).
 *               The dashboard renders these with a React component keyed by id.
 */
import type { PanelDef } from '../_engine/types';
import { isDerivedKey } from '../_engine/derive';

export interface WidgetItem {
  w: string;
  /** grid column span (3/4/6/8/9/12) */
  c?: number;
  /** panel height in px (panel widgets only) */
  h?: number;
}

export interface WidgetDef {
  id: string;
  title: string;
  kind: 'panel' | 'dom';
  group: string;
  /** panel widgets carry their definition for re-mounting */
  panel?: PanelDef;
}

const REG = new Map<string, WidgetDef>();

export function registerPanelWidget(id: string, title: string, group: string, panel: PanelDef): void {
  if (!REG.has(id)) REG.set(id, { id, title, kind: 'panel', group, panel });
}

export function registerDomWidget(id: string, title: string, group: string): void {
  if (!REG.has(id)) REG.set(id, { id, title, kind: 'dom', group });
}

/** Low-level register used by the imperative Stack path (kept for parity). */
export function registerWidget(def: WidgetDef): void {
  if (!REG.has(def.id)) REG.set(def.id, def);
}

export function getWidget(id: string): WidgetDef | undefined {
  return REG.get(id);
}

export function allWidgets(search = ''): WidgetDef[] {
  const q = search.trim().toLowerCase();
  const list = [...REG.values()];
  return q ? list.filter((w) => `${w.title} ${w.group} ${w.id}`.toLowerCase().includes(q)) : list;
}

export function widgetsByGroup(search = ''): Record<string, WidgetDef[]> {
  const groups: Record<string, WidgetDef[]> = {};
  allWidgets(search).forEach((w) => {
    const g = w.group || 'Other';
    (groups[g] ||= []).push(w);
  });
  return groups;
}

/** Series-key union over every panel widget — the custom page loads these.
 *  Browser-derived keys (w_*, bpi_state_num) are skipped: applyDerived computes
 *  them from their bases, and /series rejects them with HTTP 400. */
export function catalogSeriesKeys(): string[] {
  const keys = new Set<string>();
  REG.forEach((w) => {
    if (w.kind === 'panel' && w.panel) w.panel.series.forEach((s) => { if (!isDerivedKey(s.key)) keys.add(s.key); });
  });
  return [...keys];
}
