/**
 * Stack — the client's Canvas chart engine, ported as-is from
 * Rebh_Market_Breadth_Package/dashboard/pro_dashboard_template.html (class Stack).
 *
 * A Stack owns a vertical column of panels that share one x-axis (trading dates)
 * and sync hover/pan/zoom across every stack registered on the same ChartHub —
 * exactly the reference dashboard's global `stacks[]` + `rangeState` behaviour,
 * now encapsulated so multiple pages can mount it independently.
 *
 * No chart library is introduced: it renders straight to <canvas>, resolving all
 * colours from the CSS custom properties on the .breadth-root scope element.
 */
import { cssVar, fmt, nice, num, ticks } from './helpers';
import {
  CanaryEpisode,
  PanelDef,
  REGIME_COLORS,
  SeriesVal,
  StackOptions,
  DataSource,
} from './types';

export interface HubOptions {
  /** initial visible window in trading days (default 500, matching the reference) */
  defaultDays?: number;
}

/** Shared controller: the DATA slice, the visible date window, and the stack registry. */
export class ChartHub {
  data: DataSource;
  /** the element that carries the .breadth-root theme vars (colour lookups resolve here) */
  scope: HTMLElement;
  dateIdx: Record<string, number> = {};
  range: { i0: number; i1: number };
  stacks: Stack[] = [];
  private n: number;
  private tipEl: HTMLDivElement | null = null;

  constructor(data: DataSource, scope: HTMLElement, opts: HubOptions = {}) {
    this.data = data;
    this.scope = scope;
    this.n = data.dates.length;
    data.dates.forEach((d, i) => (this.dateIdx[d] = i));
    const days = opts.defaultDays ?? 500;
    this.range = { i0: Math.max(0, this.n - days), i1: Math.max(0, this.n - 1) };
  }

  get length(): number {
    return this.n;
  }

  /** Set the visible window to the last `days` sessions (null = all). */
  setRange(days: number | null): void {
    this.range.i1 = this.n - 1;
    this.range.i0 = days == null ? 0 : Math.max(0, this.n - days);
    this.drawAll();
  }

  /** Pan/zoom every registered stack to the current range. */
  drawAll(): void {
    this.stacks.forEach((s) => s.draw());
  }

  /** Rebuild the underlying data (e.g. after a refetch) and repaint. */
  setData(data: DataSource): void {
    this.data = data;
    this.dateIdx = {};
    this.n = data.dates.length;
    data.dates.forEach((d, i) => (this.dateIdx[d] = i));
    this.range.i0 = Math.max(0, this.range.i0);
    this.range.i1 = Math.min(this.n - 1, this.range.i1);
    this.drawAll();
  }

  /** Lazily create the singleton hover tooltip attached to <body>. */
  tip(): HTMLDivElement {
    if (!this.tipEl) {
      this.tipEl = document.createElement('div');
      this.tipEl.className = 'breadth-tip';
      this.tipEl.style.display = 'none';
      document.body.appendChild(this.tipEl);
    }
    return this.tipEl;
  }

  hideTip(): void {
    if (this.tipEl) this.tipEl.style.display = 'none';
  }

  destroy(): void {
    this.hideTip();
    if (this.tipEl && this.tipEl.parentNode) this.tipEl.parentNode.removeChild(this.tipEl);
    this.tipEl = null;
    this.stacks.forEach((s) => s.destroy());
    this.stacks = [];
  }

  css(name: string): string {
    return cssVar(name, this.scope);
  }

  series(key: string): SeriesVal[] {
    return this.data.series[key] || [];
  }

  /** canary episodes (object entries) for shaded bands. */
  canary(): CanaryEpisode[] {
    const raw = this.data.events['canary'] || [];
    return raw.filter((e): e is CanaryEpisode => typeof e === 'object' && 'start' in e);
  }

  /** resolve an event marker list to numeric indices for drawing. */
  eventIndices(key: string): number[] {
    const raw = this.data.events[key];
    if (!raw) return [];
    const out: number[] = [];
    for (const e of raw) {
      const d = typeof e === 'string' ? e : (e as CanaryEpisode).start;
      const i = this.dateIdx[d];
      if (i != null) out.push(i);
    }
    return out;
  }
}

/** runtime panel = definition + attached DOM nodes */
interface RuntimePanel extends PanelDef {
  canvas: HTMLCanvasElement;
  div: HTMLDivElement;
  last?: boolean;
}

