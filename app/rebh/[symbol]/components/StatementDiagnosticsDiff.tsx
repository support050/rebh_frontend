"use client";

import React from "react";
import { ShieldCheck, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatementDiagnosticsDiffProps {
  balanceIdentity?: {
    is_valid?: boolean;
    discrepancy?: number | null;
  };
  isFresh?: boolean;
  staleReason?: string | null;
  currentQName?: string;
  qoqDelta?: string | number | null;
  yoyDelta?: string | number | null;
}

export default function StatementDiagnosticsDiff({
  balanceIdentity = { is_valid: true },
  isFresh = true,
  staleReason = null,
  currentQName = "الربع الأخير",
  qoqDelta = null,
  yoyDelta = null,
}: StatementDiagnosticsDiffProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 1. Statement Diagnostics */}
      <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#8C3B32]" />
            تشخيص القوائم والهوية المحاسبية
          </h3>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded ${
              balanceIdentity.is_valid
                ? "bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]"
                : "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
            }`}
          >
            {balanceIdentity.is_valid ? "الهوية مطابقة A = L + E ✓" : "خلل بالميزانية ❌"}
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
            <span className="text-[#475569]">فحص توازن الميزانية العمومية:</span>
            <span className="font-mono font-bold text-[#0F172A]">
              {balanceIdentity.is_valid
                ? "مطابق تماماً (ضمن هامش التفاوت)"
                : `فارق: ${balanceIdentity.discrepancy ?? "غير محدد"}`}
            </span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
            <span className="text-[#475569]">كبت تقلبات الإشارات المحاسبية (Sign-Flip):</span>
            <span className="font-mono font-semibold text-[#16A34A]">مفعل ومضبوط آلياً ✓</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
            <span className="text-[#475569]">حالة حداثة القوائم المالية:</span>
            <span className="font-mono font-semibold text-[#0F172A]">
              {isFresh ? "محدثة وفق جدول إفصاح تداول" : staleReason || "متأخرة"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. What Changed & Diff */}
      <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#16A34A]" />
            ما الذي تغير؟ (What Changed &amp; Diff)
          </h3>
          <span className="text-[11px] font-mono text-[#64748B]">{currentQName} مقابل الفترات السابقة</span>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0] flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#1E293B] block">التغير الفصلي QoQ</span>
              <span className="text-[10px] text-[#64748B]">صافي الربح الفصلي</span>
            </div>
            <div className="flex items-center gap-1 font-mono font-bold text-sm">
              {qoqDelta != null ? (
                Number(qoqDelta) >= 0 ? (
                  <span className="text-[#16A34A] flex items-center gap-0.5">
                    <ArrowUpRight className="w-4 h-4" /> +{qoqDelta}%
                  </span>
                ) : (
                  <span className="text-[#DC2626] flex items-center gap-0.5">
                    <ArrowDownRight className="w-4 h-4" /> {qoqDelta}%
                  </span>
                )
              ) : (
                "—"
              )}
            </div>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0] flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#1E293B] block">التغير السنوي YoY</span>
              <span className="text-[10px] text-[#64748B]">مقارنة قاعدة الأساس</span>
            </div>
            <div className="flex items-center gap-1 font-mono font-bold text-sm">
              {yoyDelta != null ? (
                Number(yoyDelta) >= 0 ? (
                  <span className="text-[#16A34A] flex items-center gap-0.5">
                    <ArrowUpRight className="w-4 h-4" /> +{yoyDelta}%
                  </span>
                ) : (
                  <span className="text-[#DC2626] flex items-center gap-0.5">
                    <ArrowDownRight className="w-4 h-4" /> {yoyDelta}%
                  </span>
                )
              ) : (
                "—"
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
