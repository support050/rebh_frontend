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
  has(v) && !Number.isNaN(Number(v)) ? `${Number(v).toFixed(dec)} SAR` : "—";

export async function generateOfficialReportPdf(d: OfficialReportPdfData): Promise<void> {
  const ctx = await createRebhPdf();
  const { doc } = ctx;

  ctx.drawHeader({
    symbol: d.symbol,
    title: d.name,
    subtitle: "Comprehensive Analytical Financial Report",
  });

  // ── 1. Core metrics ────────────────────────────────────────────────────────
  ctx.heading("1. Key Metrics & Market Pricing Structure (Market Pricing & Scale)", 5);
  ctx.kvTable([
    ["Market Price", sar(d.px, 2)],
    ["Market Capitalization", d.mc ? `${(d.mc / 1000).toFixed(1)}B SAR` : "—"],
    ["P/E Ratio", d.pe != null ? `${Number(d.pe).toFixed(1)}x` : "—"],
    ["Piotroski F-Score", `${d.fScore}/9`],
    ["Sector", d.sector],
    ["Methodology Classification", d.category],
    ["Data As-Of Date", d.asOf],
  ]);

  // ── 1.1 TTM provenance ─────────────────────────────────────────────────────
  if (d.ttm) {
    ctx.heading("1.1 Quarterly Financial Statement Provenance (TTM Provenance)", 4);
    ctx.kvTable([
      ["Periods Included in TTM Calculation", `${d.ttm.quartersCount} consecutive periods`],
      ["Statement Completeness", d.ttm.isComplete ? "Complete" : "Partial estimate"],
      ["TTM Revenue", d.ttm.revenue ? `${(d.ttm.revenue / 1000).toFixed(1)}B SAR` : "—"],
      ["TTM Net Income", d.ttm.netProfit ? `${(d.ttm.netProfit / 1000).toFixed(1)}B SAR` : "—"],
    ]);
  }

  // ── 2. Shariah & capital structure ─────────────────────────────────────────
  ctx.heading("2. Capital Structure & Quantitative Shariah Screening (Shariah Quantitative Legs)", 4);
  ctx.rtlGrid(
    ["Financial Criterion", "Reference Threshold", "Computed Ratio", "Quantitative Screen Status"],
    [
      [
        "Debt-to-Equity Ratio (D/E)",
        "Moderate: below 1.0x",
        d.de != null ? `${Number(d.de).toFixed(2)}x` : "—",
        d.de != null ? (d.de < 1.0 ? "Sound" : "Caution") : "—",
      ],
      [
        "Debt-to-Assets Ratio (Debt / Assets)",
        "≤ 33.0%",
        d.debtToAssetsPct != null ? `${Number(d.debtToAssetsPct).toFixed(1)}%` : "Source unavailable",
        d.debtToAssetsPct != null ? (d.debtToAssetsPct <= 33 ? "Quantitatively compliant" : "Exceeds cap") : "Pending retrieval",
      ],
      [
        "Liquidity Ratio (Current Ratio)",
        "≥ 1.50x",
        d.current != null ? `${Number(d.current).toFixed(2)}x` : "—",
        d.current != null ? (d.current >= 1.5 ? "Strong" : "Acceptable") : "—",
      ],
    ]
  );

  // ── 3. Safety cluster & Build-Up R ─────────────────────────────────────────
  ctx.heading("3. Safety Cluster & Required Return (Khurafshi Build-Up R)", 4);
  ctx.kvTable([
    ["Adopted Required Return R (Build-Up)", `${d.requiredReturnPct}%`],
    ["Required Return Components", d.buildUpFormula ?? "—"],
    ["Base Instrument Source", d.buildUpSource ?? "—"],
  ]);
  ctx.paragraph(d.safetyNarrative);

  // ── 3.1 Nine-Box matrix ────────────────────────────────────────────────────
  if (d.nineBox) {
    ctx.heading("3.1 Adopted Nine-Box Valuation Matrix (Khurafshi 9-Box Matrix)", 4);
    ctx.paragraph(
      `Valuation of the stock across the three pillars at three growth levels (zero, long-term ${d.nineBox.glPct}%, and short-term ${d.nineBox.gsPct}%):`
    );
    const row = (label: string, r: NineBoxRow | null): string[] => [
      label,
      sar(r?.x_value),
      sar(r?.v1),
      sar(r?.v2),
      sar(r?.v3),
    ];
    ctx.rtlGrid(
      ["Methodology Pillar", "Base Value X", "V1 (No Growth)", `V2 (Perpetual Growth ${d.nineBox.glPct}%)`, `V3 (Transitional Growth ${d.nineBox.gsPct}%)`],
      [
        row("Earnings per Share (Earnings)", d.nineBox.earnings),
        row("Free Cash Flow after Net Debt (FCF Net Debt)", d.nineBox.fcfNetDebt),
        row("Cash Dividends (Dividends)", d.nineBox.dividends),
      ]
    );
    if (d.zones) {
      ctx.kvTable([
        ["Gold Threshold", sar(d.zones.goldMax)],
        ["Silver Threshold", sar(d.zones.silverMax)],
        ["Bronze Threshold", sar(d.zones.bronzeMax)],
        ["Current Price Zone", d.zones.currentZone],
      ]);
    }
  }

  // ── 4. R x GS stress matrix ────────────────────────────────────────────────
  ctx.heading("4. Two-Way Stress Matrix (R × GS Stress Matrix)", 5);
  ctx.paragraph("Fair value sensitivity table per share (SAR) at the intersection of required return rates R and expected growth rates GS:");
  const gsHead = ["R \\ GS", ...d.gsRates.map((g) => `Growth ${(g * 100).toFixed(0)}%`)];
  const matrixRows = d.rRates.map((r) => [
    `Discount ${(r * 100).toFixed(0)}%`,
    ...d.gsRates.map((g) => {
      const baseVal = d.eps && d.eps > 0 && r > g ? (d.eps * (1 + g)) / (r - g) : 0;
      return baseVal > 0 ? baseVal.toFixed(1) : "—";
    }),
  ]);
  ctx.rtlGrid(gsHead, matrixRows);

  // ── 5. Reverse DCF ─────────────────────────────────────────────────────────
  ctx.heading("5. Reverse Valuation & Market Expectations (Reverse DCF Analysis)", 3);
  ctx.kvTable([
    ["Growth Rate Currently Priced into the Stock by the Market", d.impliedGrowthPct != null ? `${d.impliedGrowthPct}%` : "—"],
  ]);
  ctx.paragraph(d.reverseDcfNote);

  // ── 6. Analyst notes ───────────────────────────────────────────────────────
  if (d.userNotes && clean(d.userNotes)) {
    ctx.heading("6. Analyst Notes & Thesis (Analyst Notes & Thesis)", 3);
    ctx.paragraph(d.userNotes);
  }

  ctx.drawFooter();
  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`REBH_${d.symbol}_OfficialReport_${dateStr}.pdf`);
}