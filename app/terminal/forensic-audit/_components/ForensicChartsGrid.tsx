"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";

interface ForensicChartsData {
  periods_q?: string[];
  periods_ar?: string[];
  income_statement?: {
    periods?: string[];
    rev?: number[];
    net?: number[];
    gp?: number[];
    op?: number[];
    ttm?: {
      rev?: number;
      gp?: number;
      op?: number;
      net?: number;
    };
  };
  rev?: number[];
  net?: number[];
  gp?: number[];
  op?: number[];
  quarters?: {
    periods?: string[];
    rev?: number[];
    net?: number[];
    gp?: number[];
    op?: number[];
  };
  bs?: {
    periods?: string[];
    total_assets?: number[];
    total_liabilities?: number[];
    total_equity?: number[];
    cash?: number[];
    short_debt?: number[];
    long_debt?: number[];
    debt?: number[];
  };
  cf?: {
    periods?: string[];
    cfo?: number[];
    cfi?: number[];
    cff?: number[];
    capex?: number[];
    fcf?: number[];
  };
}

interface Props {
  data: ForensicChartsData;
}

const PANEL = "rounded-[4px] border border-[#E5E7EB] bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]";

function fmt(v: number | null | undefined, d = 1) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("en-US", { maximumFractionDigits: d });
}

function cleanPeriod(p: string) {
  if (!p) return "";
  if (p.includes("_")) {
    const parts = p.split("_");
    return parts[0].split("-")[0];
  }
  return p.split("-")[0];
}

