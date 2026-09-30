import React from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";

interface CompanyHeroProps {
  symbol: string;
  name: string;
  sector: string;
  isBank?: boolean;
  px?: number;
  mc?: number;
  safetyPass: boolean | null;
  qualityPass: boolean | null;
}

export function CompanyHero({
  symbol,
  name,
  sector,
  isBank,
  px,
  mc,
  safetyPass,
  qualityPass,
}: CompanyHeroProps) {
  const verdicts = [
    {
      label: "Solvency Verdict",
      sub: "Liquidity & leverage ratios",
      pass: safetyPass,
      passText: "Safe · Sound solvency",
      failText: "At Risk · Review debt & liquidity",
    },
    {
      label: "Earnings Quality Verdict",
      sub: "Profit margins & returns",
      pass: qualityPass,
      passText: "Good · Productive earnings",
      failText: "Weak · Low margins",
    },
  ];

  return (
    <section className="bg-white border-b border-[#E5E7EB] px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="px-3 py-1.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-[4px] text-[#8C3B32] font-mono font-bold text-base shrink-0">
            {symbol}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-[#1A1A1A]">{name}</h2>
              {isBank && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8]">
                  Bank · Specialized Financial Model
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">{sector} · Saudi Exchange (Tadawul)</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs font-mono">
              {px != null && <span className="text-[#0F172A] font-bold">Price: {px} SAR</span>}
              {mc != null && <span className="text-[#64748B]">Market Cap: SAR {(mc / 1000).toFixed(1)}B</span>}
            </div>
          </div>
        </div>

        {/* Dual Verdict */}
        <div className="flex items-stretch gap-3 shrink-0">
          {verdicts.map((v, i) => (
            <div
              key={i}
              className={`rounded-[6px] border px-4 py-3 min-w-[160px] ${
                v.pass ? "bg-[#F0FDF4] border-[#BBF7D0]" : "bg-[#FEF2F2] border-[#FECACA]"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {v.pass ? (
                  <ShieldCheck size={14} className="text-[#16A34A]" />
                ) : (
                  <AlertTriangle size={14} className="text-[#DC2626]" />
                )}
                <span className="text-[11px] font-bold text-[#0F172A]">{v.label}</span>
              </div>
              <div className={`text-xs font-bold ${v.pass ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                {v.pass ? v.passText : v.failText}
              </div>
              <div className="text-[10px] text-[#64748B] mt-0.5">{v.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
