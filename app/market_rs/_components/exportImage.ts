/**
 * exportImage.ts
 * Reusable PNG export helpers for the /market_rs/ tabs.
 *
 * Requires:  npm i html-to-image
 *
 * - exportElementAsPng : any DOM node  -> PNG (html-to-image, 2x by default)
 * - exportSvgAsPng     : an <svg> chart -> PNG, with an optional cropBox so only the
 *                        plot/axis area is exported (no outer whitespace).
 *
 * Anything carrying the `data-export-ignore` attribute is stripped from the output.
 */
import { toPng } from 'html-to-image';

export interface CropBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ExportOptions {
    /** Device pixel ratio / scale. Default 2 (retina). */
    pixelRatio?: number;
    /** Solid background. Defaults to the first non-transparent ancestor background, then white. */
    backgroundColor?: string;
}

export const EXPORT_IGNORE_ATTR = 'data-export-ignore';
const DEFAULT_PIXEL_RATIO = 2;
const SVG_NS = 'http://www.w3.org/2000/svg';

/* ───────────────────────── helpers ───────────────────────── */

/** `rs-rotation-top8` -> `rs-rotation-top8-2026-10-22` (no extension). */
export function buildExportFilename(base: string, date: Date = new Date()): string {
    return `${base}-${date.toISOString().slice(0, 10)}`;
}

function normalizeFilename(name: string): string {
    const base = name.replace(/\.png$/i, '').replace(/[^\w.\-]+/g, '_') || 'export';
    return `${base}.png`;
}

function triggerDownload(href: string, filename: string): void {
    const a = document.createElement('a');
    a.href = href;
    a.download = normalizeFilename(filename);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
}

async function fontsReady(): Promise<void> {
    try {
        if (typeof document !== 'undefined' && document.fonts?.ready) await document.fonts.ready;
    } catch {
        /* non-fatal */
    }
}

/** Resolves after React has committed + the browser has painted (call after flushSync). */
export function waitForNextPaint(): Promise<void> {
    return new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
}

function isTransparent(color: string): boolean {
    return color === 'transparent' || /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)$/.test(color);
}

function resolveBackground(el: Element, explicit?: string): string {
    if (explicit) return explicit;
    let node: Element | null = el;
    while (node) {
        const bg = getComputedStyle(node).backgroundColor;
        if (bg && !isTransparent(bg)) return bg;
        node = node.parentElement;
    }
    return '#ffffff';
}

/* ───────────────────────── DOM -> PNG ───────────────────────── */

export async function exportElementAsPng(
    element: HTMLElement,
    filename: string,
    options: ExportOptions = {},
): Promise<void> {
    await fontsReady();

    const common = {
        pixelRatio: options.pixelRatio ?? DEFAULT_PIXEL_RATIO,
        backgroundColor: resolveBackground(element, options.backgroundColor),
        cacheBust: true,
        // Never capture export buttons / loading states.
        filter: (node: HTMLElement) => !(node instanceof Element) || !node.hasAttribute(EXPORT_IGNORE_ATTR),
        preferredFontFormat: 'woff2' as const,
    };

    // html-to-image tries to read cssRules from all stylesheets, including cross-origin
    // Google Fonts, which throws a SecurityError. The error is caught internally and
    // does not affect the output — we silence it so it doesn't appear in the console.
    const origError = console.error;
    console.error = (...args: unknown[]) => {
        const msg = String(args[0] ?? '');
        if (msg.includes('SecurityError') || msg.includes('cssRules') || msg.includes('cross-origin')) return;
        origError.apply(console, args);
    };

    let dataUrl: string;
    try {
        dataUrl = await toPng(element, common);
    } finally {
        console.error = origError;
    }
    triggerDownload(dataUrl, filename);
}

/* ───────────────────────── SVG -> PNG ───────────────────────── */

// Computed presentation props we freeze onto the clone so the standalone SVG image
// renders identically (CSS vars / classes / inherited fonts don't exist outside the page).
const INLINE_PROPS = [
    'font-family', 'font-size', 'font-weight', 'font-style', 'letter-spacing', 'text-anchor',
    'fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity',
    'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity',
] as const;

function inlineComputedStyles(source: Element, target: Element): void {
    if (target instanceof SVGElement) {
        const cs = getComputedStyle(source);
        for (const p of INLINE_PROPS) target.style.setProperty(p, cs.getPropertyValue(p));
    }
    const n = Math.min(source.children.length, target.children.length);
    for (let i = 0; i < n; i++) inlineComputedStyles(source.children[i], target.children[i]);
}

function fullBox(svg: SVGSVGElement): CropBox {
    const vb = svg.viewBox?.baseVal;
    if (vb && vb.width > 0 && vb.height > 0) return { x: vb.x, y: vb.y, width: vb.width, height: vb.height };
    const r = svg.getBoundingClientRect();
    return { x: 0, y: 0, width: r.width, height: r.height };
}

function clampBox(box: CropBox, bounds: CropBox): CropBox {
    const x0 = Math.max(bounds.x, box.x);
    const y0 = Math.max(bounds.y, box.y);
    const x1 = Math.min(bounds.x + bounds.width, box.x + box.width);
    const y1 = Math.min(bounds.y + bounds.height, box.y + box.height);
    return { x: x0, y: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0) };
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to rasterize SVG'));
        img.src = src;
    });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Canvas export failed'))), 'image/png');
    });
}

/**
 * Rasterizes an <svg> to PNG. `cropBox` is expressed in the SVG's own viewBox units;
 * when provided, only that rectangle is exported (viewBox is rewritten on a clone,
 * the live chart is untouched).
 */
export async function exportSvgAsPng(
    svgElement: SVGSVGElement,
    filename: string,
    cropBox?: CropBox,
    options: ExportOptions = {},
): Promise<void> {
    await fontsReady();

    const scale = options.pixelRatio ?? DEFAULT_PIXEL_RATIO;
    const background = resolveBackground(svgElement.parentElement ?? svgElement, options.backgroundColor);
    const box = clampBox(cropBox ?? fullBox(svgElement), fullBox(svgElement));

    // 1. Clone + freeze computed styles, then drop anything marked export-ignore.
    const clone = svgElement.cloneNode(true) as SVGSVGElement;
    inlineComputedStyles(svgElement, clone);
    clone.querySelectorAll(`[${EXPORT_IGNORE_ATTR}]`).forEach(n => n.remove());

    // 2. Rewrite geometry: the cropped viewBox becomes the whole image.
    clone.setAttribute('xmlns', SVG_NS);
    clone.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);
    clone.setAttribute('width', String(box.width));
    clone.setAttribute('height', String(box.height));
    clone.removeAttribute('class');
    clone.removeAttribute('style');

    // 3. Solid background covering exactly the crop area.
    const bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('x', String(box.x));
    bg.setAttribute('y', String(box.y));
    bg.setAttribute('width', String(box.width));
    bg.setAttribute('height', String(box.height));
    bg.setAttribute('fill', background);
    clone.insertBefore(bg, clone.firstChild);

    // 4. Font embedding skipped intentionally: Google Fonts are cross-origin and
    //    cannot be read via cssRules (SecurityError). Computed styles were already
    //    inlined in step 1, so text renders with the correct font-family string;
    //    the browser will use the loaded font face from the page context.

    // 5. Rasterize at `scale`.
    const xml = new XMLSerializer().serializeToString(clone);
    const img = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`);

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(box.width * scale);
    canvas.height = Math.round(box.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await canvasToBlob(canvas);
    const url = URL.createObjectURL(blob);
    try {
        triggerDownload(url, filename);
    } finally {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}