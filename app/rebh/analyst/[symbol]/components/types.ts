import React from "react";

export type Tab = "is" | "bs" | "cf" | "ratios";
export type SectorTemplate = "industrial" | "bank" | "reit" | "consumer" | "telecom";
export type AnalysisMode = "absolute" | "common_size" | "horizontal";

export const FORMULAS: Record<string, { formula: string; source: string; note?: string }> = {
  roe: { formula: "Net Income ÷ Total Shareholders' Equity × 100", source: "Income Statement + Balance Sheet", note: "Return earned on shareholders' capital — higher is better (watch for elevated financial leverage)" },
  gm: { formula: "(Gross Profit ÷ Revenue) × 100", source: "Income Statement", note: "Gross margin — reveals pricing power and production efficiency" },
  nm: { formula: "(Net Income ÷ Revenue) × 100", source: "Income Statement", note: "Net margin — share of revenue left to shareholders after all expenses" },
  opm: { formula: "(Operating Profit ÷ Revenue) × 100", source: "Income Statement", note: "Operating margin — measures core operating profitability before interest and taxes" },
  pe: { formula: "Market Cap ÷ Trailing Twelve Months (TTM) Net Income", source: "Market Price + Income Statement", note: "Earnings multiple — lower implies better valuation (interpret with caution for loss-making companies)" },
  pb: { formula: "Market Cap ÷ Total Shareholders' Equity", source: "Market Price + Balance Sheet", note: "Book value multiple — P/B < 1 may signal undervaluation or structural weakness" },
  peg: { formula: "P/E ÷ Annual Net Income Growth Rate %", source: "Income Statement + Market Price", note: "Growth-adjusted multiple (Lynch) — PEG < 1 is a positive signal under Lynch's methodology" },
  current: { formula: "Current Assets ÷ Current Liabilities", source: "Balance Sheet", note: "Current ratio — above 1.5× is generally considered acceptable" },
  debt_eq: { formula: "Total Debt ÷ Total Shareholders' Equity", source: "Balance Sheet", note: "Financial leverage ratio — the higher it is, the greater the solvency risk" },
  cfo_nm: { formula: "(CFO ÷ Net Income) × 100", source: "Cash Flow Statement + Income Statement", note: "Earnings-to-cash conversion rate — CFO/NI > 100% is a healthy sign" },
  g_net: { formula: "((Latest Quarter Net Income ÷ Same Quarter Prior Year Net Income) − 1) × 100", source: "Quarterly data", note: "Year-over-year (YoY) net income growth" },
  g_rev: { formula: "((Latest Quarter Revenue ÷ Same Quarter Prior Year Revenue) − 1) × 100", source: "Quarterly data", note: "Year-over-year (YoY) revenue growth" },
};

export function classifyRatio(id: string, val: number | null): "green" | "amber" | "red" | "neutral" {
  if (val == null) return "neutral";
  switch (id) {
    case "roe": return val >= 15 ? "green" : val >= 8 ? "amber" : "red";
    case "gm": return val >= 40 ? "green" : val >= 20 ? "amber" : "red";
    case "nm": return val >= 15 ? "green" : val >= 5 ? "amber" : "red";
    case "opm": return val >= 15 ? "green" : val >= 5 ? "amber" : "red";
    case "pe": return val > 0 && val <= 20 ? "green" : val <= 35 ? "amber" : "red";
    case "pb": return val > 0 && val <= 2 ? "green" : val <= 4 ? "amber" : "red";
    case "peg": return val > 0 && val <= 1 ? "green" : val <= 2 ? "amber" : "red";
    case "current": return val >= 2 ? "green" : val >= 1 ? "amber" : "red";
    case "debt_eq": return val <= 0.5 ? "green" : val <= 1.5 ? "amber" : "red";
    case "cfo_nm": return val >= 100 ? "green" : val >= 60 ? "amber" : "red";
    case "g_net": return val >= 15 ? "green" : val >= 0 ? "amber" : "red";
    case "g_rev": return val >= 10 ? "green" : val >= 0 ? "amber" : "red";
    case "dso": return val <= 45 ? "green" : val <= 90 ? "amber" : "red";
    case "dio": return val <= 60 ? "green" : val <= 120 ? "amber" : "red";
    case "dpo": return val >= 30 && val <= 75 ? "green" : val < 30 ? "amber" : "red";
    case "ccc": return val <= 30 ? "green" : val <= 90 ? "amber" : "red";
    default: return "neutral";
  }
}

export const LIGHT_CSS: Record<string, string> = {
  green: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
  amber: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
  red: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  neutral: "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]",
};

export const LIGHT_DOT: Record<string, string> = {
  green: "bg-[#16A34A]",
  amber: "bg-[#D97706]",
  red: "bg-[#DC2626]",
  neutral: "bg-[#94A3B8]",
};

export const SECTOR_TEMPLATES: Record<SectorTemplate, { label: string; ratios: string[]; notes: string[] }> = {
  industrial: {
    label: "Industrials & Petrochemicals",
    ratios: ["gm", "opm", "nm", "roe", "current", "debt_eq", "g_rev", "g_net"],
    notes: [
      "The three margins (gross / operating / net) are the primary lens for industrial companies",
      "Debt-to-equity is sensitive — heavy industries tolerate higher leverage than retail",
      "Revenue growth is a leading indicator of market share expansion",
    ]
  },
  consumer: {
    label: "Consumer & Retail",
    ratios: ["gm", "opm", "nm", "roe", "cfo_nm", "g_rev", "current"],
    notes: [
      "Retail is characterized by fast capital turnover and thin net margins — focus on cash conversion (CFO/NI)",
      "High CFO/NI ensures accounting margins reflect real cash collections",
      "Inventory turnover and working capital management are critical success drivers",
    ]
  },
  telecom: {
    label: "Telecom & Technology",
    ratios: ["opm", "nm", "roe", "debt_eq", "cfo_nm", "g_rev", "pe"],
    notes: [
      "Telecom is infrastructure- and license-driven — operating (EBIT) margin stability matters more than gross margin",
      "High capital expenditure (CapEx) intensity requires ongoing monitoring of Free Cash Flow and leverage",
      "Subscriber metrics and organic revenue growth (YoY) lead accounting earnings",
    ]
  },
  bank: {
    label: "Banks & Financial Institutions",
    ratios: ["roe", "pb", "nm", "pe"],
    notes: [
      "Banks are not valued on traditional profit margins — ROE is the primary metric",
      "P/B < 1 for banks often reflects concerns about asset quality or capital adequacy",
      "The Current Ratio does not apply to banks — the Basel regulatory framework matters more",
      "A traditional Debt/Equity ratio is not available for banks — replaced by the Capital Adequacy Ratio (CAR)",
    ]
  },
  reit: {
    label: "REITs & Real Estate Developers",
    ratios: ["nm", "pb", "g_rev", "debt_eq"],
    notes: [
      "REITs are valued primarily on Dividend Yield rather than P/E",
      "Higher financial leverage is acceptable in REITs than in other industries",
      "REIT revenue growth reflects occupancy and rents — sub-sector tracking matters most",
    ]
  }
};

export function toCommonSize(arr: number[], baseArr: number[]): (number | null)[] {
  return arr.map((v, i) => {
    const b = baseArr[i];
    if (!b) return null;
    return +((v / Math.abs(b)) * 100).toFixed(1);
  });
}

export function toHorizontal(arr: number[]): (number | null)[] {
  const base = arr.find(v => v !== 0) ?? null;
  if (base === null) return arr.map(() => null);
  return arr.map(v => +(((v - base) / Math.abs(base)) * 100).toFixed(1));
}
