import React, { useState } from "react";
import { SectorTemplate, FORMULAS, classifyRatio, LIGHT_CSS, SECTOR_TEMPLATES } from "./types";

interface RatioCardProps {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  percentile?: number;
  template: SectorTemplate;
}

export function RatioCard({
  id,
  label,
  value,
  unit,
  template,
}: RatioCardProps) {
  const [open, setOpen] = useState(false);
  const light = classifyRatio(id, value);
  const formula = FORMULAS[id];
  const tpl = SECTOR_TEMPLATES[template];
  const inTemplate = tpl.ratios.includes(id);

  return (
    <div
      className={`rounded-[6px] border p-4 space-y-2 cursor-pointer transition-all hover:shadow-md ${LIGHT_CSS[light]} ${inTemplate ? "ring-1 ring-[#8C3B32]/30" : ""}`}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {inTemplate && (
              <span className="text-[9px] font-bold text-[#8C3B32] bg-[#FFF1EF] border border-[#FECACA] px-1.5 py-0.5 rounded-full">
                {tpl.label.split(" ")[0]}
              </span>
            )}
            <span className="text-xs font-bold text-[#0F172A] truncate">{label}</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black font-mono">
              {value == null ? "—" : value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </span>
            <span className="text-xs font-mono">{unit}</span>
          </div>
        </div>
        <div className="text-right shrink-0 space-y-1">
          {light !== "neutral" && (
            <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${light === "green" ? "bg-[#BBF7D0] text-[#166534]" :
              light === "amber" ? "bg-[#FDE68A] text-[#92400E]" :
                "bg-[#FECACA] text-[#991B1B]"
              }`}>
              {light === "green" ? "✓ Strong" : light === "amber" ? "◑ Moderate" : "✗ Weak"}
            </div>
          )}
        </div>
      </div>

      {open && formula && (
        <div className="pt-2 border-t border-current/10 text-[11px] space-y-1 opacity-90" onClick={e => e.stopPropagation()}>
          <div><span className="font-bold">Formula:</span> {formula.formula}</div>
          <div><span className="font-bold">Source:</span> {formula.source}</div>
          {formula.note && <div className="text-[10px] italic">{formula.note}</div>}
        </div>
      )}
    </div>
  );
}
