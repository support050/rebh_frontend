"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, TrendingUp, Landmark } from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";
import CompanyReportView from "./components/CompanyReportView";
import MethodologySection from "./components/MethodologySection";

// The 10 companies and 8 methodology entries matching rebh-course-reports.html
const SIDEBAR_COMPANIES = [
  { sym: "1120", name: "مصرف الراجحي",    type: "bank",        label: "بنك" },
  { sym: "2280", name: "المراعي",          type: "defensive",   label: "دفاعية" },
  { sym: "7010", name: "إس تي سي",         type: "defensive",   label: "دفاعية" },
  { sym: "4190", name: "جرير للتسويق",     type: "growth",      label: "نمو" },
  { sym: "4001", name: "أسواق العثيم",     type: "defensive",   label: "دفاعية" },
  { sym: "7203", name: "علم",              type: "growth",      label: "نمو" },
  { sym: "3030", name: "أسمنت السعودية",   type: "cyclical",    label: "دورية" },
  { sym: "4300", name: "دار الأركان",      type: "realestate",  label: "عقارية" },
  { sym: "1201", name: "تكوين المتطورة",   type: "growth",      label: "خاسرة — P/S" },
  { sym: "2222", name: "أرامكو السعودية",  type: "defensive",   label: "الأمانة — موقوف" },
];

const SIDEBAR_METHODOLOGY = [
  { id: "m1", title: "خريطة اختيار الطريقة",    sub: "شجرة القرار — من أين أبدأ؟" },
  { id: "m2", title: "العادية والنمو",           sub: "المعادلات التسع والمناطق ولينش" },
  { id: "m3", title: "شركات الدورات",            sub: "النطاقات وإشارة الخروج" },
  { id: "m4", title: "البنوك والتأمين",          sub: "عدة العسيري كاملة" },
  { id: "m5", title: "القوائم والنسب",           sub: "السلامة والكفاءة والأعلام" },
  { id: "m6", title: "لم تربح أو لم تبع بعد",   sub: "P/S والافتراض على الحقيقة وrNPV" },
  { id: "m7", title: "منهجية أبو سعد نفسه",      sub: "العقيدة والقرار والانضباط" },
  { id: "m8", title: "كل الطرق — الجدول الجامع", sub: "كل طريقة: متى ومتى لا وأين تعيش" },
];

export default function CourseReportsPage() {
  const [activeKey, setActiveKey] = useState<string>("1120");
  const [companyData, setCompanyData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const isMeth = activeKey.startsWith("m");
  const activeMeta = !isMeth ? SIDEBAR_COMPANIES.find(c => c.sym === activeKey) : null;

  useEffect(() => {
    if (isMeth || !activeKey) return;
    if (companyData[activeKey]) return; // cached

    async function fetchCompany() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/rebh/company/${activeKey}`);
        if (res.ok) {
          const json = await res.json();
          setCompanyData(prev => ({ ...prev, [activeKey]: json }));
        }
      } catch (e) {
        console.error("Failed to fetch company", e);
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, [activeKey, isMeth]);

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#e8edf4] font-sans" dir="rtl">
      {/* Header */}
      <header className="border-b border-[#1d2735] bg-gradient-to-b from-[#0d1118] to-[#0a0c10] px-8 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/rebh" className="flex items-center gap-1.5 text-[11px] text-[#5f6d80] hover:text-white transition">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>المنصة الرئيسية</span>
            </Link>
          </div>
          <h1 className="text-xl font-black">
            تقارير الشركات <span className="text-[#d9b64a]">بمنهجية دورة مشعل الخرفشي</span> — على السوق السعودي
          </h1>
          <p className="text-xs text-[#aab6c6] mt-2 max-w-3xl leading-relaxed">
            10 شركات بكل الأنواع — كل تقرير يتبع تسلسل تقارير الدورة حرفياً (البطاقة التصنيفية → الشرعية → العمل → بورتر → القوائم → النمو → السلامة → Build-Up → التسع خانات → IRR وهامش الأمان → الخلاصة)، والمنهجية تتبدل بنوع الشركة: البنك بعدّته، والدورية بنطاقاتها، والخاسرة بمسار P/S.{" "}
            <b className="text-white">وفي ذيل القائمة: منهجية الدورة كاملة في ثمانية أبواب.</b>
            <br />
            <span className="text-[#5f6d80]">° محسوب ديناميكياً من قاعدة البيانات · ≈ تقديري معلن · 🔌 مصدر مسمى · تحليل تعليمي وليس توصية.</span>
          </p>
        </div>
      </header>

      {/* Body: sidebar + main */}
      <div className="flex max-w-screen-xl mx-auto" style={{ minHeight: "calc(100vh - 140px)" }}>
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-l border-[#1d2735] bg-[#0b0e14] py-3 sticky top-0 self-start" style={{ maxHeight: "calc(100vh - 140px)", overflowY: "auto" }}>
          {/* Companies */}
          {SIDEBAR_COMPANIES.map(c => (
            <button
              key={c.sym}
              onClick={() => setActiveKey(c.sym)}
              className={`w-full text-right px-4 py-2.5 border-r-[3px] transition ${
                activeKey === c.sym
                  ? "border-r-[#3987e5] bg-[#3987e5]/8 text-white"
                  : "border-r-transparent text-[#aab6c6] hover:bg-white/[0.03]"
              }`}
            >
              <div className="text-[12.5px] font-bold leading-tight">{c.name}</div>
              <div className="text-[10px] text-[#5f6d80] mt-0.5">{c.sym} · {c.label}</div>
            </button>
          ))}

          {/* Divider */}
          <div className="px-4 pt-3 pb-1 text-[10px] font-bold text-[#d9b64a] tracking-wider uppercase border-t border-[#1d2735] mt-2">
            المنهجية — الدورة كاملة
          </div>

          {/* Methodology */}
          {SIDEBAR_METHODOLOGY.map(m => (
            <button
              key={m.id}
              onClick={() => setActiveKey(m.id)}
              className={`w-full text-right px-4 py-2.5 border-r-[3px] transition ${
                activeKey === m.id
                  ? "border-r-[#3987e5] bg-[#3987e5]/8 text-white"
                  : "border-r-transparent text-[#aab6c6] hover:bg-white/[0.03]"
              }`}
            >
              <div className="text-[12px] font-bold leading-tight">{m.title}</div>
              <div className="text-[10px] text-[#5f6d80] mt-0.5 leading-tight">{m.sub}</div>
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {isMeth ? (
            <MethodologySection sectionId={activeKey} />
          ) : activeMeta ? (
            <CompanyReportView
              meta={activeMeta}
              data={companyData[activeKey] || null}
              loading={loading}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}