const UP = '--up';
const DOWN = '--down';

export class Stack {
  private el: HTMLElement;
  private panels: RuntimePanel[];
  private hub: ChartHub;
  private opts: StackOptions;
  hover: number | null = null;
  private drag: { x: number; i0: number; i1: number } | null = null;
  private ro: ResizeObserver;
  private onMouseUp: () => void;

  constructor(el: HTMLElement, hub: ChartHub, panels: PanelDef[], opts: StackOptions = {}) {
    this.el = el;
    this.hub = hub;
    this.opts = opts;
    this.panels = [];
    el.classList.add('breadth-stack');

    panels.forEach((p) => {
      const d = document.createElement('div');
      d.className = 'breadth-panel';
      d.style.height = (p.height || 150) + 'px';
      const c = document.createElement('canvas');
      d.appendChild(c);
      const rp = { ...p, canvas: c, div: d } as RuntimePanel;
      this.panels.push(rp);

      if (!p.mini) {
        const t = document.createElement('div');
        t.className = 'breadth-ttl';
        t.innerHTML =
          `<b>${p.title || ''}</b>` +
          p.series
            .map(
              (s) =>
                `<span class="lg"><i style="background:${this.hub.css(s.color)}"></i>${s.label || s.key}</span>`,
            )
            .join('');
        d.appendChild(t);
      }
      el.appendChild(d);

      c.addEventListener('mousemove', (e) => this.onMove(e, rp));
      c.addEventListener('mouseleave', () => {
        this.hover = null;
        this.hub.hideTip();
        this.draw();
      });
      c.addEventListener(
        'wheel',
        (e) => {
          e.preventDefault();
          this.zoom(e.deltaY > 0 ? 1.2 : 1 / 1.2, this.xIndex(e, rp));
        },
        { passive: false },
      );
      c.addEventListener('mousedown', (e) => {
        this.drag = { x: e.clientX, i0: this.hub.range.i0, i1: this.hub.range.i1 };
      });
      c.addEventListener('mousemove', (e) => {
        if (!this.drag) return;
        const w = this.plotW(rp);
        const n = this.hub.range.i1 - this.hub.range.i0;
        const di = Math.round(-(e.clientX - this.drag.x) / w * n);
        let a = this.drag.i0 + di;
        let b = this.drag.i1 + di;
        if (a < 0) {
          b -= a;
          a = 0;
        }
        if (b > this.hub.length - 1) {
          a -= b - (this.hub.length - 1);
          b = this.hub.length - 1;
        }
        this.hub.range.i0 = a;
        this.hub.range.i1 = b;
        this.hub.drawAll();
      });
    });

    this.onMouseUp = () => (this.drag = null);
    window.addEventListener('mouseup', this.onMouseUp);

    this.hub.stacks.push(this);
    this.ro = new ResizeObserver(() => this.draw());
    this.ro.observe(el);
    this.draw();
  }

  // --- margins (identical to the reference: mini panels hug their plot) ---
  private L(p: RuntimePanel): number {
    return p && p.mini ? 34 : 62;
  }
  private R(): number {
    return 12;
  }
  private T(p: RuntimePanel): number {
    return p && p.mini ? 4 : 24;
  }
  private B(p: RuntimePanel): number {
    return p.last ? (p.mini ? 14 : 22) : 6;
  }
  private plotW(p: RuntimePanel): number {
    return p.canvas.clientWidth - this.L(p) - this.R();
  }

  private xIndex(e: MouseEvent, p: RuntimePanel): number {
    const r = p.canvas.getBoundingClientRect();
    const x = e.clientX - r.left - this.L(p);
    const n = this.hub.range.i1 - this.hub.range.i0;
    return Math.max(
      this.hub.range.i0,
      Math.min(this.hub.range.i1, Math.round(this.hub.range.i0 + (x / this.plotW(p)) * n)),
    );
  }

  private zoom(f: number, center: number): void {
    const n = this.hub.range.i1 - this.hub.range.i0;
    let nn = Math.max(30, Math.min(this.hub.length - 1, Math.round(n * f)));
    const frac = (center - this.hub.range.i0) / n;
    let a = Math.round(center - frac * nn);
    let b = a + nn;
    if (a < 0) {
      a = 0;
      b = nn;
    }
    if (b > this.hub.length - 1) {
      b = this.hub.length - 1;
      a = b - nn;
    }
    this.hub.range.i0 = a;
    this.hub.range.i1 = b;
    this.hub.drawAll();
  }

