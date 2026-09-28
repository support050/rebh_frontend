// PDF generator for the official analytical report (rebh/report/[symbol]).
// Uses the shared REBH PDF pipeline (Amiri fonts, RTL bidi, unified maroon
// header, disclaimer footer) from @/lib/rebh/pdf.

import { createRebhPdf, clean, has } from "@/lib/rebh/pdf";

export interface NineBoxRow {
  x_value?: number | null;
  v1?: number | null;
  v2?: number | null;
  v3?: number | null;
}

export interface OfficialReportPdfData {
  symbol: string;
  name: string;
  sector: string;
  category: string;
  asOf: string;
  px: number;
  mc: number;
  pe: number | null;
  fScore: number;
  eps: number | null;
  de: number | null;
  debtToAssetsPct: number | null;
  current: number | null;
  roe: number | null;
  roa: number | null;
  requiredReturnPct: number;
  buildUpFormula: string | null;
  buildUpSource: string | null;
  ttm: {
    quartersCount: number;
    isComplete: boolean;
    revenue: number | null;
    netProfit: number | null;
  } | null;
  safetyNarrative: string;
  nineBox: {
    glPct: number;
    gsPct: number;
    earnings: NineBoxRow | null;
    fcfNetDebt: NineBoxRow | null;
    dividends: NineBoxRow | null;
  } | null;
  zones: {
    goldMax: number;
    silverMax: number;
    bronzeMax: number;
    currentZone: string;
  } | null;
  impliedGrowthPct: number | null;
  reverseDcfNote: string;
  userNotes: string | null;
  rRates: number[];
  gsRates: number[];
}

const sar = (v: number | null | undefined, dec = 1) =>
  has(v) && !Number.isNaN(Number(v)) ? `${Number(v).toFixed(dec)} ر.س` : "—";

