import React, { useState, useMemo } from "react";
import { Info, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AnalysisMode, LIGHT_DOT, toCommonSize, toHorizontal } from "./types";

interface StatRowProps {
  label: string;
  values: number[];
  periods: string[];
  unit?: string;
  isTotal?: boolean;
  indent?: boolean;
  source?: string;
  verdict?: "green" | "amber" | "red" | "neutral";
  onClick?: () => void;
  analysisMode?: AnalysisMode;
  baseValues?: number[];
  ttmValue?: number | null;
}

export function StatRow({
  label,
  values,
  periods,
  unit = "M",
  isTotal = false,
  indent = false,
  source,
  verdict,
  onClick,
  analysisMode,
  baseValues,
  ttmValue,
}: StatRowProps) {
  const [showNote, setShowNote] = useState(false);

  const displayValues: (number | null)[] = useMemo(() => {
    if (!analysisMode || analysisMode === "absolute") return values;
    if (analysisMode === "common_size" && baseValues?.length)
      return toCommonSize(values, baseValues);
    if (analysisMode === "horizontal")
      return toHorizontal(values);
    return values;
  }, [values, analysisMode, baseValues]);

  const displayTTM: number | null = useMemo(() => {
    if (ttmValue == null) return null;
    if (!analysisMode || analysisMode === "absolute") return ttmValue;
    if (analysisMode === "common_size" && baseValues?.length) {
      const lastBase = baseValues[baseValues.length - 1];
      if (!lastBase) return null;
      return +((ttmValue / Math.abs(lastBase)) * 100).toFixed(1);
    }
    if (analysisMode === "horizontal") {
      const base = values.find(v => v !== 0) ?? null;
      if (base === null) return null;
      return +(((ttmValue - base) / Math.abs(base)) * 100).toFixed(1);
    }
    return null;
  }, [ttmValue, analysisMode, baseValues, values]);

  const displayUnit = analysisMode === "absolute" ? unit : "%";
  const isAbsolute = !analysisMode || analysisMode === "absolute";

  if (!values || values.every(v => v === 0)) return null;

  const latest = displayValues[displayValues.length - 1] ?? 0;
  const prev = displayValues[displayValues.length - 2] ?? 0;
  const chg = isAbsolute && prev !== 0
    ? ((latest - prev) / Math.abs(prev)) * 100 : null;
  const isUp = chg !== null && chg >= 0;

  const renderVal = (v: number | null) =>
    v == null
      ? <span className="text-[#CBD5E1]">—</span>
      : <span className={!isAbsolute ? (v > 0 ? "text-[#16A34A]" : v < 0 ? "text-[#DC2626]" : "") : ""}>
        {!isAbsolute && v > 0 ? "+" : ""}
        {v.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        {displayUnit === "%" ? "%" : ""}
      </span>;

  return (
    <tr
      className={`border-b border-[#F1F5F9] hover:bg-[#F8FAFC] group cursor-pointer ${isTotal ? "bg-[#F8FAFC]" : ""}`}
      onClick={onClick}
    >
      {/* Label cell */}
      <td className={`p-2 text-left text-xs ${isTotal ? "font-black text-[#0F172A]" : indent ? "pl-6 text-[#374151] font-medium" : "font-semibold text-[#0F172A]"}`}>
        <div className="flex items-center gap-1.5">
          {verdict && <span className={`w-2 h-2 rounded-full shrink-0 ${LIGHT_DOT[verdict]}`} />}
          {indent && <span className="w-3 shrink-0" />}
          <span>{label}</span>
          {source && (
            <button
              onClick={e => { e.stopPropagation(); setShowNote(!showNote); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Info size={10} className="text-[#94A3B8]" />
            </button>
          )}
        </div>
        {showNote && source && (
          <div className="mt-1 text-[10px] text-[#64748B] bg-[#F1F5F9] px-2 py-1 rounded font-normal">
            Source: {source}
          </div>
        )}
      </td>

      {/* Period value cells */}
      {displayValues.map((v, i) => (
        <td key={i} className={`p-2 text-right font-mono text-xs ${isTotal ? "font-black text-[#0F172A]" : "text-[#1E293B]"
          } ${i === displayValues.length - 1 ? "bg-[#FFFBF5]" : ""}`}>
          {renderVal(v)}
        </td>
      ))}

      {/* TTM cell */}
      {ttmValue !== undefined && (
        <td className="p-2 text-right font-mono text-xs bg-[#FFF8EE] text-[#D97706] font-bold">
          {renderVal(displayTTM)}
        </td>
      )}

      {/* YoY / QoQ change column — hidden in non-absolute modes */}
      {isAbsolute && (
        <td className="p-2 text-right text-[11px] font-mono">
          {chg != null ? (
            <span className={`inline-flex items-center gap-0.5 ${isUp ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
              {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {Math.abs(chg).toFixed(1)}%
            </span>
          ) : <span className="text-[#CBD5E1]">—</span>}
        </td>
      )}
    </tr>
  );
}