  private onMove(e: MouseEvent, p: RuntimePanel): void {
    if (this.drag) return;
    const i = this.xIndex(e, p);
    this.hover = i;
    this.hub.stacks.forEach((s) => {
      s.hover = i;
      s.draw();
    });
    const S = this.hub.data.series;
    const tip = this.hub.tip();
    let h = `<b>${this.hub.data.dates[i]}${S.regime && S.regime[i] ? ' · ' + S.regime[i] : ''}</b>`;
    this.panels.forEach((pp) =>
      pp.series.forEach((s) => {
        const v = num(S[s.key] ? S[s.key][i] : null);
        const dec = s.dec ?? (Math.abs(v || 0) < 10 ? 2 : 0);
        h += `<div class="r"><span><i style="display:inline-block;width:8px;height:8px;background:${this.hub.css(
          s.color,
        )};border-radius:2px;margin-right:4px"></i>${s.label || s.key}</span><span>${fmt(v, dec)}</span></div>`;
      }),
    );
    tip.innerHTML = h;
    tip.style.display = 'block';
    const tw = tip.offsetWidth;
    tip.style.left = Math.min(e.clientX + 14, window.innerWidth - tw - 10) + 'px';
    tip.style.top = e.clientY + 14 + 'px';
  }

  draw(): void {
    const { i0, i1 } = this.hub.range;
    this.panels.forEach((p, k) => {
      p.last = k === this.panels.length - 1;
      this.drawPanel(p, i0, i1);
    });
  }

