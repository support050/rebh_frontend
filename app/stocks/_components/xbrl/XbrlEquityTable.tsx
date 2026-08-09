'use client'

import clsx from 'clsx'
import { useMemo, useState } from 'react'

import { buildPeriodMap, filterPeriodsByType, fmtNum, periodLabel } from '@/lib/xbrl-format'
import {
  PERIOD_FILTER_LABELS,
  type EquityMatrixItem,
  type PeriodFilter,
  type PeriodMeta,
} from '@/types/xbrl-financials'

import { type LangMode } from './XbrlCompanyDashboard'
import { getLabel } from './XbrlFinancialTable'

interface Props {
  items: EquityMatrixItem[]
  periods: string[]
  periodMeta?: PeriodMeta[]
  components: string[]
  loading?: boolean
  langMode?: LangMode
}

const TOTAL_FRAGS = ['total equity', 'total changes', 'equity balance']

function isTotal(label: string) {
  const l = label.toLowerCase()
  return TOTAL_FRAGS.some((f) => l.includes(f))
}

export function XbrlEquityTable({ items, periods, periodMeta, components, loading, langMode = 'both' }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(periods[periods.length - 1] ?? '')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
  const [search, setSearch] = useState('')

  const periodMap = useMemo(() => buildPeriodMap(periods, periodMeta), [periods, periodMeta])

  const availableFilters = useMemo(() => {
    const types = new Set<string>()
    periodMap.forEach((m) => types.add(m.period_type))
    const filters: PeriodFilter[] = []
    if (types.has('Q')) filters.push('Q')
    if (types.has('H1') || types.has('9M') || types.has('FY')) filters.push('ytd')
    filters.push('all')
    return filters
  }, [periodMap])

  const filteredPeriods = useMemo(
    () => filterPeriodsByType(periods, periodMap, periodFilter),
    [periods, periodMap, periodFilter],
  )

  // Auto-select last period when filter changes
  useMemo(() => {
    if (filteredPeriods.length > 0 && !filteredPeriods.includes(selectedPeriod)) {
      setSelectedPeriod(filteredPeriods[filteredPeriods.length - 1])
    }
  }, [filteredPeriods, selectedPeriod])

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter((item) => {
      const labelMatch = item.label.toLowerCase().includes(q)
      const arMatch = item.label_ar ? item.label_ar.toLowerCase().includes(q) : false
      return item.is_header || labelMatch || arMatch
    })
  }, [items, search])

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/60 bg-white/60 p-6 backdrop-blur-md">
        <div className="mb-4 h-4 w-40 animate-pulse rounded-full bg-gray-200/70" />
        <div className="h-[300px] w-full animate-pulse rounded-xl bg-gray-200/70" />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-[0_4px_24px_rgba(17,24,39,0.05)] backdrop-blur-md">
      {/* Top Bar: Search + Period Type Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <input
          type="text"
          placeholder="Search line items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-56 rounded-full border border-gray-200 bg-white/80 px-4 text-[12px] text-[#111827] placeholder:text-gray-400 outline-none transition-colors focus:border-[#4338CA]/40 focus:ring-2 focus:ring-[#4338CA]/10"
        />
        {availableFilters.length > 1 && (
          <div className="flex overflow-hidden rounded-full border border-gray-200 bg-white/80 p-0.5">
            {availableFilters.map((f) => (
              <button
                key={f}
                onClick={() => setPeriodFilter(f)}
                className={clsx(
                  'rounded-full px-3.5 py-1 text-[11px] font-medium transition-colors',
                  periodFilter === f ? 'bg-[#4338CA] text-white shadow-sm' : 'text-gray-500 hover:text-[#111827]',
                )}
              >
                {PERIOD_FILTER_LABELS[f]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Period Selector Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 px-5 py-3">
        <span className="mr-2 self-center text-[10px] font-bold uppercase tracking-wider text-gray-400">Period</span>
        {filteredPeriods.map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPeriod(p)}
            className={clsx(
              'rounded-full border px-3 py-1 text-[10px] font-semibold transition-colors',
              selectedPeriod === p
                ? 'border-indigo-200 bg-indigo-50 text-[#4338CA]'
                : 'border-gray-200 bg-white/70 text-gray-400 hover:text-gray-600',
            )}
          >
            {periodLabel(p)}
          </button>
        ))}
      </div>

      {/* Pivot Table: rows=items, cols=components */}
      <div className="overflow-x-auto relative">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="border-b border-gray-150">
              <th className="sticky left-0 z-10 min-w-[240px] bg-white px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Line Item
              </th>
              {components.map((comp) => (
                <th
                  key={comp}
                  className="whitespace-nowrap bg-white px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-400"
                >
                  {comp}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={components.length + 1} className="px-5 py-10 text-center text-gray-400">
                  {search ? `No results for "${search}"` : 'No data available'}
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => {
                if (item.is_header) {
                  return (
                    <tr key={`${item.label}-${idx}`}>
                      <td
                        colSpan={components.length + 1}
                        className="bg-gray-50/60 px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500"
                      >
                        {getLabel(item.label, item.label_ar, langMode)}
                      </td>
                    </tr>
                  )
                }

                const periodValues = item.values?.[selectedPeriod] ?? {}
                const total = isTotal(item.label)

                return (
                  <tr
                    key={`${item.label}-${idx}`}
                    className={clsx(
                      'border-t border-gray-100 transition-colors hover:bg-[#4338CA]/[0.03]',
                      total && 'bg-gray-50/50',
                    )}
                  >
                    <td
                      className={clsx(
                        'sticky left-0 z-10 max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap bg-white/90 px-5 py-2.5 backdrop-blur-md',
                        total ? 'font-semibold text-[#111827]' : 'text-gray-600',
                      )}
                      title={getLabel(item.label, item.label_ar, 'both')}
                    >
                      {getLabel(item.label, item.label_ar, langMode)}
                    </td>
                    {components.map((comp) => {
                      const v = periodValues[comp] ?? null
                      const isNeg = typeof v === 'number' && v < 0
                      return (
                        <td
                          key={`${item.label}-${comp}`}
                          className={clsx(
                            'num whitespace-nowrap px-4 py-2.5 text-right tabular-nums',
                            total && 'font-semibold text-[#111827]',
                            isNeg && !total && 'text-[#ef4444]',
                            v == null && 'text-gray-300',
                          )}
                        >
                          {v != null ? fmtNum(v) : '—'}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}