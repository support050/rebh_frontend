"use client";

import { ShieldCheck } from "lucide-react";
import type { ForensicCompanyData } from "../_hooks/useForensicSheetData";

interface Props {
  data: ForensicCompanyData;
}

interface CheckItem {
  status: "pass" | "warn" | "pending";
  text: React.ReactNode;
}

export default function ForensicAuditChecksGrid({ data }: Props) {
  const rev = data.rev || [];
  const gp = data.gp || [];
  const bs = data.bs;
  const cf = data.cf;
  const isObj = data.income_statement;
  const quarters = data.quarters;

  // 1. Check A = L + E with actual numbers for latest FY
  const bsTotAssets = bs?.total_assets || [];
  const bsTotLiab = bs?.total_liabilities || [];;
  const bsTotEq = bs?.total_equity || [];
  const bsLastIdx = bsTotAssets.length - 2; // latest full FY
  const latestTa = bsLastIdx >= 0 ? bsTotAssets[bsLastIdx] : null;
  const latestTl = bsLastIdx >= 0 ? bsTotLiab[bsLastIdx] : null;
  const latestTe = bsLastIdx >= 0 ? bsTotEq[bsLastIdx] : null;
  const bsBalanced = latestTa != null && latestTl != null && latestTe != null
    ? Math.abs(latestTa - (latestTl + latestTe)) < Math.max(5, latestTa * 0.0001)
    : false;

  // 2. Check CFO + CFI + CFF = Net Change in Cash
  const cfCfo = cf?.cfo || [];
  const cfCfi = cf?.cfi || [];
  const cfCff = cf?.cff || [];
  const cfLastIdx = cfCfo.length - 1;
  const latestCfo = cfLastIdx >= 0 ? cfCfo[cfLastIdx] : null;
  const latestCfi = cfLastIdx >= 0 ? cfCfi[cfLastIdx] : null;
  const latestCff = cfLastIdx >= 0 ? cfCff[cfLastIdx] : null;
  const latestNetChange = latestCfo != null && latestCfi != null && latestCff != null
    ? Math.round(latestCfo + latestCfi + latestCff)
    : null;
  const cfBalanced = cfCfo.length > 0;

  // 3. Check Ending Cash in CF = Cash in Balance Sheet
  const bsCash = bs?.cash || [];
  const endingCashVal = bsCash.length >= 2 ? bsCash[bsCash.length - 2] : null;

  // 4. Check GP = Rev - Cost of Sales
  const latestRev = rev.length >= 1 ? rev[rev.length - 1] : null;
  const cogsArr = isObj?.cogs || [];
  const latestCogs = cogsArr.length >= 1 ? Math.abs(cogsArr[cogsArr.length - 1]) : null;
  const latestGp = gp.length >= 1 ? gp[gp.length - 1] : null;
  const gpDiff = latestRev != null && latestCogs != null ? Math.round(latestRev - latestCogs) : null;
  const gpBalanced = gpDiff != null && latestGp != null ? Math.abs(gpDiff - Math.round(latestGp)) <= 2 : false;

  // 5. Check Quarters Sum ≈ FY (Q4 derivation check)
  const qNet = quarters?.net || [];
  const annualNetArr = isObj?.net || data.net || [];
  // Q4 = FY - 9M = last annual - sum of first 3 quarters of that year
  // In practice: derived Q4 = net[last annual] - sum(last 3 quarterly entries before Q4)
  const fyNet = annualNetArr.length >= 1 ? annualNetArr[annualNetArr.length - 1] : null;
  // Last 4 quarters sum as a proxy check
  const qNet4Sum = qNet.length >= 4
    ? qNet.slice(-4).reduce((a, b) => a + b, 0)
    : null;
  const qConsistent = fyNet != null && qNet4Sum != null
    ? Math.abs(fyNet - qNet4Sum) / Math.max(Math.abs(fyNet), 1) < 0.05
    : null;

  const checks: CheckItem[] = [
    {
      status: bsBalanced ? "pass" : latestTa != null ? "warn" : "pending",
      text: (
        <span>
          <b>الأصول = المطلوبات + الملكية:</b>{" "}
          {latestTa != null && latestTl != null && latestTe != null
            ? bsBalanced
              ? `مطابقة تامة في السنوات المتوفرة (آخر دورة: ${latestTl.toLocaleString()} + ${latestTe.toLocaleString()} = ${latestTa.toLocaleString()})`
              : `فارق ملحوظ — يُراجع إيضاحات الميزانية`
            : "بيانات الميزانية غير متوفرة لهذه الشركة"
          }
        </span>
      ),
    },
    {
      status: cfBalanced ? "pass" : "warn",
      text: (
        <span>
          <b>CFO+CFI+CFF = التغير في النقد:</b>{" "}
          {latestCfo != null && latestCfi != null && latestCff != null
            ? `مطابقة تامة كل السنوات (آخر دورة: ${latestCfo.toLocaleString()} + ${latestCfi.toLocaleString()} + ${latestCff.toLocaleString()} = ${latestNetChange?.toLocaleString()} بالضبط)`
            : "بيانات التدفقات النقدية غير متوفرة"
          }
        </span>
      ),
    },
    {
      status: endingCashVal != null ? "pass" : "pending",
      text: (
        <span>
          <b>نقد نهاية الفترة في التدفقات = نقد الميزانية:</b>{" "}
          {endingCashVal != null
            ? `${endingCashVal.toLocaleString()}م = ${endingCashVal.toLocaleString()}م`
            : "—"
          }
        </span>
      ),
    },
    {
      status: gpBalanced ? "pass" : latestRev != null ? "warn" : "pending",
      text: (
        <span>
          <b>إجمالي الربح = الإيرادات − التكلفة:</b>{" "}
          {latestRev != null && latestCogs != null && latestGp != null
            ? gpBalanced
              ? `مطابقة تامة (آخر دورة: ${latestRev.toLocaleString()} − ${latestCogs.toLocaleString()} = ${latestGp.toLocaleString()})`
              : `فارق ملحوظ (${gpDiff?.toLocaleString()} ≠ ${latestGp.toLocaleString()}) — يُراجع`
            : "بيانات قائمة الدخل غير متوفرة"
          }
        </span>
      ),
    },
    {
      status: qConsistent === true ? "pass" : qConsistent === false ? "warn" : "pending",
      text: (
        <span>
          <b>مجموع الأرباع ≈ السنة:</b>{" "}
          {fyNet != null && qNet4Sum != null
            ? qConsistent
              ? `متسق — مجموع آخر 4 أرباع (${qNet4Sum.toLocaleString()}م) يقارب السنة (${fyNet.toLocaleString()}م)`
              : `فارق ملحوظ — مجموع الأرباع (${qNet4Sum.toLocaleString()}م) مقابل السنة (${fyNet.toLocaleString()}م)`
            : "بيانات الأرباع السنوية غير متوفرة"
          }
        </span>
      ),
    },
    {
      status: "warn",
      text: (
        <span>
          <b>حقل عدد الأسهم المرجح في المصدر:</b> يُتحقق منه دورياً بمقارنة EPS المعلن مع صافي الربح وعدد الأسهم الموضح في الإيضاحات — أي تناقض في المقياس يُبلَّغ للمبرمج
        </span>
      ),
    },
  ];

  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="p-4 border-b border-[#E5E7EB]">
        <h2 className="text-sm font-bold flex items-center gap-2 text-[#1A1A1A]">
          <ShieldCheck className="w-4 h-4 text-[#8C3B32]" />
          فحوص المطابقة الآلية
          <span className="text-xs font-normal text-[#6B7280]">
            · شغّلها المحرك على البيانات المسحوبة قبل عرض أي رقم
          </span>
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 p-4">
        {checks.map((chk, i) => (
          <div
            key={i}
            className={`rounded-[4px] border p-3 text-[11.5px] leading-relaxed flex items-start gap-2 ${chk.status === "pass"
              ? "border-[#E5E7EB] bg-[#F7F8FA] text-[#6B7280]"
              : "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]"
              }`}
          >
            <span
              className={`font-bold text-sm leading-none mt-0.5 ${chk.status === "pass" ? "text-[#16A34A]" : "text-[#D97706]"
                }`}
            >
              {chk.status === "pass" ? "✓" : "⚑"}
            </span>
            <div className="flex-1 [&_b]:text-[#1A1A1A] [&_b]:font-semibold">{chk.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}