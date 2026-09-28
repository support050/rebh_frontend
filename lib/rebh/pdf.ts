/* eslint-disable @typescript-eslint/no-explicit-any */
// Shared REBH PDF infrastructure — mirrors the architecture of
// rebh/company/components/exportpdf.tsx:
//  · Amiri fonts served from /public/fonts (regular + bold, base64-cached)
//  · jsPDF's built-in processArabic() shaping + our own RTL bidi reordering
//    (keeps Latin/number runs like "12.50 SAR" or "REBH ONE" in LTR order)
//  · Unified maroon header band (REBH ONE · symbol/name · date)
//  · Disclaimer footer with page numbers on every page
//  · html2canvas capture helpers (scale 2) for chart-heavy pages

export const REBH_MAROON: [number, number, number] = [140, 59, 50];
export const REBH_DISCLAIMER =
  "منصة REBH - أداة تعليمية وتحليلية وفق منهجية مشعل الخرفشي - لا تقدم أي توصيات بيع أو شراء مباشرة.";

const FONT_REGULAR_URL = "/fonts/Amiri-Regular.ttf";
const FONT_BOLD_URL = "/fonts/Amiri-Bold.ttf";

let fontCache: { regular: string; bold: string } | null = null;

async function fetchFontBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font not found: ${url}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)) as any);
  }
  return btoa(bin);
}

export async function loadAmiriFonts() {
  if (!fontCache) {
    const [regular, bold] = await Promise.all([
      fetchFontBase64(FONT_REGULAR_URL),
      fetchFontBase64(FONT_BOLD_URL),
    ]);
    fontCache = { regular, bold };
  }
  return fontCache;
}

// Glyphs that Amiri does not contain (they would render as blanks in the PDF)
const UNSUPPORTED = /[\u2713\u2714\u2691\u2248\u2399\u274C\u26A0\uFE0F\u00B0\u2264\u2265\u2605\u2606\u221E]/g;
export const clean = (s: unknown) =>
  String(s ?? "").replace(UNSUPPORTED, "").replace(/[ \t]{2,}/g, " ").trim();
export const has = (v: any) => v !== null && v !== undefined && v !== "" && !Number.isNaN(v);
export const val = (v: any, suffix = "") => (has(v) ? `${v}${suffix}` : "—");
export const num = (v: any) =>
  has(v) && !Number.isNaN(Number(v)) ? Math.round(Number(v)).toLocaleString("en-US") : "—";
export const fmt1 = (v: any) =>
  has(v) && !Number.isNaN(Number(v))
    ? Number(v).toLocaleString("en-US", { maximumFractionDigits: 1 })
    : "—";

export interface RebhPdfHeaderOpts {
  symbol?: string;
  title: string;
  subtitle?: string;
}

export interface RebhPdfCtx {
  doc: any;
  W: number;
  H: number;
  M: number;
  R: number;
  CW: number;
  readonly y: number;
  setY(v: number): void;
  vis(input: unknown): string;
  setFont(style: "normal" | "bold", size: number): void;
  ensure(h: number): void;
  heading(title: string, tableRows?: number): void;
  paragraph(
    text: string,
    o?: { size?: number; bold?: boolean; color?: [number, number, number]; bullet?: boolean }
  ): void;
  kvTable(rows: [string, any][]): void;
  rtlGrid(head: string[], rows: any[][], labelWidth?: number): void;
  drawHeader(opts: RebhPdfHeaderOpts): void;
  drawFooter(): void;
}

