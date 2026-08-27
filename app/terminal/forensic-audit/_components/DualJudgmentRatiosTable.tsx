"use client";

import { ShieldCheck } from "lucide-react";
import type { ForensicCompanyData } from "../_hooks/useForensicSheetData";

interface Props {
  data: ForensicCompanyData;
}

interface RatioItem {
  n: string;
  v: string;
  crit: string | null;
  pass: boolean | null;
  p: number | null;
  read: string;
}

export default function DualJudgmentRatiosTable({ data }: Props) {
  const cur = data.cur || (data.peers as any)?.cur || {
    roe: null, nm: null, gm: null, pe: null, pb: null, g_net: null, g_rev: null, peg: null,
  };
  const pct = data.pct || (data.peers as any)?.pct || {
    roe: null, nm: null, gm: null, pe: null, pb: null, g_net: null, g_rev: null,
  };

  const bs = data.bs;
  const cf = data.cf;
  const isObj = data.income_statement;

  // 1. Balance Sheet Ratios (Computed dynamically from latest Annual Year & latest Quarter)
  const bsCash = bs?.cash || [];
  const bsRec = bs?.receivables || [];
  const bsCA = bs?.current_assets || [];
  const bsCL = bs?.current_liabilities || [];
  const bsShortDebt = bs?.short_debt || [];
  const bsLongDebt = bs?.long_debt || [];
  const bsEquity = bs?.total_equity || [];

  // Indices: last annual index vs latest quarter index
  const lastIdx = bsCA.length - 1; // latest period (e.g. Q1'26)
  const annIdx = bsCA.length >= 2 ? bsCA.length - 2 : lastIdx; // latest full annual year (2025)

  // ── Dynamic calculations from real data ──────────────────────────────────

  // Current Ratio: computed from BS data — no hardcoded fallback
  const crAnnual = annIdx >= 0 && bsCL[annIdx] > 0 ? (bsCA[annIdx] / bsCL[annIdx]) : null;
  const crLatest = lastIdx >= 0 && bsCL[lastIdx] > 0 ? (bsCA[lastIdx] / bsCL[lastIdx]) : null;

  // Quick Ratio: (Cash + Receivables) / Current Liabilities
  const quickAssetsAnn = (bsCash[annIdx] || 0) + (bsRec[annIdx] || 0);
  const qrAnnual = annIdx >= 0 && bsCL[annIdx] > 0 ? (quickAssetsAnn / bsCL[annIdx]) : null;

  // Debt to Equity Ratio: Total Debt / Total Equity
  const totDebtAnn = (bsShortDebt[annIdx] || 0) + (bsLongDebt[annIdx] || 0);
  const deAnnual = annIdx >= 0 && bsEquity[annIdx] > 0 ? (totDebtAnn / bsEquity[annIdx]) : null;
  const prevDebt = annIdx >= 1 ? ((bsShortDebt[annIdx - 1] || 0) + (bsLongDebt[annIdx - 1] || 0)) : null;
  const prevEquity = annIdx >= 1 ? bsEquity[annIdx - 1] : null;
  const prevDE = prevDebt != null && prevEquity && prevEquity > 0 ? (prevDebt / prevEquity) : null;

  // Interest Coverage: Operating Profit / Finance Costs
  const opArr = isObj?.op || [];
  const finCostArr = isObj?.fin_cost || [];
  const lastOpIdx = opArr.length - 1;
  const latestOp = lastOpIdx >= 0 ? opArr[lastOpIdx] : null;
  const latestFinCost = lastOpIdx >= 0 ? Math.abs(finCostArr[lastOpIdx] || 0) : null;
  const coverageRatio = latestOp != null && latestFinCost && latestFinCost > 0
    ? latestOp / latestFinCost
    : null;

  // ROA: Net Profit / Total Assets
  const annualNetArr = isObj?.net || data.net || [];
  const bsTotAssets = bs?.total_assets || [];
  const latestNetAnn = annIdx >= 0 ? annualNetArr[annIdx] : null;
  const latestTotalAssets = annIdx >= 0 ? bsTotAssets[annIdx] : null;
  const roaVal = latestNetAnn != null && latestTotalAssets && latestTotalAssets > 0
    ? (latestNetAnn / latestTotalAssets) * 100
    : null;

  // ROIC approx: NOPAT / Invested Capital (Equity + Debt - Cash)
  const nopat = latestOp != null ? latestOp * (1 - 0.025) : null; // ~2.5% zakat on OP
  const investedCapital = bsEquity[annIdx] != null && bsTotAssets[annIdx] != null
    ? (bsEquity[annIdx] || 0) + totDebtAnn - (bsCash[annIdx] || 0)
    : null;
  const roicVal = nopat != null && investedCapital && investedCapital > 0
    ? (nopat / investedCapital) * 100
    : null;

  // Capex / Revenue
  const capexArr = cf?.capex || [];
  const annualRevArr = isObj?.rev || data.rev || [];
  const lastCapex = capexArr.length > 0 ? Math.abs(capexArr[capexArr.length - 1]) : null;
  const lastRevForCapex = annualRevArr.length > 0 ? annualRevArr[annualRevArr.length - 1] : null;
  const capexRevPct = lastCapex != null && lastRevForCapex && lastRevForCapex > 0
    ? (lastCapex / lastRevForCapex) * 100
    : null;

  // FCF Ratios
  const cfFcf = cf?.fcf || [];
  const annualRev = isObj?.rev || data.rev || [];
  const annualNet = isObj?.net || data.net || [];
  const lastCfIdx = cfFcf.length - 1;

  const fcfPrev = lastCfIdx >= 1 ? cfFcf[lastCfIdx - 1] : null;
  const fcfLast = lastCfIdx >= 0 ? cfFcf[lastCfIdx] : null;
  const revPrev = annualRev.length >= 2 ? annualRev[annualRev.length - 2] : null;
  const revLast = annualRev.length >= 1 ? annualRev[annualRev.length - 1] : null;
  const netPrev = annualNet.length >= 2 ? annualNet[annualNet.length - 2] : null;

  const fcfRevPrevPct = fcfPrev != null && revPrev && revPrev > 0
    ? ((fcfPrev / revPrev) * 100).toFixed(1) : null;
  const fcfRevLastPct = fcfLast != null && revLast && revLast > 0
    ? ((fcfLast / revLast) * 100).toFixed(1) : null;
  const fcfNetPrevPct = fcfPrev != null && netPrev && netPrev > 0
    ? ((fcfPrev / netPrev) * 100).toFixed(1) : null;

  // Revenue & Net CAGR (5yr, 3yr)
  const revAll = isObj?.rev || data.rev || [];
  const netAll = isObj?.net || data.net || [];
  const revCAGR5 = revAll.length >= 6
    ? ((Math.pow(revAll[revAll.length - 1] / revAll[revAll.length - 6], 1 / 5) - 1) * 100)
    : null;
  const netCAGR3 = netAll.length >= 4
    ? ((Math.pow(
        Math.abs(netAll[netAll.length - 1]) / Math.abs(netAll[netAll.length - 4]),
        1 / 3) - 1) * 100)
    : null;
  // 5yr net growth from base — flag if base is near zero
  const netBase5 = netAll.length >= 6 ? netAll[netAll.length - 6] : null;
  const netLast5 = netAll.length >= 1 ? netAll[netAll.length - 1] : null;
  const netBase5NearZero = netBase5 != null && Math.abs(netBase5) < 50;

  // Dynamic Valuation Ratios
  const peVal = cur.pe != null ? cur.pe.toFixed(1) : null;
  const pbVal = cur.pb != null ? cur.pb.toFixed(2) : null;
  const pegVal = cur.peg != null ? cur.peg.toFixed(2) : null;

  // Periods for labels
  const periods = isObj?.periods || data.periods_ar || data.periods_q || [];
  const lastPeriod = periods.length > 0 ? periods[periods.length - 1] : "آخر دورة";
  const prevPeriod = periods.length > 1 ? periods[periods.length - 2] : "السابقة";

  // ── Dynamic read generators ─────────────────────────────────────────────

  function readNm(v: number | null): string {
    if (v == null) return "—";
    return v >= 15 ? `فوق معيار 15% ✓ — المئين ${pct.nm ?? "—"} في القطاع` : `تحت معيار 15% ✗ — المئين ${pct.nm ?? "—"} في القطاع`;
  }
  function readRoe(v: number | null): string {
    if (v == null) return "—";
    return v >= 15 ? `فوق معيار 15% ✓ — المئين ${pct.roe ?? "—"}` : `تحت معيار 15% ✗ — المئين ${pct.roe ?? "—"} (Dupont أدناه)`;
  }
  function readCoverage(v: number | null): string {
    if (v == null) return "—";
    return v >= 3 ? `قوية ✓ (${v.toFixed(2)}× > معيار 3×)` : `ضعيفة ✗ — التمويل يلتهم ${(1 / v * 100).toFixed(0)}% من ربح العمليات`;
  }
  function readCurrent(cr: number | null, latest: number | null): string {
    if (cr == null) return "—";
    const latestStr = latest != null ? ` (آخر ربع: ${latest.toFixed(2)})` : "";
    return cr >= 1.5 ? `محققة ✓${latestStr}` : `تحت المعيار ✗${latestStr}`;
  }
  function readDE(de: number | null, prev: number | null): string {
    if (de == null) return "—";
    const trend = prev != null ? (de > prev ? ` · قفز من ${prev.toFixed(2)} — تمويل خارجي ⚑` : ` · انخفض من ${prev.toFixed(2)}`) : "";
    return `${de.toFixed(2)}${trend}`;
  }

  // 3. Dynamic RATIOS_LIST
  const RATIOS_LIST: RatioItem[] = [
    {
      n: "هامش الربح الإجمالي °",
      v: cur.gm != null ? `${cur.gm.toFixed(1)}%` : "—",
      crit: null,
      pass: null,
      p: pct.gm != null ? Math.round(pct.gm) : null,
      read: cur.gm != null ? `${cur.gm.toFixed(1)}% — المئين ${pct.gm != null ? Math.round(pct.gm) : "—"} في القطاع` : "—",
    },
    {
      n: "هامش صافي الربح °",
      v: cur.nm != null ? `${cur.nm.toFixed(1)}%` : "—",
      crit: "≥ 15%",
      pass: cur.nm != null ? cur.nm >= 15 : null,
      p: pct.nm ?? null,
      read: readNm(cur.nm),
    },
    {
      n: "العائد على حقوق الملكية ROE °",
      v: cur.roe != null ? `${cur.roe.toFixed(1)}%` : "—",
      crit: "≥ 15%",
      pass: cur.roe != null ? cur.roe >= 15 : null,
      p: pct.roe ?? null,
      read: readRoe(cur.roe),
    },
    {
      n: "العائد على الأصول ROA °",
      v: roaVal != null ? `${roaVal.toFixed(1)}%` : "—",
      crit: "≥ 6%",
      pass: roaVal != null ? roaVal >= 6 : null,
      p: null,
      read: roaVal != null ? (roaVal >= 6 ? `فوق معيار 6% ✓` : `تحت معيار 6% ✗`) : "—",
    },
    {
      n: "ROIC ° (تقريب: NOPAT ÷ رأس المال المستثمر)",
      v: roicVal != null ? `≈${roicVal.toFixed(1)}%` : "—",
      crit: "> WACC",
      pass: roicVal != null ? roicVal > 9 : null,
      p: null,
      read: roicVal != null
        ? (roicVal > 9 ? `فوق تكلفة الرأس المال المقدرة ✓` : `فجوة سالبة عن أي كلفة رأس مال معقولة (8–10%) ✗`)
        : "—",
    },
    {
      n: "نسبة التداول Current °",
      v: crAnnual != null ? crAnnual.toFixed(2) : "—",
      crit: "≥ 1.5",
      pass: crAnnual != null ? crAnnual >= 1.5 : null,
      p: null,
      read: readCurrent(crAnnual, crLatest),
    },
    {
      n: "النسبة السريعة Quick °",
      v: qrAnnual != null ? qrAnnual.toFixed(2) : "—",
      crit: "≥ 1.0",
      pass: qrAnnual != null ? qrAnnual >= 1.0 : null,
      p: null,
      read: qrAnnual != null
        ? (qrAnnual >= 1.0
          ? `محققة بارتياح ✓ — النقد وحده ${bsCash[annIdx] ? (bsCash[annIdx] / 1000).toFixed(1) : "—"} مليار`
          : `تحت المعيار ✗`)
        : "—",
    },
    {
      n: "الدين ÷ حقوق الملكية °",
      v: deAnnual != null ? deAnnual.toFixed(2) : "—",
      crit: null,
      pass: null,
      p: null,
      read: readDE(deAnnual, prevDE),
    },
    {
      n: "تغطية تكلفة التمويل ° (ربح العمليات ÷ التمويل)",
      v: coverageRatio != null ? `${coverageRatio.toFixed(2)}×` : "—",
      crit: "≥ 3×",
      pass: coverageRatio != null ? coverageRatio >= 3 : null,
      p: null,
      read: readCoverage(coverageRatio),
    },
    {
      n: `FCF ÷ الإيرادات ° (${prevPeriod} / ${lastPeriod})`,
      v: fcfRevPrevPct != null && fcfRevLastPct != null
        ? `${Number(fcfRevPrevPct) >= 0 ? "+" : ""}${fcfRevPrevPct}% / ${Number(fcfRevLastPct) >= 0 ? "+" : ""}${fcfRevLastPct}%`
        : "—",
      crit: "≥ 5%",
      pass: fcfRevLastPct != null ? Number(fcfRevLastPct) >= 5 : null,
      p: null,
      read: fcfRevLastPct != null
        ? (Number(fcfRevLastPct) >= 5 ? "محقق ✓" : "تحت المعيار ✗")
        : "—",
    },
    {
      n: `FCF ÷ صافي الربح ° (${prevPeriod})`,
      v: fcfNetPrevPct != null ? `${fcfNetPrevPct}%` : "—",
      crit: "قريبة من 100%",
      pass: fcfNetPrevPct != null ? Number(fcfNetPrevPct) >= 70 : null,
      p: null,
      read: fcfNetPrevPct != null
        ? (Number(fcfNetPrevPct) >= 70 ? "الربح يتحول نقداً بنسبة جيدة ✓" : "تحويل النقد منخفض ✗")
        : "—",
    },
    {
      n: "Capex ممتلكات ÷ الإيرادات °",
      v: capexRevPct != null ? `${capexRevPct.toFixed(1)}%` : "—",
      crit: "3–5%",
      pass: null,
      p: null,
      read: capexRevPct != null
        ? (capexRevPct < 1 ? "رأسمال منخفض — استثمار عبر مخزون أو طبيعة خدمية" : `${capexRevPct.toFixed(1)}% من الإيرادات`)
        : "—",
    },
    {
      n: "نمو الإيرادات: متوسط 5 سنوات ° (CAGR)",
      v: revCAGR5 != null ? `${revCAGR5 >= 0 ? "+" : ""}${revCAGR5.toFixed(1)}%` : "—",
      crit: null,
      pass: null,
      p: pct.g_rev ?? null,
      read: revCAGR5 != null
        ? `CAGR 5 سنوات ${revCAGR5.toFixed(1)}% — المئين ${pct.g_rev ?? "—"} في القطاع`
        : "—",
    },
    {
      n: "نمو صافي الربح: 3 سنوات ° (CAGR)",
      v: netCAGR3 != null ? `${netCAGR3 >= 0 ? "+" : ""}${netCAGR3.toFixed(1)}%` : "—",
      crit: null,
      pass: null,
      p: pct.g_net ?? null,
      read: netCAGR3 != null
        ? `CAGR 3 سنوات ${netCAGR3.toFixed(1)}% — المئين ${pct.g_net ?? "—"}${netBase5NearZero ? " · قاعدة منخفضة في بداية الفترة" : ""}`
        : "—",
    },
    {
      n: "مكرر الربحية P/E °",
      v: peVal != null ? peVal : "—",
      crit: null,
      pass: null,
      p: pct.pe ?? null,
      read: cur.pe != null
        ? (cur.pe <= 15 ? `${cur.pe.toFixed(1)}× — رخيص نسبياً · المئين ${pct.pe ?? "—"}` : `${cur.pe.toFixed(1)}× — المئين ${pct.pe ?? "—"} في القطاع`)
        : "—",
    },
    {
      n: "مكرر الدفترية P/B °",
      v: pbVal != null ? pbVal : "—",
      crit: null,
      pass: null,
      p: pct.pb ?? null,
      read: cur.pb != null
        ? (cur.pb <= 1 ? `خصم من القيمة الدفترية · المئين ${pct.pb ?? "—"}` : `${cur.pb.toFixed(2)}× — المئين ${pct.pb ?? "—"}`)
        : "—",
    },
    {
      n: "PEG (معيار Lynch) °",
      v: pegVal != null ? pegVal : "—",
      crit: "< 1.0",
      pass: cur.peg != null ? cur.peg < 1.0 : null,
      p: null,
      read: cur.peg != null
        ? (cur.peg < 1.0 ? `نمو أرخص من مكرره ✓ (PEG ${cur.peg.toFixed(2)})` : `النمو أغلى من مكرره ✗ (PEG ${cur.peg.toFixed(2)})`)
        : "—",
    },
  ];

  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="p-4 border-b border-[#E5E7EB]">
        <h2 className="text-sm font-bold flex items-center gap-2 text-[#1A1A1A]">
          <ShieldCheck className="w-4 h-4 text-[#8C3B32]" />
          نسب الحكم المزدوج — المعيار المطلق + مئين القطاع
          <span className="text-xs font-normal text-[#6B7280]">
            · وسط شركات قطاع {data.sec} المحدث
          </span>
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F3F4F6] text-[#6B7280]">
              <th className="py-2.5 px-3 text-right min-w-[170px] sticky right-0 bg-[#F3F4F6] z-10">النسبة</th>
              <th className="py-2.5 px-3 text-left">الفعلي</th>
              <th className="py-2.5 px-3 text-left">معيار المطلوب</th>
              <th className="py-2.5 px-3 text-left">حكم المعيار</th>
              <th className="py-2.5 px-3 text-left">مقابل القطاع</th>
              <th className="py-2.5 px-3 text-right">القراءة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {RATIOS_LIST.map((r, idx) => (
              <tr key={idx} className="hover:bg-[#F7F8FA] transition-colors">
                <td className="py-2.5 px-3 font-medium text-[#1A1A1A] sticky right-0 z-10 bg-white">{r.n}</td>
                <td className="py-2.5 px-3 text-left font-bold tabular-nums text-[#1A1A1A]" dir="ltr">{r.v}</td>
                <td className="py-2.5 px-3 text-left text-[#6B7280] tabular-nums">{r.crit || "—"}</td>
                <td className="py-2.5 px-3 text-left font-semibold">
                  {r.pass === true ? (
                    <span className="text-[#16A34A]">✓ محقق</span>
                  ) : r.pass === false ? (
                    <span className="text-[#DC2626]">✗ غير محقق</span>
                  ) : (
                    <span className="text-[#9CA3AF]">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-left">
                  {r.p !== null ? (
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                        <div className="h-full bg-[#8C3B32]" style={{ width: `${r.p}%` }} />
                      </div>
                      <span className="text-[11px] text-[#6B7280] tabular-nums">{r.p}</span>
                      <span
                        className={`text-[10px] font-bold rounded-full px-1.5 ${r.p >= 67
                          ? "bg-[#F0FDF4] text-[#16A34A]"
                          : r.p >= 34
                            ? "bg-[#F3F4F6] text-[#6B7280]"
                            : "bg-[#FEF2F2] text-[#DC2626]"
                          }`}
                      >
                        {r.p >= 67 ? "إيجابي" : r.p >= 34 ? "محايد" : "سلبي"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[#9CA3AF]">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right text-[#6B7280] text-[11.5px] leading-relaxed">
                  {r.read}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3.5 bg-[#F3F4F6] border-t border-[#E5E7EB] text-xs text-[#6B7280] leading-relaxed">
        {cur.nm != null && cur.roe != null && latestTotalAssets && latestNetAnn && revLast ? (
          <>
            📐 <b className="text-[#1A1A1A]">تفكيك Dupont °:</b>{" "}
            هامش صافي {cur.nm.toFixed(1)}%{" "}
            × دوران أصول {(revLast / latestTotalAssets).toFixed(2)}×{" "}
            × رافعة {latestTotalAssets > 0 && bsEquity[annIdx] > 0 ? (latestTotalAssets / bsEquity[annIdx]).toFixed(2) : "—"}{" "}
            = <b className="text-[#1A1A1A]">ROE {cur.roe.toFixed(1)}%</b>{" "}
            — {cur.roe < 10
              ? `المشكلة ليست الهامش (${cur.nm.toFixed(1)}% ممتاز) بل دوران الأصول المنخفض`
              : `النموذج سليم — الهامش والدوران يعملان معاً`
            }.
          </>
        ) : (
          <span>📐 تفكيك Dupont° — بيانات الميزانية العمومية غير متوفرة لهذه الشركة</span>
        )}
      </div>
    </div>
  );
}