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
import { filterItemsBySearch, getLabel } from './XbrlFinancialTable'
import { LedgerPanel, StampButton } from './Xbrlledgerchrome'

interface Props {
  items: EquityMatrixItem[]
  periods: string[]
  periodMeta?: PeriodMeta[]
  components: string[]
  loading?: boolean
  langMode?: LangMode
}

const TOTAL_FRAGS = ['total equity', 'total changes', 'equity balance']

const STICKY_COL =
  'sticky left-0 z-20 min-w-[320px] whitespace-normal break-words border-t border-[#E5E7EB] px-5 py-2.5 text-left font-sans leading-snug'

function isTotal(label: string) {
  return TOTAL_FRAGS.some((f) => label.toLowerCase().includes(f))
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

  useMemo(() => {
    if (filteredPeriods.length > 0 && !filteredPeriods.includes(selectedPeriod)) {
      setSelectedPeriod(filteredPeriods[filteredPeriods.length - 1])
    }
  }, [filteredPeriods, selectedPeriod])

  const filteredItems = useMemo(() => filterItemsBySearch(items, search), [items, search])

  if (loading) {
    return (
      <LedgerPanel className="p-6">
        <div className="mb-4 h-4 w-40 animate-pulse rounded-full bg-[#F3F4F6]" />
        <div className="h-[300px] w-full animate-pulse rounded-[3px] bg-[#F3F4F6]" />
      </LedgerPanel>
    )
  }

  return (
    <LedgerPanel>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
        <span className="font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-[#6B7280]">Equity Ledger</span>
        <input
          type="text"
          placeholder="Search line items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-56 rounded-[4px] border border-[#E5E7EB] bg-white px-4 font-sans text-[12px] text-[#1A1A1A] placeholder:text-[#9CA3AF] outline-none transition-colors focus:border-[#8C3B32]/50"
        />
        {availableFilters.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {availableFilters.map((f) => (
              <StampButton key={f} active={periodFilter === f} onClick={() => setPeriodFilter(f)} size="sm">
                {PERIOD_FILTER_LABELS[f]}
              </StampButton>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E5E7EB] px-5 py-3">
        <span className="mr-2 self-center font-sans text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Period</span>
        {filteredPeriods.map((p) => (
          <StampButton key={p} active={selectedPeriod === p} onClick={() => setSelectedPeriod(p)} size="sm">
            {periodLabel(p)}
          </StampButton>
        ))}
      </div>

      <div className="relative overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-30 min-w-[320px] border-b border-[#E5E7EB] bg-[#F9FAFB] px-5 py-3 text-left font-sans text-[11px] font-bold uppercase tracking-wide text-[#374151]">
                Line Item
              </th>
              {components.map((comp) => (
                <th
                  key={comp}
                  className="whitespace-nowrap border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-right font-sans text-[11px] font-bold uppercase tracking-wide text-[#374151]"
                >
                  {comp}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={components.length + 1} className="px-5 py-10 text-center font-sans italic text-[#6B7280]">
                  {search ? `No results for "${search}"` : 'No data available'}
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => {
                if (item.is_header) {
                  return (
                    <tr key={`${item.label}-${idx}`}>
                      <td className={clsx(STICKY_COL, 'bg-[#F3F4F6] text-[10px] font-bold uppercase tracking-wider text-[#374151]')}>
                        {getLabel(item.label, item.label_ar, langMode)}
                      </td>
                      {components.map((comp) => (
                        <td key={`${item.label}-${comp}`} className="border-t border-[#E5E7EB] bg-[#F3F4F6] px-4 py-2" />
                      ))}
                    </tr>
                  )
                }

                const periodValues = item.values?.[selectedPeriod] ?? {}
                const total = isTotal(item.label)

                return (
                  <tr key={`${item.label}-${idx}`} className="group">
                    <td
                      className={clsx(
                        STICKY_COL,
                        total ? 'bg-[#F9FAFB] font-bold text-[#1A1A1A]' : 'bg-white text-[#1A1A1A] group-hover:bg-[#F9FAFB]',
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
                            'num whitespace-nowrap border-t border-[#E5E7EB] px-4 py-2.5 text-right font-sans tabular-nums',
                            total ? 'bg-[#F9FAFB] font-bold text-[#1A1A1A]' : 'group-hover:bg-[#F9FAFB] text-[#1A1A1A]',
                            isNeg && !total && 'text-[#DC2626]',
                            v == null && 'text-[#9CA3AF]',
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
    </LedgerPanel>
  )
}
