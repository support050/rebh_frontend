"use client";

import { useEffect, useState, useMemo } from "react";
import { authFetch } from "@/lib/api/authFetch";

import CompanyAnalyzerHeader from "./_components/CompanyAnalyzerHeader";
import OverviewKpiCards from "./_components/OverviewKpiCards";
import QuarterlyNetProfitChart from "./_components/QuarterlyNetProfitChart";
import AutomatedSignalsGrid from "./_components/AutomatedSignalsGrid";
import CompanyPriceBridge from "./_components/CompanyPriceBridge";
import FundamentalRatiosTab, { type RatioGroupItem } from "./_components/FundamentalRatiosTab";
import QuarterlyIncomeStatementsTab from "./_components/QuarterlyIncomeStatementsTab";

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
  quarters?: {
    periods: string[];
    rev: number[];
    net: number[];
    gp: number[];
    op: number[];
  };
  peers: PeerItem;
}

const PQ = ["Q1'24", "Q2'24", "Q3'24", "Q4'24", "Q1'25", "Q2'25", "Q3'25", "Q4'25", "Q1'26"];
const MUTED_BAND = "bg-[#F3F4F6]";

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

export default function CompanyFundamentalPage() {
  const initialSym = "4300";
  const [sym, setSym] = useState(initialSym);
  const [data, setData] = useState<CompanyFundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [view, setView] = useState<"overview" | "fund">("overview");
  const [sub, setSub] = useState<"ratios" | "stmts">("ratios");
  const [rg, setRg] = useState(0);
  const [hl, setHl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setLoadError(false);
      try {
        const res = await authFetch(`/api/terminal/company-fundamental/${sym}/`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted) setData(json);
        } else {
          if (isMounted) setLoadError(true);
        }
      } catch (e) {
        console.error("Failed to load company fundamental", e);
        if (isMounted) setLoadError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [sym]);

  // Ratio Groups
  const ratioGroups: RatioGroupItem[] = useMemo(() => {
    if (!data) return [];
    const d = data;
    const qRev = d.quarters?.rev || d.rev;
    const qNet = d.quarters?.net || d.net;
    const qOp = d.quarters?.op || d.op;
    const qGp = d.quarters?.gp || d.gp;
    const P = d.peers;
    const gN = yoy(qNet);
    const gR = yoy(qRev);
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
              s: ratio(qNet, qRev),
              cur: P.cur.nm,
              p: P.pct.nm,
              pk: "nm",
              f: "صافي الربح ÷ دخل العمولات الخاصة الإجمالي (TTM للعمود الحالي)",
            },
            {
              k: "opm",
              n: "الربح التشغيلي ÷ دخل العمولات °",
              s: ratio(qOp, qRev),
              cur: ((ttm(qOp) || 0) / (ttm(qRev) || 1)) * 100,
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
            s: qGp ? ratio(qGp, qRev) : null,
            cur: P.cur.gm,
            p: P.pct.gm,
            pk: null,
            f: "إجمالي الربح ÷ الإيرادات",
          },
          {
            k: "opm",
            n: "هامش الربح التشغيلي °",
            s: ratio(qOp, qRev),
            cur: ((ttm(qOp) || 0) / (ttm(qRev) || 1)) * 100,
            p: null,
            pk: null,
            f: "ربح العمليات ÷ الإيرادات",
          },
          {
            k: "nm",
            n: "هامش صافي الربح °",
            s: ratio(qNet, qRev),
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
            s: gR,
            pct: true,
            cur: d.peers.cur.g_rev,
            p: d.peers.pct.g_rev,
            pk: null,
            f: "إيرادات الربع ÷ نظيره قبل سنة − 1",
          },
          {
            k: "g_net",
            n: "نمو صافي الربح سنوياً °",
            s: gN,
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
        h: `<b>صافي الربح: تسارع ${rising + 1} أرباع</b> (${ys.slice(-4).map(p).join(" ← ")})`,
        tag: "قاعدة: التسارع المتصل (O'Neil)",
      });
    } else if (ys.length >= 2 && ys[ys.length - 1] < ys[ys.length - 2] && ys[ys.length - 2] >= 20) {
      out.push({
        neg: true,
        h: `<b>تباطؤ بعد ذروة:</b> من ${p(ys[ys.length - 2])} إلى ${p(ys[ys.length - 1])} — بند مراقبة`,
        tag: "قاعدة: كسر نمط التسارع",
      });
    }

    if (yr.length && yr[yr.length - 1] >= 25) {
      out.push({
        neg: false,
        h: `<b>الإيرادات تنمو ${p(yr[yr.length - 1])} سنوياً</b> — فوق عتبة النمو السريع (Lynch)`,
        tag: "قاعدة: نمو الإيرادات ≥ 25%",
      });
    }

    const pr = d.peers;
    if (pr.pct.roe != null && pr.pct.roe >= 75) {
      out.push({
        neg: false,
        h: `<b>ROE في المئين ${pr.pct.roe} من قطاعه</b> — من الربع الأعلى وسط ${pr.n_sec} شركات محدثة`,
        tag: "قاعدة: المئين القطاعي ≥ 75 (من بيانات السوق الحقيقية)",
      });
    }
    if (pr.cur.peg != null && pr.cur.peg < 1) {
      out.push({
        neg: false,
        h: `<b>PEG = ${pr.cur.peg.toFixed(2)} تحت 1</b> — نمو أسرع من مكرره (معيار Lynch)`,
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

  // ── LOADING STATE ──
  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#F7F8FA]">
        <div className="text-center">
          <div className="text-lg font-bold text-[#1A1A1A]">جارٍ تحميل بيانات التحليل الأساسي...</div>
          <div className="text-[12px] text-[#6B7280]">استرجاع القوائم والسلاسل الزمنية للرمز {sym}</div>
        </div>
      </div>
    );
  }

  // ── ERROR STATE ──
  if (loadError || !data) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-6">
        <div className="max-w-sm rounded-[4px] border border-[#FECACA] bg-[#FEF2F2] p-5 text-center">
          <div className="text-[14px] font-bold text-[#DC2626]">تعذّر تحميل بيانات الرمز {sym}</div>
          <div className="mt-1 text-[12px] text-[#DC2626]">تحقق من الاتصال أو أعد المحاولة بعد قليل.</div>
          <button
            onClick={() => setSym((s) => s)}
            className="mt-3 rounded-[4px] border border-[#8C3B32] bg-white px-3 py-1.5 text-[12.5px] font-bold text-[#8C3B32] hover:bg-[#8C3B32]/5"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const d = data;
  const qRev = d.quarters?.rev || d.rev;
  const qNet = d.quarters?.net || d.net;
  const qOp = d.quarters?.op || d.op;
  const qGp = d.quarters?.gp || d.gp;
  const gN = yoy(qNet);
  const gR = yoy(qRev);
  const lastNet = qNet[qNet.length - 1];
  const lastRev = qRev[qRev.length - 1];
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

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F8FA] font-sans text-[13.5px] text-[#1A1A1A]">
      {/* ── HEADER & SEARCH ── */}
      <CompanyAnalyzerHeader sym={sym} onSelectSym={(s) => setSym(s)} data={d} />

      {/* ── LEVEL 1 NAV ── */}
      <nav className="flex items-end gap-1 border-b border-[#E5E7EB] bg-white px-6">
        <button
          onClick={() => setView("overview")}
          className={`border-b-[2.5px] px-4 py-2.5 text-[13.5px] transition-colors ${
            view === "overview"
              ? "border-[#8C3B32] font-bold text-[#1A1A1A]"
              : "border-transparent text-[#6B7280] hover:text-[#1A1A1A]"
          }`}
        >
          نظرة عامة
        </button>
        <button
          onClick={() => setView("fund")}
          className={`border-b-[2.5px] px-4 py-2.5 text-[13.5px] transition-colors ${
            view === "fund"
              ? "border-[#8C3B32] font-bold text-[#1A1A1A]"
              : "border-transparent text-[#6B7280] hover:text-[#1A1A1A]"
          }`}
        >
          التحليل الأساسي
        </button>
        <span className="px-3 py-2.5 text-[11.5px] text-[#9CA3AF]">
          · الفني (M3) · الأخبار (M6) · التقرير الشامل — قادمة
        </span>
      </nav>

      <div className="w-full px-6 py-3.5 pb-16">
        {/* ================= VIEW: OVERVIEW ================= */}
        {view === "overview" && (
          <div className="space-y-3.5">
            <OverviewKpiCards
              isBank={d.is_bank}
              lastNet={lastNet}
              lastRev={lastRev}
              lastGn={lastGn}
              lastGr={lastGr}
              netTtm={ttm(qNet)}
              peCur={d.peers.cur.pe}
              tiles={tiles}
              onTileClick={handleTileClick}
            />

            <AutomatedSignalsGrid signals={signals} />

            <CompanyPriceBridge
              sym={d.sym}
              isBank={d.is_bank}
              netSeries={qNet}
            />

            <QuarterlyNetProfitChart netSeries={qNet} lastGn={lastGn} gN={gN} />
          </div>
        )}

        {/* ================= VIEW: FUNDAMENTAL ANALYSIS ================= */}
        {view === "fund" && (
          <div className="space-y-3.5">
            {/* LEVEL 2 TABS */}
            <div className={`flex w-fit gap-1 rounded-[4px] ${MUTED_BAND} p-1`}>
              <button
                onClick={() => setSub("ratios")}
                className={`rounded-[4px] px-4 py-1.5 text-[12.5px] transition-colors ${
                  sub === "ratios"
                    ? "bg-white font-bold text-[#1A1A1A] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                    : "text-[#6B7280] hover:text-[#1A1A1A]"
                }`}
              >
                النسب المالية
              </button>
              <button
                onClick={() => setSub("stmts")}
                className={`rounded-[4px] px-4 py-1.5 text-[12.5px] transition-colors ${
                  sub === "stmts"
                    ? "bg-white font-bold text-[#1A1A1A] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                    : "text-[#6B7280] hover:text-[#1A1A1A]"
                }`}
              >
                القوائم المالية
              </button>
            </div>

            {/* ── SUB: RATIOS ── */}
            {sub === "ratios" && (
              <FundamentalRatiosTab
                ratioGroups={ratioGroups}
                rg={rg}
                setRg={setRg}
                hl={hl}
                setHl={setHl}
                periodsQ={d.quarters?.periods || PQ}
                peersCount={d.peers.n_sec}
                peersMap={d.peers.peers}
                currentSym={d.sym}
              />
            )}

            {/* ── SUB: STATEMENTS ── */}
            {sub === "stmts" && (
              <QuarterlyIncomeStatementsTab
                isBank={d.is_bank}
                rev={qRev}
                op={qOp}
                net={qNet}
                eps={d.eps}
                gp={qGp}
                periodsQ={d.quarters?.periods || PQ}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}