export async function createRebhPdf(): Promise<RebhPdfCtx> {
  const [jspdfMod, autoTableMod] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const JsPDF: any = (jspdfMod as any).jsPDF ?? (jspdfMod as any).default;
  const autoTable: any = (autoTableMod as any).default ?? (autoTableMod as any).autoTable;
  const fonts = await loadAmiriFonts();

  const doc: any = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.addFileToVFS("Amiri-Regular.ttf", fonts.regular);
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  doc.addFileToVFS("Amiri-Bold.ttf", fonts.bold);
  doc.addFont("Amiri-Bold.ttf", "Amiri", "bold");

  const W: number = doc.internal.pageSize.getWidth();
  const H: number = doc.internal.pageSize.getHeight();
  const M = 14;
  const R = W - M;
  const CW = W - M * 2;
  let y = 0;

  // jsPDF's built-in bidi assumes an LTR paragraph, so mixed Arabic/Latin lines
  // come out in the wrong order. We shape + reorder ourselves (RTL paragraph)
  // and tell jsPDF the text is already visual (isInputVisual/isOutputVisual).
  const origText = doc.text.bind(doc);
  doc.text = (t: any, x: number, yy: number, opts?: any, ...rest: any[]) =>
    origText(t, x, yy, { ...(opts || {}), isInputVisual: true, isOutputVisual: true }, ...rest);

  const AR_RE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const LAT_RE = /[A-Za-z]/;
  const MIRROR: Record<string, string> = { "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{", "<": ">", ">": "<" };
  const mirrorStr = (str: string) => str.replace(/[()[\]{}<>]/g, (c) => MIRROR[c] ?? c);
  const revWord = (w: string) =>
    w
      .split(/([0-9][0-9.,]*%?|[A-Za-z]+)/)
      .reverse()
      .map((part) => (/^([0-9][0-9.,]*%?|[A-Za-z]+)$/.test(part) ? part : mirrorStr(part.split("").reverse().join(""))))
      .join("");

  const vis = (input: unknown): string => {
    const s = clean(input);
    if (!AR_RE.test(s)) return s; // pure Latin/numbers: nothing to reorder
    const shaped: string = doc.processArabic(s); // contextual letter forms (logical order)
    const toks = shaped.split(/ +/).filter(Boolean).map((t) => ({
      t,
      k: AR_RE.test(t) ? "A" : LAT_RE.test(t) ? "L" : /[0-9]/.test(t) ? "D" : "P",
    }));
    const isLtr = (i: number) => i < toks.length && (toks[i].k === "L" || toks[i].k === "D");
    const units: string[] = [];
    let i = 0;
    while (i < toks.length) {
      if (isLtr(i)) {
        // keep runs of Latin words / numbers ("12.50 SAR", "REBH ONE") in LTR order
        const run = [toks[i].t];
        let j = i;
        while (true) {
          if (isLtr(j + 1)) { run.push(toks[j + 1].t); j += 1; }
          else if (j + 2 < toks.length && toks[j + 1].k === "P" && isLtr(j + 2)) { run.push(toks[j + 1].t, toks[j + 2].t); j += 2; }
          else break;
        }
        units.push(run.join(" "));
        i = j + 1;
      } else if (toks[i].k === "A") {
        units.push(revWord(toks[i].t));
        i += 1;
      } else {
        units.push(mirrorStr(toks[i].t));
        i += 1;
      }
    }
    return units.reverse().join(" ");
  };

  const setFont = (style: "normal" | "bold", size: number) => {
    doc.setFont("Amiri", style);
    doc.setFontSize(size);
  };
  const ensure = (h: number) => {
    if (y + h > H - 18) {
      doc.addPage();
      y = M;
    }
  };

  const heading = (title: string, tableRows = 3) => {
    // keep the heading together with the start of what follows (no orphan headings)
    ensure(18 + Math.min((tableRows + 1) * 8.5, H - 60));
    y += 3;
    doc.setFillColor(243, 244, 246);
    doc.setDrawColor(229, 231, 235);
    doc.rect(M, y, CW, 8, "FD");
    doc.setFillColor(140, 59, 50);
    doc.rect(R - 1.4, y, 1.4, 8, "F");
    setFont("bold", 11);
    doc.setTextColor(26, 26, 26);
    doc.text(vis(title), R - 4, y + 5.6, { align: "right" });
    y += 12;
  };

  const paragraph = (
    text: string,
    o: { size?: number; bold?: boolean; color?: [number, number, number]; bullet?: boolean } = {}
  ) => {
    const size = o.size ?? 10;
    const lineH = size * 0.52;
    const indent = o.bullet ? 5 : 0;
    setFont(o.bold ? "bold" : "normal", size);
    const c = o.color ?? [55, 65, 81];
    doc.setTextColor(c[0], c[1], c[2]);
    const lines: string[] = doc.splitTextToSize(clean(text), (CW - indent) * 0.94);
    lines.forEach((ln, i) => {
      ensure(lineH + 1);
      if (o.bullet && i === 0) {
        doc.setFillColor(c[0], c[1], c[2]);
        doc.circle(R - 1.2, y - 1.2, 0.6, "F");
      }
      doc.text(vis(ln), R - indent, y, { align: "right" });
      y += lineH;
    });
    y += 1.2;
  };

  const tableCommon = {
    margin: { left: M, right: M },
    theme: "grid",
    styles: {
      font: "Amiri",
      fontSize: 10,
      cellPadding: 2.2,
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.2,
      minCellHeight: 7,
      valign: "middle",
    },
    headStyles: { fillColor: [243, 244, 246], textColor: [75, 85, 99], font: "Amiri", fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    willDrawCell: (d: any) => {
      // keep the original (logical) lines: autotable may draw a cell again (repeated header row)
      if (!d.cell.__orig) d.cell.__orig = [...(d.cell.text as string[])];
      d.cell.text = (d.cell.text.length ? (d.cell.__orig as string[]) : []).map((t: string) => vis(t));
    },
  };

  const keepTogether = (rowCount: number) => ensure(Math.min((rowCount + 1) * 8.5, H - 60));

  // label (right) / value (left)
  const kvTable = (rows: [string, any][]) => {
    if (rows.length === 0) return;
    keepTogether(rows.length);
    autoTable(doc, {
      ...tableCommon,
      startY: y,
      body: rows.map(([k, v]) => [clean(v) || "—", clean(k)]),
      columnStyles: {
        0: { halign: "left", cellWidth: CW * 0.4 },
        1: { halign: "right", cellWidth: CW * 0.6, fontStyle: "bold" },
      },
    });
    y = doc.lastAutoTable.finalY + 5;
  };

  // multi-column RTL grid: first logical column sits on the right
  const rtlGrid = (head: string[], rows: any[][], labelWidth?: number) => {
    const n = head.length;
    keepTogether(rows.length);
    const rev = (arr: any[]) => [...arr].reverse();
    const columnStyles: Record<number, any> = {};
    for (let i = 0; i < n; i++) columnStyles[i] = { halign: "center" };
    columnStyles[n - 1] = { halign: "right", fontStyle: "bold", ...(labelWidth ? { cellWidth: labelWidth } : {}) };
    autoTable(doc, {
      ...tableCommon,
      startY: y,
      head: [rev(head).map(clean)],
      body: rows.map((r) => rev(r).map((c) => clean(has(c) ? c : "—"))),
      columnStyles,
      styles: { ...tableCommon.styles, fontSize: n > 6 ? 8.5 : 10, cellPadding: n > 6 ? 1.8 : 2.2 },
    });
    y = doc.lastAutoTable.finalY + 5;
  };

  // Unified maroon header band: platform name (REBH ONE), report/company title,
  // symbol, and the issue date — drawn on top of the first page.
  const drawHeader = (opts: RebhPdfHeaderOpts) => {
    const dateStr = new Date().toISOString().split("T")[0];
    doc.setFillColor(REBH_MAROON[0], REBH_MAROON[1], REBH_MAROON[2]);
    doc.rect(0, 0, W, 30, "F");
    doc.setTextColor(255, 255, 255);
    setFont("bold", 17);
    doc.text(vis(opts.symbol ? `${opts.title} - ${opts.symbol}` : opts.title), R, 13, { align: "right" });
    setFont("normal", 10);
    doc.text(vis(`${opts.subtitle ? `${opts.subtitle} - ` : ""}REBH ONE`), R, 21, { align: "right" });
    setFont("normal", 10);
    doc.text(dateStr, M, 13);
    y = 38;
  };

  // Disclaimer + page numbers at the bottom of every page.
  const drawFooter = () => {
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setDrawColor(229, 231, 235);
      doc.line(M, H - 13, R, H - 13);
      setFont("normal", 8);
      doc.setTextColor(156, 163, 175);
      doc.text(vis(REBH_DISCLAIMER), R, H - 8, { align: "right" });
      doc.text(`${i} / ${total}`, M, H - 8);
    }
  };

  return {
    doc, W, H, M, R, CW,
    get y() { return y; },
    setY(v: number) { y = v; },
    vis, setFont, ensure, heading, paragraph, kvTable, rtlGrid, drawHeader, drawFooter,
  };
}

