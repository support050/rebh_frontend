"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { authFetch } from "@/lib/api/authFetch";

interface CompanyData {
  sym: string;
  name: string;
  sector: string;
  mc: number;
  pe: number | null;
  pb: number | null;
  roe: number | null;
  nm: number | null;
  current: number | null;
  quick: number | null;
  de: number | null;
  coverage: number | null;
  fcf: number | null;
  fcf_yield: number | null;
  fcf_ni: number | null;
  owner_yield: number | null;
  div_yield: number | null;
  g_net: number | null;
  g_rev: number | null;
  roic: number | null;
  ev_ebit: number | null;
  magic_pos: number | null;
  fresh: boolean;
  flags: string[];
  p_roe?: number | null;
  end?: string;
  [key: string]: any;
}

interface AuditData {
  pass: number;
  na: number;
  fixed: number;
  mixed: number;
  corrupt: number;
  magic_n: number;
}

type ScreenKey = "magic" | "buffett" | "graham" | "quality" | "watch" | "all";

interface ScreenDef {
  t: string;
  d: string | ((count: number) => string);
  cols: [string, string][];
  rows: (data: CompanyData[]) => CompanyData[];
  cell?: (r: CompanyData, k: string) => React.ReactNode | null;
}

const SCREENS: Record<ScreenKey, ScreenDef> = {
  magic: {
    t: "🧮 Magic Formula الحقيقية — منهجية Greenblatt الكاملة",
    d: "الترتيب المركب: رخص EV/EBIT° + جودة ROIC° (EBIT ÷ رأس المال الموظف = الملكية + الدين − النقد). الصيغة الحقيقية من كتابه، ليست proxy — أصبحت ممكنة اليوم لأن الميزانيات مسحوبة لكل السوق. غير المالية فقط.",
    cols: [
      ["#", "magic_pos"],
      ["الشركة", "name"],
      ["القطاع", "sector"],
      ["EV/EBIT °", "ev_ebit"],
      ["ROIC °", "roic"],
      ["P/E", "pe"],
      ["عائد FCF ٪", "fcf_yield"],
      ["نمو الربح ٪", "g_net"],
    ],
    rows: (data) =>
      data
        .filter((r) => r.fresh && r.magic_pos != null)
        .sort((a, b) => (a.magic_pos || 999) - (b.magic_pos || 999)),
    cell: (r, k) =>
      k === "magic_pos" ? (
        <span className="font-bold tabular-nums">
          {r.magic_pos}
          {(r.magic_pos || 999) <= 10 && (
            <span className="mr-1 inline-block rounded border border-[#B8860B] dark:border-[#D9B64A] bg-[#FEF9E7] dark:bg-[#D9B64A]/15 px-1 text-[9.5px] font-bold text-[#B8860B] dark:text-[#D9B64A]">
              ✦
            </span>
          )}
        </span>
      ) : null,
  },
  buffett: {
    t: "💰 شاشة بافيت — التدفق الحر وأرباح المالك",
    d: "عائد FCF° = (التشغيلي − capex) ÷ القيمة السوقية، سنة 2025 · جودة التحويل FCF/NI° (قريبة من 100% = الربح حقيقي نقداً) · عائد أرباح المالك° = (الربح + الإهلاك − capex صيانة) ÷ القيمة. الترتيب بعائد FCF.",
    cols: [
      ["الشركة", "name"],
      ["القطاع", "sector"],
      ["عائد FCF ٪ °", "fcf_yield"],
      ["FCF/NI ٪ °", "fcf_ni"],
      ["عائد أرباح المالك ٪ °", "owner_yield"],
      ["عائد توزيعات ٪ °", "div_yield"],
      ["P/E", "pe"],
      ["ROE ٪", "roe"],
    ],
    rows: (data) =>
      data
        .filter(
          (r) =>
            r.fresh &&
            r.fcf_yield != null &&
            r.fcf_yield > 0 &&
            !["Banks", "Insurance", "Financial Services", "REITs"].includes(r.sector)
        )
        .sort((a, b) => (b.fcf_yield || 0) - (a.fcf_yield || 0)),
  },
  graham: {
    t: "🛡️ شاشة جراهام — هامش الأمان الدفاعي",
    d: "معاييره الحرفية للمستثمر الدفاعي: تداول ≥ 1.5 · دين/ملكية ≤ 0.5 · P/E ≤ 15 · P/B ≤ 1.5 (أو P/E×P/B ≤ 22.5) · ربح موجب. كل شرط يظهر التزامه — الشركة تدخل فقط لو حققتها كلها.",
    cols: [
      ["الشركة", "name"],
      ["القطاع", "sector"],
      ["P/E", "pe"],
      ["P/B", "pb"],
      ["التداول °", "current"],
      ["دين/ملكية °", "de"],
      ["ROE ٪", "roe"],
      ["عائد توزيعات ٪", "div_yield"],
    ],
    rows: (data) =>
      data
        .filter(
          (r) =>
            r.fresh &&
            r.pe != null &&
            r.pe <= 15 &&
            r.pb != null &&
            (r.pb <= 1.5 || r.pe * r.pb <= 22.5) &&
            r.current != null &&
            r.current >= 1.5 &&
            r.de != null &&
            r.de <= 0.5
        )
        .sort((a, b) => (a.pe || 0) - (b.pe || 0)),
  },
  quality: {
    t: "⭐ شاشة الجودة المركبة — Munger/GuruFocus",
    d: "ROIC° ≥ 15 + تغطية فوائد° ≥ 5 + تحويل نقدي FCF/NI ≥ 60% — الشركات التي «تستحق سعرها»: ربحية رأس مال عالية بنقد حقيقي وميزانية مرتاحة.",
    cols: [
      ["الشركة", "name"],
      ["القطاع", "sector"],
      ["ROIC ٪ °", "roic"],
      ["تغطية الفوائد °", "coverage"],
      ["FCF/NI ٪ °", "fcf_ni"],
      ["EV/EBIT °", "ev_ebit"],
      ["P/E", "pe"],
      ["نمو الربح ٪", "g_net"],
    ],
    rows: (data) =>
      data
        .filter(
          (r) =>
            r.fresh &&
            r.roic != null &&
            r.roic >= 15 &&
            (r.coverage == null || r.coverage >= 5) &&
            r.fcf_ni != null &&
            r.fcf_ni >= 60
        )
        .sort((a, b) => (b.roic || 0) - (a.roic || 0)),
  },
  watch: {
    t: "⚠️ قائمة مراقبة الدين — تغطية فوائد ضعيفة",
    d: "ربح العمليات° ÷ تكلفة التمويل° < 2 — ليست حكماً سلبياً بذاتها (المطورون العقاريون طبيعتهم كذلك) لكنها أول ما يفحصه أي مقرض أو محلل ائتمان. الترتيب من الأضعف.",
    cols: [
      ["الشركة", "name"],
      ["القطاع", "sector"],
      ["تغطية الفوائد °", "coverage"],
      ["دين/ملكية °", "de"],
      ["عائد FCF ٪", "fcf_yield"],
      ["P/B", "pb"],
      ["نمو الربح ٪", "g_net"],
    ],
    rows: (data) =>
      data
        .filter((r) => r.fresh && r.coverage != null && r.coverage > 0 && r.coverage < 2)
        .sort((a, b) => (a.coverage || 0) - (b.coverage || 0)),
  },
  all: {
    t: "📋 السوق كله — كل الشاشات في جدول واحد",
    d: (count: number) =>
      `${count} شركة لديها ميزانية مسحوبة. اضغط أي عمود للترتيب. المئين «مقابل القطاع» يُحسب وسط شركات القطاع المحدثة فقط ويُحجب لو العينة أقل من 3.`,
    cols: [
      ["الشركة", "name"],
      ["القطاع", "sector"],
      ["P/E", "pe"],
      ["P/B", "pb"],
      ["ROE ٪", "roe"],
      ["مئين ROE", "p_roe"],
      ["EV/EBIT °", "ev_ebit"],
      ["ROIC ٪ °", "roic"],
      ["التداول °", "current"],
      ["دين/ملكية °", "de"],
      ["عائد FCF ٪ °", "fcf_yield"],
      ["تغطية °", "coverage"],
      ["Magic", "magic_pos"],
    ],
    rows: (data) => data,
    cell: (r, k) =>
      k === "p_roe" && r.p_roe != null ? (
        <span
          className={`inline-block min-w-[26px] rounded px-1 text-center text-[10px] font-bold ${
            r.p_roe >= 67
              ? "bg-[#16A34A]/10 dark:bg-[#0CA30C]/20 text-[#16A34A] dark:text-[#0CA30C]"
              : r.p_roe >= 34
              ? "bg-[#F3F4F6] dark:bg-[#222220] text-[#6B7280] dark:text-[#C3C2B7]"
              : "bg-[#FEF2F2] dark:bg-[#E66767]/15 text-[#DC2626] dark:text-[#E66767]"
          }`}
        >
          {r.p_roe}
        </span>
      ) : null,
  },
};

