import React, { useState } from "react";
import Link from "next/link";
import { Search, FileDown, RefreshCw, Loader2 } from "lucide-react";
import { buildCanvasPdf } from "@/lib/rebh/pdf";
import { XRayStory, SIG_COLOR } from "./types";

interface HeaderProps {
  symbol: string;
  name: string;
  nameEn: string;
  sector: string;
  activePeriod: string;
  periods: string[];
  activePeriodIndex: number;
  onSelectPeriod: (index: number) => void;
  search: string;
  setSearch: (s: string) => void;
  onSearch: (e: React.FormEvent) => void;
  showFormulas: boolean;
  setShowFormulas: (v: boolean) => void;
  px?: number | null;
  pe?: number | null;
  pb?: number | null;
  fScore?: number | null;
  story: XRayStory | null;
  isChangingPeriod?: boolean;
}

export function XRayHeader({
  symbol,
  name,
  nameEn,
  sector,
  activePeriod,
  periods,
  activePeriodIndex,
  onSelectPeriod,
  search,
  setSearch,
  onSearch,
  showFormulas,
  setShowFormulas,
  px,
  pe,
  pb,
  fScore,
  story,
  isChangingPeriod,
}: HeaderProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // ── Direct PDF download (unified REBH pipeline) ────────────────────────────
  // Captures the report body — everything wrapped in the element with
  // id="xray-report-content" in the page (page.tsx) — via html2canvas (scale 2),
  // then embeds it into a multi-page A4 PDF carrying the unified maroon REBH
  // header and the disclaimer footer on every page.
  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    const node = document.getElementById("xray-report-content");
    if (!node) {
      console.error(
        'XRay PDF export: no element with id="xray-report-content" found on the page.'
      );
      return;
    }

    setIsExportingPdf(true);
    try {
      const dateStr = new Date().toISOString().split("T")[0];
      await buildCanvasPdf({
        node,
        filename: `REBH_XRay_${symbol}_${dateStr}.pdf`,
        header: {
          symbol,
          title: name,
          subtitle: `Financial Narrative X-Ray - ${sector}`,
        },
      });
    } catch (err) {
      console.error("XRay PDF export failed", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <>
      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] px-5 py-2.5 flex items-center justify-between flex-wrap gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] print:hidden pdf-exclude">
        <div className="flex items-center gap-3">
          <Link href="/rebh/xray">
            <span className="px-2.5 py-1 rounded-[6px] bg-[#8C3B32] text-white font-mono font-black text-xs cursor-pointer hover:bg-[#752f28] focus:outline-none focus:ring-2 focus:ring-[#8C3B32] focus:ring-offset-2 transition-all">
              X-RAY
            </span>
          </Link>
          <h1 className="font-bold text-sm text-[#1A1A1A] tracking-tight">
            Company Financial Story · X-Ray —{" "}
            <span className="font-mono text-[#8C3B32] tabular-nums">{symbol}</span>
          </h1>
          <span className="hidden sm:block text-xs text-[#9CA3AF]">|</span>
          <span className="hidden sm:block text-xs text-[#6B7280] truncate max-w-[200px]">
            {name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={onSearch} className="flex items-center">
            <div className="relative flex items-center">
              <Search
                size={13}
                className="absolute left-3 text-[#9CA3AF] pointer-events-none"
              />
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={search}
                onChange={(e) => setSearch(e.target.value.replace(/\D/g, ""))}
                placeholder="Ticker"
                aria-label="Company ticker"
                className="w-32 pl-8 pr-9 py-1.5 text-xs border border-[#D1D5DB] rounded-full outline-none focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/20 font-mono text-center bg-[#F9FAFB] transition-all"
              />
              <button
                type="submit"
                aria-label="Go"
                className="absolute right-1 flex items-center justify-center w-6 h-6 rounded-full bg-[#8C3B32] text-white hover:bg-[#752f28] focus:outline-none focus:ring-2 focus:ring-[#8C3B32]/40 transition-colors"
              >
                <Search size={12} />
              </button>
            </div>
          </form>
          <button
            onClick={() => setShowFormulas(!showFormulas)}
            className={`px-3 py-1.5 rounded-[6px] border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C3B32]/30 transition-colors ${showFormulas
              ? "bg-[#8C3B32] text-white border-[#8C3B32]"
              : "bg-white text-[#374151] border-[#D1D5DB] hover:bg-[#F3F4F6]"
              }`}
          >
            Formulas
          </button>
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8C3B32] hover:bg-[#752f28] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-[6px] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C3B32] focus:ring-offset-2 transition-colors min-w-[104px] justify-center"
          >
            {isExportingPdf ? (
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

      {/* ── COMPANY SNAPSHOT ─────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#E5E7EB] px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-[6px] text-[#8C3B32] font-mono font-bold text-base shrink-0 tabular-nums">
              {symbol}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-[#1A1A1A]">{name}</h2>
                {nameEn && <span className="text-[11px] font-mono text-[#6B7280]">{nameEn}</span>}
              </div>
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <span>{sector}</span>
                <span>·</span>
                <span>Analysis period: <strong className="text-[#0F172A] font-mono">{activePeriod}</strong></span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-mono">
                  🔌 Official data
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#374151] print:hidden">
              <span>Period:</span>
              <div className="relative">
                <select
                  value={activePeriodIndex}
                  onChange={(e) => onSelectPeriod(Number(e.target.value))}
                  className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#D1D5DB] rounded-[6px] text-xs font-mono outline-none focus:border-[#8C3B32] focus:ring-2 focus:ring-[#8C3B32]/20 transition-all cursor-pointer"
                >
                  {periods.map((period, index) => (
                    <option key={`${period}-${index}`} value={index}>
                      {period}
                    </option>
                  ))}
                </select>
                {isChangingPeriod && (
                  <RefreshCw size={11} className="animate-spin text-[#8C3B32] absolute right-6 top-2.5 pointer-events-none" />
                )}
              </div>
            </label>
            {[
              { label: "Price", val: px ? `${px} SAR` : "—" },
              { label: "P/E", val: pe ? `${pe}×` : "—" },
              { label: "P/B", val: pb ? `${pb}×` : "—" },
              { label: "Piotroski", val: fScore != null ? `${fScore}/9` : "—" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 py-1.5 text-center min-w-[70px]"
              >
                <span className="block text-[10px] text-[#64748B]">{s.label}</span>
                <span className="block font-mono font-black text-xs text-[#0F172A] tabular-nums">
                  {s.val}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HEADLINE NARRATIVE & ACCESSIBLE SIGNAL STRIP ─────────────────── */}
      {story && (
        <section className="bg-[#0F172A] text-white px-6 py-6 transition-all duration-200">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[11px] font-mono text-[#94A3B8]">
                  Financial story derived from unified data
                </p>
                <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.2 rounded font-mono">
                  {activePeriod}
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight">{story.headline}</h2>
              <p className="text-sm text-[#94A3B8] mt-1">{story.subtitle}</p>
            </div>

            {/* Accessibility: Multi-modal encoding (Color + Glyph Icon + Label) */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap bg-slate-900/60 p-2 rounded-[8px] border border-slate-800">
              {(
                [
                  { k: "cash", l: "Cash" },
                  { k: "margin", l: "Margins" },
                  { k: "leverage", l: "Leverage" },
                  { k: "quality", l: "Quality" },
                  { k: "funding", l: "Funding" },
                ] as const
              ).map(({ k, l }) => {
                const sig = story[k];
                const s = sig.signal;
                const token = SIG_COLOR[s];
                return (
                  <div key={k} className="flex flex-col items-center gap-1 min-w-[42px]">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white shadow-sm"
                      style={{ backgroundColor: token.colorHex }}
                      title={`${l}: ${s === "green" ? "Positive" : s === "amber" ? "Caution" : "Negative"}`}
                    >
                      {token.glyph}
                    </div>
                    <span className="text-[10px] font-bold text-[#94A3B8]">{l}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}