// ── Canvas capture helpers (chart-heavy pages: Studio / X-Ray / Company) ─────

export async function captureElementCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import("html2canvas");

  // Let fonts settle so text metrics (and any SVG sized from text) are final.
  try {
    await Promise.race([
      (document as any).fonts?.ready ?? Promise.resolve(),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
  } catch { /* non-blocking */ }

  // html2canvas throws InvalidStateError "createPattern: Passed-in canvas has
  // width 0" when the captured DOM contains a zero-sized <svg> or <canvas>
  // (e.g. a chart that rendered empty while its data was still loading). Such
  // elements are invisible anyway, so hide them for the capture duration.
  const zeroSized: Element[] = [];
  node.querySelectorAll("svg, canvas").forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      el.classList.add("pdf-zero-hide");
      zeroSized.push(el);
    }
  });

  try {
    return await html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      ignoreElements: (el) =>
        el.classList?.contains("pdf-exclude") ||
        el.classList?.contains("pdf-zero-hide"),
    });
  } finally {
    zeroSized.forEach((el) => el.classList.remove("pdf-zero-hide"));
  }
}

// Slice a captured canvas into the given content area across as many A4 pages
// as needed (images are clipped at the page boundary by the viewer).
export function embedCanvasInArea(
  doc: any,
  canvas: HTMLCanvasElement,
  area: { x: number; y: number; w: number; h: number }
): void {
  const imgData = canvas.toDataURL("image/png", 1.0);
  const imgW = area.w;
  const imgH = (canvas.height * imgW) / canvas.width;
  const placeSegment = (offset: number) => {
    doc.addImage(imgData, "PNG", area.x, area.y - offset, imgW, imgH);
  };
  let offset = 0;
  placeSegment(offset);
  let remaining = imgH - area.h;
  while (remaining > 0) {
    offset += area.h;
    doc.addPage();
    placeSegment(offset);
    remaining -= area.h;
  }
}

// One-call pipeline for canvas-based exports: unified header → captured node →
// paginated body → disclaimer footer → save.
export async function buildCanvasPdf(o: {
  node: HTMLElement;
  filename: string;
  header: RebhPdfHeaderOpts;
}): Promise<void> {
  const ctx = await createRebhPdf();
  ctx.drawHeader(o.header);
  const canvas = await captureElementCanvas(o.node);
  const top = ctx.y + 2;
  embedCanvasInArea(ctx.doc, canvas, { x: 0, y: top, w: ctx.W, h: ctx.H - top - 14 });
  ctx.drawFooter();
  ctx.doc.save(o.filename);
}
