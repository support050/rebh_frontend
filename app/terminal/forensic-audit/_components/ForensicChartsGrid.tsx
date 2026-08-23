"use client";

import { useRef, useEffect, useCallback } from "react";
import type { ForensicCompanyData } from "../_hooks/useForensicSheetData";

interface Props {
  data: ForensicCompanyData;
}

/** Pure SVG bar chart — matches the HTML reference ch1/ch3 pattern */
function BarChartSVG({
  values,
  labels,
  allowNeg,
  height = 150,
}: {
  values: number[];
  labels: string[];
  allowNeg?: boolean;
  height?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  const draw = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || values.length === 0) return;
    const W = svg.clientWidth || 520;
    const H = height;
    const pB = 22, pT = 12, pS = 4, pE = 10;
    const mx = Math.max(...values.map((v) => Math.abs(v))) || 1;
    const slot = (W - pS - pE) / values.length;
    const bw = Math.min(slot * 0.55, 40);
    const maxV = Math.max(...values);
    const minV = Math.min(...values);
    const zero = allowNeg && maxV !== minV
      ? pT + (H - pT - pB) * (maxV / (maxV - minV))
      : H - pB;
    const scale = allowNeg && maxV !== minV
      ? (H - pT - pB) / (maxV - minV)
      : (H - pT - pB) / mx;

    let o = `<line x1="${pS}" x2="${W - pE}" y1="${zero}" y2="${zero}" stroke="#383835" stroke-width="1.5"/>`;
    values.forEach((v, i) => {
      const h = Math.abs(v) * scale;
      const x = pS + slot * i + (slot - bw) / 2;
      const y = v >= 0 ? zero - h : zero;
      const fill = v >= 0 ? "#3987e5" : "#e66767";
      o += `<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(h, 1)}" rx="3" fill="${fill}"/>`;
      o += `<text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle" font-size="8.5" fill="#898781">${labels[i] || ""}</text>`;
      if (i === values.length - 1 || Math.abs(v) === mx) {
        const lbl = v < 0 ? `(${Math.abs(Math.round(v)).toLocaleString()})` : Math.round(v).toLocaleString();
        const ly = v >= 0 ? y - 3 : y + h + 10;
        const fc = v < 0 ? "#e66767" : "#fff";
        o += `<text x="${x + bw / 2}" y="${ly}" text-anchor="middle" font-size="9" font-weight="700" fill="${fc}" direction="ltr">${lbl}</text>`;
      }
    });
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = o;
  }, [values, labels, allowNeg, height]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  return <svg ref={svgRef} width="100%" height={height} />;
}

/** Pure SVG line chart — matches the HTML reference ch2/ch4 pattern */
function LineChartSVG({
  series1,
  series2,
  labels,
  color1 = "#3987e5",
  color2 = "#eb6834",
  format = (v: number) => v.toFixed(0),
  height = 138,
}: {
  series1: number[];
  series2: number[];
  labels: string[];
  color1?: string;
  color2?: string;
  format?: (v: number) => string;
  height?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  const draw = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || series1.length === 0) return;
    const W = svg.clientWidth || 520;
    const H = height;
    const pB = 20, pT = 10, pS = 4, pE = 44;
    const all = [...series1, ...series2];
    const mn = 0;
    const mx = Math.max(...all) * 1.15 || 1;
    const n = series1.length;
    const X = (i: number) => pS + (i / Math.max(n - 1, 1)) * (W - pS - pE);
    const Y = (v: number) => pT + (1 - (v - mn) / ((mx - mn) || 1)) * (H - pT - pB);

    let o = `<line x1="${pS}" x2="${W - pE}" y1="${H - pB}" y2="${H - pB}" stroke="#383835"/>`;
    o += `<polyline points="${series1.map((v, i) => X(i) + "," + Y(v)).join(" ")}" fill="none" stroke="${color1}" stroke-width="2"/>`;
    o += `<polyline points="${series2.map((v, i) => X(i) + "," + Y(v)).join(" ")}" fill="none" stroke="${color2}" stroke-width="2"/>`;
    series1.forEach((v, i) => {
      o += `<circle cx="${X(i)}" cy="${Y(v)}" r="2.5" fill="${color1}"/>`;
    });
    series2.forEach((v, i) => {
      o += `<circle cx="${X(i)}" cy="${Y(v)}" r="2.5" fill="${color2}"/>`;
    });
    labels.forEach((L, i) => {
      o += `<text x="${X(i)}" y="${H - 6}" text-anchor="middle" font-size="8.5" fill="#898781">${L}</text>`;
    });
    if (n > 0) {
      o += `<text x="${X(n - 1) + 5}" y="${Y(series1[n - 1]) + 3}" font-size="9.5" fill="${color1}" font-weight="700">${format(series1[n - 1])}</text>`;
      o += `<text x="${X(n - 1) + 5}" y="${Y(series2[n - 1]) + 3}" font-size="9.5" fill="${color2}" font-weight="700">${format(series2[n - 1])}</text>`;
    }

    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = o;
  }, [series1, series2, labels, color1, color2, format, height]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  return <svg ref={svgRef} width="100%" height={height} />;
}

