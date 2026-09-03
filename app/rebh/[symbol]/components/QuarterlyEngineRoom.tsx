"use client";

import React, { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

interface Props {
  symbol: string;
}

// Sparkline SVG component exactly matching universal_template.html line 149-154
function Sparkline({ vals, w = 110, h = 24, color = "#63a5f0" }: { vals: (number | null)[]; w?: number; h?: number; color?: string }) {
  const vs = vals.filter((v): v is number => v != null);
  if (vs.length < 2) return <span className="text-[#657081] font-mono text-[10px]">—</span>;

  const mn = Math.min(...vs, 0);
  const mx = Math.max(...vs, 0);
  const X = (i: number) => 2 + (i / (vals.length - 1)) * (w - 4);
  const Y = (v: number) => 2 + (1 - (v - mn) / ((mx - mn) || 1)) * (h - 4);

  const pts = vals
    .map((v, i) => (v == null ? null : `${X(i).toFixed(1)},${Y(v).toFixed(1)}`))
    .filter(Boolean)
    .join(" ");

  return (
    <svg width={w} height={h} className="inline-block align-middle overflow-visible">
      {mn < 0 && (
        <line x1="2" x2={w - 2} y1={Y(0)} y2={Y(0)} stroke="#1e2836" strokeWidth="1" strokeDasharray="2,2" />
      )}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const DEFAULT_QL = ["Q1'24", "Q2'24", "Q3'24", "Q4'24°", "Q1'25", "Q2'25", "Q3'25", "Q4'25°", "Q1'26"];

export default function QuarterlyEngineRoom({ symbol }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuarterly() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/terminal/company-fundamental/${symbol}/`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Error loading quarterly engine data:", err);
      } finally {
        setLoading(false);
      }
    }
    if (symbol) {
      fetchQuarterly();
    }
  }, [symbol]);

  if (loading) {
    return (
      <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-5 text-center text-xs text-[#657081] font-mono">
        جاري تحميل بيانات غرفة المحركات الربعية (9 Quarters Engine)...
      </div>
    );
  }

  if (!data) return null;

  const qObj = data.quarters || {};
  const periods = qObj.periods?.length > 0 ? qObj.periods : data.periods_q?.length > 0 ? data.periods_q : DEFAULT_QL;
  const count = Math.min(9, periods.length);
  const qPeriods = periods.slice(-count);

  const rev = (qObj.rev?.length ? qObj.rev : data.rev || []).slice(-count);
  const gp = (qObj.gp?.length ? qObj.gp : data.gp || []).slice(-count);
  const op = (qObj.op?.length ? qObj.op : data.op || []).slice(-count);
  const net = (qObj.net?.length ? qObj.net : data.net || []).slice(-count);
  const eps = (data.eps || []).slice(-count);

  const lines: { label: string; vals: (number | null)[]; isEps?: boolean; color: string }[] = [];

  if (rev.length > 0) lines.push({ label: "الإيرادات (Revenue)", vals: rev, color: "#3987e5" });
  if (gp.length > 0) lines.push({ label: "إجمالي الربح (Gross Profit)", vals: gp, color: "#d9b64a" });
  if (op.length > 0) lines.push({ label: "الربح التشغيلي (Operating Profit)", vals: op, color: "#c084fc" });
  if (net.length > 0) lines.push({ label: "صافي الربح (Net Profit)", vals: net, color: "#2ecc71" });
  if (eps.length > 0) lines.push({ label: "ربحية السهم (EPS ر.س)", vals: eps, isEps: true, color: "#38bdf8" });

  if (lines.length === 0) return null;

  const fmt = (v: number | null | undefined, isEps = false) => {
    if (v == null) return "—";
    return isEps ? v.toFixed(2) : Math.round(v).toLocaleString();
  };

  const getTTM = (vals: (number | null)[], isEps = false) => {
    const last4 = vals.slice(-4);
    if (last4.length < 4 || !last4.every(x => typeof x === "number")) return "—";
    const sum = last4.reduce((a: number, b: number) => a + (b || 0), 0);
    return isEps ? sum.toFixed(2) : Math.round(sum).toLocaleString();
  };

  return (
    <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-5 overflow-hidden space-y-3">
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-[#1e2836] pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#3987e5]" />
          غرفة المحركات الربعية — QUARTERLY ENGINE ROOM (9 Discrete Quarters°)
        </h3>
        <span className="text-[10px] text-[#657081] font-mono">
          سلسلة الـ 9 أرباع المالية الحقيقية المدققة مع مؤشر TTM ومسار النمو البياني Sparkline
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono text-left">
          <thead>
            <tr className="text-[#657081] border-b border-[#1e2836] bg-[#0e1218]">
              <th className="p-2.5 text-right min-w-[150px]">البند المالي</th>
              {qPeriods.map((p: string, idx: number) => (
                <th key={idx} className="p-2.5 text-right whitespace-nowrap">
                  {idx === qPeriods.length - 1 ? <b className="text-white">{p}</b> : p}
                </th>
              ))}
              <th className="p-2.5 text-right bg-[#182130] text-[#d9b64a] font-bold">TTM°</th>
              <th className="p-2.5 text-center min-w-[120px]">مسار النمو (Sparkline)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2836]">
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02]">
                <td className="p-2.5 text-right font-sans font-bold text-white">
                  {line.label}
                </td>
                {line.vals.map((v, vIdx) => {
                  const isNeg = typeof v === "number" && v < 0;
                  return (
                    <td
                      key={vIdx}
                      className={`p-2.5 text-right tabular-nums ${isNeg ? "text-rose-400" : "text-[#a7b1bd]"}`}
                    >
                      {fmt(v, line.isEps)}
                    </td>
                  );
                })}
                <td className="p-2.5 text-right font-bold text-white bg-[#182130] tabular-nums">
                  {getTTM(line.vals, line.isEps)}
                </td>
                <td className="p-2.5 text-center">
                  <Sparkline vals={line.vals} color={line.color} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-2 text-[10px] text-[#657081] font-mono flex justify-between items-center">
        <span>ملاحظة: الربع الرابع محسوب آلياً بالفرق°: القوائم السنوية − مجموع 9 أشهر</span>
        <span>القيم بملايين الريالات ما عدا ربحية السهم (EPS)</span>
      </div>
    </div>
  );
}