export async function generateOfficialReportPdf(d: OfficialReportPdfData): Promise<void> {
  const ctx = await createRebhPdf();
  const { doc } = ctx;

  ctx.drawHeader({
    symbol: d.symbol,
    title: d.name,
    subtitle: "التقرير المالي التحليلي الشامل",
  });

  // ── 1. Core metrics ────────────────────────────────────────────────────────
  ctx.heading("1. المؤشرات الأساسية وهيكل التسعير السوقي (Market Pricing & Scale)", 5);
  ctx.kvTable([
    ["السعر السوقي", sar(d.px, 2)],
    ["القيمة السوقية", d.mc ? `${(d.mc / 1000).toFixed(1)}B ر.س` : "—"],
    ["مكرر الأرباح P/E", d.pe != null ? `${Number(d.pe).toFixed(1)}x` : "—"],
    ["جودة بيوتروسكي", `${d.fScore}/9`],
    ["القطاع", d.sector],
    ["التصنيف المنهجي", d.category],
    ["تاريخ السحب والإصدار", d.asOf],
  ]);

  // ── 1.1 TTM provenance ─────────────────────────────────────────────────────
  if (d.ttm) {
    ctx.heading("1.1 توثيق القوائم المالية ربع السنوية (TTM Provenance)", 4);
    ctx.kvTable([
      ["الفترات المشمولة في حساب TTM", `${d.ttm.quartersCount} فترات متتالية`],
      ["اكتمال القوائم", d.ttm.isComplete ? "مكتملة" : "تقدير جزئي"],
      ["الإيرادات السنوية TTM", d.ttm.revenue ? `${(d.ttm.revenue / 1000).toFixed(1)}B ر.س` : "—"],
      ["صافي الدخل TTM", d.ttm.netProfit ? `${(d.ttm.netProfit / 1000).toFixed(1)}B ر.س` : "—"],
    ]);
  }

  // ── 2. Shariah & capital structure ─────────────────────────────────────────
  ctx.heading("2. فحص الهيكل المالي والضوابط الشرعية الكمية (Shariah Quantitative Legs)", 4);
  ctx.rtlGrid(
    ["المعيار المالي", "الحد الأقصى المرجعي", "النسبة الفعلية المحسوبة", "حالة الشاشة الكمية"],
    [
      [
        "نسبة الديون إلى حقوق الملكية (D/E)",
        "معتدل أقل من 1.0x",
        d.de != null ? `${Number(d.de).toFixed(2)}x` : "—",
        d.de != null ? (d.de < 1.0 ? "سليم" : "تنبيه") : "—",
      ],
      [
        "الديون بالنسبة للأصول (Debt / Assets)",
        "أقل أو يساوي 33.0%",
        d.debtToAssetsPct != null ? `${Number(d.debtToAssetsPct).toFixed(1)}%` : "مصدر غير متاح",
        d.debtToAssetsPct != null ? (d.debtToAssetsPct <= 33 ? "متوافق كمياً" : "تجاوز السقف") : "قيد السحب",
      ],
      [
        "نسبة التداول والسيولة (Current Ratio)",
        "أكبر أو يساوي 1.50x",
        d.current != null ? `${Number(d.current).toFixed(2)}x` : "—",
        d.current != null ? (d.current >= 1.5 ? "قوي" : "مقبول") : "—",
      ],
    ]
  );

  // ── 3. Safety cluster & Build-Up R ─────────────────────────────────────────
  ctx.heading("3. عنقود السلامة والعائد المطلوب (Khurafshi Build-Up R)", 4);
  ctx.kvTable([
    ["العائد المطلوب المعتمد R (Build-Up)", `${d.requiredReturnPct}%`],
    ["مكونات العائد المطلوب", d.buildUpFormula ?? "—"],
    ["مصدر الصك الأساسي", d.buildUpSource ?? "—"],
  ]);
  ctx.paragraph(d.safetyNarrative);

  // ── 3.1 Nine-Box matrix ────────────────────────────────────────────────────
  if (d.nineBox) {
    ctx.heading("3.1 مصفوفة التقييم التساعية المعتمدة (Khurafshi 9-Box Matrix)", 4);
    ctx.paragraph(
      `تقييم السهم عبر الركائز الثلاث بمستويات النمو الثلاثة (صفر، طويل الأجل ${d.nineBox.glPct}%，وقصير الأجل ${d.nineBox.gsPct}%):`
    );
    const row = (label: string, r: NineBoxRow | null): string[] => [
      label,
      sar(r?.x_value),
      sar(r?.v1),
      sar(r?.v2),
      sar(r?.v3),
    ];
    ctx.rtlGrid(
      ["الركيزة المنهجية", "القيمة الأساسية X", "V1 (بدون نمو)", `V2 (نمو دائم ${d.nineBox.glPct}%)`, `V3 (نمو انتقالي ${d.nineBox.gsPct}%)`],
      [
        row("أرباح السهم (Earnings)", d.nineBox.earnings),
        row("التدفق الحر بعد الدين (FCF Net Debt)", d.nineBox.fcfNetDebt),
        row("التوزيعات النقدية (Dividends)", d.nineBox.dividends),
      ]
    );
    if (d.zones) {
      ctx.kvTable([
        ["حد الذهب", sar(d.zones.goldMax)],
        ["حد الفضة", sar(d.zones.silverMax)],
        ["حد البرونز", sar(d.zones.bronzeMax)],
        ["المنطقة الحالية للسعر", d.zones.currentZone],
      ]);
    }
  }

  // ── 4. R x GS stress matrix ────────────────────────────────────────────────
  ctx.heading("4. مصفوفة الإجهاد الثنائية (R × GS Stress Matrix)", 5);
  ctx.paragraph("جدول حساسية القيمة العادلة للسهم (ر.س) عند تقاطع معدلات العائد المطلوب R مع معدلات النمو المتوقعة GS:");
  const gsHead = ["R \\ GS", ...d.gsRates.map((g) => `نمو ${(g * 100).toFixed(0)}%`)];
  const matrixRows = d.rRates.map((r) => [
    `خصم ${(r * 100).toFixed(0)}%`,
    ...d.gsRates.map((g) => {
      const baseVal = d.eps && d.eps > 0 && r > g ? (d.eps * (1 + g)) / (r - g) : 0;
      return baseVal > 0 ? baseVal.toFixed(1) : "—";
    }),
  ]);
  ctx.rtlGrid(gsHead, matrixRows);

  // ── 5. Reverse DCF ─────────────────────────────────────────────────────────
  ctx.heading("5. التقييم العكسي وتوقعات السوق (Reverse DCF Analysis)", 3);
  ctx.kvTable([
    ["معدل النمو الذي يسعره السوق حالياً في السهم", d.impliedGrowthPct != null ? `${d.impliedGrowthPct}%` : "—"],
  ]);
  ctx.paragraph(d.reverseDcfNote);

  // ── 6. Analyst notes ───────────────────────────────────────────────────────
  if (d.userNotes && clean(d.userNotes)) {
    ctx.heading("6. سجل وملاحظات المحلل الشخصية (Analyst Notes & Thesis)", 3);
    ctx.paragraph(d.userNotes);
  }

  ctx.drawFooter();
  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`REBH_${d.symbol}_OfficialReport_${dateStr}.pdf`);
}
