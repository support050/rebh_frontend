import { API_BASE_URL } from '@/lib/api/config'
import type {
  ChartDataResponse,
  CompanyFinancials,
  CompanyListItem,
  KpisResponse,
  FinancialSection,
  CompanyMeta,
} from '@/types/xbrl-financials'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { cache: 'no-store' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'API error')
  }
  return res.json()
}

export const getCompanies = (): Promise<CompanyListItem[]> => apiFetch('/api/companies/')

export const getCompany = (symbol: string): Promise<CompanyFinancials> =>
  apiFetch(`/api/companies/${symbol}`)

export const getCompanySections = (symbol: string): Promise<{ sections: string[] }> =>
  apiFetch(`/api/companies/${symbol}/sections`)

export const getSection = (
  symbol: string,
  section: string,
): Promise<FinancialSection & { meta: CompanyMeta }> =>
  apiFetch(`/api/companies/${symbol}/sections/${section}`)

export const getKpis = (symbol: string, section: string): Promise<KpisResponse> =>
  apiFetch(`/api/financials/${symbol}/kpis?section=${section}`)

export const getChartData = (
  symbol: string,
  section: string,
  metrics: string[],
  periods: string[],
): Promise<ChartDataResponse> => {
  const params = new URLSearchParams({ section })
  metrics.forEach((m) => params.append('metrics', m))
  periods.forEach((p) => params.append('periods', p))
  return apiFetch(`/api/financials/${symbol}/chart-data?${params}`)
}

export const getSummary = (symbol: string) => apiFetch(`/api/financials/${symbol}/summary`)

export const getSignals = (symbol: string): Promise<{ symbol: string; company_name?: string; signals: Array<{ type: string; neg: boolean; rule: string; text: string }> }> =>
  apiFetch(`/api/companies/${symbol}/signals`)

export const getTrustBadge = (symbol: string): Promise<{ symbol: string; verified: boolean; badge_label: string; badge_status: string; pass_rate_pct: number; latest_period?: string }> =>
  apiFetch(`/api/companies/${symbol}/trust-badge`)

export const getValuationModels = (symbol: string): Promise<{ symbol: string; company_name?: string; models: any }> =>
  apiFetch(`/api/companies/${symbol}/models`)

export async function uploadXbrlFiles(files: File[]) {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  const res = await fetch(`${API_BASE_URL}/api/upload/xbrl`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Upload failed')
  }
  return res.json()
}
