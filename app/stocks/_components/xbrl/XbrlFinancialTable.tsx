'use client'

import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'

import { fmtNum, periodLabel } from '@/lib/xbrl-format'
import type { FinancialItem, PeriodMeta, SectionKey } from '@/types/xbrl-financials'

import { type LangMode } from './XbrlCompanyDashboard'

interface Props {
  items: FinancialItem[]
  periods: string[]
  periodMeta?: PeriodMeta[]
  sectionKey?: SectionKey
  loading?: boolean
  langMode?: LangMode
}

const TOTAL_FRAGS = [
  'total assets',
  'total liabilities',
  'total equity',
  'total liabilities and equity',
  'total current assets',
  'total non-current assets',
  'total current liabilities',
  'total non-current liabilities',
  'gross profit',
  'operating profit',
  'profit for the period',
  'net profit',
  'total operating income',
  'total operating expenses',
  'net cash from operating',
  'net cash from investing',
  'net cash from financing',
  'net change in cash',
]

function isTotal(label: string) {
  const l = label.toLowerCase()
  return TOTAL_FRAGS.some((f) => l.includes(f))
}

function hasArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text)
}

export function getLabel(label: string, labelAr: string | null | undefined, langMode: LangMode = 'both'): string {
  const en = label
  const ar = labelAr || ''

  if (langMode === 'ar') return ar || en
  if (langMode === 'en') return en || ar

  if (ar && en) {
    return `${ar} | ${en}`
  }
  return ar || en
}

export function XbrlFinancialTable({ items, periods, periodMeta, sectionKey, loading, langMode = 'both' }: Props) {
  const [search, setSearch] = useState('')
  const [activePeriods, setActivePeriods] = useState<Set<string>>(new Set(periods.slice(-5)))

  useEffect(() => {
    setActivePeriods((prev) => {
      const next = new Set(periods.slice(-5))
      periods.forEach((p) => {
        if (prev.has(p)) next.add(p)
      })
      return next
    })
  }, [periods])

  const shownPeriods = useMemo(() => periods.filter((p) => activePeriods.has(p)), [periods, activePeriods])

  const filteredItems = useMemo(() => {
    // 1. Language Filter
    let langFiltered = items
    if (langMode === 'ar') {
      langFiltered = items.filter((item) => {
        // Show if it has explicit Arabic label, or if the main label contains Arabic characters
        return !!item.label_ar || hasArabic(item.label)
      })
    } else if (langMode === 'en') {
      langFiltered = items.filter((item) => {
        // Show only if it does NOT contain Arabic characters in the main label
        return !hasArabic(item.label)
      })
    }

    // 2. Search Filter
    if (!search.trim()) return langFiltered
    const q = search.toLowerCase()
    return langFiltered.filter((item) => {
      const labelMatch = item.label.toLowerCase().includes(q)
      const arMatch = item.label_ar ? item.label_ar.toLowerCase().includes(q) : false
      return item.is_header || labelMatch || arMatch
    })
  }, [items, search, langMode])

  function togglePeriod(period: string) {
    setActivePeriods((prev) => {
      const next = new Set(prev)
      if (next.has(period)) {
        if (next.size > 1) next.delete(period)
      } else {
        next.add(period)
      }
      return next
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-[0_4px_24px_rgba(17,24,39,0.05)] backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-4">
        <input
          type="text"
          placeholder="Search line items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-56 rounded-full border border-gray-200 bg-white/80 px-4 text-[12px] text-[#111827] placeholder:text-gray-400 outline-none transition-colors focus:border-[#4338CA]/40 focus:ring-2 focus:ring-[#4338CA]/10"
        />
        <div className="ml-auto flex flex-wrap gap-1.5">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => togglePeriod(p)}
              className={clsx(
                'rounded-full border px-3 py-1 text-[10px] font-semibold transition-colors',
                activePeriods.has(p)
                  ? 'border-indigo-200 bg-indigo-50 text-[#4338CA]'
                  : 'border-gray-200 bg-white/70 text-gray-400 hover:text-gray-600',
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr>
              <th className="min-w-[240px] px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Line Item
              </th>
              {shownPeriods.map((p) => (
                <th
                  key={p}
                  className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-400"
                >
                  {periodLabel(p)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={shownPeriods.length + 1} className="px-5 py-10 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={shownPeriods.length + 1} className="px-5 py-10 text-center text-gray-400">
                  No results for "{search}"
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => {
                const total = isTotal(item.label)

                // Check if this item has any actual values across all periods
                const hasValues = Object.values(item.values).some((v) => v !== null && v !== undefined && v !== '')

                if (item.is_header && !hasValues) {
                  return (
                    <tr key={`${item.label}-${idx}`} className="bg-gray-50/60">
                      <td
                        colSpan={shownPeriods.length + 1}
                        className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500"
                      >
                        {getLabel(item.label, item.label_ar, langMode)}
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr
                    key={`${item.label}-${idx}`}
                    className={clsx(
                      'border-t border-gray-100 transition-colors hover:bg-[#4338CA]/[0.03]',
                      (total || item.is_header) && 'bg-gray-50/50',
                    )}
                  >
                    <td
                      className={clsx(
                        'max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap px-5 py-2.5',
                        (total || item.is_header) ? 'font-semibold text-[#111827]' : 'text-gray-600',
                      )}
                      title={getLabel(item.label, item.label_ar, 'both')}
                    >
                      {getLabel(item.label, item.label_ar, langMode)}
                    </td>
                    {shownPeriods.map((p) => {
                      const v = item.values[p]
                      const isNum = typeof v === 'number'
                      const isNeg = isNum && v < 0
                      return (
                        <td
                          key={`${item.label}-${p}`}
                          className={clsx(
                            'px-4 py-2.5 tabular-nums min-w-[200px]',
                            isNum ? 'num whitespace-nowrap text-right' : 'whitespace-normal break-words text-left text-xs leading-relaxed max-w-lg',
                            (total || item.is_header) && 'font-semibold text-[#111827]',
                            isNeg && !total && !item.is_header && 'text-[#ef4444]',
                            !total && !item.is_header && !isNeg && isNum && 'text-gray-600',
                            v == null && 'text-gray-300',
                          )}
                        >
                          {v != null ? (isNum ? fmtNum(v as number) : String(v)) : '—'}
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