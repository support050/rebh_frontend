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
    title: d.nameEn || d.name,
    subtitle: "Financial Statements & Accounting Ratios",
  });

  // ── 1. TTM snapshot ────────────────────────────────────────────────────────
  if (d.ttm && (has(d.ttm.rev) || has(d.ttm.net))) {
    ctx.heading("1. Trailing Twelve Months (TTM) Performance Summary", 5);
    ctx.kvTable([
      ["TTM Revenue", has(d.ttm.rev) ? `SAR ${(Number(d.ttm.rev) / 1000).toFixed(1)}B` : "—"],
      ["TTM Gross Profit", has(d.ttm.gp) ? `SAR ${(Number(d.ttm.gp) / 1000).toFixed(1)}B` : "—"],
      ["TTM Net Income", has(d.ttm.net) ? `SAR ${(Number(d.ttm.net) / 1000).toFixed(1)}B` : "—"],
      ["TTM Earnings per Share (EPS)", has(d.ttm.eps) ? `SAR ${Number(d.ttm.eps).toFixed(2)}` : "—"],
    ]);
  }

  // ── 2. Dual verdict ────────────────────────────────────────────────────────
  ctx.heading("2. Dual Verdict: Solvency & Earnings Quality", 3);
  ctx.kvTable([
    ["Solvency Verdict (Debt + Liquidity)", d.safetyPass == null ? "N/A" : d.safetyPass ? "Pass" : "Fail"],
    ["Earnings Quality Verdict (ROE + Net Margin)", d.qualityPass == null ? "N/A" : d.qualityPass ? "Pass" : "Fail"],
  ]);

  // ── 3. Ratio groups (sector template) ──────────────────────────────────────
  ctx.heading("3. Financial Ratio Dashboard by Sector Template", 8);
  d.groups.forEach((g) => {
    ctx.paragraph(g.title, { bold: true, size: 10.5 });
    ctx.rtlGrid(
      ["Financial Ratio", "Value"],
      g.rows.map((r) => [r.label, fmtVal(r.value, r.unit)])
    );
  });

  // ── 4. Sector template notes ───────────────────────────────────────────────
  ctx.heading("4. Sector Template Notes", d.templateNotes.length + 1);
  ctx.paragraph(`Applied Template: ${d.templateLabel}`, { bold: true });
  d.templateNotes.forEach((n) => ctx.paragraph(n, { bullet: true, size: 9.5 }));

  // ── 5. Peer ROE comparison ─────────────────────────────────────────────────
  if (d.peers.length > 0) {
    ctx.heading("5. Return on Equity (ROE) vs. Sector Peers", d.peers.length + 1);
    ctx.paragraph(`Number of companies in the ${d.sector} sector: ${d.peersCount}`, { size: 9.5 });
    ctx.rtlGrid(
      ["Ticker", "Company", "ROE"],
      d.peers.map((p) => [p.sym, p.name, `${fmt1(p.roe)}%`])
    );
  }

  ctx.drawFooter();
  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`REBH_${d.symbol}_Analyst_${dateStr}.pdf`);
}