"use client";

import React, { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

interface Props {
  symbol: string;
}

// Sparkline SVG component exactly matching universal_template.html line 149-154
function Sparkline({ vals, w = 110, h = 24, color = "#8C3B32" }: { vals: (number | null)[]; w?: number; h?: number; color?: string }) {
  const vs = vals.filter((v): v is number => v != null);
  if (vs.length < 2) return <span className="text-[#9CA3AF] font-mono text-[10px]">—</span>;

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
        <line x1="2" x2={w - 2} y1={Y(0)} y2={Y(0)} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2" />
      )}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Distinct, muted line colors that stay legible on a white card without reading as neon
const LINE_COLORS = ["#8C3B32", "#B8863F", "#6B4C8A", "#16A34A", "#2E6B8C"];

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
      <div className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 text-center text-xs text-[#6B7280] font-mono">
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

  if (rev.length > 0) lines.push({ label: "الإيرادات (Revenue)", vals: rev, color: LINE_COLORS[0] });
  if (gp.length > 0) lines.push({ label: "إجمالي الربح (Gross Profit)", vals: gp, color: LINE_COLORS[1] });
  if (op.length > 0) lines.push({ label: "الربح التشغيلي (Operating Profit)", vals: op, color: LINE_COLORS[2] });
  if (net.length > 0) lines.push({ label: "صافي الربح (Net Profit)", vals: net, color: LINE_COLORS[3] });
  if (eps.length > 0) lines.push({ label: "ربحية السهم (EPS ر.س)", vals: eps, isEps: true, color: LINE_COLORS[4] });

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
    // UX note: on narrow screens, the first column ("البند المالي") scrolls away with the
    // rest of the table even though it's the row label. Made it sticky below so it stays
    // readable while scrolling through 9 quarters of data.
    <div className="bg-white border border-[#E5E7EB] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 overflow-hidden space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-[#E5E7EB] pb-4">
        <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#8C3B32]" />
          غرفة المحركات الربعية — Quarterly Engine Room (9 أرباع)
        </h3>
        <span className="text-[11px] text-[#6B7280] font-mono">
          سلسلة الـ 9 أرباع المالية المدققة مع مؤشر TTM ومسار النمو
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="text-[#6B7280] bg-[#F3F4F6] border-b border-[#E5E7EB]">
              <th className="p-2.5 text-right min-w-[150px] sticky right-0 bg-[#F3F4F6] font-semibold">البند المالي</th>
              {qPeriods.map((p: string, idx: number) => (
                <th key={idx} className="p-2.5 text-right whitespace-nowrap font-mono font-normal">
                  {idx === qPeriods.length - 1 ? <b className="text-[#1A1A1A] font-semibold">{p}</b> : p}
                </th>
              ))}
              <th className="p-2.5 text-right bg-[#F3F4F6] text-[#8C3B32] font-bold border-r border-[#E5E7EB]">TTM°</th>
              <th className="p-2.5 text-center min-w-[120px]">مسار النمو</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-[#F3F4F6]/60 transition-colors">
                <td className="p-2.5 text-right font-semibold text-[#1A1A1A] sticky right-0 bg-white">
                  {line.label}
                </td>
                {line.vals.map((v, vIdx) => {
                  const isNeg = typeof v === "number" && v < 0;
                  return (
                    <td
                      key={vIdx}
                      className={`p-2.5 text-right tabular-nums font-mono ${isNeg ? "text-[#DC2626]" : "text-[#1A1A1A]"}`}
                    >
                      {fmt(v, line.isEps)}
                    </td>
                  );
                })}
                <td className="p-2.5 text-right font-bold text-[#1A1A1A] bg-[#F3F4F6] tabular-nums font-mono border-r border-[#E5E7EB]">
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

      <div className="pt-3 border-t border-[#E5E7EB] text-[11px] text-[#9CA3AF] flex flex-wrap justify-between gap-1">
        <span>ملاحظة: الربع الرابع محسوب آلياً بالفرق° (القوائم السنوية − مجموع 9 أشهر)</span>
        <span>القيم بملايين الريالات ما عدا ربحية السهم (EPS)</span>
      </div>
    </div>
  );
}