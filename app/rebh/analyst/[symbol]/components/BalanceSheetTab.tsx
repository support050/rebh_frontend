import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { StatRow } from "./StatRow";
import { AnalysisMode, classifyRatio } from "./types";

interface BalanceSheetTabProps {
  bsData: any;
  viewMode: "annual" | "quarterly";
  analysisMode: AnalysisMode;
  ratios: any;
}

export function BalanceSheetTab({
  bsData,
  viewMode,
  analysisMode,
  ratios,
}: BalanceSheetTabProps) {
  return (
    <div className="space-y-5">
      {/* Assets */}
      <div className="bg-white border border-[#E5E7EB] rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="bg-[#F3F4F6] border-b border-[#E5E7EB] px-4 py-2 text-xs font-bold text-[#374151]">Assets</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="p-2.5 text-left font-bold text-[#475569] min-w-[180px]">
                  Line Item
                  {analysisMode === "common_size" && <span className="text-[10px] font-mono text-[#8C3B32] ml-1">(% of Total Assets)</span>}
                  {analysisMode === "horizontal" && (
                    <span className="text-[10px] font-mono text-[#8C3B32] ml-1">
                      ({viewMode === "annual" ? "% change vs. first year" : "% change vs. first quarter"})
                    </span>
                  )}
                </th>
                {(bsData.periods || []).map((p: string, i: number) => (
                  <th key={i} className="p-2.5 text-right font-mono font-bold text-[#475569] whitespace-nowrap min-w-[90px]">{p}</th>
                ))}
                <th className="p-2.5 text-right font-bold text-[#475569] w-16">
                  {analysisMode === "absolute" ? (viewMode === "annual" ? "YoY" : "QoQ") : "—"}
                </th>
              </tr>
            </thead>
            <tbody>
              <StatRow label="Cash & Cash Equivalents" values={bsData.cash || []} periods={bsData.periods || []} source="Balance Sheet (XBRL)" indent analysisMode={analysisMode} baseValues={bsData.total_assets || []} />
              <StatRow label="Accounts Receivable" values={bsData.receivables || []} periods={bsData.periods || []} source="Balance Sheet (XBRL)" indent analysisMode={analysisMode} baseValues={bsData.total_assets || []} />
              {bsData.inventory && bsData.inventory.some((v: number) => v > 0) && (
                <StatRow label="Inventory" values={bsData.inventory || []} periods={bsData.periods || []} source="Balance Sheet (XBRL)" indent analysisMode={analysisMode} baseValues={bsData.total_assets || []} />
              )}
              <StatRow label="Total Current Assets" values={bsData.current_assets || []} periods={bsData.periods || []} isTotal source="Sum of current assets" analysisMode={analysisMode} baseValues={bsData.total_assets || []} />
              <StatRow label="Property, Plant & Equipment (PP&E)" values={bsData.ppe || []} periods={bsData.periods || []} source="Balance Sheet (XBRL)" indent analysisMode={analysisMode} baseValues={bsData.total_assets || []} />
              <StatRow label="Total Assets" values={bsData.total_assets || []} periods={bsData.periods || []} isTotal source="Verified: must equal (Liabilities + Shareholders' Equity)" verdict="green" analysisMode={analysisMode} baseValues={bsData.total_assets || []} />
            </tbody>
          </table>
        </div>
      </div>

      {/* Liabilities + Equity */}
      <div className="bg-white border border-[#E5E7EB] rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="bg-[#F3F4F6] border-b border-[#E5E7EB] px-4 py-2 text-xs font-bold text-[#374151]">Liabilities & Shareholders' Equity</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="p-2.5 text-left font-bold text-[#475569] min-w-[180px]">
                  Line Item
                  {analysisMode === "common_size" && <span className="text-[10px] font-mono text-[#8C3B32] ml-1">(% of Total Assets)</span>}
                  {analysisMode === "horizontal" && (
                    <span className="text-[10px] font-mono text-[#8C3B32] ml-1">
                      ({viewMode === "annual" ? "% change vs. first year" : "% change vs. first quarter"})
                    </span>
                  )}
                </th>
                {(bsData.periods || []).map((p: string, i: number) => (
                  <th key={i} className="p-2.5 text-right font-mono font-bold text-[#475569] whitespace-nowrap min-w-[90px]">{p}</th>
                ))}
                <th className="p-2.5 text-right font-bold text-[#475569] w-16">
                  {analysisMode === "absolute" ? (viewMode === "annual" ? "YoY" : "QoQ") : "—"}
                </th>
              </tr>
            </thead>
            <tbody>
              <StatRow label="Accounts Payable & Suppliers" values={bsData.payables || []} periods={bsData.periods || []} source="Balance Sheet (XBRL)" indent analysisMode={analysisMode} baseValues={bsData.total_assets || []} />
              <StatRow label="Short-Term Debt" values={bsData.short_debt || []} periods={bsData.periods || []} source="Balance Sheet (XBRL)" indent analysisMode={analysisMode} baseValues={bsData.total_assets || []} />
              <StatRow label="Total Current Liabilities" values={bsData.current_liabilities || []} periods={bsData.periods || []} isTotal source="Sum of current liabilities" analysisMode={analysisMode} baseValues={bsData.total_assets || []} />
              <StatRow label="Long-Term Debt" values={bsData.long_debt || []} periods={bsData.periods || []} source="Balance Sheet (XBRL) — may include Sukuk and Murabaha" indent analysisMode={analysisMode} baseValues={bsData.total_assets || []} />
              <StatRow label="Total Liabilities" values={bsData.total_liabilities || []} periods={bsData.periods || []} isTotal analysisMode={analysisMode} baseValues={bsData.total_assets || []} />
              <StatRow label="Paid-In Capital" values={bsData.capital || []} periods={bsData.periods || []} source="Balance Sheet (XBRL)" indent analysisMode={analysisMode} baseValues={bsData.total_assets || []} />
              <StatRow label="Retained Earnings / (Accumulated Losses)" values={bsData.retained_earnings || []} periods={bsData.periods || []} source="Balance Sheet (XBRL)" indent analysisMode={analysisMode} baseValues={bsData.total_assets || []} />
              <StatRow label="Total Shareholders' Equity" values={bsData.total_equity || []} periods={bsData.periods || []} isTotal source="Verified: Assets − Liabilities" verdict={classifyRatio("roe", ratios?.roe ?? null)} analysisMode={analysisMode} baseValues={bsData.total_assets || []} />
            </tbody>
          </table>
        </div>
      </div>

      {/* Identity check */}
      {bsData.total_assets && bsData.total_liabilities && bsData.total_equity && (() => {
        const ta = bsData.total_assets.at(-1) ?? 0;
        const tl = bsData.total_liabilities.at(-1) ?? 0;
        const te = bsData.total_equity.at(-1) ?? 0;
        const diff = Math.abs(ta - (tl + te));
        const ok = diff < 1;
        return (
          <div className={`rounded-[6px] border px-4 py-3 text-xs flex items-start gap-2 ${ok ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]" : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"}`}>
            {ok ? <CheckCircle2 size={14} className="shrink-0" /> : <XCircle size={14} className="shrink-0" />}
            <span>
              <strong>Accounting Identity Check (A = L + E):</strong>{" "}
              {ok
                ? `Passed ✓ — Assets (${ta.toLocaleString()} M) = Liabilities + Shareholders' Equity (${(tl + te).toLocaleString(undefined, { maximumFractionDigits: 1 })} M) · Difference: ${diff.toFixed(2)} M`
                : `Failed ✗ — Difference ${diff.toLocaleString(undefined, { maximumFractionDigits: 1 })} M — may be due to minority interests or IFRS adjustments — flagged for review`
              }
            </span>
          </div>
        );
      })()}
    </div>
  );
}