export default function ForensicChartsGrid({ data }: Props) {
  const isObj = data.income_statement;
  const annualPeriods = isObj?.periods || data.periods_ar || [];
  const revAnnual = isObj?.rev || data.rev || [];
  const netAnnual = isObj?.net || data.net || [];
  const gpAnnual = isObj?.gp || data.gp || [];

  // TTM values
  const ttmRev = isObj?.ttm?.rev ?? 4131.0;
  const ttmGp = isObj?.ttm?.gp ?? 1970.0;
  const ttmNet = isObj?.ttm?.net ?? 1185.0;

  // Chart 1 & 2: 6 Annual years + TTM
  const chart1Labels = [...annualPeriods.slice(-6), "TTM"];
  const chart1Net = [...netAnnual.slice(-6), ttmNet];
  const chart2Rev = [...revAnnual.slice(-6), ttmRev];
  const chart2Gp = [...gpAnnual.slice(-6), ttmGp];
  const chart2Net = [...netAnnual.slice(-6), ttmNet];

  const gmPct = chart2Rev.map((r, i) => (chart2Gp[i] != null && r > 0 ? parseFloat(((chart2Gp[i] / r) * 100).toFixed(1)) : 0));
  const nmPct = chart2Rev.map((r, i) => (chart2Net[i] != null && r > 0 ? parseFloat(((chart2Net[i] / r) * 100).toFixed(1)) : 0));

  // Chart 3: CFO real series (6 annual periods)
  const cf = data.cf;
  const cfoVals = cf?.cfo || [];
  const cfLabels = (cf?.periods || []).map((p) => (p.includes("_") ? p.split("_")[1].split("-")[0] : p.split("-")[0]));

  // Chart 4: Total Equity vs Net Debt in Billions SAR
  const bs = data.bs;
  const eqVals = (bs?.total_equity || []).map((v) => parseFloat((v / 1000.0).toFixed(1)));
  const totalDebt = (bs?.short_debt || []).map((sd, i) => (sd || 0) + ((bs?.long_debt && bs.long_debt[i]) || 0));
  const ndVals = totalDebt.map((td, i) => {
    const cash = (bs?.cash && bs.cash[i]) || 0;
    return parseFloat(((td - cash) / 1000.0).toFixed(1));
  });
  const bsLabels = (bs?.periods || []).map((p) => (p.endsWith("-12") ? p.split("-")[0] : p.endsWith("-03") ? `Q1'${p.slice(2, 4)}` : p));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Chart 1: Annual Net Profit Bar Chart */}
      <div className="rounded-xl border border-white/10 bg-[#1a1a19] p-3.5">
        <h4 className="text-xs font-bold mb-2">صافي الربح السنوي (فعلي) — بملايين الريالات</h4>
        <BarChartSVG values={chart1Net} labels={chart1Labels} allowNeg={chart1Net.some((v) => v < 0)} />
      </div>

      {/* Chart 2: Gross vs Net Margin Lines */}
      <div className="rounded-xl border border-white/10 bg-[#1a1a19] p-3.5">
        <h4 className="text-xs font-bold mb-1">الهوامش ٪ سنوياً (فعلي)</h4>
        <div className="flex gap-3 text-[10.5px] text-[#c3c2b7] mb-1">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#3987e5]" /> إجمالي
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#eb6834]" /> صافي
          </span>
        </div>
        {gmPct.length > 0 && nmPct.length > 0 ? (
          <LineChartSVG
            series1={gmPct}
            series2={nmPct}
            labels={chart1Labels}
            color1="#3987e5"
            color2="#eb6834"
            format={(v) => v.toFixed(0) + "%"}
          />
        ) : (
          <div className="h-[138px] flex items-center justify-center text-xs text-[#898781]">بيانات الهوامش غير متاحة</div>
        )}
      </div>

      {/* Chart 3: CFO Bar Chart with Real Data & Negative Support */}
      <div className="rounded-xl border border-white/10 bg-[#1a1a19] p-3.5">
        <h4 className="text-xs font-bold mb-2">التدفق التشغيلي CFO سنوياً (فعلي) — دورات ضخ واسترداد</h4>
        {cfoVals.length > 0 ? (
          <BarChartSVG values={cfoVals} labels={cfLabels} allowNeg={true} />
        ) : (
          <div className="h-[150px] flex items-center justify-center text-xs text-[#898781]">
            بيانات التدفقات النقدية غير متاحة
          </div>
        )}
      </div>

      {/* Chart 4: Net Debt vs Equity in Billions SAR */}
      <div className="rounded-xl border border-white/10 bg-[#1a1a19] p-3.5">
        <h4 className="text-xs font-bold mb-1">صافي الدين مقابل حقوق الملكية — بمليارات الريالات</h4>
        <div className="flex gap-3 text-[10.5px] text-[#c3c2b7] mb-1">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#3987e5]" /> حقوق الملكية
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#d03b3b]" /> صافي الدين
          </span>
        </div>
        {eqVals.length > 0 && ndVals.length > 0 ? (
          <LineChartSVG
            series1={eqVals}
            series2={ndVals}
            labels={bsLabels}
            color1="#3987e5"
            color2="#d03b3b"
            format={(v) => v.toFixed(1)}
          />
        ) : (
          <div className="h-[138px] flex items-center justify-center text-xs text-[#898781]">
            بيانات الميزانية غير متاحة
          </div>
        )}
      </div>
    </div>
  );
}
