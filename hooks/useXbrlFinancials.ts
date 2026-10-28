'use client'

import { useEffect, useState } from 'react'

import { getChartData, getCompanies, getCompany, getKpis, getSection } from '@/lib/xbrl-api'
import type {
  ChartDataResponse,
  CompanyFinancials,
  CompanyListItem,
  FinancialSection,
  KpisResponse,
  SectionKey,
} from '@/types/xbrl-financials'

function useFetch<T>(fetcher: (() => Promise<T>) | null, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(Boolean(fetcher))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!fetcher) {
      setLoading(false)
      setError(null)
      return () => {
        cancelled = true
      }
    }
    setLoading(true)
    setError(null)
    fetcher()
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setLoading(false)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Unknown error')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}

export function useCompanies() {
  return useFetch<CompanyListItem[]>(() => getCompanies(), [])
}

export function useCompany(symbol: string | null) {
  return useFetch<CompanyFinancials>(symbol ? () => getCompany(symbol) : null, [symbol])
}

export function useKpis(symbol: string | null, section: SectionKey) {
  return useFetch<KpisResponse>(symbol ? () => getKpis(symbol, section) : null, [symbol, section])
}

export function useChartData(
  symbol: string | null,
  section: SectionKey,
  metrics: string[],
  periods: string[],
) {
  return useFetch<ChartDataResponse>(
    symbol ? () => getChartData(symbol, section, metrics, periods) : null,
    [symbol, section, JSON.stringify(metrics), JSON.stringify(periods)],
  )
}

export function useSectionData(symbol: string | null, section: SectionKey) {
  return useFetch<FinancialSection & { meta: CompanyFinancials['meta'] }>(
    symbol ? () => getSection(symbol, section) : null,
    [symbol, section],
  )
}

// useUpload() and the /api/upload/xbrl client chain were deleted 2026-10-29:
// zero callers, and the endpoint itself was retired as dead code.
