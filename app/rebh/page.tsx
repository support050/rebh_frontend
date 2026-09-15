"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2, BarChart3, ShieldAlert, BookOpen,
  CheckSquare, Search, ArrowLeft, Award, LineChart,
  Film, FileSpreadsheet, Activity, Layers
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

export default function RebhHomePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setError(null);
        const res = await fetch(`${API_BASE_URL}/api/rebh/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          setError("تعذر تحميل الإحصائيات المباشرة");
        }
      } catch (err: any) {
        console.error("Error fetching live REBH stats:", err);
        setError("خطأ في الاتصال بخادم التحليل");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const FEATURES = [
    {
      href: "/rebh/company/2222",
      icon: Building2,
      iconColor: "text-[#2563EB]",
      iconBg: "bg-[#EFF6FF]",
      badge: "LIVE · 270 COS",
      badgeColor: "text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]",
      title: "صفحة الشركة الشاملة — ONE ∞",
      desc: "تحليل شامل لأي شركة: مصفوفة الأمان، تقييمات العوامل، القيمة العادلة، ومؤشرات البنوك المتخصصة.",
    },
    {
      href: "/rebh/studio/2222",
      icon: LineChart,
      iconColor: "text-[#2563EB]",
      iconBg: "bg-[#EFF6FF]",
      badge: "STUDIO",
      badgeColor: "text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]",
      title: "استوديو الرسوم المالية (Chart Studio)",
      desc: "رسوم تفاعلية مرنة لمقارنة الفترات، تطور الأرباح، مكررات التقييم، وتدفقات الكاش للشركات.",
    },
    {
      href: "/rebh/xray/2222",
      icon: Film,
      iconColor: "text-[#B45309]",
      iconBg: "bg-[#FFFBEB]",
      badge: "X-RAY",
      badgeColor: "text-[#B45309] bg-[#FFFBEB] border-[#FDE68A]",
      title: "تشريح السردية (Story · X-Ray)",
      desc: "شلال تحويل الإيراد لنقد حر (نهر المال)، ودورة التحويل النقدي CCC، وتطور هيكل رأس المال والميزانية.",
    },
    {
      href: "/rebh/analyst/2222",
      icon: FileSpreadsheet,
      iconColor: "text-[#16A34A]",
      iconBg: "bg-[#F0FDF4]",
      badge: "XBRL AUDIT",
      badgeColor: "text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]",
      title: "القوائم المالية والتدقيق (Analyst)",
      desc: "قوائم الدخل والميزانية والتدفقات النقدية مدققة ومطابقة لمعايير XBRL مع تتبع بنود رأس المال العامل.",
    },
    {
      href: "/rebh/watchlist",
      icon: Search,
      iconColor: "text-[#B08900]",
      iconBg: "bg-[#FEFCE8]",
      badge: "SCREENER",
      badgeColor: "text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]",
      title: "قائمة المتابعة والفلترة الذكية",
      desc: "جدول الفرز الحي لكل شركات تاسي بمكررات PEG ومؤشر جراهام الصافي P/NCAV وجودة بيوتروسكي F-Score.",
    },
    {
      href: "/rebh/tools",
      icon: BarChart3,
      iconColor: "text-[#16A34A]",
      iconBg: "bg-[#F0FDF4]",
      badge: "18 LABS",
      badgeColor: "text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]",
      title: "أدوات ومختبرات الدورة الرياضية",
      desc: "حاسبات تفاعلية: نموذج تاسي ومكرر السندات، Beneish M-Score، rNPV للمشاريع، وCut-Cut للتعافي بعد الأزمات.",
    },
    {
      href: "/rebh/council",
      icon: CheckSquare,
      iconColor: "text-[#B08900]",
      iconBg: "bg-[#FEFCE8]",
      badge: "31 CHECKLISTS",
      badgeColor: "text-[#B08900] bg-[#FEFCE8] border-[#FDE68A]",
      title: "محطة فحص المجلس وقوائم التدقيق",
      desc: "فحص فيشر الـ 15 مع إلزامية بند النزاهة، إشارات الخطر الست، وفاحص البنوك الـ 12 مع احتساب الحكم اللحظي.",
    },
    {
      href: "/rebh/report/2222",
      icon: Award,
      iconColor: "text-[#8C3B32]",
      iconBg: "bg-[#FBEAE8]",
      badge: "PRINT / PDF ⎙",
      badgeColor: "text-[#8C3B32] bg-[#FBEAE8] border-[#F0CFC9]",
      title: "التقرير التحليلي الشامل (THE REPORT)",
      desc: "توليد تقرير دورة الخرفشي المطبوع بنمط أبو سعد، مصفوفة الإجهاد الثنائية R×GS، وقراءة التقييم العكسي مع سجل المحلل.",
      hoverBorder: "hover:border-[#8C3B32]",
      hoverTitle: "group-hover:text-[#8C3B32]",
    },
    {
      href: "/rebh/course-reports",
      icon: BookOpen,
      iconColor: "text-[#8C3B32]",
      iconBg: "bg-[#FBEAE8]",
      badge: "CASE STUDIES",
      badgeColor: "text-[#8C3B32] bg-[#FBEAE8] border-[#F0CFC9]",
      title: "تقارير الدورة ودراسات الحالة",
      desc: "دراسات الحالة العشر لدورة الأستاذ مشعل الخرفشي (الخريف، علم، سال، سيسكو، وغيرها) محاكية ومفصلة رقمياً.",
    },
    {
      href: "/rebh/journal",
      icon: BookOpen,
      iconColor: "text-[#2563EB]",
      iconBg: "bg-[#EFF6FF]",
      badge: "DISCIPLINE",
      badgeColor: "text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]",
      title: "سجل الصفقات وقوانين مينرفيني",
      desc: "توثيق الصفقات وحساب معدل الفوز الحي (Win Rate ≥ 60%)، ومعامل المكافأة للمخاطرة R/R، والتوقع الرياضي.",
    },
    {
      href: "/rebh/quarantine",
      icon: ShieldAlert,
      iconColor: "text-[#B45309]",
      iconBg: "bg-[#FFFBEB]",
      badge: "TOO-HARD PILE",
      badgeColor: "text-[#B45309] bg-[#FFFBEB] border-[#FDE68A]",
      title: "سلة مونجر (Quarantine)",
      desc: "إعلان شفاف للشركات المستبعدة من التقييم بسبب عدم اكتمال القوائم أو توقف التحديث مع الحل البرمجي المطلوب.",
      hoverBorder: "hover:border-[#F59E0B]",
      hoverTitle: "group-hover:text-[#B45309]",
    },
    {
      href: "/rebh/health",
      icon: Activity,
      iconColor: "text-[#16A34A]",
      iconBg: "bg-[#F0FDF4]",
      badge: "AUDIT MATRIX",
      badgeColor: "text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]",
      title: "صحة وتدقيق البيانات (Data Health)",
      desc: "مصفوفة التدقيق الحي: فحص تطابق A = L + E، وسلامة وسوم القوائم، وفحص منع التضليل لجميع الشركات.",
    },
  ];

  const KPIS = [
    { val: stats?.balance_sheets_passed, label: "ميزانية مدققة", color: "text-[#1A1A1A]" },
    { val: stats?.valued_count, label: "شركة مقيّمة", color: "text-[#2563EB]" },
    { val: stats?.estimates_count, label: "توقع بأخطاء مقاسة", color: "text-[#1A1A1A]" },
    { val: stats?.checklists_count, label: "قائمة فحص محسوبة", color: "text-[#B08900]" },
    { val: stats?.quarantine_count, label: "في سلة مونجر", color: "text-[#B45309]" },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Hero Banner */}
        <div className="text-center pt-8 pb-4 space-y-3">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#1A1A1A] leading-tight">
            كل ما تملكه المنصات السبع.<br />
            <span className="text-[#8C3B32]">متحقق منه محاسبياً — أو معلن بأمانة.</span>
          </h1>
        </div>

        {/* Dynamic Live Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
          <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="text-2xl font-black font-mono text-[#16A34A]">{FEATURES.length}</div>
            <div className="text-[10px] uppercase font-mono text-[#6B7280] mt-1">أقسام حية</div>
          </div>
          {KPIS.map(({ val, label, color }) => (
            <div key={label} className="bg-white border border-[#E5E7EB] rounded-[4px] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className={`text-2xl font-black font-mono ${color}`}>
                {loading ? <span className="animate-pulse bg-[#F3F4F6] rounded-[4px] w-10 h-7 inline-block" /> : (val ?? '—')}
              </div>
              <div className="text-[10px] uppercase font-mono text-[#6B7280] mt-1">{label}</div>
            </div>
          ))}
          <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="text-2xl font-black font-mono text-[#16A34A]">
              {loading ? <span className="animate-pulse bg-[#F3F4F6] rounded-[4px] w-10 h-7 inline-block" /> : `${stats?.identity_pass_pct ?? 0}%`}
            </div>
            <div className="text-[10px] uppercase font-mono text-[#6B7280] mt-1">اجتياز A = L + E</div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Link
                key={f.href}
                href={f.href}
                className={`group bg-white border border-[#E5E7EB] ${f.hoverBorder ?? "hover:border-[#8C3B32]"} rounded-[4px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all hover:shadow-md`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2.5 ${f.iconBg} ${f.iconColor} rounded-[4px]`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${f.badgeColor}`}>
                    {f.badge}
                  </span>
                </div>
                <h3 className={`font-bold text-base text-[#1A1A1A] ${f.hoverTitle ?? "group-hover:text-[#8C3B32]"} flex items-center gap-1.5 mb-1.5`}>
                  {f.title}
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                </h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  {f.desc}
                </p>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}