export default function ForensicChartsGrid({ data }: Props) {
  const isObj = data.income_statement;
  const annualPeriods = isObj?.periods || data.periods_ar || ["2020", "2021", "2022", "2023", "2024", "2025"];
  const revAnnual = isObj?.rev || data.rev || [];
  const netAnnual = isObj?.net || data.net || [];
  const gpAnnual = isObj?.gp || data.gp || [];

  const bsObj = data.bs || {};
  const bsPeriods = bsObj.periods || annualPeriods;
  const equity = (bsObj as any).total_equity || [];
  const cash = (bsObj as any).cash || [];
  const shortDebt = (bsObj as any).short_debt || [];
  const longDebt = (bsObj as any).long_debt || [];

  const cfObj = data.cf || {};
  const cfPeriods = cfObj.periods || annualPeriods;
  const cfo = (cfObj as any).cfo || [];

  // 1. Chart 1: صافي الربح السنوي بملايين الريالات
  const netAnnualData = annualPeriods.map((p, i) => ({
    period: cleanPeriod(p),
    net: netAnnual[i] ?? null,
  }));

  // 2. Chart 2: هوامش الربح % سنوياً (إجمالي مقابل صافي)
  const marginsData = annualPeriods.map((p, i) => {
    const r = revAnnual[i] || 0;
    const g = gpAnnual[i] || 0;
    const n = netAnnual[i] || 0;
    return {
      period: cleanPeriod(p),
      gm: r > 0 ? Number(((g / r) * 100).toFixed(1)) : null,
      nm: r > 0 ? Number(((n / r) * 100).toFixed(1)) : null,
    };
  });

  // 3. Chart 3: التدفق التشغيلي CFO سنوياً
  const cfoData = cfPeriods.map((p, i) => ({
    period: cleanPeriod(p),
    cfo: cfo[i] ?? null,
  }));

  // 4. Chart 4: صافي الدين مقابل حقوق الملكية (بمليارات الريالات)
  const debtEquityData = bsPeriods.map((p, i) => {
    const eq = (equity[i] || 0) / 1000.0; // تحويل إلى مليارات
    const totDebt = (shortDebt[i] || 0) + (longDebt[i] || 0);
    const c = cash[i] || 0;
    const netDebt = (totDebt - c) / 1000.0; // صافي الدين بالمليارات

    return {
      period: cleanPeriod(p),
      equity: Number(eq.toFixed(2)),
      netDebt: Number(netDebt.toFixed(2)),
    };
  });

  return (
    <div className="space-y-3.5">
      {/* الصف الأول: الأرباح والهوامش */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {/* 1. صافي الربح السنوي (فعلي) */}
        <div className={PANEL}>
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-[12.5px] font-bold text-[#1A1A1A]">صافي الربح السنوي (فعلي)</h4>
            <span className="text-[10.5px] text-[#9CA3AF]">ملايين الريالات</span>
          </div>
          <div className="mt-2 h-[140px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={netAnnualData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 10.5 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 10 }} tickFormatter={(v) => fmt(v, 0)} />
                {netAnnualData.some((d) => (d.net ?? 0) < 0) && <ReferenceLine y={0} stroke="#D1D5DB" />}
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div dir="rtl" className="rounded border border-[#E5E7EB] bg-white p-2 shadow-lg text-[11.5px]">
                          <div className="font-bold text-[#1A1A1A]">{d.period}</div>
                          <div className="mt-1 text-[#8C3B32]">
                            صافي الربح: <b className="tabular-nums" dir="ltr">{fmt(d.net, 1)} م.ر</b>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="net" radius={[3, 3, 0, 0]} maxBarSize={32}>
                  {netAnnualData.map((entry, idx) => (
                    <Cell key={idx} fill={(entry.net ?? 0) >= 0 ? "#8C3B32" : "#DC2626"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. الهوامش ٪ سنوياً (فعلي) */}
        <div className={PANEL}>
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-[12.5px] font-bold text-[#1A1A1A]">الهوامش ٪ سنوياً (فعلي)</h4>
            <div className="flex items-center gap-3 text-[10.5px]">
              <span className="flex items-center gap-1 text-[#8C3B32]"><span className="inline-block h-2 w-2 rounded-full bg-[#8C3B32]" />إجمالي</span>
              <span className="flex items-center gap-1 text-[#EA580C]"><span className="inline-block h-2 w-2 rounded-full bg-[#EA580C]" />صافي</span>
            </div>
          </div>
          <div className="mt-2 h-[140px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marginsData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 10.5 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div dir="rtl" className="rounded border border-[#E5E7EB] bg-white p-2 shadow-lg text-[11.5px]">
                          <div className="font-bold text-[#1A1A1A]">{d.period}</div>
                          <div className="mt-1 text-[#8C3B32]">هامش إجمالي: <b>{fmt(d.gm, 1)}%</b></div>
                          <div className="text-[#EA580C]">هامش صافي: <b>{fmt(d.nm, 1)}%</b></div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="gm" stroke="#8C3B32" strokeWidth={2} dot={{ r: 3.5 }} name="هامش إجمالي" />
                <Line type="monotone" dataKey="nm" stroke="#EA580C" strokeWidth={2} dot={{ r: 3.5 }} name="هامش صافي" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* الصف الثاني: التدفق التشغيلي وصافي الدين مقابل حقوق الملكية */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {/* 3. التدفق التشغيلي CFO سنوياً */}
        <div className={PANEL}>
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-[12.5px] font-bold text-[#1A1A1A]">التدفق التشغيلي CFO سنوياً (فعلي)</h4>
            <span className="text-[10.5px] text-[#9CA3AF]">ملايين الريالات</span>
          </div>
          <div className="mt-2 h-[140px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cfoData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 10.5 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 10 }} tickFormatter={(v) => fmt(v, 0)} />
                {cfoData.some((d) => (d.cfo ?? 0) < 0) && <ReferenceLine y={0} stroke="#D1D5DB" />}
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div dir="rtl" className="rounded border border-[#E5E7EB] bg-white p-2 shadow-lg text-[11.5px]">
                          <div className="font-bold text-[#1A1A1A]">{d.period}</div>
                          <div className="mt-1 text-[#1E3A8A]">
                            التدفق التشغيلي (CFO): <b className="tabular-nums" dir="ltr">{fmt(d.cfo, 1)} م.ر</b>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="cfo" radius={[3, 3, 0, 0]} maxBarSize={32}>
                  {cfoData.map((entry, idx) => (
                    <Cell key={idx} fill={(entry.cfo ?? 0) >= 0 ? "#1E3A8A" : "#DC2626"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. صافي الدين مقابل حقوق الملكية */}
        <div className={PANEL}>
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-[12.5px] font-bold text-[#1A1A1A]">صافي الدين مقابل حقوق الملكية</h4>
            <div className="flex items-center gap-3 text-[10.5px]">
              <span className="flex items-center gap-1 text-[#8C3B32]"><span className="inline-block h-2 w-2 rounded-full bg-[#8C3B32]" />حقوق الملكية</span>
              <span className="flex items-center gap-1 text-[#DC2626]"><span className="inline-block h-2 w-2 rounded-full bg-[#DC2626]" />صافي الدين</span>
            </div>
          </div>
          <div className="mt-2 h-[140px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={debtEquityData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 10.5 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 10 }} tickFormatter={(v) => `${v}B`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div dir="rtl" className="rounded border border-[#E5E7EB] bg-white p-2 shadow-lg text-[11.5px]">
                          <div className="font-bold text-[#1A1A1A]">{d.period}</div>
                          <div className="mt-1 flex justify-between gap-4 text-[#8C3B32]">
                            <span>حقوق الملكية:</span>
                            <b className="tabular-nums" dir="ltr">{fmt(d.equity, 2)} مليار ر.س</b>
                          </div>
                          <div className="flex justify-between gap-4 text-[#DC2626]">
                            <span>صافي الدين:</span>
                            <b className="tabular-nums" dir="ltr">{fmt(d.netDebt, 2)} مليار ر.س</b>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="equity" stroke="#8C3B32" strokeWidth={2} dot={{ r: 3.5 }} name="حقوق الملكية" />
                <Line type="monotone" dataKey="netDebt" stroke="#DC2626" strokeWidth={2} dot={{ r: 3.5 }} name="صافي الدين" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}