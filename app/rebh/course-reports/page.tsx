"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, TrendingUp, Landmark, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";
import CompanyReportView from "./components/CompanyReportView";
import MethodologySection from "./components/MethodologySection";

// The 10 companies and 8 methodology entries matching rebh-course-reports.html
const SIDEBAR_COMPANIES = [
  { sym: "1120", name: "مصرف الراجحي", type: "bank", label: "بنك" },
  { sym: "2280", name: "المراعي", type: "defensive", label: "دفاعية" },
  { sym: "7010", name: "إس تي سي", type: "defensive", label: "دفاعية" },
  { sym: "4190", name: "جرير للتسويق", type: "growth", label: "نمو" },
  { sym: "4001", name: "أسواق العثيم", type: "defensive", label: "دفاعية" },
  { sym: "7203", name: "علم", type: "growth", label: "نمو" },
  { sym: "3030", name: "أسمنت السعودية", type: "cyclical", label: "دورية" },
  { sym: "4300", name: "دار الأركان", type: "realestate", label: "عقارية" },
  { sym: "1201", name: "تكوين المتطورة", type: "growth", label: "خاسرة — P/S" },
  { sym: "2222", name: "أرامكو السعودية", type: "defensive", label: "الأمانة — موقوف" },
];

const SIDEBAR_METHODOLOGY = [
  { id: "m1", title: "خريطة اختيار الطريقة", sub: "شجرة القرار — من أين أبدأ؟" },
  { id: "m2", title: "العادية والنمو", sub: "المعادلات التسع والمناطق ولينش" },
  { id: "m3", title: "شركات الدورات", sub: "النطاقات وإشارة الخروج" },
  { id: "m4", title: "البنوك والتأمين", sub: "عدة العسيري كاملة" },
  { id: "m5", title: "القوائم والنسب", sub: "السلامة والكفاءة والأعلام" },
  { id: "m6", title: "لم تربح أو لم تبع بعد", sub: "P/S والافتراض على الحقيقة وrNPV" },
  { id: "m7", title: "منهجية أبو سعد نفسه", sub: "العقيدة والقرار والانضباط" },
  { id: "m8", title: "كل الطرق — الجدول الجامع", sub: "كل طريقة: متى ومتى لا وأين تعيش" },
];

