// PDF generator for the Khurafshi course company report (rebh/course-reports).
// Uses the shared REBH PDF pipeline (Amiri fonts, RTL bidi, unified maroon
// header, disclaimer footer) from @/lib/rebh/pdf.

import { createRebhPdf, fmt1, has } from "@/lib/rebh/pdf";

// Column-order switch for ctx.rtlGrid. The shared grid helper's column order
// could not be verified (its source was not provided). Arrays below are written
// in natural left-to-right order [first ... last]. If the PDF renders columns
// mirrored, set this to true.
const GRID_MIRRORED = false;
const orient = <T,>(arr: T[]): T[] => (GRID_MIRRORED ? [...arr].reverse() : arr);

export interface CourseReportPorterItem {
  q: string;
  v: number;
  reason: string;
}

export interface CourseReportSafetyItem {
  label: string;
  v: number | null;
  score: number;
  limits: string;
}

export interface CourseReportQuarterRow {
  label: string;
  vals: (number | null)[];
  ttm: number | null;
}

export interface CourseReportPdfData {
  sym: string;
  name: string;
  sec: string;
  typeLabel: string;
  type: string;
  px: number | null;
  pe: number | null;
  pb: number | null;
  roe: number | null;
  deAssets: number | null;
  de: number | null;
  shariaOk: boolean | null;
  porterItems: CourseReportPorterItem[];
  porterTotal: number;
  porterComp: number;
  porterLabel: string;
  quarters: { periods: string[]; rows: CourseReportQuarterRow[] };
  gNet: number | null;
  gs: number;
  safetyItems: CourseReportSafetyItem[];
  totalSafety: number;
  safetyComp: number;
  buildUp: { porterWeight: number; safetyWeight: number; bondRate: number; r: string };
  gl: number;
  n: number;
  epv: { bear: number; base: number; bull: number; vs: number } | null;
  zone: string;
  verdict: string;
  warnings: Array<[string, string]>;
  isBank: boolean;
}

const numOrDash = (v: number | null | undefined, dec = 2) =>
  has(v) && !Number.isNaN(Number(v)) ? Number(v).toFixed(dec) : "—";

const scoreWord = (s: number) => (s > 0 ? "Within limit" : s === 0 ? "Neutral" : "Outside limit");