function fmt(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("en-US", { maximumFractionDigits: digits });
}

export default function LegendsScreenerPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [cur, setCur] = useState<ScreenKey>("magic");
  const [sortK, setSortK] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [query, setQuery] = useState("");

  const [data, setData] = useState<CompanyData[]>([]);
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [resRatios, resAudit] = await Promise.all([
          authFetch("/api/terminal/all-ratios/"),
          authFetch("/api/terminal/audit-summary/"),
        ]);
        if (!cancelled) {
          if (resRatios.ok) {
            const ratios = await resRatios.json();
            setData(ratios);
          } else {
            throw new Error(`Failed to load ratios data (${resRatios.status})`);
          }
          if (resAudit.ok) {
            const aud = await resAudit.json();
            setAudit(aud);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Failed to load legends data", err);
          setError(err.message || "Failed to load standards guide data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Derive freshest "as of" date from live dataset
  const asOfDate = useMemo(() => {
    const dates = data.map((d) => d.end).filter(Boolean) as string[];
    if (dates.length > 0) {
      dates.sort();
      return dates[dates.length - 1];
    }
    return "2026-08-18";
  }, [data]);

  const S = SCREENS[cur];
  const screenRows = useMemo(() => {
    let r = S.rows(data);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      r = r.filter(
        (row) => row.name.toLowerCase().includes(q) || row.sym.toLowerCase().includes(q)
      );
    }
    if (sortK) {
      r = [...r].sort((a: any, b: any) => {
        const x = a[sortK];
        const y = b[sortK];
        if (x == null) return 1;
        if (y == null) return -1;
        return sortAsc ? (x > y ? 1 : -1) : (x < y ? 1 : -1);
      });
    }
    // Cap displayed rows at 25 per screen (300 for the "all" market screen) matching original demo
    return r.slice(0, cur === "all" ? 300 : 25);
  }, [S, data, sortK, sortAsc, query, cur]);

  function setSort(k: string) {
    if (sortK === k) setSortAsc((v) => !v);
    else {
      setSortK(k);
      setSortAsc(true);
    }
  }

  function renderMarks(r: CompanyData) {
    const badges: React.ReactNode[] = [];
    if ((r.flags || []).includes("≈debt")) {
      badges.push(
        <span
          key="approx"
          className="mr-1 inline-block rounded bg-[#F3F4F6] dark:bg-[#222220] px-1 text-[9.5px] font-bold text-[#6B7280] dark:text-[#C3C2B7]"
          title="الدين الطويل مقدر من المطلوبات غير المتداولة حتى إصلاح mapping الصكوك"
        >
          ≈دين
        </span>
      );
    }
    if ((r.flags || []).some((f) => f.startsWith("⚑"))) {
      badges.push(
        <span
          key="flag"
          className="mr-1 inline-block rounded bg-[#FEF2F2] dark:bg-[#E66767]/15 px-1 text-[9.5px] font-bold text-[#DC2626] dark:text-[#E66767]"
          title="بيانات قيد المراجعة — بعض الحقول حُجبت"
        >
          ⚑
        </span>
      );
    }
    if (!r.fresh) {
      badges.push(
        <span
          key="stale"
          className="mr-1 inline-block rounded bg-[#FEF2F2] dark:bg-[#E66767]/15 px-1 text-[9.5px] font-bold text-[#DC2626] dark:text-[#E66767]"
        >
          قديمة {String(r.end || "").slice(0, 7)}
        </span>
      );
    }
    return badges;
  }

  const descText = typeof S.d === "function" ? S.d(data.length || 220) : S.d;

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F8FA] dark:bg-[#0D0D0D] font-sans text-[13.5px] text-[#1A1A1A] dark:text-[#F2F1ED] transition-colors">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#2C2C2A] bg-white dark:bg-[#1A1A19] px-6 py-3.5 transition-colors">
        <div>
          <h1 className="text-lg font-bold text-[#1A1A1A] dark:text-[#F2F1ED]">مجلس المال — شاشات الأساطير على السوق السعودي</h1>
          <div className="mt-1 text-[11.5px] text-[#6B7280] dark:text-[#C3C2B7]">
            قوائم دخل + <b>ميزانيات + تدفقات نقدية</b> لكل السوق، مسحوبة مباشرة من قاعدة ربح ({asOfDate}) · أسعار إغلاق اليوم نفسه · كل شاشة تطبق منهجية صاحبها الحقيقية لا تقريباً · ° محسوب · ≈ تقدير معلن · ⚑ بيانات قيد المراجعة
          </div>
        </div>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-[4px] border border-[#E5E7EB] dark:border-[#2C2C2A] px-3 py-1 text-[12px] text-[#6B7280] dark:text-[#C3C2B7] hover:bg-[#F3F4F6] dark:hover:bg-[#222220] transition-colors"
        >
          {mounted && theme === "dark" ? "☀️ فاتح" : "🌙 داكن"}
        </button>
      </header>

      <div className="w-full px-4 py-4 pb-16 space-y-4 md:px-6 lg:px-10">
        {error && (
          <div className="rounded-[4px] border border-[#FECACA] dark:border-[#E66767]/30 bg-[#FEF2F2] dark:bg-[#E66767]/15 p-3 text-[12px] text-[#DC2626] dark:text-[#E66767]">
            ⚠️ {error}
          </div>
        )}

        {/* ── AUDIT CARD ── */}
        {audit && (
          <div className="rounded-[4px] border border-[#E5E7EB] dark:border-[#2C2C2A] bg-white dark:bg-[#1A1A19] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors">
            <h3 className="mb-2 text-[14px] font-bold text-[#1A1A1A] dark:text-[#F2F1ED]">🔍 التدقيق الجنائي قبل أي رقم — ما فحصه المحرك اليوم</h3>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-[4px] border border-[#E5E7EB] dark:border-[#2C2C2A] bg-[#F7F8FA] dark:bg-[#222220] p-3 text-[12px] text-[#1A1A1A] dark:text-[#F2F1ED]">
                <b className="block text-[18px] text-[#16A34A] dark:text-[#0CA30C]">{audit.pass}</b>
                شركة نجحت في فحص أ = خ + ح بعد الاسترداد°
                <div className="mt-0.5 text-[10.5px] text-[#6B7280] dark:text-[#C3C2B7]">من {audit.pass + (audit.na || 0)} لديها ميزانية</div>
              </div>
              <div className="rounded-[4px] border border-[#E5E7EB] dark:border-[#2C2C2A] bg-[#F7F8FA] dark:bg-[#222220] p-3 text-[12px] text-[#1A1A1A] dark:text-[#F2F1ED]">
                <b className="block text-[18px] text-[#16A34A] dark:text-[#0CA30C]">{audit.fixed}</b>
                ميزانية استُردت آلياً من خطأ المضاعفة°
                <div className="mt-0.5 text-[10.5px] text-[#6B7280] dark:text-[#C3C2B7]">تحقق بالريال على حالتين</div>
              </div>
              <div className="rounded-[4px] border border-[#E5E7EB] dark:border-[#2C2C2A] bg-[#F7F8FA] dark:bg-[#222220] p-3 text-[12px] text-[#1A1A1A] dark:text-[#F2F1ED]">
                <b className="block text-[18px] text-[#B8860B] dark:text-[#D9B64A]">{audit.mixed}</b>
                شركة بمقاييس مختلطة عولجت آلياً
                <div className="mt-0.5 text-[10.5px] text-[#6B7280] dark:text-[#C3C2B7]">ريال/آلاف — يلزم حقل scale عند المصدر</div>
              </div>
              <div className="rounded-[4px] border border-[#E5E7EB] dark:border-[#2C2C2A] bg-[#F7F8FA] dark:bg-[#222220] p-3 text-[12px] text-[#1A1A1A] dark:text-[#F2F1ED]">
                <b className="block text-[18px] text-[#B8860B] dark:text-[#D9B64A]">{audit.corrupt || 0}</b>
                حقل ملوث حُجب ولم يُعرض
                <div className="mt-0.5 text-[10.5px] text-[#6B7280] dark:text-[#C3C2B7]">قيد المراجعة لا تُعرض قيم خاطئة</div>
              </div>
              <div className="rounded-[4px] border border-[#E5E7EB] dark:border-[#2C2C2A] bg-[#F7F8FA] dark:bg-[#222220] p-3 text-[12px] text-[#1A1A1A] dark:text-[#F2F1ED]">
                <b className="block text-[18px] text-[#16A34A] dark:text-[#0CA30C]">{audit.magic_n || 0}</b>
                شركة مؤهلة لـ Magic Formula الحقيقية
                <div className="mt-0.5 text-[10.5px] text-[#6B7280] dark:text-[#C3C2B7]">غير مالية + بيانات نظيفة + محدثة</div>
              </div>
            </div>

            <div className="mt-3 border-t border-dashed border-[#E5E7EB] dark:border-[#2C2C2A] pt-2.5 text-[12px] leading-relaxed text-[#6B7280] dark:text-[#C3C2B7]">
              <b className="text-[#1A1A1A] dark:text-[#F2F1ED]">اكتشاف جوهري أثناء السحب:</b> الطبقة الموحّدة في قاعدة البيانات تضاعف الإجماليات (إجمالي الأصول المعلن = الحقيقي + غير المتداولة مرة ثانية) في <b className="text-[#1A1A1A] dark:text-[#F2F1ED]">{audit.fixed}</b> شركة — المحرك اكتشفها بفحص «الأصول = المطلوبات + الملكية»، واستنتج معادلة الاسترداد الدقيقة وتحقق منها بالريال على دار الأركان وأسمنت السعودية (TA<sub>حقيقي</sub> = (TA<sub>موحّد</sub> + المتداولة) ÷ 2). <b className="text-[#1A1A1A] dark:text-[#F2F1ED]">مطلوب إصلاحها عند المصدر — التفاصيل في خطة المبرمج.</b> كذلك: بند الصكوك/المرابحات غير ممثل في حقل الدين الموحّد لبعض الشركات — عولج بتقدير معلن (≈) من المطلوبات غير المتداولة حتى يُصلح الـ mapping.
            </div>
          </div>
        )}

        {/* ── SCREENS SELECTOR + SEARCH ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(Object.entries(SCREENS) as [ScreenKey, ScreenDef][]).map(([key, scr]) => (
              <button
                key={key}
                onClick={() => {
                  setCur(key);
                  setSortK(null);
                }}
                className={`rounded-full border-[1.5px] px-4 py-1.5 text-[12.5px] transition-colors ${
                  cur === key
                    ? "border-[#8C3B32] dark:border-[#3987E5] bg-[#8C3B32]/5 dark:bg-[#3987E5]/15 font-bold text-[#8C3B32] dark:text-[#3987E5] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                    : "border-[#E5E7EB] dark:border-[#2C2C2A] bg-white dark:bg-[#1A1A19] text-[#6B7280] dark:text-[#C3C2B7] hover:bg-[#F3F4F6] dark:hover:bg-[#222220]"
                }`}
              >
                {scr.t.split(" — ")[0]}
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-[220px] sm:w-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  document.getElementById("screener-table")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              placeholder="ابحث عن شركة أو رمز..."
              className="w-full rounded-[4px] border border-[#E5E7EB] dark:border-[#2C2C2A] bg-[#F7F8FA] dark:bg-[#222220] px-3 py-1.5 text-[12.5px] text-[#1A1A1A] dark:text-[#F2F1ED] placeholder:text-[#9CA3AF] dark:placeholder:text-[#898781] outline-none transition-colors focus:border-[#8C3B32] dark:focus:border-[#3987E5] focus:ring-2 focus:ring-[#8C3B32]/15 dark:focus:ring-[#3987E5]/20"
            />
          </div>
        </div>

        {/* ── TABLE CARD / LOADING / EMPTY STATE ── */}
        <div id="screener-table" className="scroll-mt-20 overflow-hidden rounded-[4px] border border-[#E5E7EB] dark:border-[#2C2C2A] bg-white dark:bg-[#1A1A19] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors">
          <h3 className="px-4 pt-3.5 pb-1 text-[13.5px] font-bold text-[#1A1A1A] dark:text-[#F2F1ED]">
            {S.t} <span className="text-[11px] font-normal text-[#6B7280] dark:text-[#C3C2B7]">· بيانات حقيقية ({asOfDate})</span>
          </h3>
          <div className="px-4 pb-2 text-[12px] text-[#6B7280] dark:text-[#C3C2B7]">{descText}</div>
          <div className="px-4 pb-2.5 text-[11.5px] text-[#9CA3AF] dark:text-[#898781]">{screenRows.length} شركة</div>

          {loading ? (
            <div className="p-12 text-center text-[#6B7280] dark:text-[#C3C2B7]">
              <div className="mb-2 inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#8C3B32] dark:border-[#3987E5] border-t-transparent dark:border-t-transparent" />
              <p className="text-[12px]">جاري تحميل بيانات شاشات الأساطير من إفصاحات XBRL الفعلية…</p>
            </div>
          ) : (

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.3px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] dark:border-[#2C2C2A] bg-[#F3F4F6] dark:bg-[#222220]">
                    {S.cols.map(([label, key]) => (
                      <th
                        key={key}
                        onClick={() => setSort(key)}
                        className={`cursor-pointer select-none whitespace-nowrap px-2.5 py-2 text-[10.5px] font-semibold text-[#6B7280] dark:text-[#898781] hover:text-[#1A1A1A] dark:hover:text-[#F2F1ED] ${
                          key === "name"
                            ? "sticky inset-inline-start-0 z-10 bg-[#F3F4F6] dark:bg-[#222220] text-right shadow-[-1px_0_0_#E5E7EB_inset] dark:shadow-[-1px_0_0_#2C2C2A_inset]"
                            : "text-left"
                        } ${sortK === key ? "text-[#8C3B32] dark:text-[#3987E5]" : ""}`}
                      >
                        {label}
                        {sortK === key && <span className="mr-0.5">{sortAsc ? " ↑" : " ↓"}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {screenRows.length === 0 ? (
                    <tr>
                      <td colSpan={S.cols.length} className="px-4 py-8 text-center text-[12.5px] text-[#9CA3AF] dark:text-[#898781]">
                        لا توجد شركات مطابقة لهذه الشاشة أو البحث الحالي
                      </td>
                    </tr>
                  ) : (
                    screenRows.map((r) => (
                      <tr
                        key={r.sym}
                        onClick={() => router.push(`/stocks/${r.sym}/xbrl`)}
                        className="cursor-pointer border-b border-[#E5E7EB] dark:border-[#2C2C2A] transition-colors hover:bg-[#F7F8FA] dark:hover:bg-[#222220]"
                      >
                        {S.cols.map(([, key]) => {
                          if (S.cell) {
                            const custom = S.cell(r, key);
                            if (custom != null) {
                              return (
                                <td key={key} className="whitespace-nowrap px-2.5 py-2 text-left tabular-nums" dir="ltr">
                                  {custom}
                                </td>
                              );
                            }
                          }
                          if (key === "name") {
                            return (
                              <td
                                key={key}
                                className="sticky inset-inline-start-0 z-10 whitespace-nowrap bg-white dark:bg-[#1A1A19] px-2.5 py-2 text-right font-semibold text-[#1A1A1A] dark:text-[#F2F1ED] shadow-[-1px_0_0_#E5E7EB_inset] dark:shadow-[-1px_0_0_#2C2C2A_inset]"
                              >
                                {r.name} <small className="font-normal text-[#9CA3AF] dark:text-[#898781]">{r.sym}</small>
                                {renderMarks(r)}
                              </td>
                            );
                          }
                          if (key === "sector") {
                            return (
                              <td key={key} className="whitespace-nowrap px-2.5 py-2 text-left text-[10.5px] text-[#6B7280] dark:text-[#C3C2B7]">
                                {r.sector}
                              </td>
                            );
                          }
                          const v = (r as any)[key];
                          const isNum = typeof v === "number";
                          const colorCls =
                            (key === "g_net" || key === "fcf_yield" || key === "fcf" || key === "owner_yield") && isNum
                              ? v > 0
                                ? "text-[#16A34A] dark:text-[#0CA30C]"
                                : v < 0
                                ? "text-[#DC2626] dark:text-[#E66767]"
                                : "text-[#1A1A1A] dark:text-[#F2F1ED]"
                              : "text-[#1A1A1A] dark:text-[#F2F1ED]";
                          return (
                            <td
                              key={key}
                              className={`whitespace-nowrap px-2.5 py-2 text-left tabular-nums ${colorCls}`}
                              dir="ltr"
                            >
                              {fmt(v)}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-[#E5E7EB] dark:border-[#2C2C2A] bg-[#F7F8FA] dark:bg-[#222220] px-4 py-2.5 text-[11px] text-[#6B7280] dark:text-[#C3C2B7]">
            مصدر كل رقم: XBRL تداول عبر قاعدة ربح · الميزانية: آخر مركز معلن · التدفقات: سنة 2025 المالية · TTM: مجموع آخر 4 أرباع فعلية° · «مقابل القطاع»: مئين فعلي وسط الشركات المحدثة في نفس القطاع (يُحجب لو العينة &lt; 3) · المنصة تعرض معطيات وشاشات ولا تقدم توصية شراء أو بيع
          </div>
        </div>
      </div>
    </div>
  );
}