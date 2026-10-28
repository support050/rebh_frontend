/**
 * Breadth preferences store — the CR3 ⚙ Customize state (PREFS) plus the
 * per-panel height/collapse map (PH), ported from the reference template
 * (lines 192-200, 326-346).
 *
 * The reference persists everything in localStorage only. CR3 §4 moves it
 * server-side: the same object is mirrored into the shared `user_prefs` table
 * under its `breadth` key (GET/PUT /api/rebh/breadth/prefs) so the setup follows
 * the user across devices. Strategy:
 *   - boot fast from localStorage (synchronous, no flash),
 *   - then reconcile with the backend on login (applyRemote) and
 *   - debounce every change back to the server (schedulePush).
 *
 * It is a tiny observable singleton (subscribe/notify) rather than React state
 * so the imperative canvas engine (Stack.ts) and the React chrome (drawer,
 * layout, custom dashboard) all read ONE source without prop drilling.
 */
import { API_BASE_URL } from '@/lib/api/config';
import { authFetch } from '@/lib/api/authFetch';

export interface BreadthPrefs {
  font: number;
  chart: number;
  lw: number;
  legend: boolean;
  rscolor: boolean;
  compact: boolean;
  nav: number;
  up: string;
  down: string;
  range: number | null;
  hidden: string[];
  title: string;
  tvbars: number;
}

/** Reference PREFS defaults (template line 193), key-for-key. */
export const DEFAULT_PREFS: BreadthPrefs = {
  font: 1, chart: 1, lw: 1, legend: true, rscolor: true, compact: false,
  nav: 190, up: '', down: '', range: 504, hidden: [],
  title: 'TASI Market Breadth', tvbars: 500,
};

/** Per-panel heights + collapse flags (reference PH), keyed `${pageId}:${k}`. */
export interface PanelSizes {
  h: Record<string, number>;
  c: Record<string, boolean>;
}

const LS_PREFS = 'tb-prefs';
const LS_PH = 'tb-ph';

/* ---------------------------- localStorage boot ---------------------------- */

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } as T : fallback;
  } catch {
    return fallback;
  }
}

/* ------------------------------- the store --------------------------------- */

type Listener = () => void;

class PrefsStore {
  prefs: BreadthPrefs = { ...DEFAULT_PREFS };
  ph: PanelSizes = { h: {}, c: {} };
  private listeners = new Set<Listener>();
  private pushTimer: ReturnType<typeof setTimeout> | null = null;
  private hydrated = false;

  constructor() {
    if (typeof window !== 'undefined') this.loadLocal();
  }

  /** Synchronous boot from localStorage (no network, so first paint is stable). */
  loadLocal(): void {
    this.prefs = readJSON<BreadthPrefs>(LS_PREFS, { ...DEFAULT_PREFS });
    const ph = readJSON<PanelSizes>(LS_PH, { h: {}, c: {} });
    this.ph = { h: ph.h || {}, c: ph.c || {} };
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  private persistLocal(): void {
    try {
      localStorage.setItem(LS_PREFS, JSON.stringify(this.prefs));
      localStorage.setItem(LS_PH, JSON.stringify(this.ph));
    } catch {
      /* storage full / disabled — the in-memory copy still drives this session */
    }
  }

  /** Shallow-merge new PREFS keys (drawer sliders/toggles call this). */
  set(patch: Partial<BreadthPrefs>): void {
    this.prefs = { ...this.prefs, ...patch };
    this.persistLocal();
    this.notify();
    this.schedulePush();
  }

  /** Set one panel's remembered height (drag handle). */
  setPanelHeight(pk: string, h: number): void {
    this.ph = { ...this.ph, h: { ...this.ph.h, [pk]: h } };
    this.persistLocal();
    this.notify();
    this.schedulePush();
  }

  /** Toggle a panel's collapsed flag. */
  setPanelCollapse(pk: string, collapsed: boolean): void {
    this.ph = { ...this.ph, c: { ...this.ph.c, [pk]: collapsed } };
    this.persistLocal();
    this.notify();
    this.schedulePush();
  }

  /** Clear every remembered height/collapse (drawer "reset"). */
  resetPanelSizes(): void {
    this.ph = { h: {}, c: {} };
    this.persistLocal();
    this.notify();
    this.schedulePush();
  }

  /* ---------------------------- backend sync ------------------------------ */

  /** Fetch the stored breadth prefs and overlay them on the local copy. */
  async hydrate(): Promise<void> {
    if (this.hydrated || typeof window === 'undefined') return;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/rebh/breadth/prefs`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return; // not signed in / offline — keep the local prefs
      const json = (await res.json()) as { preferences?: Partial<BreadthPrefs> & Partial<PanelPush> };
      if (json && json.preferences) {
        const { panels, ...prefs } = json.preferences;
        this.prefs = { ...DEFAULT_PREFS, ...this.prefs, ...prefs };
        if (panels && typeof panels === 'object') {
          this.ph = {
            h: { ...this.ph.h, ...(panels.h || {}) },
            c: { ...this.ph.c, ...(panels.c || {}) },
          };
        }
        this.persistLocal();
        this.notify();
      }
      this.hydrated = true;
    } catch {
      /* network failure — the local prefs remain authoritative for this session */
    }
  }

  /** Debounced write-behind of the whole prefs+panels blob to the server. */
  schedulePush(): void {
    if (typeof window === 'undefined') return;
    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => void this.push(), 800);
  }

  async push(): Promise<void> {
    const body: PanelPush = { ...this.prefs, panels: this.ph };
    try {
      await authFetch(`${API_BASE_URL}/api/rebh/breadth/prefs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      /* best-effort; localStorage already holds the change */
    }
  }
}

interface PanelPush {
  panels: PanelSizes;
}

export const prefsStore = new PrefsStore();

/** Read a live PREFS snapshot for imperative (non-React) callers like Stack. */
export const getPrefs = (): BreadthPrefs => prefsStore.prefs;

/* --------------------------------------------------------------------------
 * applyPrefs — reference applyPrefs (template lines 197-200), adapted to the
 * Next.js breadth layout. Sets font size, compact class, sidebar width, up/down
 * colour overrides and the doc title; returns nothing. Call after boot and on
 * every prefs change.
 * ------------------------------------------------------------------------ */
export function applyPrefs(): void {
  if (typeof document === 'undefined') return;
  const p = prefsStore.prefs;
  const root = document.documentElement;
  const size = `${Math.round(13 * p.font)}px`;
  root.style.fontSize = size;
  document.body.classList.toggle('breadth-compact', p.compact);
  const scope = document.querySelector('.breadth-root') as HTMLElement | null;
  if (scope) {
    scope.style.fontSize = size;
    if (p.up) scope.style.setProperty('--up', p.up);
    else scope.style.removeProperty('--up');
    if (p.down) scope.style.setProperty('--down', p.down);
    else scope.style.removeProperty('--down');
  }
  document.title = p.title;
}