function CourseReportsContent() {
  const searchParams = useSearchParams();
  const initialKey = searchParams?.get("sym") || searchParams?.get("c") || searchParams?.get("m") || "1120";
  const [activeKey, setActiveKey] = useState<string>(initialKey);
  const [companyData, setCompanyData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const urlKey = searchParams?.get("sym") || searchParams?.get("c") || searchParams?.get("m");
    if (urlKey && urlKey !== activeKey) {
      setActiveKey(urlKey);
    }
  }, [searchParams]);

  const isMeth = activeKey.startsWith("m");
  const activeMeta = !isMeth ? SIDEBAR_COMPANIES.find(c => c.sym === activeKey) : null;

  // Structural addition: sidebar search filters both lists by name/symbol/title.
  // Not part of the original logic — purely presentational filtering of the static arrays.
  const q = query.trim();
  const filteredCompanies = q
    ? SIDEBAR_COMPANIES.filter(c => c.name.includes(q) || c.sym.includes(q) || c.label.includes(q))
    : SIDEBAR_COMPANIES;
  const filteredMethodology = q
    ? SIDEBAR_METHODOLOGY.filter(m => m.title.includes(q) || m.sub.includes(q))
    : SIDEBAR_METHODOLOGY;
  const hasResults = filteredCompanies.length > 0 || filteredMethodology.length > 0;

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (filteredCompanies.length > 0) {
        setActiveKey(filteredCompanies[0].sym);
      } else if (filteredMethodology.length > 0) {
        setActiveKey(filteredMethodology[0].id);
      }
    }
  };

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
        // UX note: fetch failures are only logged to the console — the user sees
        // an indefinitely empty report with no error message. Worth surfacing
        // a visible error state in CompanyReportView if this proves common.
        console.error("Failed to fetch company", e);
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, [activeKey, isMeth]);

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] font-sans" dir="rtl">
      {/* Header */}
      <header className="border-b border-[#E5E7EB] bg-[#FFFFFF] px-8 py-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/rebh" className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF] hover:text-[#1A1A1A] transition">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>المنصة الرئيسية</span>
            </Link>
          </div>
          <h1 className="text-xl font-black">
            تقارير الشركات <span className="text-[#8C3B32]">بمنهجية دورة مشعل الخرفشي</span> — على السوق السعودي
          </h1>
          <p className="text-xs text-[#6B7280] mt-2 max-w-3xl leading-relaxed">
            10 شركات بكل الأنواع — كل تقرير يتبع تسلسل تقارير الدورة حرفياً (البطاقة التصنيفية → الشرعية → العمل → بورتر → القوائم → النمو → السلامة → Build-Up → التسع خانات → IRR وهامش الأمان → الخلاصة)، والمنهجية تتبدل بنوع الشركة: البنك بعدّته، والدورية بنطاقاتها، والخاسرة بمسار P/S.{" "}
            <b className="text-[#1A1A1A]">وفي ذيل القائمة: منهجية الدورة كاملة في ثمانية أبواب.</b>
            <br />
            <span className="text-[#9CA3AF]">° محسوب ديناميكياً من قاعدة البيانات · ≈ تقديري معلن · 🔌 مصدر مسمى · تحليل تعليمي وليس توصية.</span>
          </p>
        </div>
      </header>

      {/* Body: sidebar + main */}
      <div className="flex max-w-screen-xl mx-auto" style={{ minHeight: "calc(100vh - 140px)" }}>
        {/* Sidebar */}
        <aside className="w-60 shrink-0 border-l border-[#E5E7EB] bg-[#FFFFFF] py-3 sticky top-0 self-start" style={{ maxHeight: "calc(100vh - 140px)", overflowY: "auto" }}>
          {/* Search */}
          <div className="px-3 pb-3">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="ابحث عن شركة أو باب..."
              className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] px-3 py-2 text-xs text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#8C3B32] focus:ring-1 focus:ring-[#8C3B32]/30 transition"
            />
          </div>

          {/* Companies */}
          {filteredCompanies.length > 0 && (
            <div className="px-4 pb-1 text-[10px] font-bold text-[#9CA3AF] tracking-wider uppercase">
              الشركات
            </div>
          )}
          {filteredCompanies.map(c => (
            <button
              key={c.sym}
              onClick={() => setActiveKey(c.sym)}
              className={`w-full text-right px-4 py-2.5 border-r-[3px] transition ${activeKey === c.sym
                ? "border-r-[#8C3B32] bg-[#8C3B32]/[0.06] text-[#1A1A1A]"
                : "border-r-transparent text-[#6B7280] hover:bg-[#F3F4F6]"
                }`}
            >
              <div className="text-[12.5px] font-bold leading-tight">{c.name}</div>
              <div className="text-[10px] text-[#9CA3AF] mt-0.5">{c.sym} · {c.label}</div>
            </button>
          ))}

          {/* Divider */}
          {filteredMethodology.length > 0 && (
            <div className="px-4 pt-3 pb-1 text-[10px] font-bold text-[#8C3B32] tracking-wider uppercase border-t border-[#E5E7EB] mt-2">
              المنهجية — الدورة كاملة
            </div>
          )}

          {/* Methodology */}
          {filteredMethodology.map(m => (
            <button
              key={m.id}
              onClick={() => setActiveKey(m.id)}
              className={`w-full text-right px-4 py-2.5 border-r-[3px] transition ${activeKey === m.id
                ? "border-r-[#8C3B32] bg-[#8C3B32]/[0.06] text-[#1A1A1A]"
                : "border-r-transparent text-[#6B7280] hover:bg-[#F3F4F6]"
                }`}
            >
              <div className="text-[12px] font-bold leading-tight">{m.title}</div>
              <div className="text-[10px] text-[#9CA3AF] mt-0.5 leading-tight">{m.sub}</div>
            </button>
          ))}

          {!hasResults && (
            <div className="px-4 py-6 text-center text-[11px] text-[#9CA3AF]">
              لا نتائج مطابقة لبحثك.
            </div>
          )}
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

export default function CourseReportsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
          <Loader2 className="w-4 h-4 animate-spin text-[#8C3B32]" />
          <span>جاري تحميل تقارير شركات الدورة...</span>
        </div>
      </div>
    }>
      <CourseReportsContent />
    </Suspense>
  );
}