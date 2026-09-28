// PDF generator for the analyst statements page (rebh/analyst/[symbol]).
// Uses the shared REBH PDF pipeline (Amiri fonts, RTL bidi, unified maroon
// header, disclaimer footer) from @/lib/rebh/pdf.

import { createRebhPdf, fmt1, has } from "@/lib/rebh/pdf";

export interface AnalystRatioItem {
  id: string;
  label: string;
  value: number | null;
  unit: string;
}

export interface AnalystRatioGroup {
  title: string;
  rows: AnalystRatioItem[];
}

export interface AnalystPdfData {
  symbol: string;
  name: string;
  nameEn: string;
  sector: string;
  isBank: boolean;
  templateLabel: string;
  templateNotes: string[];
  groups: AnalystRatioGroup[];
  safetyPass: boolean | null;
  qualityPass: boolean | null;
  ttm: { rev: number | null; gp: number | null; net: number | null; eps: number | null } | null;
  peers: { sym: string; name: string; roe: number }[];
  peersCount: number;
}

const fmtVal = (v: number | null, unit: string) =>
  has(v) && !Number.isNaN(Number(v))
    ? unit === "%" || unit === "\u00D7"
      ? `${fmt1(v)}${unit}`
      : `${fmt1(v)} ${unit}`
    : "\u2014";

export async function generateAnalystPdf(d: AnalystPdfData): Promise<void> {
  const ctx = await createRebhPdf();
  const { doc } = ctx;

  ctx.drawHeader({
    symbol: d.symbol,
    title: d.name,
    subtitle: "القوائم المالية والنسب المحاسبية",
  });

  // ── 1. TTM snapshot ────────────────────────────────────────────────────────
  if (d.ttm && (has(d.ttm.rev) || has(d.ttm.net))) {
    ctx.heading("1. ملخص الأداء السنوي المتحرك (TTM)", 5);
    ctx.kvTable([
      ["الإيرادات السنوية TTM", has(d.ttm.rev) ? `${(Number(d.ttm.rev) / 1000).toFixed(1)}B ر.س` : "—"],
      ["إجمالي الربح TTM", has(d.ttm.gp) ? `${(Number(d.ttm.gp) / 1000).toFixed(1)}B ر.س` : "—"],
      ["صافي الربح TTM", has(d.ttm.net) ? `${(Number(d.ttm.net) / 1000).toFixed(1)}B ر.س` : "—"],
      ["ربحية السهم TTM (EPS)", has(d.ttm.eps) ? `${Number(d.ttm.eps).toFixed(2)} ر.س` : "—"],
    ]);
  }

  // ── 2. Dual verdict ────────────────────────────────────────────────────────
  ctx.heading("2. الحكم المزدوج للسلامة والجودة (Dual Verdict)", 3);
  ctx.kvTable([
    ["فحص السلامة المالية (ديون + سيولة)", d.safetyPass == null ? "غير متاح" : d.safetyPass ? "اجتاز الفحص" : "لم يجتز الفحص"],
    ["فحص جودة الأرباح (ROE + هامش صافي)", d.qualityPass == null ? "غير متاح" : d.qualityPass ? "اجتاز الفحص" : "لم يجتز الفحص"],
  ]);

  // ── 3. Ratio groups (sector template) ──────────────────────────────────────
  ctx.heading("3. لوحة النسب المالية حسب القالب القطاعي", 8);
  d.groups.forEach((g) => {
    ctx.paragraph(g.title, { bold: true, size: 10.5 });
    ctx.rtlGrid(
      ["القيمة", "النسبة المالية"],
      g.rows.map((r) => [fmtVal(r.value, r.unit), r.label])
    );
  });

  // ── 4. Sector template notes ───────────────────────────────────────────────
  ctx.heading("4. ملاحظات القالب القطاعي", d.templateNotes.length + 1);
  ctx.paragraph(`القالب المعتمد: ${d.templateLabel}`, { bold: true });
  d.templateNotes.forEach((n) => ctx.paragraph(n, { bullet: true, size: 9.5 }));

  // ── 5. Peer ROE comparison ─────────────────────────────────────────────────
  if (d.peers.length > 0) {
    ctx.heading("5. مقارنة ROE بمنافسي القطاع", d.peers.length + 1);
    ctx.paragraph(`عدد الشركات في قطاع ${d.sector}: ${d.peersCount} شركة`, { size: 9.5 });
    ctx.rtlGrid(
      ["ROE", "الشركة", "الرمز"],
      d.peers.map((p) => [`${fmt1(p.roe)}%`, p.name, p.sym])
    );
  }

  ctx.drawFooter();
  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`REBH_${d.symbol}_Analyst_${dateStr}.pdf`);
}
