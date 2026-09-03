"use client";

import React from "react";
import { BarChart3, Shield, Layers, RefreshCw } from "lucide-react";

export default function CourseLabsTab() {
  return (
    <div className="py-6 space-y-6">
      {/* 4 Featured Interactive Labs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lab 1: TASI Index Lab */}
        <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1e2836] pb-2.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#d9b64a]" />
              مختبر مؤشر تاسي (TASI Index Lab° — SP-Vlu)
            </h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded">بيانات فعلية°</span>
          </div>
          <p className="text-xs text-[#a7b1bd]">
            حساب القيمة العادلة لمؤشر تاسي بمضاعفات 15/17/20/25 وقاعدة (عائد السندات × 1.5).
          </p>
          <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs pt-1">
            <div className="bg-[#182130] p-2 rounded border border-[#1e2836]">
              <span className="text-[10px] text-[#657081] block">P/E 15 (ذهب)</span>
              <span className="font-bold text-emerald-400">+10.3%</span>
            </div>
            <div className="bg-[#182130] p-2 rounded border border-[#1e2836]">
              <span className="text-[10px] text-[#657081] block">P/E 17</span>
              <span className="font-bold text-lime-400">+25.0%</span>
            </div>
            <div className="bg-[#182130] p-2 rounded border border-[#1e2836]">
              <span className="text-[10px] text-[#657081] block">P/E 20 (فضة)</span>
              <span className="font-bold text-[#63a5f0]">+47.1%</span>
            </div>
            <div className="bg-[#182130] p-2 rounded border border-[#1e2836]">
              <span className="text-[10px] text-[#657081] block">P/E 25 (برونز)</span>
              <span className="font-bold text-amber-400">+83.8%</span>
            </div>
          </div>
        </div>

        {/* Lab 2: Beneish M-Score */}
        <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1e2836] pb-2.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#3987e5]" />
              مختبر كشف التلاعب المالي (Beneish M-Score)
            </h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded">معادلة كاملة</span>
          </div>
          <p className="text-xs text-[#a7b1bd]">
            النموذج الإحصائي المعتمد بالدورة (حد الخطر &gt; -1.78 لكشف تضخيم الأرباح وتأجيل المصاريف).
          </p>
          <div className="bg-[#182130] p-3 rounded-lg border border-[#1e2836] flex items-center justify-between font-mono text-xs">
            <div>
              <span className="text-[10px] text-[#657081] block">M-Score النموذجي</span>
              <span className="text-sm font-bold text-emerald-400">-2.386</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded">
              قوائم سليمة إحصائياً ✓
            </span>
          </div>
        </div>

        {/* Lab 3: rNPV Stage-Gate Biotech */}
        <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1e2836] pb-2.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              مختبر المشاريع المرحلية والقطاع الصحي (rNPV Lab)
            </h3>
            <span className="text-[10px] bg-purple-500/10 text-purple-400 font-mono px-2 py-0.5 rounded">درس انعكاس الإشارة</span>
          </div>
          <p className="text-xs text-[#a7b1bd]">
            خصم التدفقات باحتماليات النجاح DiMasi (المرحلة 1: 59.5% · 2: 35.5% · 3: 62% · اعتماد: 90%).
          </p>
          <div className="bg-[#182130] p-3 rounded-lg border border-[#1e2836] grid grid-cols-2 gap-2 text-xs font-mono text-center">
            <div>
              <span className="text-[10px] text-[#657081] block">Plain NPV (الساذج)</span>
              <span className="text-sm font-bold text-emerald-400">+24.34M ر.س</span>
            </div>
            <div>
              <span className="text-[10px] text-[#657081] block">rNPV (المخصوم بالمخاطر)</span>
              <span className="text-sm font-bold text-rose-400">-12.17M ر.س</span>
            </div>
          </div>
        </div>

        {/* Lab 4: Cut-Cut Crisis Recovery */}
        <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1e2836] pb-2.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-400" />
              نظام استعادة الأزمات (Cut-Cut System°)
            </h3>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 font-mono px-2 py-0.5 rounded">أداة أبو سعد الخاصة</span>
          </div>
          <p className="text-xs text-[#a7b1bd]">
            استنتاج معدل النمو التعويضي المؤقت I/Y للشركات المتضررة من أزمة مؤقتة قبل صدور نتائج ربعين.
          </p>
          <div className="bg-[#182130] p-3 rounded-lg border border-[#1e2836] flex items-center justify-between font-mono text-xs">
            <div>
              <span className="text-[10px] text-[#657081] block">مثال الراجحي بالدورة (5.0 ← 2.4 ر.س)</span>
              <span className="text-xs text-[#a7b1bd]">فترة التعافي: 4 سنوات</span>
            </div>
            <span className="text-sm font-bold text-[#d9b64a] bg-amber-500/10 px-2 py-1 rounded">
              I/Y = 20.14%
            </span>
          </div>
        </div>
      </div>

      {/* Complete 18 Labs Directory */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {[
          { id: 5, title: "مختبر سهم الطفرة (Multibagger)", desc: "شاشة معايير Alta Fox المعربة لحصر أسهم النمو فائق السرعة." },
          { id: 6, title: "مضاعف السعر للمبيعات (P/S Multiple)", desc: "احتساب القيمة العادلة من هامش صافي الربح وسلم النمو." },
          { id: 7, title: "تأثير التخفيض وإعادة الشراء (Dilution)", desc: "قياس أثر تغير عدد الأسهم على نمو ربحية السهم الحقيقية." },
          { id: 8, title: "مختبر القيمة الدفترية العادلة (Fair P/B)", desc: "معادلة P/B = ROE / R وحصر أسهم الأصول المهملة." },
          { id: 9, title: "مختبر كفاءة رأس المال (Terry Smith ROCE)", desc: "ROCE = EBIT / (TA - CL) بمعيار الجودة 32%." },
          { id: 10, title: "مختبر تقييم التطبيقات (User-Based)", desc: "تقييم المنصات بـ 100-200$ لكل مستخدم نشط (مثال طلبات / جاهز)." },
          { id: 11, title: "مختبر البنوك (Al-Asiri Banking Toolkit)", desc: "مؤشرات NII و NIM على الأصول المدرة، نسبة القروض للودائع LDR وسقف الـ 95%." },
          { id: 12, title: "لوحة الاقتصاد الأمريكي (Economy Scorecard)", desc: "مؤشرات الوظائف NFP وإعانات البطالة وفارق العائد 10Y-2Y وقاعدة الـ 20 نقطة." },
          { id: 13, title: "قائمة فحص فيشر الـ 15 (Fisher 15)", desc: "تقييم الجودة الإدارية وميزة الكلفة وإلزامية بند النزاهة 15." },
          { id: 14, title: "فئات لينش الست ومصادر النمو (Lynch 6)", desc: "تصنيف السهم: بطيء، مستقر، سريع، دوري، أصول، أو انعطافة." },
          { id: 15, title: "حراسة الحوكمة وإشارات الخطر (Governance)", desc: "إشارات الخطر الست + قاعدة زيادة رأس المال المطلقة + اختبار مكالمة علاقات المستثمرين." },
          { id: 16, title: "محطة سيكولوجيا التداول (Psychology Station)", desc: "سجل الخواطر بالأركان الخمسة ومحفزات التوقف السبعة ومصيدة تعويض الخسارة." },
          { id: 17, title: "محطة الذكاء الاصطناعي (AI Analysis Station)", desc: "كتلة التحقق السباعية الإلزامية ونموذج RISE ومكتبة برومبتات الأقسام الفردية." },
          { id: 18, title: "محلل القيمة الزمنية للنقود (TVM / IRR Solver)", desc: "حاسبة التدفقات والعائد الداخلي ومقارنتها بعتبة الـ 15% المنهجية." },
        ].map((lab) => (
          <div key={lab.id} className="bg-[#121924] border border-[#1e2836] rounded-xl p-4 hover:border-[#3987e5]/50 transition">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono text-[#d9b64a] font-bold">Lab #{lab.id}</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded">مدمج بالمنصة°</span>
            </div>
            <h4 className="text-xs font-bold text-white mb-1">{lab.title}</h4>
            <p className="text-[11px] text-[#657081] leading-relaxed">{lab.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
