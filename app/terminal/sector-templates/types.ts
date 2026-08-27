// Shared types for sector-templates page
export interface RowData {
  t?: "section" | "subtotal" | "total";
  ar: string;
  en?: string;
  v?: (number | null)[];
  accel?: boolean;
  est3?: boolean;
  eps?: boolean;
  prov?: boolean;
  opex?: boolean;
  net?: boolean;
  gross?: boolean;
  noDerive?: boolean;
}

export interface SensParams {
  deposits: number;   // total deposits / interest-bearing liabilities in thousands
  assets: number;     // total interest-earning assets in thousands
  betaDeposits: number;
  betaAssets: number;
  nimCurrent: number; // current NIM in percent
}

export interface CompanyTemplate {
  name: string;
  en: string;
  symbol: string;
  sector: string;
  tmpl: string;
  price: string;
  chg: string;
  real: boolean;
  verified?: boolean;
  hasSens?: boolean;
  chgDown?: boolean;
  periods: string[];
  periodsEn: string[];
  unit: string;
  kpis: {
    cmp: string;
    items: { name: string; short?: string; eps?: boolean; invert?: boolean }[];
  };
  ratios: { h: string; v: string; s: string; dir: "up" | "down" | "mut"; f: string }[];
  aux?: { ar: string; v: (number | null)[] }[];
  rows: RowData[];
  notes: { h: string; b: string }[];
  foot: string[];
  sensParams?: SensParams;
  stmts?: {
    bs?: { periods: string[]; periodsEn: string[]; cumulative?: boolean; rows: RowData[] };
    cf?: { periods: string[]; periodsEn: string[]; cumulative?: boolean; rows: RowData[] };
  };
}


export interface SectorPulse {
  s: string;
  up: number;
  dn: number;
  px: string;
  div: boolean;
}

export type CompanyKey = "bank" | "petro" | "gen" | "ins" | "fin" | "reit";

export interface StmtView {
  rows: RowData[];
  periods: string[];
  periodsEn: string[];
  cumulative: boolean;
}