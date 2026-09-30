import React from "react";
import { useRouter } from "next/navigation";
import { Info, Activity } from "lucide-react";
import { StatRow } from "./StatRow";
import { AnalysisMode, classifyRatio, LIGHT_CSS } from "./types";

interface CashFlowTabProps {
  symbol: string;
  cfData: any;
  viewMode: "annual" | "quarterly";
  analysisMode: AnalysisMode;
  ratios: any;
}

export function CashFlowTab({
  symbol,
  cfData,
  viewMode,
  analysisMode,
  ratios,
}: CashFlowTabProps) {
  const router = useRouter();

  return (
    <div className="space-y-5">
      <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[6px] px-4 py-3 text-xs text-[#92400E] flex items-start gap-2">
        <Info size={13} className="shrink-0 mt-0.5 text-[#D97706]" />
        <span>
          Cash Flow Statement: CFO = Operating Activities · CFI = Investing Activities · CFF = Financing Activities
          · <strong>Check:</strong> CFO + CFI + CFF = Net Change in Cash
          · FCF = CFO − |CapEx|
        </span>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="p-2.5 text-left font-bold text-[#475569] min-w-[200px]">
                  Line Item
                  {analysisMode === "common_size" && <span className="text-[10px] font-mono text-[#8C3B32] ml-1">(% of CFO)</span>}
                  {analysisMode === "horizontal" && (
                    <span className="text-[10px] font-mono text-[#8C3B32] ml-1">
                      ({viewMode === "annual" ? "% change vs. first year" : "% change vs. first quarter"})
                    </span>
                  )}
                </th>
                {(cfData.periods || []).map((p: string, i: number) => (
                  <th key={i} className="p-2.5 text-right font-mono font-bold text-[#475569] whitespace-nowrap min-w-[90px]">{p}</th>
                ))}
                <th className="p-2.5 text-right font-bold text-[#475569] w-16">
                  {analysisMode === "absolute" ? (viewMode === "annual" ? "YoY" : "QoQ") : "—"}
                </th>
              </tr>
            </thead>
            <tbody>
              <StatRow label="Operating Cash Flow (CFO)" values={cfData.cfo || []} periods={cfData.periods || []} isTotal source="Cash Flow Statement (XBRL)" verdict={classifyRatio("cfo_nm", ratios?.cfo_nm ?? null)} onClick={() => router.push(`/rebh/studio/${symbol}?preset=profitability_divergence`)} analysisMode={analysisMode} baseValues={cfData.cfo || []} />
              <StatRow label="Change in Working Capital" values={cfData.inventory || []} periods={cfData.periods || []} indent source="Cash Flow Statement (XBRL)" analysisMode={analysisMode} baseValues={cfData.cfo || []} />
              <StatRow label="Interest Paid" values={cfData.finance_paid || []} periods={cfData.periods || []} indent source="Cash Flow Statement (XBRL)" analysisMode={analysisMode} baseValues={cfData.cfo || []} />
              <StatRow label="Capital Expenditures (CapEx)" values={cfData.capex || []} periods={cfData.periods || []} isTotal source="Investing Activities (XBRL)" onClick={() => router.push(`/rebh/studio/${symbol}?preset=fcf_conversion`)} analysisMode={analysisMode} baseValues={cfData.cfo || []} />
              <StatRow label="Investing Cash Flow (CFI)" values={cfData.cfi || []} periods={cfData.periods || []} source="Cash Flow Statement (XBRL)" analysisMode={analysisMode} baseValues={cfData.cfo || []} />
              <StatRow label="Net Borrowings & Refinancing" values={cfData.borrowings || []} periods={cfData.periods || []} indent source="Financing Activities (XBRL)" analysisMode={analysisMode} baseValues={cfData.cfo || []} />
              <StatRow label="Financing Cash Flow (CFF)" values={cfData.cff || []} periods={cfData.periods || []} source="Cash Flow Statement (XBRL)" analysisMode={analysisMode} baseValues={cfData.cfo || []} />
              <StatRow label="Free Cash Flow (FCF = CFO − CapEx)" values={cfData.fcf || []} periods={cfData.periods || []} isTotal source="Computed: CFO − abs(CapEx)" verdict={classifyRatio("cfo_nm", ratios?.cfo_nm ?? null)} onClick={() => router.push(`/rebh/studio/${symbol}?preset=fcf_conversion`)} analysisMode={analysisMode} baseValues={cfData.cfo || []} />
              <StatRow label="Net Change in Cash" values={cfData.net_change || []} periods={cfData.periods || []} isTotal source="CFO + CFI + CFF" analysisMode={analysisMode} baseValues={cfData.cfo || []} />
            </tbody>
          </table>
        </div>
      </div>

      {/* CFO/NI check */}
      {ratios?.cfo_nm != null && (
        <div className={`rounded-[6px] border px-4 py-3 text-xs flex items-start gap-2 ${LIGHT_CSS[classifyRatio("cfo_nm", ratios.cfo_nm)]}`}>
          <Activity size={14} className="shrink-0 mt-0.5" />
          <span>
            <strong>Earnings-to-Cash Conversion Check (CFO/NI):</strong>{" "}
            CFO/NI = {ratios.cfo_nm.toFixed(1)}%
            {ratios.cfo_nm >= 100
              ? " ✓ — Accounting earnings are fully backed by real cash flow"
              : ratios.cfo_nm >= 60
                ? " ◑ — Partial conversion — review changes in working capital"
                : " ✗ — Large gap between earnings and cash — check receivables and inventory"}
          </span>
        </div>
      )}
    </div>
  );
}