  private drawPanel(p: RuntimePanel, i0: number, i1: number): void {
    void this.opts;
    const c = p.canvas;
    const dpr = window.devicePixelRatio || 1;
    const W = c.clientWidth;
    const H = p.div.clientHeight;
    c.width = W * dpr;
    c.height = H * dpr;
    const g = c.getContext('2d');
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    const S = this.hub.data.series;
    const L = this.L(p);
    const R = this.R();
    const T = this.T(p);
    const B = this.B(p);
    const pw = W - L - R;
    const ph = H - T - B;
    const n = i1 - i0;
    const X = (i: number) => L + ((i - i0) / Math.max(1, n)) * pw;

    // rebase support (index series to 100 at the left edge of the window)
    const cache: Record<string, SeriesVal[]> = {};
    const arr = (s: { key: string }): SeriesVal[] => {
      if (!p.rebase) return S[s.key] || [];
      if (cache[s.key]) return cache[s.key];
      const a = S[s.key] || [];
      let b: number | null = null;
      for (let i = i0; i <= i1; i++) {
        const v = num(a[i]);
        if (v != null) {
          b = v;
          break;
        }
      }
      const out: SeriesVal[] = new Array(a.length).fill(null);
      for (let i = i0; i <= i1; i++) out[i] = a[i] == null || b == null ? null : (100 * num(a[i])!) / b;
      return (cache[s.key] = out);
    };

    g.fillStyle = this.hub.css('--surface');
    g.fillRect(0, 0, W, H);

    // y-range
    let lo = Infinity;
    let hi = -Infinity;
    p.series.forEach((s) => {
      const a = arr(s);
      for (let i = i0; i <= i1; i++) {
        const v = num(a[i]);
        if (v == null) continue;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      if (s.type === 'candle') {
        for (let i = i0; i <= i1; i++) {
          const l = num(S['tasi_l']?.[i]);
          const h = num(S['tasi_h']?.[i]);
          if (l != null && l < lo) lo = l;
          if (h != null && h > hi) hi = h;
        }
      }
    });
    if (p.ylim) {
      lo = p.ylim[0];
      hi = p.ylim[1];
    }
    if (!isFinite(lo)) {
      lo = 0;
      hi = 1;
    }
    if (p.zero && lo > 0) lo = 0;
    if (p.zero && hi < 0) hi = 0;
    if (!p.ylim) {
      const pad = (hi - lo) * 0.06 || 1;
      lo -= pad;
      hi += pad;
    }
    const Y = (v: number) => T + ph - ((v - lo) / (hi - lo)) * ph;

    // zones
    (p.zones || []).forEach((z) => {
      g.fillStyle = this.hub.css(z.color);
      const y1 = Y(Math.min(z.to, hi));
      const y2 = Y(Math.max(z.from, lo));
      if (y2 > y1) g.fillRect(L, y1, pw, y2 - y1);
    });

    // canary episodes
    if (p.episodes) {
      g.fillStyle = this.hub.css('--episode');
      this.hub.canary().forEach((ep) => {
        const a = this.hub.dateIdx[ep.start];
        const b = this.hub.dateIdx[ep.end];
        if (a == null || b == null || b < i0 || a > i1) return;
        g.fillRect(X(Math.max(a, i0)), T, X(Math.min(b, i1)) - X(Math.max(a, i0)), ph);
      });
    }

    // grid + y ticks
    g.strokeStyle = this.hub.css('--grid');
    g.lineWidth = 1;
    g.font = '10px sans-serif';
    g.fillStyle = this.hub.css('--text2');
    g.textAlign = 'right';
    ticks(lo, hi, (p.height || 150) > 200 ? 6 : 4).forEach((v) => {
      const y = Y(v);
      g.beginPath();
      g.moveTo(L, y);
      g.lineTo(L + pw, y);
      g.stroke();
      g.fillText(fmt(v, Math.abs(hi - lo) < 5 ? 2 : 0), L - 6, y + 3);
    });

    // horizontal reference lines
    (p.hlines || []).forEach((h) => {
      if (h.y < lo || h.y > hi) return;
      g.strokeStyle = this.hub.css(h.color || '--text2');
      g.setLineDash(h.dash || [4, 3]);
      g.beginPath();
      g.moveTo(L, Y(h.y));
      g.lineTo(L + pw, Y(h.y));
      g.stroke();
      g.setLineDash([]);
      if (h.label) {
        g.textAlign = 'left';
        g.fillStyle = this.hub.css(h.color || '--text2');
        g.fillText(h.label, L + 4, Y(h.y) - 3);
        g.textAlign = 'right';
      }
    });

    // x ticks (only on the last panel of a stack)
    if (p.last) {
      g.textAlign = 'center';
      g.fillStyle = this.hub.css('--text2');
      const step = n > 2500 ? 250 : n > 1200 ? 125 : n > 500 ? 63 : n > 200 ? 21 : n > 60 ? 10 : 5;
      let lastLab = '';
      for (let i = i0; i <= i1; i++) {
        const d = this.hub.data.dates[i];
        const lab = n > 500 ? d.slice(0, 4) : d.slice(0, 7);
        if (lab !== lastLab && (n <= 500 || d.slice(5, 7) === '01')) {
          if (n > 500 && lab === lastLab) continue;
          lastLab = lab;
          if (i - i0 < step / 3 && i !== i0) continue;
          g.strokeStyle = this.hub.css('--grid');
          g.beginPath();
          g.moveTo(X(i), T);
          g.lineTo(X(i), T + ph);
          g.stroke();
          g.fillText(lab, X(i), H - 6);
        }
      }
    }

    // series (clipped to plot)
    g.save();
    g.beginPath();
    g.rect(L, T, pw, ph);
    g.clip();
    const bw = Math.max(1, pw / Math.max(1, n) - 1);
    p.series.forEach((s) => {
      const a = arr(s);
      const col = this.hub.css(s.color);
      if (s.type === 'hist') {
        for (let i = i0; i <= i1; i++) {
          const v = num(a[i]);
          if (v == null) continue;
          g.fillStyle = this.hub.css(v >= 0 ? s.up || UP : s.down || DOWN);
          const y0 = Y(0);
          const y = Y(v);
          g.fillRect(X(i) - bw / 2, Math.min(y0, y), bw, Math.max(1, Math.abs(y0 - y)));
        }
      } else if (s.type === 'bar') {
        g.fillStyle = col;
        const cb = s.colorBy ? S[s.colorBy] : null;
        for (let i = i0; i <= i1; i++) {
          const v = num(a[i]);
          if (v == null) continue;
          if (cb) g.fillStyle = this.hub.css((num(cb[i]) ?? 0) >= 0 ? UP : DOWN);
          const y0 = Y(Math.max(lo, 0));
          const y = Y(v);
          g.fillRect(X(i) - bw / 2, Math.min(y0, y), bw, Math.max(1, Math.abs(y0 - y)));
        }
      } else if (s.type === 'candle' && n <= 320) {
        for (let i = i0; i <= i1; i++) {
          const o = num(S['tasi_o']?.[i]);
          const h = num(S['tasi_h']?.[i]);
          const l = num(S['tasi_l']?.[i]);
          const cl = num(S['tasi']?.[i]);
          if (cl == null) continue;
          const up = o == null ? true : cl >= o;
          g.strokeStyle = g.fillStyle = this.hub.css(up ? UP : DOWN);
          const x = X(i);
          if (h != null && l != null) {
            g.beginPath();
            g.moveTo(x, Y(h));
            g.lineTo(x, Y(l));
            g.stroke();
          }
          if (o != null) {
            const y1 = Y(Math.max(o, cl));
            const y2 = Y(Math.min(o, cl));
            g.fillRect(x - bw / 2, y1, bw, Math.max(1, y2 - y1));
          }
        }
      } else {
        g.strokeStyle = col;
        g.lineWidth = s.width || 1.5;
        g.beginPath();
        let pen = false;
        for (let i = i0; i <= i1; i++) {
          const v = num(a[i]);
          if (v == null) {
            pen = false;
            continue;
          }
          const x = X(i);
          const y = Y(v);
          if (!pen) {
            g.moveTo(x, y);
            pen = true;
          } else g.lineTo(x, y);
        }
        g.stroke();
        if (s.type === 'area') {
          g.lineTo(X(i1), Y(Math.max(lo, 0)));
          g.lineTo(X(i0), Y(Math.max(lo, 0)));
          g.closePath();
          g.globalAlpha = 0.15;
          g.fillStyle = col;
          g.fill();
          g.globalAlpha = 1;
        }
      }
    });

    // event markers
    (p.events || []).forEach((ev) => {
      const col = this.hub.css(ev.color);
      this.hub.eventIndices(ev.key).forEach((i) => {
        if (i < i0 || i > i1) return;
        const x = X(i);
        const y = ev.pos === 'top' ? T + 4 : T + ph - 4;
        g.fillStyle = col;
        g.beginPath();
        if (ev.dot) g.arc(x, ev.pos === 'top' ? y + 4 : y - 4, 3.5, 0, 6.3);
        else if (ev.pos === 'top') {
          g.moveTo(x, y + 8);
          g.lineTo(x - 5, y);
          g.lineTo(x + 5, y);
        } else {
          g.moveTo(x, y - 8);
          g.lineTo(x - 5, y);
          g.lineTo(x + 5, y);
        }
        g.closePath();
        g.fill();
      });
    });

    // regime strip
    if (p.regimeStrip && S.regime) {
      for (let i = i0; i <= i1; i++) {
        const r = S.regime[i];
        if (!r || typeof r !== 'string') continue;
        g.fillStyle = this.hub.css(REGIME_COLORS[r] || '--text2');
        g.globalAlpha = 0.55;
        g.fillRect(X(i) - bw / 2 - 0.5, T + ph - 5, bw + 1, 5);
        g.globalAlpha = 1;
      }
    }
    g.restore();

    // crosshair + right-edge value chips
    if (this.hover != null && this.hover >= i0 && this.hover <= i1) {
      const x = X(this.hover);
      g.strokeStyle = this.hub.css('--text2');
      g.setLineDash([3, 3]);
      g.beginPath();
      g.moveTo(x, T);
      g.lineTo(x, T + ph);
      g.stroke();
      g.setLineDash([]);
      p.series.forEach((s) => {
        if (s.type === 'hist' || s.type === 'bar') return;
        const v = num(arr(s)[this.hover!]);
        if (v == null) return;
        g.fillStyle = this.hub.css(s.color);
        g.beginPath();
        g.arc(x, Y(v), 3, 0, 6.3);
        g.fill();
        g.fillRect(L + pw + 1, Y(v) - 7, R + 40, 14);
        g.fillStyle = '#fff';
        g.textAlign = 'left';
        g.font = '10px sans-serif';
        g.fillText(fmt(v, s.dec ?? (Math.abs(v) < 10 ? 2 : 0)), L + pw + 3, Y(v) + 4);
      });
    }

    // frame
    g.strokeStyle = this.hub.css('--border');
    g.strokeRect(L + 0.5, T + 0.5, pw - 1, ph - 1);
  }

  destroy(): void {
    this.ro.disconnect();
    window.removeEventListener('mouseup', this.onMouseUp);
    this.el.innerHTML = '';
    const idx = this.hub.stacks.indexOf(this);
    if (idx >= 0) this.hub.stacks.splice(idx, 1);
  }
}
