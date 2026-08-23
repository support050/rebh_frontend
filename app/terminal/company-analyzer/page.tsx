"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { authFetch } from "@/lib/api/authFetch";

interface PeerItem {
  sym: string;
  name: string;
  sec: string;
  cur: Record<string, number | null>;
  pct: Record<string, number | null>;
  peers: Record<string, [string, string, number][]>;
  n_sec: number;
}

interface CompanyFundData {
  sym: string;
  name: string;
  en: string;
  sec: string;
  is_bank: boolean;
  px: number;
  mc: number;
  net: number[];
  rev: number[];
  gp?: number[] | null;
  op: number[];
  eps: number[];
  periods_q: string[];
  periods_ar: string[];
  peers: PeerItem;
}

const PQ = ["Q1'24", "Q2'24", "Q3'24", "Q4'24", "Q1'25", "Q2'25", "Q3'25", "Q4'25", "Q1'26"];

function fmt(v: number | null | undefined, d = 1) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("en-US", { maximumFractionDigits: d });
}

function pctS(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(1) + "%";
}

function yoy(a: number[]) {
  return a.map((v, i) =>
    i >= 4 && a[i - 4] && v != null && Math.sign(a[i - 4]) === Math.sign(v)
      ? (Math.abs(v) / Math.abs(a[i - 4]) - 1) * 100
      : null
  );
}

function ttm(a: number[]) {
  const t = a.slice(-4);
  if (t.some((v) => v == null)) return null;
  return t.reduce((x, y) => x + y, 0);
}

function ratio(num: number[], den: number[]) {
  return num.map((v, i) => (v != null && den[i] ? (v / den[i]) * 100 : null));
}

function mkPrice(b: number, t: number, a: number, c: number) {
  const r = [];
  for (let i = 0; i < 110; i++) {
    r.push(b + t * i + a * Math.sin(i / c) + ((i % 7) - 3) * b * 0.002);
  }
  return r;
}

