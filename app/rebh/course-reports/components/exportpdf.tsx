// PDF generator for the Khurafshi course company report (rebh/course-reports).
// Uses the shared REBH PDF pipeline (Amiri fonts, RTL bidi, unified maroon
// header, disclaimer footer) from @/lib/rebh/pdf.

import { createRebhPdf, fmt1, has } from "@/lib/rebh/pdf";

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

const scoreWord = (s: number) => (s > 0 ? "ضمن الحد" : s === 0 ? "محايد" : "خارج الحد");

export async function generateCourseReportPdf(d: CourseReportPdfData): Promise<void> {
  const ctx = await createRebhPdf();
  const { doc } = ctx;

  ctx.drawHeader({
    symbol: d.sym,
    title: d.name,
    subtitle: `تقرير دورة الخرفشي التعليمي - ${d.sec}`,
  });

  // ── 1. Snapshot ────────────────────────────────────────────────────────────
  ctx.heading("1. بطاقة الشركة والفحص الشرعي الكمي", 6);
  ctx.kvTable([
    ["السعر", numOrDash(d.px)],
    ["مكرر الأرباح P/E", has(d.pe) ? `${fmt1(d.pe)}×` : "—"],
    ["مكرر القيمة الدفترية P/B", has(d.pb) ? `${fmt1(d.pb)}×` : "—"],
    ["العائد على حقوق المساهمين ROE", has(d.roe) ? `${fmt1(d.roe)}%` : "—"],
    ["التصنيف المنهجي", d.typeLabel],
    ["الدين إلى الأصول", has(d.deAssets) ? `${fmt1(d.deAssets)}%` : "—"],
    ["الفحص الشرعي الكمي (أقل من 33%)", d.shariaOk == null ? "غير متاح" : d.shariaOk ? "متوافق كمياً" : "تجاوز السقف"],
  ]);

  // ── 2. Porter five forces ──────────────────────────────────────────────────
  ctx.heading("2. قواعد مايكل بورتر الخمس (0-1 لكل قوة)", d.porterItems.length + 2);
  ctx.rtlGrid(
    ["القوة", "التقييم", "السبب"],
    [
      ...d.porterItems.map((it) => [it.q, it.v.toFixed(2), it.reason]),
      ["الإجمالي والتعويض", `${d.porterTotal.toFixed(2)}/5`, `${d.porterComp}% — ${d.porterLabel}`],
    ]
  );

  // ── 3. Quarterly financials ────────────────────────────────────────────────
  if (d.quarters.rows.length > 0) {
    ctx.heading("3. القوائم المالية — الأرباع المتحققة (بالمليون ريال)", d.quarters.rows.length + 1);
    ctx.rtlGrid(
      ["البند", ...d.quarters.periods, "TTM"],
      d.quarters.rows.map((r) => [
        r.label,
        ...r.vals.map((v) => (v != null ? Math.round(v).toLocaleString("en-US") : "—")),
        r.ttm != null ? Math.round(r.ttm).toLocaleString("en-US") : "—",
      ])
    );
  }

  // ── 4. Growth ──────────────────────────────────────────────────────────────
  ctx.heading("4. النمو (التحديد أولاً بالاستبعاد)", 3);
  const gNet = d.gNet;
  ctx.kvTable([
    ["البسيط (اللحظة الأخيرة)", gNet != null ? `${gNet >= 0 ? "+" : ""}${fmt1(gNet)}%` : "—"],
    ["GS النمو العابر المعتمد", `${d.gs}.0%`],
  ]);

  // ── 5. Safety elements ─────────────────────────────────────────────────────
  if (!d.isBank && d.safetyItems.length > 0) {
    ctx.heading("5. عناصر السلامة المالية (+1 / 0 / −1)", d.safetyItems.length + 1);
    ctx.rtlGrid(
      ["العنصر", "القيمة", "الحدود", "التقييم"],
      [
        ...d.safetyItems.map((it) => [it.label, numOrDash(it.v), it.limits, scoreWord(it.score)]),
        ["الإجمالي والتعويض", `${d.totalSafety}`, "—", `${d.safetyComp}%`],
      ]
    );
  }

  // ── 6. Build-Up R ──────────────────────────────────────────────────────────
  ctx.heading("6. العائد المناسب — Build-Up", 5);
  ctx.kvTable([
    ["قواعد بورتر", `الوزن ${(d.buildUp.porterWeight * 100).toFixed(0)}% · التعويض ${d.porterComp}% · الناتج ${(d.buildUp.porterWeight * d.porterComp).toFixed(2)}%`],
    ["عناصر السلامة", d.isBank ? "لا تُطبق على البنوك" : `الوزن ${(d.buildUp.safetyWeight * 100).toFixed(0)}% · التعويض ${d.safetyComp}% · الناتج ${(d.buildUp.safetyWeight * d.safetyComp).toFixed(2)}%`],
    ["عائد السند", `${d.buildUp.bondRate}%`],
    ["R المطلوب", `${d.buildUp.r}% (ضمن نطاق الدورة 4-12)`],
    ["GL المعتمد و N", `GL=${d.gl}% · N=${d.n}`],
  ]);

  // ── 7. Nine-box zones ──────────────────────────────────────────────────────
  if (d.epv) {
    ctx.heading("7. المربع التسعة — مناطق الأسعار", 5);
    ctx.kvTable([
      ["من EPV (دب)", numOrDash(d.epv.bear)],
      ["من EPV (أساس)", numOrDash(d.epv.base)],
      ["من EPV (ثور)", numOrDash(d.epv.bull)],
      ["السعر الحالي", numOrDash(d.px)],
      ["المنطقة السعرية", d.zone || "—"],
      ["المقارنة بـ EPV الأساس", has(d.epv.vs) ? `${d.epv.vs >= 0 ? "+" : ""}${fmt1(d.epv.vs)}%` : "—"],
    ]);
  }

  // ── 8. Warnings & verdict ──────────────────────────────────────────────────
  if (d.warnings.length > 0) {
    ctx.heading("8. الأعلام الحمراء وبوابة الشراء", d.warnings.length + 1);
    d.warnings.forEach(([type, msg]) =>
      ctx.paragraph(`${type === "w" ? "تنبيه" : "سليم"}: ${msg}`, { bullet: true, size: 9.5 })
    );
  }
  ctx.heading("الخلاصة والقرار", 2);
  ctx.paragraph(d.verdict, { bold: true });
  ctx.paragraph("هذا تحليل تعليمي وفق منهجية الدورة وليس توصية استثمارية.", { size: 9 });

  ctx.drawFooter();
  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`REBH_CourseReport_${d.sym}_${dateStr}.pdf`);
}
