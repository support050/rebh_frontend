// PDF generator for the platform coverage scorecard (rebh/score).
// Uses the shared REBH PDF pipeline (Amiri fonts, RTL bidi, unified maroon
// header, disclaimer footer) from @/lib/rebh/pdf.

import { createRebhPdf, num } from "@/lib/rebh/pdf";

export interface ScorecardAdvisorRow {
  id: number;
  advisor: string;
  advisorEn: string;
  demand: string;
  platformAnswer: string;
  where: string;
  score: number;
}

export interface ScorecardPdfGroup {
  label: string;
  labelEn: string;
  rows: ScorecardAdvisorRow[];
}

export interface ScorecardLiveData {
  computed_at?: string | null;
  total_coverage?: number | null;
  pass_count?: number | null;
  stale_quarantined?: number | null;
  live_price_symbols?: number | null;
  sectors_unique?: number | null;
  forensic_pass?: number | null;
  coverage_pct?: number | null;
}

export interface ScorecardPdfData {
  groups: ScorecardPdfGroup[];
  liveData: ScorecardLiveData | null;
}

export async function generateScorecardPdf(d: ScorecardPdfData): Promise<void> {
  const ctx = await createRebhPdf();
  const { doc } = ctx;

  ctx.drawHeader({
    title: "Platform Coverage Scorecard — 35 Requirements",
    subtitle: "Investment Advisor & Institutional Standards Coverage Matrix",
  });

  ctx.paragraph(
    "35 investment advisors and institutional standards — each with a specific requirement, and the platform documents how it answers each one. This matrix is a documented coverage map, not an independently computed score for each advisor.",
    { size: 10 }
  );
  ctx.paragraph(
    "Note: this Scorecard evaluates platform coverage, not any individual stock — a score of 10 means the tool is available, not that every stock is a suitable buy.",
    { size: 9.5 }
  );

  // ── Live stats ─────────────────────────────────────────────────────────────
  if (d.liveData) {
    ctx.heading("Live Database Figures", 6);
    ctx.kvTable([
      ["Computed At", d.liveData.computed_at ?? "—"],
      ["Company Universe", `${num(d.liveData.total_coverage)} companies`],
      ["Passed Screening", `${num(d.liveData.pass_count)} companies`],
      ["Quarantined (Too-Hard Pile)", `${num(d.liveData.stale_quarantined)} companies`],
      ["Live Market Prices", `${num(d.liveData.live_price_symbols)} symbols`],
      ["Unique Sectors", `${num(d.liveData.sectors_unique)} sectors`],
    ]);
  }

  // ── Coverage matrix (per school) ───────────────────────────────────────────
  d.groups.forEach((g) => {
    const groupTitle = g.labelEn && g.labelEn !== g.label ? `${g.label} (${g.labelEn})` : g.label;
    ctx.heading(`${groupTitle} — ${g.rows.length} requirements`, g.rows.length + 1);
    ctx.rtlGrid(
      ["Advisor", "Requirement", "How the Platform Answers", "Where in the Platform"],
      g.rows.map((a) => [a.advisor, a.demand, a.platformAnswer, a.where]),
      30
    );
  });

  ctx.drawFooter();
  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`REBH_Scorecard_${dateStr}.pdf`);
}