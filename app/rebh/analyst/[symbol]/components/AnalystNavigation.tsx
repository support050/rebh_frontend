import React from "react";
import { Tab, SectorTemplate, AnalysisMode, SECTOR_TEMPLATES } from "./types";
import { TrendingUp, Layers, Activity, BarChart3, FileSpreadsheet } from "lucide-react";

interface AnalystNavigationProps {
  tab: Tab;
  setTab: (t: Tab) => void;
  viewMode: "annual" | "quarterly";
  setViewMode: (m: "annual" | "quarterly") => void;
  analysisMode: AnalysisMode;
  setAnalysisMode: (m: AnalysisMode) => void;
  template: SectorTemplate;
  setTemplate: (t: SectorTemplate) => void;
  onOpenFormulas: () => void;
}

const TAB_LIST: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: "is", label: "Income Statement", icon: <TrendingUp size={13} /> },
  { id: "bs", label: "Balance Sheet", icon: <Layers size={13} /> },
  { id: "cf", label: "Cash Flow Statement", icon: <Activity size={13} /> },
  { id: "ratios", label: "Financial Ratios", icon: <BarChart3 size={13} /> },
];

export function AnalystNavigation({
  tab,
  setTab,
  viewMode,
  setViewMode,
  analysisMode,
  setAnalysisMode,
  template,
  setTemplate,
  onOpenFormulas,
}: AnalystNavigationProps) {
  return (
    <div className="bg-white border-b border-[#E5E7EB]">
      {/* Tier 1: Main Tab Bar */}
      <div className="px-6 border-b border-[#F3F4F6]">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-2">
          <nav className="flex items-center gap-1.5 overflow-x-auto">
            {TAB_LIST.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[5px] text-xs font-semibold whitespace-nowrap transition-all ${
                  tab === t.id
                    ? "bg-[#8C3B32] text-white shadow-sm"
                    : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1A1A1A]"
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          <button
            onClick={onOpenFormulas}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-[#E5E7EB] text-xs font-semibold text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1A1A1A] transition shrink-0 ml-3"
          >
            <FileSpreadsheet size={13} className="text-[#8C3B32]" />
            <span>Formulas &amp; Sources</span>
          </button>
        </div>
      </div>

      {/* Tier 2: Statement View & Analysis Controls */}
      <div className="px-6 py-2 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Annual / Quarterly toggle (for IS, BS, CF tabs) */}
            {tab !== "ratios" && (
              <div className="flex items-center bg-[#F3F4F6] p-0.5 rounded border border-[#E5E7EB] text-[11px] font-semibold">
                {(["annual", "quarterly"] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    className={`px-3 py-1 rounded transition-colors ${
                      viewMode === m
                        ? "bg-white text-[#8C3B32] shadow-sm font-bold"
                        : "text-[#6B7280]"
                    }`}
                  >
                    {m === "annual" ? "Annual" : "Quarterly"}
                  </button>
                ))}
              </div>
            )}

            {/* Analysis mode (always available for IS, BS, CF in both annual & quarterly) */}
            {tab !== "ratios" && (
              <div className="flex items-center bg-[#F3F4F6] p-0.5 rounded border border-[#E5E7EB] text-[11px] font-semibold">
                {(
                  [
                    { id: "absolute", label: "Absolute" },
                    {
                      id: "common_size",
                      label:
                        tab === "bs"
                          ? "Common-Size % (Assets=100)"
                          : tab === "cf"
                          ? "Common-Size % (CFO=100)"
                          : "Common-Size % (Revenue=100)",
                    },
                    {
                      id: "horizontal",
                      label:
                        viewMode === "annual"
                          ? "Horizontal % (vs. first year)"
                          : "Horizontal % (vs. first quarter)",
                    },
                  ] as { id: AnalysisMode; label: string }[]
                ).map(m => (
                  <button
                    key={m.id}
                    onClick={() => setAnalysisMode(m.id)}
                    className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                      analysisMode === m.id
                        ? "bg-white text-[#8C3B32] shadow-sm font-bold"
                        : "text-[#6B7280]"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}

            {/* Sector template (shown on ratios tab) */}
            {tab === "ratios" && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#374151]">Sector Template:</span>
                <select
                  value={template}
                  onChange={e => setTemplate(e.target.value as SectorTemplate)}
                  className="px-2 py-1 text-[11px] bg-white border border-[#D1D5DB] rounded-[4px] outline-none font-semibold text-[#1A1A1A]"
                >
                  {Object.entries(SECTOR_TEMPLATES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
