import React from "react";
import { SectorTemplate, SECTOR_TEMPLATES, FORMULAS } from "./types";
import { RatioCard } from "./RatioCard";
import {
  BookOpen, ChevronRight, TrendingUp, Activity,
  Layers, ShieldCheck, RefreshCw, BarChart3
} from "lucide-react";

interface FinancialRatiosTabProps {
  symbol: string;
  template: SectorTemplate;
  ratios: any;
  isBank?: boolean;
  data: any;
  showFormulas: boolean;
}

export function FinancialRatiosTab({
  symbol,
  template,
  ratios,
  isBank,
  data,
  showFormulas,
}: FinancialRatiosTabProps) {
  return (
    <div className="space-y-6">
      {/* Sector template notes */}
      <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-2">
        <h4 className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
          <BookOpen size={13} className="text-[#8C3B32]" />
          Template Notes — {SECTOR_TEMPLATES[template].label}
        </h4>
        <ul className="space-y-1">
          {SECTOR_TEMPLATES[template].notes.map((n, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-[#374151]">
              <ChevronRight size={11} className="shrink-0 mt-0.5 text-[#8C3B32]" />
              <span>{n}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Profitability */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
          <TrendingUp size={14} className="text-[#8C3B32]" />
          Profitability
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <RatioCard id="roe" label="Return on Equity (ROE)" value={ratios.roe} unit="%" percentile={ratios.pct?.roe} template={template} />
          <RatioCard id="nm" label="Net Profit Margin" value={ratios.nm} unit="%" percentile={ratios.pct?.nm} template={template} />
          <RatioCard id="gm" label="Gross Profit Margin" value={ratios.gm} unit="%" percentile={ratios.pct?.gm} template={template} />
          <RatioCard id="opm" label="Operating Margin (EBIT)" value={ratios.opm} unit="%" template={template} />
        </div>
      </div>

      {/* Growth */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
          <Activity size={14} className="text-[#8C3B32]" />
          Growth (YoY)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <RatioCard id="g_net" label="Net Income Growth (YoY)" value={ratios.g_net} unit="%" percentile={ratios.pct?.g_net} template={template} />
          <RatioCard id="g_rev" label="Revenue Growth (YoY)" value={ratios.g_rev} unit="%" percentile={ratios.pct?.g_rev} template={template} />
          <RatioCard id="peg" label="PEG Ratio" value={ratios.peg} unit="×" template={template} />
        </div>
      </div>

      {/* Valuation */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
          <Layers size={14} className="text-[#8C3B32]" />
          Valuation
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <RatioCard id="pe" label="Price / Earnings (P/E)" value={ratios.pe} unit="×" percentile={ratios.pct?.pe} template={template} />
          <RatioCard id="pb" label="Price / Book (P/B)" value={ratios.pb} unit="×" percentile={ratios.pct?.pb} template={template} />
        </div>
      </div>

      {/* Safety */}
      {!isBank && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
            <ShieldCheck size={14} className="text-[#8C3B32]" />
            Liquidity / Leverage
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <RatioCard id="current" label="Current Ratio" value={ratios.cur} unit="×" template={template} />
            <RatioCard id="debt_eq" label="Debt / Equity" value={ratios.de} unit="×" template={template} />
            <RatioCard id="cfo_nm" label="Earnings-to-Cash Conversion (CFO/NI)" value={ratios.cfo_nm} unit="%" template={template} />
          </div>
        </div>
      )}

      {/* Working Capital Efficiency */}
      {!isBank && (ratios.dso != null || ratios.dio != null || ratios.dpo != null) && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
            <RefreshCw size={14} className="text-[#8C3B32]" />
            Working Capital Efficiency
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ratios.dso != null && (
              <RatioCard id="dso" label="Days Sales Outstanding (DSO)" value={ratios.dso} unit="days" template={template} />
            )}
            {ratios.dio != null && (
              <RatioCard id="dio" label="Days Inventory Outstanding (DIO)" value={ratios.dio} unit="days" template={template} />
            )}
            {ratios.dpo != null && (
              <RatioCard id="dpo" label="Days Payables Outstanding (DPO)" value={ratios.dpo} unit="days" template={template} />
            )}
            {ratios.ccc != null && (
              <RatioCard id="ccc" label="Cash Conversion Cycle (CCC)" value={ratios.ccc} unit="days" template={template} />
            )}
          </div>
          <div className="text-[10.5px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] px-3 py-2 space-y-0.5">
            <div><span className="font-bold">Note:</span> These ratios appear only when inventory and payables data are available in XBRL</div>
            <div>DSO = (Receivables ÷ Revenue) × 365 | DIO = (Inventory ÷ COGS) × 365 | DPO = (Payables ÷ COGS) × 365 | CCC = DSO + DIO − DPO</div>
          </div>
        </div>
      )}

      {/* Formula reference table */}
      {showFormulas && (
        <div className="bg-white border border-[#E5E7EB] rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="bg-[#F3F4F6] border-b border-[#E5E7EB] px-4 py-2.5 flex items-center gap-2">
            <BookOpen size={13} className="text-[#8C3B32]" />
            <span className="text-xs font-bold text-[#374151]">Complete Formulas & Sources Reference</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="p-2.5 text-left font-bold text-[#475569]">Ratio</th>
                  <th className="p-2.5 text-left font-bold text-[#475569]">Formula</th>
                  <th className="p-2.5 text-left font-bold text-[#475569]">Source</th>
                  <th className="p-2.5 text-left font-bold text-[#475569]">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {Object.entries(FORMULAS).map(([id, f]) => (
                  <tr key={id} className="hover:bg-[#F8FAFC]">
                    <td className="p-2.5 font-mono font-bold text-[#8C3B32]">{id.toUpperCase()}</td>
                    <td className="p-2.5 font-mono text-[#1E293B]">{f.formula}</td>
                    <td className="p-2.5 text-[#64748B]">{f.source}</td>
                    <td className="p-2.5 text-[#64748B] max-w-[220px]">{f.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Peer comparison strip */}
      {data?.peers?.peers?.roe?.length > 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3">
          <h4 className="text-xs font-bold text-[#1A1A1A] flex items-center gap-2">
            <BarChart3 size={13} className="text-[#8C3B32]" />
            ROE vs. Sector Peers
            <span className="text-[10px] font-normal text-[#64748B]">({data.peers?.n_sec || 0} companies in sector)</span>
          </h4>
          <div className="space-y-1.5">
            {data.peers.peers.roe.slice(0, 8).map(([sym, peerName, roe]: [string, string, number]) => {
              const isCurrent = sym === symbol;
              const max = Math.max(...data.peers.peers.roe.map((r: any) => r[2]));
              const pct = max > 0 ? (roe / max) * 100 : 0;
              return (
                <div key={sym} className={`flex items-center gap-3 p-2 rounded-[4px] ${isCurrent ? "bg-[#FFF1EF] border border-[#FECACA]" : "hover:bg-[#F8FAFC]"}`}>
                  <span className={`font-mono text-[11px] font-bold w-12 shrink-0 ${isCurrent ? "text-[#8C3B32]" : "text-[#0F172A]"}`}>{sym}</span>
                  <span className="text-[11px] text-[#374151] w-32 shrink-0 truncate">{peerName}</span>
                  <div className="flex-1 bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${isCurrent ? "bg-[#8C3B32]" : "bg-[#94A3B8]"}`} style={{ width: `${Math.max(2, pct)}%` }} />
                  </div>
                  <span className={`font-mono text-[11px] font-bold w-14 text-right ${roe >= 15 ? "text-[#16A34A]" : roe >= 8 ? "text-[#D97706]" : "text-[#DC2626]"}`}>
                    {roe.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
