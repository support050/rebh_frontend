export interface CompanyMeta {
  company_name: string
  symbol: string
  isin?: string
  sector?: string
  currency?: string
  rounding?: string
  status?: string
  report_end?: string
  source_files: string[]
}

export type PeriodType = 'Q' | 'H1' | '9M' | 'FY' | 'snapshot' | 'unknown'

export interface PeriodMeta {
  key: string
  start: string
  end: string
  period_type: PeriodType
}

export interface FinancialItem {
  label: string
  label_ar?: string | null
  is_header: boolean
  is_unmapped?: boolean
  values: Record<string, number | string | null>
}

/** Equity matrix items have nested values: period → component → number */
export interface EquityMatrixItem {
  label: string
  label_ar?: string | null
  is_header: boolean
  is_unmapped?: boolean
  values: Record<string, Record<string, number>>
}

export interface FinancialSection {
  periods: string[]
  period_meta?: PeriodMeta[]
  items: FinancialItem[]
  section_type?: 'equity_matrix' | null
  components?: string[]
}

export type SectionKey =
  | 'balance_sheet'
  | 'income_statement'
  | 'cash_flow'
  | 'other_comprehensive_income'
  | 'equity_changes'
  | 'filing_info'
  | 'auditors_report'
  | 'standardized_balance_sheet'
  | 'standardized_income_statement'
  | 'standardized_cash_flow'

export interface CompanyFinancials {
  meta: CompanyMeta
  sections: Record<string, FinancialSection>
}

export interface CompanyListItem {
  symbol: string
  company_name: string
  sector?: string
  report_end?: string
  periods_count: number
}

export interface KPI {
  label: string
  value: number | null
  prev_value: number | null
  period: string
  prev_period: string | null
  change_pct: number | null
}

export interface KpisResponse {
  symbol: string
  section: string
  kpis: KPI[]
}

export interface ChartDataset {
  label: string
  data: { period: string; value: number | null }[]
}

export interface ChartDataResponse {
  symbol: string
  section: string
  periods: string[]
  datasets: ChartDataset[]
}

export const SECTION_LABELS: Record<string, string> = {
  balance_sheet: 'Balance Sheet',
  income_statement: 'Income Statement',
  cash_flow: 'Cash Flow',
  equity_changes: 'Equity Changes',
  other_comprehensive_income: 'Other Comprehensive Income',
  filing_info: 'Filing Info',
  auditors_report: 'Auditors Report',
}

export const NAVIGABLE_SECTIONS: SectionKey[] = [
  'income_statement',
  'balance_sheet',
  'cash_flow',
  'equity_changes',
]

/** Sections that are point-in-time snapshots (balance sheet) vs flow-over-period */
export const SNAPSHOT_SECTIONS: Set<string> = new Set(['balance_sheet', 'filing_info', 'auditors_report'])

export type PeriodFilter = 'all' | 'Q' | 'ytd' | 'snapshot'

export const PERIOD_FILTER_LABELS: Record<PeriodFilter, string> = {
  all: 'All',
  Q: 'Quarterly',
  ytd: 'YTD',
  snapshot: 'Snapshot',
}
