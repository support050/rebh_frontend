"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2, ShieldCheck, Award, Star, Printer,
  Copy, Check, FileText, ChevronRight, BarChart2, BookOpen,
  CheckSquare, AlertTriangle, Filter, ChevronDown
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

// ─── 35 Advisor Rows ──────────────────────────────────────────────────────────
type School =
  | "fundamental"
  | "macro"
  | "quant"
  | "technical"
  | "method"
  | "platform";

interface AdvisorRow {
  id: number;
  school: School;
  advisor: string;
  advisorEn: string;
  demand: string;
  platformAnswer: string;
  where: string;
  score: 10;
}

const ADVISORS: AdvisorRow[] = [
  // ── Fundamental School ────────────────────────────────────────────────────
  {
    id: 1, school: "fundamental",
    advisor: "بنيامين غراهام", advisorEn: "Benjamin Graham",
    demand: "هامش أمان محسوب · P/B < 1 · فحص NCAV · شراء الدولار بخمسين سنتاً",
    platformAnswer: "تحسب المنصة Margin of Safety % من Nine-Box · NCAV · P/B حي من قاعدة البيانات",
    where: "/rebh/company · /rebh/analyst · Nine-Box",
    score: 10,
  },
  {
    id: 2, school: "fundamental",
    advisor: "وارن بافيت", advisorEn: "Warren Buffett",
    demand: "ROE > 15% · استدامة الأرباح · خندق تنافسي · مدير نزيه",
    platformAnswer: "ROE محسوب من XBRL · Piotroski F-Score · BCG Stage · Porter 5 Forces",
    where: "/rebh/analyst · /rebh/xray · /rebh/score",
    score: 10,
  },
  {
    id: 3, school: "fundamental",
    advisor: "بيتر لينش", advisorEn: "Peter Lynch",
    demand: "PEG < 1 · نمو EPS · فهم القصة التجارية",
    platformAnswer: "PEG محسوب ديناميكياً · نمو EPS YoY · story سردية من X-Ray",
    where: "/rebh/xray · /rebh/analyst",
    score: 10,
  },
  {
    id: 4, school: "fundamental",
    advisor: "فيل فيشر", advisorEn: "Philip Fisher",
    demand: "نمو المبيعات على مدى طويل · هامش ربح صافٍ مستدام · إدارة رؤيوية",
    platformAnswer: "5 سنوات من بيانات الإيرادات والهوامش · Sparklines تاريخية",
    where: "/rebh/xray (trend sparklines) · /rebh/studio",
    score: 10,
  },
  {
    id: 5, school: "fundamental",
    advisor: "جون نيف", advisorEn: "John Neff",
    demand: "P/E منخفض + نمو + توزيعات مرتفعة",
    platformAnswer: "P/E حي + معدل نمو صافي ربح + توزيعات (Dividend Yield) من محرك الشركة",
    where: "/rebh/company · /rebh/analyst (valuation)",
    score: 10,
  },
  {
    id: 6, school: "fundamental",
    advisor: "سيث كلارمان", advisorEn: "Seth Klarman",
    demand: "فحص جنائي للقوائم · تجنب الشركات المتلاعبة · هامش أمان واسع",
    platformAnswer: "Beneish M-Score · Piotroski · Red Flags · Quarantine System",
    where: "/rebh/xray · /rebh/score · Quarantine",
    score: 10,
  },
  {
    id: 7, school: "fundamental",
    advisor: "تشارلز مونغر", advisorEn: "Charlie Munger",
    demand: "شركة رائعة بسعر عادل لا شركة عادية بسعر رائع · عائد متراكم",
    platformAnswer: "Nine-Box يقيّم العائد المتراكم على مدى 5-10 سنوات من FCF/EPS/توزيعات",
    where: "/rebh/company (Nine-Box) · /rebh/analyst",
    score: 10,
  },
  // ── Macro School ──────────────────────────────────────────────────────────
  {
    id: 8, school: "macro",
    advisor: "جورج سوروس", advisorEn: "George Soros",
    demand: "تحديد نقطة الانعكاس · العكسية · دراسة السوق كنظام",
    platformAnswer: "محرك Reverse DCF يكشف معدل نمو مُضمَّن في السعر · Zone System",
    where: "/rebh/company (Reverse DCF) · /rebh/analyst",
    score: 10,
  },
  {
    id: 9, school: "macro",
    advisor: "ريموند دالييو", advisorEn: "Ray Dalio",
    demand: "توازن المحفظة · تنويع القطاعات · إدارة التقلب",
    platformAnswer: "تغطية 21 قطاع GICS · درجات القطاع · فحص الارتباط",
    where: "/rebh/company (sector) · /rebh/score",
    score: 10,
  },
  {
    id: 10, school: "macro",
    advisor: "مارك موبيوس", advisorEn: "Mark Mobius",
    demand: "الأسواق الناشئة · حوكمة الشركات · سيولة السوق",
    platformAnswer: "فحص Shariah compliance · حوكمة XBRL · حجم التداول من قاعدة الأسعار",
    where: "/rebh/company · /rebh/score (governance)",
    score: 10,
  },
  {
    id: 11, school: "macro",
    advisor: "جيم روجرز", advisorEn: "Jim Rogers",
    demand: "استثمار السلع والقطاعات الدورية",
    platformAnswer: "Cyclical Bands Engine يحسب نطاق الشراء/البيع للأسهم الدورية",
    where: "/rebh/company (Cyclical Bands)",
    score: 10,
  },
  // ── Quant School ──────────────────────────────────────────────────────────
  {
    id: 12, school: "quant",
    advisor: "جويل غرينبلات", advisorEn: "Joel Greenblatt",
    demand: "Magic Formula: EBIT/EV + ROIC · تصنيف سوقي",
    platformAnswer: "Magic Formula محسوبة من XBRL · ROIC · EBIT/EV · تصنيف داخل الكون",
    where: "/rebh/company (Magic Formula) · /rebh/analyst",
    score: 10,
  },
  {
    id: 13, school: "quant",
    advisor: "جيمس سيمونز", advisorEn: "James Simons",
    demand: "أنماط إحصائية · بيانات عالية الجودة · نقاء البيانات",
    platformAnswer: "XBRL Parser + Balance Identity Check + Forensic Audit = بيانات نظيفة موثقة",
    where: "/rebh/score · /rebh/xray · forensic_service",
    score: 10,
  },
  {
    id: 14, school: "quant",
    advisor: "يوجين فاما", advisorEn: "Eugene Fama",
    demand: "عوامل: القيمة · الحجم · الزخم · الجودة",
    platformAnswer: "P/B · P/E · ROE · EPS Growth · Piotroski تُولد عوامل متعددة",
    where: "/rebh/analyst (ratios) · /rebh/score",
    score: 10,
  },
  {
    id: 15, school: "quant",
    advisor: "ريتشارد ثايلر", advisorEn: "Richard Thaler",
    demand: "الانحياز السلوكي · تراجع الانتباه عن الأسهم المنبوذة",
    platformAnswer: "Quarantine System يمنع التحليل العاطفي · حوكمة صارمة للبيانات",
    where: "/rebh/score (quarantine) · /rebh/xray",
    score: 10,
  },
  {
    id: 16, school: "quant",
    advisor: "جوزيف بيوتروسكي", advisorEn: "Joseph Piotroski",
    demand: "9-point F-Score كامل من قوائم حقيقية",
    platformAnswer: "F-Score محسوبة بالكامل من XBRL · 9 نقاط: ربحية + سيولة + كفاءة + رفع",
    where: "/rebh/company · /rebh/xray",
    score: 10,
  },
  {
    id: 17, school: "quant",
    advisor: "ميسود بينيش", advisorEn: "Messod Beneish",
    demand: "M-Score كاشف تلاعب محاسبي",
    platformAnswer: "Beneish M-Score محسوب من 8 مؤشرات XBRL · عتبة الخطر −1.78 (المعيار المعتمد داخل المنصة)",
    where: "/rebh/xray · /rebh/company",
    score: 10,
  },
  {
    id: 18, school: "quant",
    advisor: "إدوارد ألتمان", advisorEn: "Edward Altman",
    demand: "Z-Score للتنبؤ بالإفلاس",
    platformAnswer: "Altman Z-Score محسوب من الميزانية وقائمة الدخل وسعر السوق",
    where: "/rebh/company · /rebh/xray",
    score: 10,
  },
  // ── Technical School ──────────────────────────────────────────────────────
  {
    id: 19, school: "technical",
    advisor: "ويليام أونيل", advisorEn: "William O'Neil",
    demand: "CANSLIM: C · A · N · S · L · I · M",
    platformAnswer: "EPS TTM · EPS YoY · نمو المبيعات · قيادة السوق · مساندة مؤسسية",
    where: "/rebh/analyst · /rebh/studio (price action)",
    score: 10,
  },
  {
    id: 20, school: "technical",
    advisor: "مارتن بريتز", advisorEn: "Martin Pring",
    demand: "تحليل تقني متكامل · مؤشرات الزخم",
    platformAnswer: "Price Action Mode: SMA-20 · Volume Bars · Area Chart في Chart Studio",
    where: "/rebh/studio (price action mode)",
    score: 10,
  },
  {
    id: 21, school: "technical",
    advisor: "ستان واينشتاين", advisorEn: "Stan Weinstein",
    demand: "تحليل المراحل · Stage Analysis",
    platformAnswer: "BCG Stage Engine يُصنِّف الشركة (Growth/Mature/Question/Dog)",
    where: "/rebh/company (BCG stage) · /rebh/xray",
    score: 10,
  },
  // ── Method Masters ────────────────────────────────────────────────────────
  {
    id: 22, school: "method",
    advisor: "أسواب دامودران", advisorEn: "Aswath Damodaran",
    demand: "DCF · معدل خصم مبني من البيانات · Reverse DCF",
    platformAnswer: "Build-Up Required Return من Sukuk + Porter + Safety · Reverse DCF يكشف معدل النمو الضمني",
    where: "/rebh/company (Reverse DCF + Build-Up)",
    score: 10,
  },
  {
    id: 23, school: "method",
    advisor: "مايكل موبوسين", advisorEn: "Michael Mauboussin",
    demand: "الميزة التنافسية · ROIC vs WACC · تحليل القيمة الجوهرية",
    platformAnswer: "ROIC محسوب · Porter 5 Forces · Nine-Box يحسب القيمة من ROIC ومدة ميزة تنافسية",
    where: "/rebh/company · /rebh/analyst (ratios)",
    score: 10,
  },
  {
    id: 24, school: "method",
    advisor: "هوارد ماركس", advisorEn: "Howard Marks",
    demand: "دورات السوق · تقييم المخاطر · هامش أمان مُقنَّن",
    platformAnswer: "Zone System: Gold/Silver/Bronze · Margin of Safety % · Risk Flags",
    where: "/rebh/company (Zones) · /rebh/score",
    score: 10,
  },
  {
    id: 25, school: "method",
    advisor: "مونيش بابراي", advisorEn: "Mohnish Pabrai",
    demand: "Dhandho: شراء أعمال بسيطة بسعر منخفض جداً",
    platformAnswer: "Buy Gate Evaluation · Quarantine · NCAV Screen · Net-Net Check",
    where: "/rebh/company (Buy Gate) · /rebh/score",
    score: 10,
  },
  {
    id: 26, school: "method",
    advisor: "بات دورسي", advisorEn: "Pat Dorsey",
    demand: "الخندق الاقتصادي: شبكات · تكاليف تحول · أصول غير ملموسة",
    platformAnswer: "Porter 5 Forces quantified · BCG Stage · predictability score",
    where: "/rebh/company (Porter) · /rebh/analyst",
    score: 10,
  },
  {
    id: 27, school: "method",
    advisor: "توماس فيليبس", advisorEn: "Thomas Philips",
    demand: "Owner's Earnings · FCF الحقيقي للمالك",
    platformAnswer: "Owner Yield محسوب = FCF / Market Cap · FCF = CFO − CapEx من XBRL",
    where: "/rebh/company · /rebh/xray (money river)",
    score: 10,
  },
  {
    id: 28, school: "method",
    advisor: "كريستوفر ماير", advisorEn: "Christopher Mayer",
    demand: "100-Bagger: نمو مركّب بدون ربح مؤقت · صاحب مؤسس",
    platformAnswer: "EPS TTM growth + Retained Earnings trend + predictability 5Y",
    where: "/rebh/analyst · /rebh/xray (sparklines)",
    score: 10,
  },
  // ── Platform Benchmark ────────────────────────────────────────────────────
  {
    id: 29, school: "platform",
    advisor: "معيار IFRS / XBRL", advisorEn: "IFRS / XBRL Standard",
    demand: "مطابقة المعايير الدولية للتقارير المالية · بيانات XML موثقة",
    platformAnswer: "Parser XBRL يقرأ ملفات تداول الرسمية · فحص A = L + E · حجب القيم الفاسدة",
    where: "/rebh/score · forensic_service.py · xbrl_data_service.py",
    score: 10,
  },
  {
    id: 30, school: "platform",
    advisor: "CFA Institute", advisorEn: "CFA Institute",
    demand: "نزاهة البيانات · إفصاح كامل · لا تلاعب في الأرقام",
    platformAnswer: "كل نسبة مع مصدرها · كل تقدير موسوم · وسم ° ≈ ⚑ 🔌 لكل قيمة",
    where: "/rebh/analyst (formula traceability) · /rebh/score",
    score: 10,
  },
  {
    id: 31, school: "platform",
    advisor: "هيئة السوق المالية (CMA)", advisorEn: "Saudi CMA",
    demand: "الالتزام بلوائح الإفصاح السعودية · بيانات تداول الرسمية فقط",
    platformAnswer: "مصادر البيانات حصرياً من منصة تداول الرسمية · لا بيانات غير معتمدة",
    where: "xbrl_data_service.py · forensic_service.py",
    score: 10,
  },
  {
    id: 32, school: "platform",
    advisor: "معايير الحوكمة البنكية (Basel III)", advisorEn: "Basel III",
    demand: "نموذج تقييم منفصل للبنوك · NIM · LDR · CASA",
    platformAnswer: "Bank Metrics Engine: NIM · LDR · CASA · Cost of Risk · Provisions/Revenue",
    where: "/rebh/company (BankMetrics) · /rebh/analyst",
    score: 10,
  },
  {
    id: 33, school: "platform",
    advisor: "معيار الشريعة الإسلامية", advisorEn: "Shariah Compliance",
    demand: "نسبة الدين · الدخل غير الحلال · الأصول غير السائلة",
    platformAnswer: "Shariah Compliance: debt/mc % · interest_income_pct · illiquid_assets_pct",
    where: "/rebh/company (Shariah) · /rebh/score",
    score: 10,
  },
  {
    id: 34, school: "platform",
    advisor: "معيار النزاهة الجنائية (Forensic Finance)", advisorEn: "Forensic Finance",
    demand: "كشف التحايل المحاسبي · كاش قابل للتحقق · إشارات Accruals",
    platformAnswer: "Beneish + Piotroski + CFO/NI check + Red Flag Engine + Quarantine",
    where: "/rebh/xray · /rebh/score · forensic_service",
    score: 10,
  },
  {
    id: 35, school: "platform",
    advisor: "معيار تجربة المستثمر الأكاديمي", advisorEn: "Academic Investor UX",
    demand: "شاشات متخصصة · تتبع الصيغ · لغة المهنيين",
    platformAnswer: "Analyst + Studio + X-Ray + Score + One + Company — 6 شاشات متخصصة",
    where: "/rebh/* — المنصة الكاملة",
    score: 10,
  },
];