export default function CompanyFundamentalPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const initialSym = "4300";
  const [sym, setSym] = useState(initialSym);
  const [data, setData] = useState<CompanyFundData | null>(null);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<"overview" | "fund">("overview");
  const [sub, setSub] = useState<"ratios" | "stmts">("ratios");
  const [rg, setRg] = useState(0);
  const [hl, setHl] = useState<string | null>(null);
  const [activePeersPk, setActivePeersPk] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await authFetch(`/api/terminal/company-fundamental/${sym}/`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error("Failed to load company fundamental", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sym]);

  // Ratio Groups
  const ratioGroups = useMemo(() => {
    if (!data) return [];
    const d = data;
    const P = d.peers;
    const gN = yoy(d.net);
    const gR = yoy(d.rev);
    const common = {
      pe: { v: P.cur.pe, p: P.pct.pe, f: "القيمة السوقية ÷ صافي الربح 12 شهراً" },
      pb: { v: P.cur.pb, p: P.pct.pb, f: "القيمة السوقية ÷ حقوق الملكية" },
      peg: { v: P.cur.peg, p: null, f: "P/E ÷ نمو الربح السنوي — معيار Lynch (تحت 1 = نمو رخيص)" },
    };

    if (d.is_bank) {
      return [
        {
          t: "الربحية",
          rows: [
            {
              k: "nm",
              n: "هامش صافي الربح ÷ دخل العمولات °",
              s: ratio(d.net, d.rev),
              cur: P.cur.nm,
              p: P.pct.nm,
              pk: "nm",
              f: "صافي الربح ÷ دخل العمولات الخاصة الإجمالي (TTM للعمود الحالي)",
            },
            {
              k: "opm",
              n: "الربح التشغيلي ÷ دخل العمولات °",
              s: ratio(d.op, d.rev),
              cur: ((ttm(d.op) || 0) / (ttm(d.rev) || 1)) * 100,
              p: null,
              pk: null,
              f: "الربح من النشاطات التشغيلية ÷ دخل العمولات",
            },
            {
              k: "roe",
              n: "العائد على حقوق الملكية ROE °",
              s: null,
              cur: P.cur.roe,
              p: P.pct.roe,
              pk: "roe",
              f: "صافي الربح (TTM) ÷ حقوق الملكية — السلسلة الربعية بعد ربط تاريخ الميزانيات",
            },
          ],
        },
        {
          t: "النمو",
          rows: [
            {
              k: "g_net",
              n: "نمو صافي الربح سنوياً °",
              s: gN,
              pct: true,
              cur: P.cur.g_net,
              p: P.pct.g_net,
              pk: "g_net",
              f: "ربح الربع ÷ نظيره قبل سنة − 1",
            },
            {
              k: "g_rev",
              n: "نمو دخل العمولات سنوياً °",
              s: gR,
              pct: true,
              cur: P.cur.g_rev,
              p: P.pct.g_rev,
              pk: null,
              f: "دخل عمولات الربع ÷ نظيره قبل سنة − 1",
            },
          ],
        },
        {
          t: "التقييم",
          rows: [
            { k: "pe", n: "مكرر الربحية P/E °", s: null, cur: common.pe.v, p: common.pe.p, pk: "pe", f: common.pe.f, inv: true },
            { k: "pb", n: "مكرر القيمة الدفترية P/B °", s: null, cur: common.pb.v, p: common.pb.p, pk: null, f: common.pb.f, inv: true, x: 1 },
            { k: "peg", n: "PEG (معيار Lynch) °", s: null, cur: common.peg.v, p: null, pk: null, f: common.peg.f, x: 1 },
          ],
          note: "السلاسل الزمنية للتقييم بعد ربط تاريخ الأسعار",
        },
      ];
    }

    return [
      {
        t: "الربحية",
        rows: [
          {
            k: "gm",
            n: "هامش الربح الإجمالي °",
            s: d.gp ? ratio(d.gp, d.rev) : null,
            cur: P.cur.gm,
            p: P.pct.gm,
            pk: null,
            f: "إجمالي الربح ÷ الإيرادات",
          },
          {
            k: "opm",
            n: "هامش الربح التشغيلي °",
            s: ratio(d.op, d.rev),
            cur: ((ttm(d.op) || 0) / (ttm(d.rev) || 1)) * 100,
            p: null,
            pk: null,
            f: "ربح العمليات ÷ الإيرادات",
          },
          {
            k: "nm",
            n: "هامش صافي الربح °",
            s: ratio(d.net, d.rev),
            cur: P.cur.nm,
            p: P.pct.nm,
            pk: "nm",
            f: "صافي الربح ÷ الإيرادات",
          },
          {
            k: "roe",
            n: "العائد على حقوق الملكية ROE °",
            s: null,
            cur: P.cur.roe,
            p: P.pct.roe,
            pk: "roe",
            f: "صافي الربح (TTM) ÷ حقوق الملكية",
          },
        ],
      },
      {
        t: "النمو",
        rows: [
          {
            k: "g_rev",
            n: "نمو الإيرادات سنوياً °",
            s: yoy(d.rev),
            pct: true,
            cur: d.peers.cur.g_rev,
            p: d.peers.pct.g_rev,
            pk: null,
            f: "إيرادات الربع ÷ نظيره قبل سنة − 1",
          },
          {
            k: "g_net",
            n: "نمو صافي الربح سنوياً °",
            s: yoy(d.net),
            pct: true,
            cur: d.peers.cur.g_net,
            p: d.peers.pct.g_net,
            pk: "g_net",
            f: "ربح الربع ÷ نظيره قبل سنة − 1",
          },
        ],
      },
      {
        t: "التقييم",
        rows: [
          { k: "pe", n: "مكرر الربحية P/E °", s: null, cur: common.pe.v, p: common.pe.p, pk: "pe", f: common.pe.f, inv: true },
          { k: "pb", n: "مكرر القيمة الدفترية P/B °", s: null, cur: common.pb.v, p: common.pb.p, pk: null, f: common.pb.f, inv: true, x: 1 },
          { k: "peg", n: "PEG (معيار Lynch) °", s: null, cur: common.peg.v, p: null, pk: null, f: common.peg.f, x: 1 },
        ],
        note: "السلاسل الزمنية للتقييم بعد ربط تاريخ الأسعار",
      },
    ];
  }, [data]);

  // Rules Engine Signals
  const signals = useMemo(() => {
    if (!data) return [];
    const d = data;
    const out: { neg: boolean; h: string; tag: string }[] = [];
    const ys = yoy(d.net).filter((v) => v != null) as number[];
    const yr = yoy(d.rev).filter((v) => v != null) as number[];
    const p = (x: number) => (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(0) + "%";

    let rising = 0;
    for (let i = ys.length - 1; i > 0 && ys[i] > ys[i - 1]; i--) rising++;
    if (rising >= 2 && ys[ys.length - 1] > 0) {
      out.push({
        neg: false,
        h: `صافي الربح: تسارع ${rising + 1} أرباع (${ys.slice(-4).map(p).join(" ← ")})`,
        tag: "قاعدة: التسارع المتصل (O'Neil)",
      });
    } else if (ys.length >= 2 && ys[ys.length - 1] < ys[ys.length - 2] && ys[ys.length - 2] >= 20) {
      out.push({
        neg: true,
        h: `تباطؤ بعد ذروة: من ${p(ys[ys.length - 2])} إلى ${p(ys[ys.length - 1])} — بند مراقبة`,
        tag: "قاعدة: كسر نمط التسارع",
      });
    }

    if (yr.length && yr[yr.length - 1] >= 25) {
      out.push({
        neg: false,
        h: `الإيرادات تنمو ${p(yr[yr.length - 1])} سنوياً — فوق عتبة النمو السريع (Lynch)`,
        tag: "قاعدة: نمو الإيرادات ≥ 25%",
      });
    }

    const pr = d.peers;
    if (pr.pct.roe != null && pr.pct.roe >= 75) {
      out.push({
        neg: false,
        h: `ROE في المئين ${pr.pct.roe} من قطاعه — من الربع الأعلى وسط ${pr.n_sec} شركات محدثة`,
        tag: "قاعدة: المئين القطاعي ≥ 75 (من بيانات السوق الحقيقية)",
      });
    }
    if (pr.cur.peg != null && pr.cur.peg < 1) {
      out.push({
        neg: false,
        h: `PEG = ${pr.cur.peg.toFixed(2)} تحت 1 — نمو أسرع من مكرره (معيار Lynch)`,
        tag: "قاعدة: PEG < 1",
      });
    }
    return out.slice(0, 4);
  }, [data]);

  function handleTileClick(key: string) {
    let groupIdx = 0;
    ratioGroups.forEach((g, idx) => {
      if (g.rows.some((r) => r.k === key)) groupIdx = idx;
    });
    setView("fund");
    setSub("ratios");
    setRg(groupIdx);
    setHl(key);
    setTimeout(() => {
      const el = document.querySelector(`tr[data-k="${key}"]`);
      if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 60);
  }

  if (loading || !data) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#0d0d0d] text-[#fff]">
        <div className="text-center">
          <div className="text-lg font-bold">جارٍ تحميل بيانات التحليل الأساسي...</div>
          <div className="text-[12px] text-[#898781]">استرجاع القوائم والسلاسل الزمنية للرمز {sym}</div>
        </div>
      </div>
    );
  }

  const d = data;
  const gN = yoy(d.net);
  const gR = yoy(d.rev);
  const lastNet = d.net[d.net.length - 1];
  const lastRev = d.rev[d.rev.length - 1];
  const lastGn = gN[gN.length - 1];
  const lastGr = gR[gR.length - 1];

  const tiles = [
    ["ROE °", d.peers.cur.roe, d.peers.pct.roe, "%", "roe"],
    ["هامش صافي °", d.peers.cur.nm, d.peers.pct.nm, "%", "nm"],
    ["نمو الربح °", d.peers.cur.g_net, d.peers.pct.g_net, "%", "g_net"],
    ["نمو الإيرادات °", d.peers.cur.g_rev, d.peers.pct.g_rev, "%", "g_rev"],
    ["P/E °", d.peers.cur.pe, d.peers.pct.pe, "x", "pe"],
    ["PEG °", d.peers.cur.peg, null, "", "peg"],
  ] as const;

  // Render SVG Price Line
  const pricePoints = d.is_bank ? mkPrice(17.5, 0.026, 0.55, 9) : mkPrice(3.9, 0.007, 0.14, 9);
  const W = 1180;
  const H = 92;
  const pB = 14;
  const pT = 6;
  const pS = 6;
  const pE = 48;
  const mn = Math.min(...pricePoints);
  const mx = Math.max(...pricePoints);
  const rgVal = mx - mn || 1;
  const X = (i: number) => pS + (i / (pricePoints.length - 1)) * (W - pS - pE);
  const Y = (v: number) => pT + (1 - (v - mn) / rgVal) * (H - pT - pB);

  const ma: number[] = [];
  for (let i = 0; i < pricePoints.length; i++) {
    const sIdx = Math.max(0, i - 49);
    const seg = pricePoints.slice(sIdx, i + 1);
    ma.push(seg.reduce((a, b) => a + b, 0) / seg.length);
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#0d0d0d] font-sans text-[13.5px] text-[#fff]">
      {/* ── TOP SWITCHER ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#1a1a19] px-6 py-2.5">
        <span className="text-[11.5px] text-[#898781]">شركة (بيانات حقيقية):</span>
        <button
          onClick={() => {
            setSym("1010");
            router.push("/stocks/1010/fundamental");
          }}
          className={`rounded-lg border px-3 py-1.5 text-[12.5px] transition-colors ${
            sym === "1010"
              ? "border-[#3987e5] bg-[#184f95] font-bold text-[#fff]"
              : "border-white/10 bg-[#1a1a19] text-[#c3c2b7] hover:bg-[#222220]"
          }`}
        >
          بنك الرياض 1010
        </button>
        <button
          onClick={() => {
            setSym("1831");
            router.push("/stocks/1831/fundamental");
          }}
          className={`rounded-lg border px-3 py-1.5 text-[12.5px] transition-colors ${
            sym === "1831"
              ? "border-[#3987e5] bg-[#184f95] font-bold text-[#fff]"
              : "border-white/10 bg-[#1a1a19] text-[#c3c2b7] hover:bg-[#222220]"
          }`}
        >
          مهارة 1831
        </button>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="mr-auto rounded-lg border border-white/10 px-3 py-1 text-[12px] text-[#c3c2b7] hover:bg-[#222220]"
        >
          {mounted && theme === "dark" ? "☀️ فاتح" : "🌙 داكن"}
        </button>
      </div>

      {/* ── COMPANY HEADER ── */}
      <header className="border-b border-white/10 bg-[#1a1a19] px-6 py-3.5">
        <div className="flex flex-wrap items-baseline gap-3">
          <div className="text-[19px] font-bold">
            {d.name} <span className="mr-1.5 text-[12.5px] font-normal text-[#898781]">{d.en}</span>
          </div>
          <span className="rounded-full bg-[#262624] px-3 py-0.5 text-[11.5px] text-[#c3c2b7]">{d.sym}</span>
          <span className="rounded-full bg-[#262624] px-3 py-0.5 text-[11.5px] text-[#c3c2b7]">تداول</span>
          <span className="rounded-full bg-[#262624] px-3 py-0.5 text-[11.5px] text-[#c3c2b7]">{d.sec}</span>
          <span className="rounded-full bg-[#0ca30c]/15 px-3 py-0.5 text-[11.5px] font-semibold text-[#0ca30c]">
            ✓ بيانات XBRL حقيقية — 9 أرباع حتى Q1 2026
          </span>
          <span className="mr-auto text-[21px] font-bold tabular-nums" dir="ltr">
            {fmt(d.px, 2)} <small className="text-[11.5px] font-normal text-[#898781]">ر.س (إغلاق فعلي)</small>
          </span>
        </div>
      </header>

      {/* ── LEVEL 1 NAV ── */}
      <nav className="flex items-end gap-1 border-b-[1.5px] border-[#383835] bg-[#1a1a19] px-6">
        <button
          onClick={() => setView("overview")}
          className={`border-b-[2.5px] px-4 py-2.5 text-[13.5px] transition-colors ${
            view === "overview" ? "border-[#3987e5] font-bold text-[#fff]" : "border-transparent text-[#c3c2b7]"
          }`}
        >
          نظرة عامة
        </button>
        <button
          onClick={() => setView("fund")}
          className={`border-b-[2.5px] px-4 py-2.5 text-[13.5px] transition-colors ${
            view === "fund" ? "border-[#3987e5] font-bold text-[#fff]" : "border-transparent text-[#c3c2b7]"
          }`}
        >
          التحليل الأساسي
        </button>
        <span className="px-3 py-2.5 text-[11.5px] text-[#898781]">· الفني (M3) · الأخبار (M6) · التقرير الشامل — قادمة</span>
      </nav>

      <div className="mx-auto max-w-[1300px] px-6 py-3.5 pb-16">
        {/* ================= VIEW: OVERVIEW ================= */}
        {view === "overview" && (
          <div className="space-y-3.5">
            {/* 4 KPIs */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-[#1a1a19] p-3.5">
                <h4 className="text-[11px] font-semibold text-[#c3c2b7]">صافي الربح (آخر ربع)</h4>
                <div className="text-[20px] font-bold tabular-nums" dir="ltr">
                  {fmt(lastNet, 1)} م
                </div>
                <div className={`text-[11px] font-bold ${lastGn && lastGn >= 0 ? "text-[#0ca30c]" : "text-[#e66767]"}`}>
                  {pctS(lastGn)} على أساس سنوي
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#1a1a19] p-3.5">
                <h4 className="text-[11px] font-semibold text-[#c3c2b7]">
                  {d.is_bank ? "دخل العمولات (آخر ربع)" : "الإيرادات (آخر ربع)"}
                </h4>
                <div className="text-[20px] font-bold tabular-nums" dir="ltr">
                  {fmt(lastRev, 1)} م
                </div>
                <div className={`text-[11px] font-bold ${lastGr && lastGr >= 0 ? "text-[#0ca30c]" : "text-[#e66767]"}`}>
                  {pctS(lastGr)} على أساس سنوي
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#1a1a19] p-3.5">
                <h4 className="text-[11px] font-semibold text-[#c3c2b7]">صافي الربح TTM °</h4>
                <div className="text-[20px] font-bold tabular-nums" dir="ltr">
                  {fmt(ttm(d.net), 0)} م
                </div>
                <div className="text-[11px] text-[#898781]">من 4 أرباع حقيقية</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#1a1a19] p-3.5">
                <h4 className="text-[11px] font-semibold text-[#c3c2b7]">مكرر الربحية P/E °</h4>
                <div className="text-[20px] font-bold tabular-nums" dir="ltr">
                  {fmt(d.peers.cur.pe, 1)}
                </div>
                <div className="text-[11px] text-[#898781]">من 4 أرباع حقيقية</div>
              </div>
            </div>

            {/* DERIVED RATIO TILES */}
            <div>
              <div className="mb-2 text-[12px] font-bold text-[#898781]">
                النسب المشتقة °{" "}
                <span className="font-normal">
                  · كل بطاقة تفتح سلسلتها الزمنية في التحليل الأساسي — قاعدة &quot;بطاقة ← سلسلة&quot;
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                {tiles.map(([h, v, p, u, key]) => (
                  <div
                    key={key}
                    onClick={() => handleTileClick(key)}
                    className="cursor-pointer rounded-xl border border-white/10 bg-[#1a1a19] p-3 transition-colors hover:border-[#3987e5]"
                  >
                    <h5 className="text-[10.5px] font-semibold text-[#898781]">{h}</h5>
                    <div className="text-[16px] font-bold tabular-nums" dir="ltr">
                      {v == null ? "—" : fmt(v, 1)}
                      {u === "%" ? "%" : ""}
                    </div>
                    <div className={`text-[10.5px] ${p != null && p >= 60 ? "text-[#0ca30c]" : "text-[#898781]"}`}>
                      {p != null ? `المئين ${p} في القطاع` : "—"}
                    </div>
                    <span className="mt-1 block text-[10px] text-[#3987e5]">↗ السلسلة الزمنية</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AUTOMATED SIGNALS */}
            <div>
              <div className="mb-2 text-[12px] font-bold text-[#898781]">
                إشارات مكتشفة آلياً <span className="font-normal">· محرك قواعد يحسب من الأرقام الحقيقية</span>
              </div>
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {signals.map((s, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border border-white/10 bg-[#1a1a19] p-3 text-[12.5px] ${
                      s.neg ? "border-r-[3px] border-r-[#e66767]" : "border-r-[3px] border-r-[#3987e5]"
                    }`}
                  >
                    <b className="font-bold">{s.h}</b>
                    <span className="mt-1 block text-[10px] text-[#898781]">{s.tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PRICE BRIDGE CHART */}
            <div className="rounded-xl border border-white/10 bg-[#1a1a19] p-3.5">
              <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-[#898781]">
                <b className="text-[13px] text-[#fff]">جسر السعر</b>
                <span>
                  أرباح <b className="text-[#fff] tabular-nums">{pctS(lastGn)}</b>{" "}
                  {gN.length > 1 && (lastGn || 0) > (gN[gN.length - 2] || 0) ? "متسارعة ↑" : "— الوتيرة تتباطأ"} ·
                  السعر {pricePoints[pricePoints.length - 1] > ma[ma.length - 1] ? "فوق MA50 ✓ يؤكد" : "تحت MA50 ✗"}
                </span>
                <span className="mr-auto">▮ = إعلان نتائج · بيانات سعر توضيحية — الحية في Sprint 3</span>
              </div>
              <svg width="100%" height="92" viewBox={`0 0 ${W} ${H}`} className="mt-2">
                <polyline
                  points={ma.map((v, i) => `${X(i)},${Y(v)}`).join(" ")}
                  fill="none"
                  stroke="#383835"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <polyline
                  points={pricePoints.map((v, i) => `${X(i)},${Y(v)}`).join(" ")}
                  fill="none"
                  stroke="#3987e5"
                  strokeWidth="2"
                />
                {[18, 42, 66, 92].map((ei) => (
                  <g key={ei}>
                    <rect
                      x={X(ei) - 6}
                      y={Y(pricePoints[ei]) - 14}
                      width="12"
                      height="10"
                      rx="2.5"
                      fill="#38301a"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <text
                      x={X(ei)}
                      y={Y(pricePoints[ei]) - 6}
                      textAnchor="middle"
                      fontSize="7.5"
                      fill="#e8c464"
                      fontWeight="bold"
                    >
                      ن
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        )}

        {/* ================= VIEW: FUNDAMENTAL ANALYSIS ================= */}
        {view === "fund" && (
          <div className="space-y-3.5">
            {/* LEVEL 2 TABS */}
            <div className="flex w-fit gap-1 rounded-lg bg-[#262624] p-1">
              <button
                onClick={() => setSub("ratios")}
                className={`rounded-md px-4 py-1.5 text-[12.5px] transition-colors ${
                  sub === "ratios" ? "bg-[#1a1a19] font-bold text-[#fff] shadow" : "text-[#c3c2b7]"
                }`}
              >
                النسب المالية
              </button>
              <button
                onClick={() => setSub("stmts")}
                className={`rounded-md px-4 py-1.5 text-[12.5px] transition-colors ${
                  sub === "stmts" ? "bg-[#1a1a19] font-bold text-[#fff] shadow" : "text-[#c3c2b7]"
                }`}
              >
                القوائم المالية
              </button>
            </div>

            {/* ── SUB: RATIOS ── */}
            {sub === "ratios" && (
              <div className="space-y-3">
                {/* L3 Groups */}
                <div className="flex flex-wrap gap-2">
                  {ratioGroups.map((g, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setRg(idx);
                        setHl(null);
                      }}
                      className={`rounded-full border px-3.5 py-1 text-[11.5px] transition-colors ${
                        rg === idx
                          ? "border-[#3987e5] bg-[#184f95] font-bold text-[#3987e5]"
                          : "border-white/10 bg-[#1a1a19] text-[#c3c2b7] hover:bg-[#222220]"
                      }`}
                    >
                      {g.t}
                    </button>
                  ))}
                </div>

                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1a1a19]">
                  <h3 className="px-4 pt-3 text-[13px] font-bold text-[#fff]">
                    نسب {ratioGroups[rg]?.t} — سلاسل زمنية من الأرقام الحقيقية
                  </h3>
                  <div className="px-4 pb-2 text-[10.5px] text-[#898781]">
                    مرّر على اسم أي نسبة لمعادلتها · عمود &quot;مقابل القطاع&quot; = المئين الفعلي وسط أقران القطاع المحدثين من قاعدة
                    ربح ({d.peers.n_sec} شركات) · زر &quot;الأقران&quot; يفتح الترتيب الحقيقي
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[12.5px]">
                      <thead>
                        <tr className="border-b-[1.5px] border-[#383835]">
                          <th className="sticky inset-inline-start-0 z-10 bg-[#1a1a19] px-3 py-2 text-right text-[10.5px] font-semibold text-[#898781]">
                            النسبة
                          </th>
                          {PQ.map((p) => (
                            <th key={p} className="px-2.5 py-2 text-left text-[10.5px] font-semibold text-[#898781]">
                              {p}
                            </th>
                          ))}
                          <th className="px-2.5 py-2 text-left text-[10.5px] font-semibold text-[#898781]">
                            الحالي (TTM)
                          </th>
                          <th className="px-2.5 py-2 text-left text-[10.5px] font-semibold text-[#898781]">
                            مقابل القطاع
                          </th>
                          <th className="px-2.5 py-2 text-left"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {ratioGroups[rg]?.rows.map((r) => {
                          const isHl = hl === r.k;
                          const pVal = r.p;
                          const verdict =
                            pVal == null ? (
                              <span className="rounded bg-[#262624] px-1.5 text-[10px] text-[#898781]">—</span>
                            ) : pVal >= 67 ? (
                              <span className="rounded bg-[#0ca30c]/15 px-1.5 text-[10px] font-bold text-[#0ca30c]">
                                إيجابي
                              </span>
                            ) : pVal >= 34 ? (
                              <span className="rounded bg-[#262624] px-1.5 text-[10px] text-[#898781]">محايد</span>
                            ) : (
                              <span className="rounded bg-[#e66767]/15 px-1.5 text-[10px] font-bold text-[#e66767]">
                                سلبي
                              </span>
                            );

                          const curTxt =
                            r.cur == null
                              ? "—"
                              : "x" in r && r.x
                              ? fmt(r.cur, 2)
                              : "pct" in r && r.pct
                              ? pctS(r.cur)
                              : fmt(r.cur, 1) + "%";

                          return (
                            <tr
                              key={r.k}
                              data-k={r.k}
                              className={`border-b border-[#2c2c2a] ${
                                isHl ? "bg-[#184f95]/30" : "hover:bg-[#222220]"
                              }`}
                            >
                              <td
                                className="sticky inset-inline-start-0 z-10 whitespace-nowrap bg-[#1a1a19] px-3 py-2 text-right font-medium text-[#fff] shadow-[-1px_0_0_#2c2c2a_inset]"
                                title={`المعادلة: ${r.f}`}
                              >
                                {r.n}
                              </td>

                              {!r.s ? (
                                <td colSpan={PQ.length} className="px-2.5 py-2 text-[11px] text-[#898781]">
                                  السلسلة الربعية قادمة — القيمة الحالية TTM حقيقية
                                </td>
                              ) : (
                                r.s.map((val, idx) => (
                                  <td
                                    key={idx}
                                    className={`whitespace-nowrap px-2.5 py-2 text-left tabular-nums ${
                                      val == null
                                        ? "text-[#898781]"
                                        : "pct" in r && r.pct && val < 0
                                        ? "text-[#e66767]"
                                        : ""
                                    }`}
                                    dir="ltr"
                                  >
                                    {val == null ? "·" : "pct" in r && r.pct ? pctS(val) : fmt(val, 1) + "%"}
                                  </td>
                                ))
                              )}

                              <td className="whitespace-nowrap px-2.5 py-2 text-left font-bold tabular-nums" dir="ltr">
                                {curTxt}
                              </td>

                              <td className="whitespace-nowrap px-2.5 py-2 text-left">
                                {pVal == null ? (
                                  verdict
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-[54px] overflow-hidden rounded-full bg-[#262624]">
                                      <div className="h-full rounded-full bg-[#3987e5]" style={{ width: `${pVal}%` }} />
                                    </div>
                                    <span className="text-[10.5px] tabular-nums" dir="ltr">
                                      {pVal}
                                    </span>
                                    {verdict}
                                  </div>
                                )}
                              </td>

                              <td className="whitespace-nowrap px-2.5 py-2 text-left">
                                {r.pk && (
                                  <button
                                    onClick={() =>
                                      setActivePeersPk(activePeersPk === r.pk ? null : (r.pk as string))
                                    }
                                    className="rounded border border-white/10 px-2 py-0.5 text-[10.5px] text-[#3987e5] hover:bg-[#222220]"
                                  >
                                    الأقران ▾
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}

                        {/* PEERS EXPANDED ROW */}
                        {activePeersPk && (
                          <tr className="bg-[#141413]">
                            <td colSpan={PQ.length + 4} className="p-3.5">
                              <b className="mb-2 block text-[11px] text-[#fff]">
                                ترتيب القطاع الفعلي ({d.peers.peers[activePeersPk]?.length || 0} شركة محدثة — من قاعدة ربح):
                              </b>
                              <div className="space-y-1">
                                {(d.peers.peers[activePeersPk] || []).map(([symCode, name, val]) => {
                                  const isMe = symCode === d.sym;
                                  const peersList = d.peers.peers[activePeersPk] || [];
                                  const maxVal = Math.max(...peersList.map((p) => Math.abs(p[2])), 1e-9);
                                  const barW = (Math.abs(val) / maxVal) * 55;

                                  return (
                                    <div key={symCode} className="flex items-center gap-2 text-[11px]">
                                      <span className={`w-[130px] text-right ${isMe ? "font-bold text-[#3987e5]" : "text-[#c3c2b7]"}`}>
                                        {name} {isMe ? "◀" : ""}
                                      </span>
                                      <div
                                        className={`h-2.5 rounded-full ${isMe ? "bg-[#3987e5]" : "bg-[#383835] opacity-50"}`}
                                        style={{ width: `${barW}%`, maxWidth: "420px" }}
                                      />
                                      <span className="text-[10.5px] tabular-nums" dir="ltr">
                                        {fmt(val, 1)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-[#2c2c2a] px-4 py-2.5 text-[11px] text-[#898781]">
                    <span>° محسوب من TTM/أرباع حقيقية · المئين من الشركات المحدثة في القطاع فقط</span>
                    <span>{ratioGroups[rg]?.note || ""}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── SUB: STATEMENTS ── */}
            {sub === "stmts" && (
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1a1a19]">
                <h3 className="px-4 pt-3 text-[13px] font-bold text-[#fff]">قائمة الدخل — ربعي (9 أرباع حقيقية)</h3>
                <div className="px-4 pb-2 text-[10.5px] text-[#898781]">
                  القيم بملايين الريالات · الصف المميز = بند التسارع · النسخة الكاملة للقوائم الأربعة في نموذج القوائم التفصيلي
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[12.5px]">
                    <thead>
                      <tr className="border-b-[1.5px] border-[#383835]">
                        <th className="sticky inset-inline-start-0 z-10 bg-[#1a1a19] px-3 py-2 text-right text-[10.5px] font-semibold text-[#898781]">
                          البند
                        </th>
                        {PQ.map((p) => (
                          <th key={p} className="px-2.5 py-2 text-left text-[10.5px] font-semibold text-[#898781]">
                            {p}
                          </th>
                        ))}
                        <th className="px-2.5 py-2 text-left text-[10.5px] font-semibold text-[#898781]">YoY أخير</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(d.is_bank
                        ? [
                            ["دخل العمولات الخاصة", d.rev, ""],
                            ["الربح من النشاطات التشغيلية", d.op, "font-bold border-t border-[#383835]"],
                            ["صافي ربح الفترة", d.net, "font-bold border-t-2 border-white border-b-2 border-double border-[#383835]"],
                            ["ربحية السهم (ريال)", d.eps, ""],
                          ]
                        : [
                            ["الإيرادات", d.rev, ""],
                            ["إجمالي الربح", d.gp || [], "font-bold border-t border-[#383835]"],
                            ["ربح العمليات", d.op, "font-bold border-t border-[#383835]"],
                            ["صافي ربح الفترة", d.net, "font-bold border-t-2 border-white border-b-2 border-double border-[#383835]"],
                            ["ربحية السهم (ريال)", d.eps, ""],
                          ]
                      ).map(([lbl, series, cls], idx) => {
                        const sArr = series as number[];
                        const gArr = yoy(sArr);
                        const lastG = gArr[gArr.length - 1];

                        return (
                          <tr key={idx} className={`border-b border-[#2c2c2a] hover:bg-[#222220] ${cls}`}>
                            <td className="sticky inset-inline-start-0 z-10 whitespace-nowrap bg-[#1a1a19] px-3 py-2 text-right shadow-[-1px_0_0_#2c2c2a_inset]">
                              {lbl as string}
                            </td>
                            {sArr.map((v, sIdx) => (
                              <td
                                key={sIdx}
                                className={`whitespace-nowrap px-2.5 py-2 text-left tabular-nums ${v < 0 ? "text-[#e66767]" : ""}`}
                                dir="ltr"
                              >
                                {v == null ? "—" : Math.abs(v) < 50 ? Number(v).toFixed(2) : fmt(v, 0)}
                              </td>
                            ))}
                            <td
                              className={`whitespace-nowrap px-2.5 py-2 text-left font-bold tabular-nums ${
                                lastG != null && lastG >= 0 ? "text-[#0ca30c]" : "text-[#e66767]"
                              }`}
                              dir="ltr"
                            >
                              {lastG == null ? "—" : pctS(lastG)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
