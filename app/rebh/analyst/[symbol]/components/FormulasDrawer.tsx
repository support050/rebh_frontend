import React from "react";
import { X, BookOpen } from "lucide-react";
import { FORMULAS } from "./types";

interface FormulasDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FormulasDrawer({ isOpen, onClose }: FormulasDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 cursor-default"
      >
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-[#8C3B32]" />
            <h3 className="font-bold text-sm text-[#1A1A1A]">Financial Formulas &amp; Methodology</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#E5E7EB] rounded-full text-[#6B7280] transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          <p className="text-[#64748B] leading-relaxed">
            All formulas and metrics adhere strictly to unified Tadawul XBRL taxonomy standards and standardized financial accounting guidelines.
          </p>

          <div className="space-y-3">
            {Object.entries(FORMULAS).map(([k, v]) => (
              <div key={k} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] space-y-1">
                <div className="font-bold text-[#8C3B32] uppercase tracking-wide text-[11px]">{k}</div>
                <div className="font-mono text-[#0F172A] font-semibold">{v.formula}</div>
                <div className="text-[10.5px] text-[#64748B]">Source: {v.source}</div>
                {v.note && (
                  <div className="text-[10px] text-[#475569] bg-white p-1.5 rounded border border-[#E2E8F0] mt-1">
                    {v.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
