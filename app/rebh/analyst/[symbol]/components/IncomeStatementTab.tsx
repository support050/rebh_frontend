import React from "react";
import { useRouter } from "next/navigation";
import { Info, Activity } from "lucide-react";
import { StatRow } from "./StatRow";
import { AnalysisMode, classifyRatio } from "./types";

interface IncomeStatementTabProps {
  symbol: string;
  isData: any;
  quartersData: any;
  viewMode: "annual" | "quarterly";
  analysisMode: AnalysisMode;
  ratios: any;
  isBank?: boolean;
}

export function IncomeStatementTab({
  symbol,
  isData,
  quartersData,
  viewMode,
  analysisMode,
  ratios,
  isBank,
}: IncomeStatementTabProps) {
  const router = useRouter();
  const isTTM = isData.ttm || {};

  return (
    <div className="space-y-5">
      {/* Audit note */}
      <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[6px] px-4 py-3 text-xs text-[#92400E] flex items-start gap-2">
        <Info size={13} className="shrink-0 mt-0.5 text-[#D97706]" />
        <span>
          Data automatically extracted from XBRL filings published on Tadawul · Display unit: SAR millions · Negative figures denote expenses
          {isBank && " · Banks use different income line items — the first column reflects Net Interest Margin (NIM)"}
        </span>
      </div>

      {/* IS Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="p-2.5 text-left font-bold text-[#475569] min-w-[180px]">
                  Line Item
                  {analysisMode === "common_size" && <span className="text-[10px] font-mono text-[#8C3B32] ml-1">(% of Revenue)</span>}
                  {analysisMode === "horizontal" && (
                    <span className="text-[10px] font-mono text-[#8C3B32] ml-1">
                      ({viewMode === "annual" ? "% change vs. first year" : "% change vs. first quarter"})
                    </span>
                  )}
                </th>
                {(viewMode === "annual" ? isData.periods || [] : quartersData?.periods || []).map((p: string, i: number) => (
                  <th key={i} className="p-2.5 text-right font-mono font-bold text-[#475569] whitespace-nowrap min-w-[90px]">{p}</th>
                ))}
                {/* TTM header: always shown in annual mode */}
                {viewMode === "annual" && (
                  <th className="p-2.5 text-right font-mono font-bold text-[#D97706] whitespace-nowrap bg-[#FFF8EE]">
                    TTM {analysisMode !== "absolute" && <span className="text-[9px] text-[#D97706]/70">%</span>}
                  </th>
                )}
                {/* YoY / QoQ change column — only in absolute mode */}
                {analysisMode === "absolute" && (
                  <th className="p-2.5 text-right font-bold text-[#475569] w-16">
                    {viewMode === "annual" ? "YoY" : "QoQ"}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {viewMode === "annual" ? (
                <>
                  <StatRow label="Revenue / Sales" values={isData.rev || []} periods={isData.periods || []} source="Income Statement (XBRL)" verdict={classifyRatio("g_rev", ratios?.g_rev ?? null)} isTotal analysisMode={analysisMode} baseValues={isData.rev || []} ttmValue={isTTM.rev ?? null} onClick={() => router.push(`/rebh/studio/${symbol}?preset=revenue_margin_health`)} />
                  <StatRow label="Cost of Goods Sold (COGS)" values={isData.cogs || []} periods={isData.periods || []} source="Income Statement" indent analysisMode={analysisMode} baseValues={isData.rev || []} />
                  <StatRow label="Gross Profit" values={isData.gp || []} periods={isData.periods || []} source="Revenue − COGS" verdict="green" isTotal analysisMode={analysisMode} baseValues={isData.rev || []} ttmValue={isTTM.gp ?? null} />
                  <StatRow label="General & Administrative Expenses" values={isData.ga || []} periods={isData.periods || []} source="Income Statement (XBRL)" indent analysisMode={analysisMode} baseValues={isData.rev || []} />
                  <StatRow label="Operating Profit (EBIT)" values={isData.op || []} periods={isData.periods || []} source="Gross Profit − Operating Expenses" isTotal analysisMode={analysisMode} baseValues={isData.rev || []} onClick={() => router.push(`/rebh/studio/${symbol}?preset=profitability_divergence`)} />
                  <StatRow label="Finance Costs & Interest" values={isData.fin_cost || []} periods={isData.periods || []} source="Income Statement (XBRL)" indent analysisMode={analysisMode} baseValues={isData.rev || []} />
                  <StatRow label="Share of Associates & Joint Ventures" values={isData.jv || []} periods={isData.periods || []} source="Income Statement (XBRL)" indent analysisMode={analysisMode} baseValues={isData.rev || []} />
                  <StatRow label="Other Income (Expense)" values={isData.other_inc || []} periods={isData.periods || []} source="Income Statement (XBRL)" indent analysisMode={analysisMode} baseValues={isData.rev || []} />
                  <StatRow label="Profit Before Zakat & Tax (PBT)" values={isData.pbt || []} periods={isData.periods || []} source="Derived — pre-zakat" isTotal analysisMode={analysisMode} baseValues={isData.rev || []} />
                  <StatRow label="Zakat & Income Tax Expense" values={isData.zakat || []} periods={isData.periods || []} source="Income Statement (XBRL)" indent analysisMode={analysisMode} baseValues={isData.rev || []} />
                  <StatRow label="Net Income" values={isData.net || []} periods={isData.periods || []} source="PBT − Zakat & Tax" verdict={classifyRatio("nm", ratios?.nm ?? null)} isTotal analysisMode={analysisMode} baseValues={isData.rev || []} ttmValue={isTTM.net ?? null} onClick={() => router.push(`/rebh/studio/${symbol}?preset=profitability_divergence`)} />
                  <StatRow label="Earnings per Share (EPS)" values={isData.eps || []} periods={isData.periods || []} source="Net Income ÷ Shares Outstanding" unit="SAR" ttmValue={isTTM.eps ?? null} />
                </>
              ) : (
                <>
                  <StatRow label="Quarterly Revenue" values={quartersData?.rev || []} periods={quartersData?.periods || []} isTotal analysisMode={analysisMode} baseValues={quartersData?.rev || []} />
                  <StatRow label="Quarterly Gross Profit" values={quartersData?.gp || []} periods={quartersData?.periods || []} analysisMode={analysisMode} baseValues={quartersData?.rev || []} />
                  <StatRow label="Quarterly Operating Profit" values={quartersData?.op || []} periods={quartersData?.periods || []} analysisMode={analysisMode} baseValues={quartersData?.rev || []} />
                  <StatRow label="Quarterly Net Income" values={quartersData?.net || []} periods={quartersData?.periods || []} isTotal analysisMode={analysisMode} baseValues={quartersData?.rev || []} />
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TTM Summary */}
      {viewMode === "annual" && isTTM.rev > 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <h4 className="text-xs font-bold text-[#1A1A1A] mb-3 flex items-center gap-2">
            <Activity size={13} className="text-[#8C3B32]" />
            TTM Performance Summary (Trailing 12 Months)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "TTM Revenue", val: isTTM.rev, unit: "M SAR" },
              { label: "TTM Gross Profit", val: isTTM.gp, unit: "M SAR" },
              { label: "TTM Net Income", val: isTTM.net, unit: "M SAR" },
              { label: "TTM EPS", val: isTTM.eps, unit: "SAR" },
            ].map((m, i) => (
              <div key={i} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] p-2.5">
                <div className="text-[10px] text-[#64748B]">{m.label}</div>
                <div className="text-sm font-bold font-mono text-[#0F172A] mt-0.5">
                  {m.val != null ? m.val.toLocaleString() : "—"}{" "}
                  <span className="text-[10px] font-normal text-[#64748B]">{m.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
