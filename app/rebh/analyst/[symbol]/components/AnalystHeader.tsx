import React from "react";
import Link from "next/link";
import { FileDown, Loader2 } from "lucide-react";

interface AnalystHeaderProps {
  symbol: string;
  search: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  exportingPdf: boolean;
  onExportPdf: () => void;
}

export function AnalystHeader({
  symbol,
  search,
  onSearchChange,
  onSearchSubmit,
  exportingPdf,
  onExportPdf,
}: AnalystHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] px-5 py-2.5 flex items-center justify-between flex-wrap gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-3">
        <Link href="/rebh/analyst">
          <span className="px-2 py-1 rounded bg-[#8C3B32] text-white font-mono font-black text-xs cursor-pointer hover:bg-[#752f28]">
            ANALYST
          </span>
        </Link>
        <h1 className="font-bold text-sm text-[#1A1A1A] tracking-tight">
          Statements · Analyst — <span className="font-mono text-[#8C3B32]">{symbol}</span>
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <form onSubmit={onSearchSubmit} className="flex items-center gap-1.5">
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={search}
            onChange={e => onSearchChange(e.target.value.replace(/\D/g, ""))}
            placeholder="Ticker"
            className="w-24 px-2.5 py-1.5 text-xs border border-[#D1D5DB] rounded-[4px] outline-none focus:border-[#8C3B32] font-mono text-center bg-[#F9FAFB]"
          />
          <button
            type="submit"
            className="px-2.5 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] rounded-[4px] text-xs font-semibold"
          >
            Go
          </button>
        </form>
        <button
          onClick={onExportPdf}
          disabled={exportingPdf}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#8C3B32] hover:bg-[#752f28] text-white rounded-[4px] text-xs font-semibold disabled:opacity-60"
        >
          {exportingPdf ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <FileDown size={13} />
              Export PDF
            </>
          )}
        </button>
      </div>
    </header>
  );
}
