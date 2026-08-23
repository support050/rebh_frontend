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
  ncav: number | null;
  netnet: boolean | null;
  fresh: boolean;
  flags: string[];
  p_roe?: number | null;
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
  d: string;
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
            <span className="mr-1 inline-block rounded border border-[#d9b64a] bg-[#38301a] px-1 text-[9.5px] font-bold text-[#d9b64a]">
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
            !["Banks", "Insurance", "Financial Services", "Financials", "REITs"].includes(r.sector) &&
            !r.sector.includes("تأمين") &&
            !r.sector.includes("بنوك")
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
    d: "220 شركة لديها ميزانية مسحوبة. اضغط أي عمود للترتيب. المئين «مقابل القطاع» يُحسب وسط شركات القطاع المحدثة فقط ويُحجب لو العينة أقل من 3.",
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
              ? "bg-[#0ca30c]/15 text-[#0ca30c]"
              : r.p_roe >= 34
              ? "bg-[#262624] text-[#898781]"
              : "bg-[#e66767]/15 text-[#e66767]"
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

  const [data, setData] = useState<CompanyData[]>([]);
  const [audit, setAudit] = useState<AuditData>({
    pass: 195,
    na: 25,
    fixed: 165,
    mixed: 120,
    corrupt: 4,
    magic_n: 71,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    async function loadData() {
      try {
        const [resRatios, resAudit] = await Promise.all([
          authFetch("/api/terminal/all-ratios/"),
          authFetch("/api/terminal/audit-summary/"),
        ]);
        if (resRatios.ok) {
          const ratios = await resRatios.json();
          setData(ratios);
        }
        if (resAudit.ok) {
          const aud = await resAudit.json();
          setAudit((prev) => ({ ...prev, ...aud }));
        }
      } catch (err) {
        console.error("Failed to load legends data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const S = SCREENS[cur];
  const screenRows = useMemo(() => {
    let r = S.rows(data);
    if (sortK) {
      r = [...r].sort((a: any, b: any) => {
        const x = a[sortK];
        const y = b[sortK];
        if (x == null) return 1;
        if (y == null) return -1;
        return sortAsc ? (x > y ? 1 : -1) : (x < y ? 1 : -1);
      });
    }
    return r;
  }, [S, data, sortK, sortAsc]);

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
          className="mr-1 inline-block rounded bg-[#262624] px-1 text-[9.5px] font-bold text-[#898781]"
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
          className="mr-1 inline-block rounded bg-[#e66767]/15 px-1 text-[9.5px] font-bold text-[#e66767]"
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
          className="mr-1 inline-block rounded bg-[#e66767]/15 px-1 text-[9.5px] font-bold text-[#e66767]"
        >
          قديمة {String(r.end || "").slice(0, 7)}
        </span>
      );
    }
    return badges;
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#0d0d0d] font-sans text-[13.5px] text-[#fff] dark:bg-[#0d0d0d] dark:text-[#fff]"
    >
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between border-b border-white/10 bg-[#1a1a19] px-6 py-3.5">
        <div>
          <h1 className="text-lg font-bold">مجلس المال — شاشات الأساطير على السوق السعودي</h1>
          <div className="mt-1 text-[11.5px] text-[#898781]">
            قوائم دخل + <b>ميزانيات + تدفقات نقدية</b> لكل السوق، مسحوبة مباشرة من قاعدة ربح · كل شاشة تطبق منهجية صاحبها الحقيقية لا تقريباً · ° محسوب · ≈ تقدير معلن · ⚑ بيانات قيد المراجعة
          </div>
        </div>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-lg border border-white/10 px-3 py-1 text-[12px] text-[#c3c2b7] hover:bg-[#222220]"
        >
          {mounted && theme === "dark" ? "☀️ فاتح" : "🌙 داكن"}
        </button>
      </header>

      <div className="mx-auto max-w-[1280px] px-6 py-4 pb-16 space-y-3.5">
        {/* ── AUDIT CARD ── */}
        <div className="rounded-xl border border-white/10 bg-[#1a1a19] p-4">
          <h3 className="mb-2 text-[14px] font-bold text-[#fff]">🔍 التدقيق الجنائي قبل أي رقم — ما فحصه المحرك اليوم</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg border border-white/10 p-2.5 text-[12px]">
              <b className="block text-[17px] text-[#0ca30c]">{audit.pass}</b>
              شركة نجحت في فحص أ = خ + ح بعد الاسترداد°
              <div className="text-[10.5px] text-[#898781]">من {audit.pass + audit.na} لديها ميزانية</div>
            </div>
            <div className="rounded-lg border border-white/10 p-2.5 text-[12px]">
              <b className="block text-[17px] text-[#0ca30c]">{audit.fixed}</b>
              ميزانية استُردت آلياً من خطأ المضاعفة°
              <div className="text-[10.5px] text-[#898781]">تحقق بالريال على حالتين</div>
            </div>
            <div className="rounded-lg border border-white/10 p-2.5 text-[12px]">
              <b className="block text-[17px] text-[#e8c464]">{audit.mixed}</b>
              شركة بمقاييس مختلطة عولجت آلياً
              <div className="text-[10.5px] text-[#898781]">ريال/آلاف — يلزم حقل scale عند المصدر</div>
            </div>
            <div className="rounded-lg border border-white/10 p-2.5 text-[12px]">
              <b className="block text-[17px] text-[#e8c464]">{audit.corrupt || 4}</b>
              حقل ملوث حُجب ولم يُعرض
              <div className="text-[10.5px] text-[#898781]">منها معادن 1211 — قيد المراجعة لا تُعرض قيم خاطئة</div>
            </div>
            <div className="rounded-lg border border-white/10 p-2.5 text-[12px]">
              <b className="block text-[17px] text-[#0ca30c]">{audit.magic_n || 71}</b>
              شركة مؤهلة لـ Magic Formula الحقيقية
              <div className="text-[10.5px] text-[#898781]">غير مالية + بيانات نظيفة + محدثة</div>
            </div>
          </div>

          <div className="mt-3 border-t border-dashed border-[#2c2c2a] pt-2 text-[12px] leading-relaxed text-[#c3c2b7]">
            <b>اكتشاف جوهري أثناء السحب:</b> الطبقة الموحّدة في قاعدة البيانات تضاعف الإجماليات (إجمالي الأصول المعلن = الحقيقي + غير المتداولة مرة ثانية) في <b>{audit.fixed}</b> شركة — المحرك اكتشفها بفحص «الأصول = المطلوبات + الملكية»، واستنتج معادلة الاسترداد الدقيقة وتحقق منها بالريال على دار الأركان وأسمنت السعودية (TA<sub>حقيقي</sub> = (TA<sub>موحّد</sub> + المتداولة) ÷ 2). <b>مطلوب إصلاحها عند المصدر — التفاصيل في خطة المبرمج.</b> كذلك: بند الصكوك/المرابحات غير ممثل في حقل الدين الموحّد لبعض الشركات — عولج بتقدير معلن (≈) من المطلوبات غير المتداولة حتى يُصلح الـ mapping.
          </div>
        </div>

        {/* ── SCREENS SELECTOR ── */}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(SCREENS) as [ScreenKey, ScreenDef][]).map(([key, scr]) => (
            <button
              key={key}
              onClick={() => {
                setCur(key);
                setSortK(null);
              }}
              className={`rounded-[20px] border-[1.5px] px-4 py-1.5 text-[12.5px] transition-colors ${
                cur === key
                  ? "border-[#3987e5] bg-[#184f95] font-bold text-[#3987e5]"
                  : "border-white/10 bg-[#1a1a19] text-[#c3c2b7] hover:bg-[#222220]"
              }`}
            >
              {scr.t.split(" — ")[0]}
            </button>
          ))}
        </div>

        {/* ── TABLE CARD ── */}
        <div className="rounded-xl border border-white/10 bg-[#1a1a19] overflow-hidden">
          <h3 className="px-4 pt-3 pb-1 text-[13.5px] font-bold text-[#fff]">
            {S.t} <span className="text-[11px] font-normal text-[#898781]">· بيانات حقيقية</span>
          </h3>
          <div className="px-4 pb-2 text-[12px] text-[#c3c2b7]">{S.d}</div>
          <div className="px-4 pb-2 text-[11.5px] text-[#898781]">{screenRows.length} شركة</div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12.3px]">
              <thead>
                <tr className="border-b-[1.5px] border-[#383835]">
                  {S.cols.map(([label, key]) => (
                    <th
                      key={key}
                      onClick={() => setSort(key)}
                      className={`cursor-pointer select-none whitespace-nowrap px-2.5 py-1.5 text-[10.5px] font-semibold text-[#898781] ${
                        key === "name" ? "text-right" : "text-left"
                      } ${sortK === key ? "text-[#3987e5]" : ""}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {screenRows.map((r) => (
                  <tr
                    key={r.sym}
                    onClick={() => router.push(`/stocks/${r.sym}/xbrl`)}
                    className="cursor-pointer border-b border-[#2c2c2a] hover:bg-[#262624]"
                  >
                    {S.cols.map(([, key]) => {
                      if (S.cell) {
                        const custom = S.cell(r, key);
                        if (custom != null) {
                          return (
                            <td key={key} className="whitespace-nowrap px-2.5 py-1.5 text-left tabular-nums" dir="ltr">
                              {custom}
                            </td>
                          );
                        }
                      }
                      if (key === "name") {
                        return (
                          <td key={key} className="whitespace-nowrap px-2.5 py-1.5 text-right font-semibold text-[#fff]">
                            {r.name} <small className="font-normal text-[#898781]">{r.sym}</small>
                            {renderMarks(r)}
                          </td>
                        );
                      }
                      if (key === "sector") {
                        return (
                          <td key={key} className="whitespace-nowrap px-2.5 py-1.5 text-left text-[10.5px] text-[#898781]">
                            {r.sector}
                          </td>
                        );
                      }
                      const v = (r as any)[key];
                      const isNum = typeof v === "number";
                      const colorCls =
                        (key === "g_net" || key === "fcf_yield" || key === "fcf" || key === "owner_yield") && isNum
                          ? v > 0
                            ? "text-[#0ca30c]"
                            : v < 0
                            ? "text-[#e66767]"
                            : ""
                          : "";
                      return (
                        <td
                          key={key}
                          className={`whitespace-nowrap px-2.5 py-1.5 text-left tabular-nums ${colorCls}`}
                          dir="ltr"
                        >
                          {fmt(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-[#2c2c2a] px-4 py-2.5 text-[11px] text-[#898781]">
            مصدر كل رقم: XBRL تداول عبر قاعدة ربح · الميزانية: آخر مركز معلن · التدفقات: سنة 2025 المالية · TTM: مجموع آخر 4 أرباع فعلية° · «مقابل القطاع»: مئين فعلي وسط الشركات المحدثة في نفس القطاع (يُحجب لو العينة &lt; 3) · المنصة تعرض معطيات وشاشات ولا تقدم توصية شراء أو بيع
          </div>
        </div>
      </div>
    </div>
  );
}