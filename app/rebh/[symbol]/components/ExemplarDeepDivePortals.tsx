"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, ExternalLink } from "lucide-react";

interface ExemplarDeepDivePortalsProps {
  symbol: string;
}

export default function ExemplarDeepDivePortals({ symbol }: ExemplarDeepDivePortalsProps) {
  return (
    <section className="bg-white border border-[#E5E7EB] rounded-[4px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
      <div className="border-b border-[#E5E7EB] pb-3">
        <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#8C3B32]" />
          بوابات التعمق والتشريح المالي للسهم (Deep-Dive Portals)
        </h3>
        <p className="text-xs text-[#6B7280]">
          الانتقال المباشر للمحطات التحليلية التخصصية المرتبطة بنفس السهم
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href={`/rebh/analyst/${symbol}`}
          className="p-3.5 rounded-[4px] border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white hover:border-[#8C3B32] transition-all group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-xs text-[#0F172A] group-hover:text-[#8C3B32]">
              جداول القوائم المالية الكاملة
            </span>
            <ExternalLink size={14} className="text-[#94A3B8] group-hover:text-[#8C3B32]" />
          </div>
          <p className="text-[11px] text-[#64748B]">
            عرض الدخل والمركز المالي والتدفقات النقدية والنسب المحاسبية المدققة عبر الفصول.
          </p>
        </Link>

        <Link
          href={`/rebh/xray/${symbol}`}
          className="p-3.5 rounded-[4px] border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white hover:border-[#8C3B32] transition-all group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-xs text-[#0F172A] group-hover:text-[#8C3B32]">
              فيلم السردية وشلال الأموال
            </span>
            <ExternalLink size={14} className="text-[#94A3B8] group-hover:text-[#8C3B32]" />
          </div>
          <p className="text-[11px] text-[#64748B]">
            تشريح شلال الأموال وانحدار الإيراد لكاش وتفكيك دوبونت لمحركات العائد.
          </p>
        </Link>

        <Link
          href={`/rebh/studio/${symbol}`}
          className="p-3.5 rounded-[4px] border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white hover:border-[#8C3B32] transition-all group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-xs text-[#0F172A] group-hover:text-[#8C3B32]">
              استوديو الرسوم التفاعلية
            </span>
            <ExternalLink size={14} className="text-[#94A3B8] group-hover:text-[#8C3B32]" />
          </div>
          <p className="text-[11px] text-[#64748B]">
            مقارنة بيانية تفاعلية متعددة المحاور لبنود القوائم والتدفقات والهوامش عبر الزمن.
          </p>
        </Link>
      </div>
    </section>
  );
}
