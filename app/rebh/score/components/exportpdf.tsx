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
    title: "بطاقة تغطية المنصة — 35 متطلباً",
    subtitle: "Platform Coverage Scorecard",
  });

  ctx.paragraph(
    "35 مستشاراً ومعياراً استثمارياً ومؤسسياً — كل واحد له مطلب محدد، والمنصة توثّق كيف تُجيب عنه. هذه المصفوفة تغطية توثيقية وليست درجات محسوبة مستقلة لكل مستشار.",
    { size: 10 }
  );
  ctx.paragraph(
    "تنبيه: هذا Scorecard يقيّم تغطية المنصة لا السهم — score: 10 يعني أن الأداة متوفرة، لا أن كل سهم مناسب للشراء.",
    { size: 9.5 }
  );

  // ── Live stats ─────────────────────────────────────────────────────────────
  if (d.liveData) {
    ctx.heading("أرقام حية من قاعدة البيانات", 6);
    ctx.kvTable([
      ["تاريخ الحساب", d.liveData.computed_at ?? "—"],
      ["كون الشركات", `${num(d.liveData.total_coverage)} شركة`],
      ["مجتازة الاختبار", `${num(d.liveData.pass_count)} شركة`],
      ["محجورة (Too-Hard)", `${num(d.liveData.stale_quarantined)} شركة`],
      ["أسعار سوقية حية", `${num(d.liveData.live_price_symbols)} رمز`],
      ["قطاعات فريدة", `${num(d.liveData.sectors_unique)} قطاع`],
    ]);
  }

  // ── Coverage matrix (per school) ───────────────────────────────────────────
  d.groups.forEach((g) => {
    ctx.heading(`${g.label} (${g.labelEn}) — ${g.rows.length} متطلبات`, g.rows.length + 1);
    ctx.rtlGrid(
      ["المستشار", "المطلب", "كيف تُجيب المنصة", "أين في المنصة"],
      g.rows.map((a) => [a.advisor, a.demand, a.platformAnswer, a.where]),
      30
    );
  });

  ctx.drawFooter();
  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`REBH_Scorecard_${dateStr}.pdf`);
}