export async function generateCourseReportPdf(d: CourseReportPdfData): Promise<void> {
  const ctx = await createRebhPdf();
  const { doc } = ctx;

  ctx.drawHeader({
    symbol: d.sym,
    title: d.name,
    subtitle: `Khurafshi Course Educational Report - ${d.sec}`,
  });

  // ── 1. Snapshot ────────────────────────────────────────────────────────────
  ctx.heading("1. Company Snapshot & Quantitative Sharia Screen", 6);
  ctx.kvTable([
    ["Price", numOrDash(d.px)],
    ["Price/Earnings (P/E)", has(d.pe) ? `${fmt1(d.pe)}×` : "—"],
    ["Price/Book Value (P/B)", has(d.pb) ? `${fmt1(d.pb)}×` : "—"],
    ["Return on Equity (ROE)", has(d.roe) ? `${fmt1(d.roe)}%` : "—"],
    ["Methodology Classification", d.typeLabel],
    ["Debt to Assets", has(d.deAssets) ? `${fmt1(d.deAssets)}%` : "—"],
    ["Quantitative Sharia Screen (below 33%)", d.shariaOk == null ? "N/A" : d.shariaOk ? "Quantitatively compliant" : "Exceeds cap"],
  ]);

  // ── 2. Porter five forces ──────────────────────────────────────────────────
  ctx.heading("2. Michael Porter's Five Forces (0–1 per force)", d.porterItems.length + 2);
  ctx.rtlGrid(
    orient(["Force", "Score", "Rationale"]),
    [
      ...d.porterItems.map((it) => orient([it.q, it.v.toFixed(2), it.reason])),
      orient(["Total & Premium", `${d.porterTotal.toFixed(2)}/5`, `${d.porterComp}% — ${d.porterLabel}`]),
    ]
  );

  // ── 3. Quarterly financials ────────────────────────────────────────────────
  if (d.quarters.rows.length > 0) {
    ctx.heading("3. Financial Statements — Realized Quarters (SAR millions)", d.quarters.rows.length + 1);
    ctx.rtlGrid(
      orient(["Line Item", ...d.quarters.periods, "TTM"]),
      d.quarters.rows.map((r) =>
        orient([
          r.label,
          ...r.vals.map((v) => (v != null ? Math.round(v).toLocaleString("en-US") : "—")),
          r.ttm != null ? Math.round(r.ttm).toLocaleString("en-US") : "—",
        ])
      )
    );
  }

  // ── 4. Growth ──────────────────────────────────────────────────────────────
  ctx.heading("4. Growth (Determination by Elimination First)", 3);
  const gNet = d.gNet;
  ctx.kvTable([
    ["Simple (latest period)", gNet != null ? `${gNet >= 0 ? "+" : ""}${fmt1(gNet)}%` : "—"],
    ["Adopted GS (transitional growth)", `${d.gs}.0%`],
  ]);

  // ── 5. Safety elements ─────────────────────────────────────────────────────
  if (!d.isBank && d.safetyItems.length > 0) {
    ctx.heading("5. Financial Safety Elements (+1 / 0 / −1)", d.safetyItems.length + 1);
    ctx.rtlGrid(
      orient(["Element", "Value", "Thresholds", "Score"]),
      [
        ...d.safetyItems.map((it) => orient([it.label, numOrDash(it.v), it.limits, scoreWord(it.score)])),
        orient(["Total & Premium", `${d.totalSafety}`, "—", `${d.safetyComp}%`]),
      ]
    );
  }

  // ── 6. Build-Up R ──────────────────────────────────────────────────────────
  ctx.heading("6. Required Return — Build-Up", 5);
  ctx.kvTable([
    ["Porter Forces", `Weight ${(d.buildUp.porterWeight * 100).toFixed(0)}% · Premium ${d.porterComp}% · Contribution ${(d.buildUp.porterWeight * d.porterComp).toFixed(2)}%`],
    ["Safety Elements", d.isBank ? "Not applicable to banks" : `Weight ${(d.buildUp.safetyWeight * 100).toFixed(0)}% · Premium ${d.safetyComp}% · Contribution ${(d.buildUp.safetyWeight * d.safetyComp).toFixed(2)}%`],
    ["Bond Yield", `${d.buildUp.bondRate}%`],
    ["Required R", `${d.buildUp.r}% (within course range 4–12)`],
    ["Adopted GL & N", `GL=${d.gl}% · N=${d.n}`],
  ]);

  // ── 7. Nine-box zones ──────────────────────────────────────────────────────
  if (d.epv) {
    ctx.heading("7. Nine-Box Matrix — Price Zones", 5);
    ctx.kvTable([
      ["From EPV (Bear)", numOrDash(d.epv.bear)],
      ["From EPV (Base)", numOrDash(d.epv.base)],
      ["From EPV (Bull)", numOrDash(d.epv.bull)],
      ["Current Price", numOrDash(d.px)],
      ["Price Zone", d.zone || "—"],
      ["vs. EPV Base", has(d.epv.vs) ? `${d.epv.vs >= 0 ? "+" : ""}${fmt1(d.epv.vs)}%` : "—"],
    ]);
  }

  // ── 8. Warnings & verdict ──────────────────────────────────────────────────
  if (d.warnings.length > 0) {
    ctx.heading("8. Red Flags & Buy Gate", d.warnings.length + 1);
    d.warnings.forEach(([type, msg]) =>
      ctx.paragraph(`${type === "w" ? "Warning" : "Sound"}: ${msg}`, { bullet: true, size: 9.5 })
    );
  }
  ctx.heading("Conclusion & Decision", 2);
  ctx.paragraph(d.verdict, { bold: true });
  ctx.paragraph("This is educational analysis per the course methodology and is not an investment recommendation.", { size: 9 });

  ctx.drawFooter();
  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`REBH_CourseReport_${d.sym}_${dateStr}.pdf`);
}