const SCHOOL_META: Record<School, { label: string; labelEn: string; color: string; bg: string; border: string }> = {
  fundamental: { label: "المدرسة الأساسية", labelEn: "Fundamental School", color: "text-[#1D4ED8]", bg: "bg-[#EFF6FF]", border: "border-[#BFDBFE]" },
  macro: { label: "المدرسة الكلية", labelEn: "Macro School", color: "text-[#7C3AED]", bg: "bg-[#F5F3FF]", border: "border-[#DDD6FE]" },
  quant: { label: "المدرسة الكمية", labelEn: "Quant School", color: "text-[#0D9488]", bg: "bg-[#F0FDFA]", border: "border-[#99F6E4]" },
  technical: { label: "التحليل الفني", labelEn: "Technical School", color: "text-[#B45309]", bg: "bg-[#FFFBEB]", border: "border-[#FDE68A]" },
  method: { label: "أساتذة المنهجية", labelEn: "Method Masters", color: "text-[#9D174D]", bg: "bg-[#FDF2F8]", border: "border-[#FBCFE8]" },
  platform: { label: "معيار المنصة", labelEn: "Platform Benchmark", color: "text-[#166534]", bg: "bg-[#F0FDF4]", border: "border-[#BBF7D0]" },
};

// ─── Evidence map labels ──────────────────────────────────────────────────────
const EVIDENCE_LABEL: Record<string, string> = {
  forensic_pass: "مجتاز جنائياً", total_universe: "إجمالي الكون",
  fresh_companies: "قوائم حديثة", stale_quarantined: "محجور",
  live_price_symbols: "أسعار حية", sectors_unique: "قطاعات",
  pass_count: "مجتاز", coverage_pct: "نسبة التغطية %",
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RebhCouncilScorecardPage() {
  const [liveData, setLiveData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<School | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchScorecard() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rebh/scorecard`);
        if (res.ok) setLiveData(await res.json());
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    fetchScorecard();
  }, []);

  const filtered = useMemo(() => {
    let rows = ADVISORS;
    if (filter !== "all") rows = rows.filter(r => r.school === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.advisor.toLowerCase().includes(q) ||
        r.advisorEn.toLowerCase().includes(q) ||
        r.demand.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [filter, search]);

  const handleCopy = () => {
    const lines = ADVISORS.map(a =>
      `[${a.id}] ${a.advisor} (${a.advisorEn}) | ${a.demand} | ${a.platformAnswer} | ${a.score}/10`
    );
    navigator.clipboard.writeText(["بطاقة تغطية منصة REBH — 35 متطلباً", ...lines].join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // School counts
  const schoolCounts = useMemo(() =>
    Object.keys(SCHOOL_META).reduce((acc, k) => {
      acc[k] = ADVISORS.filter(a => a.school === k).length;
      return acc;
    }, {} as Record<string, number>)
    , []);

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1A] pb-28 print:bg-white">

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] px-5 py-2.5 flex items-center justify-between flex-wrap gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] print:hidden">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded bg-[#8C3B32] text-white font-mono font-black text-xs">SCORECARD</span>
          <h1 className="font-bold text-sm text-[#1A1A1A] tracking-tight">بطاقة تغطية المنصة · 35 متطلباً</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F9FAFB] border border-[#D1D5DB] rounded-[4px] text-xs font-semibold text-[#374151]">
            {copied ? <Check size={13} className="text-[#16A34A]" /> : <Copy size={13} />}
            {copied ? "تم" : "نسخ"}
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8C3B32] hover:bg-[#752f28] text-white rounded-[4px] text-xs font-semibold">
            <Printer size={13} />طباعة
          </button>
        </div>
      </header>

      {/* ── HERO BANNER ──────────────────────────────────────────────────── */}
      <section className="bg-[#0F172A] text-white px-6 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16A34A]/20 border border-[#16A34A]/30 text-[#4ADE80] text-xs font-bold font-mono">
              <ShieldCheck size={14} />
              مصفوفة تغطية المنصة · 35 متطلب استشاري
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              بطاقة تغطية المنصة — Platform Coverage Scorecard
            </h2>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              35 مستشاراً ومعياراً استثمارياً ومؤسسياً · كل واحد له مطلب محدد ·
              المنصة تُوثّق كيف تُجيب عنه — <strong className="text-white">مصفوفة تغطية توثيقية</strong> وليست درجات محسوبة مستقلة لكل مستشار
            </p>
            <p className="text-[11px] font-mono text-[#64748B] border border-[#334155] rounded-[4px] px-3 py-1.5 inline-block">
              ⚠ هذا Scorecard يُقيِّم تغطية المنصة لا السهم — score: 10 يعني أن الأداة متوفرة، لا أن كل سهم مناسب للشراء
            </p>
          </div>

          {/* Grand score display */}
          <div className="shrink-0 text-center bg-white/5 border border-white/10 rounded-[8px] px-8 py-6 space-y-2">
            <span className="block text-[11px] font-mono text-[#94A3B8]">متطلبات موثّقة</span>
            <div className="text-5xl font-black font-mono text-[#4ADE80]">35</div>
            <div className="text-base font-bold text-white">مطلب × تغطية موثّقة</div>
            <div className="text-[11px] font-mono text-[#4ADE80] mt-1">
              مصفوفة تغطية المنصة ✓
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE PLATFORM STATS (from backend) ───────────────────────────── */}
      {!loading && liveData && (
        <section className="bg-white border-b border-[#E5E7EB] px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <p className="text-[11px] font-bold text-[#94A3B8] mb-3 font-mono">أرقام حية من قاعدة البيانات (محسوبة في: {liveData.computed_at ?? "—"})</p>
            <div className="flex flex-wrap gap-3">
              {[
                { label: "كون الشركات", val: liveData.total_coverage, unit: "شركة" },
                { label: "مجتازة الاختبار", val: liveData.pass_count, unit: "شركة" },
                { label: "محجورة (Too-Hard)", val: liveData.stale_quarantined, unit: "شركة" },
                { label: "أسعار سوقية حية", val: liveData.live_price_symbols, unit: "رمز" },
                { label: "قطاعات فريدة", val: liveData.sectors_unique, unit: "قطاع" },
              ].map((s, i) => (
                <div key={i} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] px-3 py-1.5 flex items-center gap-2">
                  <span className="text-[10px] text-[#64748B]">{s.label}</span>
                  <span className="font-mono font-black text-xs text-[#0F172A]">{s.val ?? "—"} {s.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SCHOOL FILTER + SEARCH ────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-3 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-bold border transition-colors ${filter === "all" ? "bg-[#8C3B32] text-white border-[#8C3B32]" : "bg-white text-[#374151] border-[#D1D5DB] hover:bg-[#F3F4F6]"}`}
            >
              الكل ({ADVISORS.length})
            </button>
            {(Object.keys(SCHOOL_META) as School[]).map(k => {
              const m = SCHOOL_META[k];
              return (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`px-3 py-1.5 rounded-[4px] text-xs font-bold border transition-colors ${filter === k ? `${m.bg} ${m.color} ${m.border}` : "bg-white text-[#374151] border-[#D1D5DB] hover:bg-[#F3F4F6]"}`}
                >
                  {m.label} ({schoolCounts[k]})
                </button>
              );
            })}
          </div>
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث باسم المستشار أو المطلب…"
            className="px-3 py-1.5 text-xs border border-[#D1D5DB] rounded-[4px] outline-none focus:border-[#8C3B32] bg-[#F9FAFB] w-52"
          />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-8">

        {/* ── ADVISOR TABLE ────────────────────────────────────────────────── */}
        <div className="bg-white border border-[#E5E7EB] rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
              <Award size={14} className="text-[#8C3B32]" />
              جدول المستشارين — {filtered.length} صف
            </h3>
            <span className="text-[11px] font-mono text-[#64748B]">كل صف: Score = 10/10</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="p-2.5 text-right font-bold text-[#475569] w-8">#</th>
                  <th className="p-2.5 text-right font-bold text-[#475569] min-w-[120px]">المستشار</th>
                  <th className="p-2.5 text-right font-bold text-[#475569] min-w-[80px]">المدرسة</th>
                  <th className="p-2.5 text-right font-bold text-[#475569] min-w-[200px]">المطلب الجوهري</th>
                  <th className="p-2.5 text-right font-bold text-[#475569] min-w-[220px]">إجابة المنصة</th>
                  <th className="p-2.5 text-right font-bold text-[#475569] min-w-[160px]">الموقع</th>
                  <th className="p-2.5 text-center font-bold text-[#475569] w-16">النتيجة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.map(row => {
                  const sm = SCHOOL_META[row.school];
                  return (
                    <tr key={row.id} className="hover:bg-[#FFFBF9] group transition-colors">
                      <td className="p-2.5 text-right">
                        <span className="font-mono font-bold text-[#94A3B8]">{row.id}</span>
                      </td>
                      <td className="p-2.5">
                        <span className="block font-bold text-[#0F172A]">{row.advisor}</span>
                        <span className="block text-[10px] font-mono text-[#6B7280]">{row.advisorEn}</span>
                      </td>
                      <td className="p-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${sm.bg} ${sm.color} ${sm.border}`}>
                          {sm.label}
                        </span>
                      </td>
                      <td className="p-2.5 text-[#374151] leading-relaxed">{row.demand}</td>
                      <td className="p-2.5 text-[#374151] leading-relaxed">{row.platformAnswer}</td>
                      <td className="p-2.5">
                        <span className="block font-mono text-[10px] text-[#8C3B32] leading-relaxed">{row.where}</span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-6 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] font-mono font-black text-[#16A34A] text-xs">
                          10
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-[#F8FAFC] border-t-2 border-[#E2E8F0]">
                    <td colSpan={6} className="p-3 text-right text-xs font-bold text-[#0F172A]">
                      مجموع النتيجة ({filtered.length} مستشار)
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-mono font-black text-sm text-[#16A34A]">
                        {filtered.length * 10}/{filtered.length * 10}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* ── SCHOOL BREAKDOWN CARDS ────────────────────────────────────── */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
            <BookOpen size={14} className="text-[#8C3B32]" />
            توزيع المدارس الاستثمارية
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(Object.entries(SCHOOL_META) as [School, typeof SCHOOL_META[School]][]).map(([k, m]) => (
              <div
                key={k}
                className={`rounded-[6px] border ${m.border} ${m.bg} p-4 text-center cursor-pointer hover:shadow-sm transition-all`}
                onClick={() => setFilter(k === filter ? "all" : k)}
              >
                <span className={`block text-2xl font-black font-mono ${m.color}`}>{schoolCounts[k]}</span>
                <span className={`block text-[11px] font-bold mt-1 ${m.color}`}>{m.label}</span>
                <span className="block text-[10px] font-mono text-[#94A3B8] mt-0.5">{m.labelEn}</span>
                <span className={`block text-[10px] font-bold mt-1 ${m.color}`}>
                  {schoolCounts[k] * 10}/{schoolCounts[k] * 10}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── LIVE 10-DIMENSION DATA (from backend) ────────────────────── */}
        {!loading && liveData?.categories?.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
              <CheckSquare size={14} className="text-[#8C3B32]" />
              الأبعاد العشرة المُحقَّقة — بيانات حية من المنصة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {liveData.categories.map((cat: any) => (
                <div key={cat.id} className="bg-white border border-[#E5E7EB] rounded-[6px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-2">
                  <div className="flex items-start justify-between gap-2 border-b border-[#F1F5F9] pb-2">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#8C3B32] text-white flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">{cat.id}</span>
                      <div>
                        <h4 className="text-xs font-bold text-[#0F172A]">{cat.name}</h4>
                        <span className="text-[10px] font-mono text-[#64748B]">{cat.nameEn}</span>
                      </div>
                    </div>
                    <span className="font-mono font-black text-xs text-[#16A34A] shrink-0">{cat.score}/{cat.max} ✓</span>
                  </div>
                  <p className="text-[11px] text-[#475569] leading-relaxed">{cat.detail}</p>
                  {cat.evidence && Object.keys(cat.evidence).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(cat.evidence).map(([k, v]: [string, any]) => (
                        <span key={k} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F1F5F9] border border-[#E2E8F0] text-[9px] font-mono text-[#334155]">
                          <span className="text-[#64748B]">{EVIDENCE_LABEL[k] ?? k}:</span>
                          <strong>{typeof v === "number" && !Number.isInteger(v) ? v.toFixed(1) : String(v)}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] border-t border-[#F8FAFC] pt-1.5">
                    <span className="text-[#64748B]">مرجعية الاعتماد</span>
                    <span className="font-mono font-semibold text-[#0F172A]">{cat.authority}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DISCLAIMER + NAVIGATION ──────────────────────────────────── */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[6px] p-5 space-y-3">
          <h4 className="text-xs font-bold text-[#92400E] flex items-center gap-2">
            <AlertTriangle size={14} className="text-[#D97706]" />
            إخلاء المسؤولية — ضروري للقراءة
          </h4>
          <ul className="space-y-1.5 text-xs text-[#78350F]">
            <li className="flex items-start gap-2">
              <span className="text-[#D97706] shrink-0">⚑</span>
              هذا Scorecard يُقيِّم المنصة كأداة تحليلية، ولا يمثل توصية بالشراء أو البيع لأي سهم.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D97706] shrink-0">⚑</span>
              نتيجة 10/10 تعني أن المنصة تُوفر أدوات تحليل كاملة — الاستثمار قرار شخصي يحمل مخاطر.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D97706] shrink-0">⚑</span>
              الأرقام الحية من قاعدة البيانات تعكس وقت الحساب — قد تتغير بتحديث القوائم الرسمية.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D97706] shrink-0">⚑</span>
              هذه المنصة معيار استثماري أكاديمي، ولا تُغني عن اعتماد لجان شرعية ومستشارين ماليين معتمدين.
            </li>
          </ul>
        </div>

        {/* Nav footer */}
        <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div>
            <p className="font-bold text-[#0F172A]">استعرض المنصة</p>
            <p className="text-[#64748B] mt-0.5">كل شاشة تُجيب على مطلب مستشار مختلف</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {[
              { href: "/rebh/analyst/2222", label: "المحلل" },
              { href: "/rebh/xray/2222", label: "الأشعة (X-Ray)" },
              { href: "/rebh/studio/2222", label: "الاستوديو" },
              { href: "/rebh/company/2222", label: "شركة كاملة", primary: true },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className={`px-3 py-1.5 rounded-[4px] font-semibold transition-colors ${l.primary ? "bg-[#8C3B32] hover:bg-[#752f28] text-white" : "bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] text-[#374151]"}`}>
                {l.label} →
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center text-[11px] text-[#9CA3AF] pt-6 border-t border-[#E5E7EB] print:mt-8">
        <p>منصة REBH — بطاقة تغطية المنصة · 35 متطلب توثيقي</p>
        <p className="mt-0.5">هذه النتيجة تُقيِّم المنصة كأداة تحليلية · لا تمثل توصية استثمارية لأي سهم</p>
      </footer>
    </div>
  );
}