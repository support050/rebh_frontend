import React from "react";

interface SectionPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionPanel({ children, className = "" }: SectionPanelProps) {
  return (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-[8px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

interface KpiCardProps {
  label: string;
  val: number | null;
  unit?: string;
  color?: string;
  note?: string;
  formula?: string;
  showFormula?: boolean;
  tooltipText?: string;
  maxFractionDigits?: number;
}

export function KpiCard({
  label,
  val,
  unit = "",
  color,
  note,
  formula,
  showFormula,
  tooltipText,
  maxFractionDigits = 1,
}: KpiCardProps) {
  const accent = color || "#94A3B8";
  return (
    <div
      className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3 space-y-1.5 group relative transition-all duration-200 ease-out hover:-translate-y-[1px] hover:bg-white hover:shadow-[0_4px_14px_rgba(15,23,42,0.08)]"
      style={{ borderColor: undefined }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `${accent}66`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "#E2E8F0";
      }}
    >
      <div className="flex items-center justify-between">
        <span className="block text-[11px] font-semibold text-[#64748B]">{label}</span>
        {tooltipText && (
          <span
            title={tooltipText}
            className="text-[10px] text-[#94A3B8] cursor-help bg-white border border-[#E2E8F0] px-1 rounded hover:text-[#0F172A] hover:border-[#CBD5E1] transition-colors"
          >
            ?
          </span>
        )}
      </div>

      <span
        className="block font-mono font-black text-lg tabular-nums tracking-tight"
        style={color ? { color } : undefined}
      >
        {val != null
          ? val.toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits })
          : "—"}
        {unit && <span className="text-xs font-normal ml-1 text-[#64748B]">{unit}</span>}
      </span>

      {note && (
        <span
          className="inline-flex items-center text-[10.5px] font-bold px-2 py-[3px] rounded-full leading-none tabular-nums"
          style={{
            color: accent,
            backgroundColor: `${accent}14`,
            border: `1px solid ${accent}33`,
          }}
        >
          {note}
        </span>
      )}

      {showFormula && formula && (
        <span className="block text-[9px] font-mono text-[#94A3B8] mt-1 border-t border-slate-200 pt-1">
          {formula}
        </span>
      )}
    </div>
  );
}