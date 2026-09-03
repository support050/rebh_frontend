"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2, BarChart3, ShieldAlert, BookOpen,
  CheckSquare, Activity, Search, ArrowLeft, ArrowUpRight, TrendingUp, Layers, Award
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

export default function RebhHomePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rebh/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Error fetching live REBH stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#08090c] text-[#f0f2f5] p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Hero Banner (Matching platform_shell.html Hero) */}
        <div className="text-center pt-6 pb-2 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#d9b64a]/10 border border-[#d9b64a]/30 rounded-full text-[#d9b64a] text-xs font-mono font-bold">
            <span>✦</span>
            <span>TASI FINANCIAL PLATFORM · REAL XBRL VERIFIED</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            كل ما تملكه المنصات السبع.<br />
            <span className="text-[#d9b64a]">متحقق منه محاسبياً — أو معلن بأمانة.</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-3xl mx-auto leading-relaxed">
            منصة واحدة تشمل {loading ? <span className="animate-pulse bg-[#1c2230] rounded w-8 h-4 inline-block" /> : (stats?.total_companies ?? 0)} شركة في السوق المالي السعودي. كل رقم مسحوب ومدقق ضد المعادلات المحاسبية الرسمية ومطابق لمنهجية دورة الأستاذ مشعل الخرفشي.
          </p>
        </div>

        {/* Dynamic Live Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
          <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-3.5">
            <div className="text-2xl font-black font-mono text-[#10b981]">11</div>
            <div className="text-[10px] uppercase font-mono text-slate-400 mt-1">أقسام حية</div>
          </div>
          {([
            { val: stats?.balance_sheets_passed, label: 'ميزانية مدققة', color: 'text-white' },
            { val: stats?.valued_count, label: 'شركة مقيّمة', color: 'text-[#3987e5]' },
            { val: stats?.estimates_count, label: 'توقع بأخطاء مقاسة', color: 'text-white' },
            { val: stats?.checklists_count, label: 'قائمة فحص محسوبة', color: 'text-[#d9b64a]' },
            { val: stats?.quarantine_count, label: 'في سلة مونجر', color: 'text-[#f59e0b]' },
          ] as { val: number | undefined; label: string; color: string }[]).map(({ val, label, color }) => (
            <div key={label} className="bg-[#11141b] border border-[#1c2230] rounded-xl p-3.5">
              <div className={`text-2xl font-black font-mono ${color}`}>
                {loading ? <span className="animate-pulse bg-[#1c2230] rounded w-10 h-7 inline-block" /> : (val ?? '—')}
              </div>
              <div className="text-[10px] uppercase font-mono text-slate-400 mt-1">{label}</div>
            </div>
          ))}
          <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-3.5">
            <div className="text-2xl font-black font-mono text-[#10b981]">
              {loading ? <span className="animate-pulse bg-[#1c2230] rounded w-10 h-7 inline-block" /> : `${stats?.identity_pass_pct ?? 0}%`}
            </div>
            <div className="text-[10px] uppercase font-mono text-slate-400 mt-1">اجتياز A = L + E</div>
          </div>
        </div>

        {/* Feature Cards Grid (Matching Section Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          <Link href="/rebh/2222" className="group bg-[#11141b] border border-[#1c2230] hover:border-[#3987e5] rounded-xl p-5 transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 bg-[#3987e5]/10 text-[#3987e5] rounded-lg">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/30">
                LIVE · 270 COS
              </span>
            </div>
            <h3 className="font-bold text-base text-white group-hover:text-[#63a5f0] flex items-center gap-1.5 mb-1.5">
              صفحة الشركة الشاملة — ONE ∞
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              تحليل شامل لأي شركة من الـ 270: مصفوفة الأمان، تقييمات العوامل، القيمة العادلة، ومؤشرات البنوك المتخصصة.
            </p>
          </Link>

          <Link href="/rebh/watchlist" className="group bg-[#11141b] border border-[#1c2230] hover:border-[#3987e5] rounded-xl p-5 transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 bg-[#d9b64a]/10 text-[#d9b64a] rounded-lg">
                <Search className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold text-[#3987e5] bg-[#3987e5]/10 px-2 py-0.5 rounded border border-[#3987e5]/30">
                SCREENER
              </span>
            </div>
            <h3 className="font-bold text-base text-white group-hover:text-[#63a5f0] flex items-center gap-1.5 mb-1.5">
              قائمة المتابعة والفلترة الذكية
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              جدول الفرز الحي لكل شركات تاسي بمكررات PEG ومؤشر جراهام الصافي P/NCAV وجودة بيوتروسكي F-Score.
            </p>
          </Link>

          <Link href="/rebh/tools" className="group bg-[#11141b] border border-[#1c2230] hover:border-[#3987e5] rounded-xl p-5 transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 bg-[#10b981]/10 text-[#10b981] rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/30">
                18 LABS
              </span>
            </div>
            <h3 className="font-bold text-base text-white group-hover:text-[#63a5f0] flex items-center gap-1.5 mb-1.5">
              أدوات ومختبرات الدورة الرياضية
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              حاسبات تفاعلية: نموذج تاسي ومكرر السندات، Beneish M-Score، rNPV للمشاريع، وCut-Cut للتعافي بعد الأزمات.
            </p>
          </Link>

          <Link href="/rebh/quarantine" className="group bg-[#11141b] border border-[#1c2230] hover:border-[#f59e0b] rounded-xl p-5 transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 bg-[#f59e0b]/10 text-[#f59e0b] rounded-lg">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded border border-[#f59e0b]/30">
                TOO-HARD PILE
              </span>
            </div>
            <h3 className="font-bold text-base text-white group-hover:text-[#f59e0b] flex items-center gap-1.5 mb-1.5">
              سلة مونجر (Quarantine)
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              إعلان شفاف للشركات المستبعدة من التقييم بسبب عدم اكتمال القوائم أو توقف التحديث مع الحل البرمجي المطلوب.
            </p>
          </Link>

          <Link href="/rebh/journal" className="group bg-[#11141b] border border-[#1c2230] hover:border-[#3987e5] rounded-xl p-5 transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 bg-[#63a5f0]/10 text-[#63a5f0] rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold text-[#63a5f0] bg-[#63a5f0]/10 px-2 py-0.5 rounded border border-[#63a5f0]/30">
                DISCIPLINE
              </span>
            </div>
            <h3 className="font-bold text-base text-white group-hover:text-[#63a5f0] flex items-center gap-1.5 mb-1.5">
              سجل الصفقات وقوانين مينرفيني
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              توثيق الصفقات وحساب معدل الفوز الحي (Win Rate ≥ 60%)، ومعامل المكافأة للمخاطرة R/R، والتوقع الرياضي.
            </p>
          </Link>

          <Link href="/rebh/council" className="group bg-[#11141b] border border-[#1c2230] hover:border-[#3987e5] rounded-xl p-5 transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 bg-[#d9b64a]/10 text-[#d9b64a] rounded-lg">
                <CheckSquare className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold text-[#d9b64a] bg-[#d9b64a]/10 px-2 py-0.5 rounded border border-[#d9b64a]/30">
                31 CHECKLISTS
              </span>
            </div>
            <h3 className="font-bold text-base text-white group-hover:text-[#63a5f0] flex items-center gap-1.5 mb-1.5">
              محطة فحص المجلس وقوائم التدقيق
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              فحص فيشر الـ 15 مع إلزامية بند النزاهة، إشارات الخطر الست، وفاحص البنوك الـ 12 مع احتساب الحكم اللحظي.
            </p>
          </Link>

          <Link href="/rebh/report/2222" className="group bg-[#11141b] border border-[#1c2230] hover:border-[#d9b64a] rounded-xl p-5 transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 bg-[#8b0000]/20 text-[#e85d5d] rounded-lg">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold text-[#d9b64a] bg-[#d9b64a]/10 px-2 py-0.5 rounded border border-[#d9b64a]/30">
                PRINT / PDF ⎙
              </span>
            </div>
            <h3 className="font-bold text-base text-white group-hover:text-[#d9b64a] flex items-center gap-1.5 mb-1.5">
              التقرير التحليلي الشامل (THE REPORT)
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              توليد تقرير دورة الخرفشي المطبوع بنمط أبو سعد، مصفوفة الإجهاد الثنائية R×GS، وقراءة التقييم العكسي مع سجل المحلل.
            </p>
          </Link>
        </div>

      </div>
    </div>
  );
}
