'use client'

import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'

import { fmtNum, periodLabel } from '@/lib/xbrl-format'
import type { FinancialItem, PeriodMeta, SectionKey } from '@/types/xbrl-financials'

import { type LangMode } from './XbrlCompanyDashboard'
import { LedgerPanel, StampButton } from './Xbrlledgerchrome'

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

const STICKY_COL =
  'sticky left-0 z-20 min-w-[320px] whitespace-normal break-words border-t border-[#E5E7EB] px-5 py-2.5 text-left font-sans leading-snug'

function isTotal(label: string) {
  return TOTAL_FRAGS.some((f) => label.toLowerCase().includes(f))
}

function hasArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text)
}

function matchesSearch(label: string, labelAr: string | null | undefined, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  if (label.toLowerCase().includes(q)) return true
  return !!labelAr && labelAr.toLowerCase().includes(q)
}

/** Keep matching rows + their section headers when searching (EN + AR labels). */
export function filterItemsBySearch<T extends { is_header?: boolean; label: string; label_ar?: string | null }>(
  items: T[],
  query: string,
): T[] {
  if (!query.trim()) return items

  const matches = items.map((item) => matchesSearch(item.label, item.label_ar, query))
  const keep = new Array(items.length).fill(false)

  for (let i = 0; i < items.length; i++) {
    if (!items[i].is_header && matches[i]) keep[i] = true
  }

  for (let i = 0; i < items.length; i++) {
    if (!items[i].is_header) continue
    if (matches[i]) {
      keep[i] = true
      continue
    }
    for (let j = i + 1; j < items.length; j++) {
      if (items[j].is_header) break
      if (keep[j]) {
        keep[i] = true
        break
      }
    }
  }

  return items.filter((_, i) => keep[i])
}

export function getLabel(label: string, labelAr: string | null | undefined, langMode: LangMode = 'both'): string {
  const en = label
  const ar = labelAr || ''

  if (langMode === 'ar') return ar || en
  if (langMode === 'en') return en || ar
  if (ar && en) return `${ar} | ${en}`
  return ar || en
}

export function XbrlFinancialTable({ items, periods, loading, langMode = 'both' }: Props) {
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
    let list = items
    if (langMode === 'ar') {
      list = items.filter((item) => item.is_header || !!item.label_ar || hasArabic(item.label))
    } else if (langMode === 'en') {
      list = items.filter((item) => item.is_header || !hasArabic(item.label))
    }
    return filterItemsBySearch(list, search)
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
    <LedgerPanel>
      <div className="flex flex-wrap items-center gap-3 border-b border-[#E5E7EB] px-5 py-4">
        <span className="font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-[#6B7280]">Ledger Sheet</span>
        <input
          type="text"
          placeholder="Search line items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-56 rounded-[4px] border border-[#E5E7EB] bg-white px-4 font-sans text-[12px] text-[#1A1A1A] placeholder:text-[#9CA3AF] outline-none transition-colors focus:border-[#8C3B32]/50"
        />
        <div className="ml-auto flex flex-wrap gap-1.5">
          {periods.map((p) => (
            <StampButton key={p} active={activePeriods.has(p)} onClick={() => togglePeriod(p)} size="sm">
              {p}
            </StampButton>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-30 min-w-[320px] border-b border-[#E5E7EB] bg-[#F9FAFB] px-5 py-3 text-left font-sans text-[11px] font-bold uppercase tracking-wide text-[#374151]">
                Line Item
              </th>
              {shownPeriods.map((p) => (
                <th
                  key={p}
                  className="whitespace-nowrap border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-right font-sans text-[11px] font-bold uppercase tracking-wide text-[#374151]"
                >
                  {periodLabel(p)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={shownPeriods.length + 1} className="px-5 py-10 text-center font-sans italic text-[#6B7280]">
                  Loading ledger…
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={shownPeriods.length + 1} className="px-5 py-10 text-center font-sans italic text-[#6B7280]">
                  No results for "{search}"
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => {
                const hasValues = Object.values(item.values).some((v) => v != null && v !== '')
                const sectionHeader = Boolean(item.is_header && !hasValues)
                const band = sectionHeader || isTotal(item.label) || Boolean(item.is_header)

                return (
                  <tr key={`${item.label}-${idx}`} className="group">
                    <td
                      className={clsx(
                        STICKY_COL,
                        sectionHeader && 'bg-[#F3F4F6] text-[10px] font-bold uppercase tracking-wider text-[#374151]',
                        !sectionHeader && band && 'bg-[#F9FAFB] font-bold text-[#1A1A1A]',
                        !sectionHeader && !band && 'bg-white text-[#1A1A1A] group-hover:bg-[#F9FAFB]',
                      )}
                      title={getLabel(item.label, item.label_ar, 'both')}
                    >
                      {getLabel(item.label, item.label_ar, langMode)}
                    </td>
                    {shownPeriods.map((p) => {
                      if (sectionHeader) {
                        return <td key={`${item.label}-${p}`} className="border-t border-[#E5E7EB] bg-[#F3F4F6] px-4 py-2.5" />
                      }

                      const v = item.values[p]
                      const isNum = typeof v === 'number'
                      const isNeg = isNum && v < 0
                      return (
                        <td
                          key={`${item.label}-${p}`}
                          className={clsx(
                            'min-w-[200px] border-t border-[#E5E7EB] px-4 py-2.5 font-sans tabular-nums',
                            band ? 'bg-[#F9FAFB] font-bold text-[#1A1A1A]' : 'group-hover:bg-[#F9FAFB]',
                            isNum ? 'num whitespace-nowrap text-right' : 'max-w-lg whitespace-normal break-words text-left text-xs leading-relaxed',
                            isNeg && !band && 'text-[#DC2626]',
                            !band && !isNeg && isNum && 'text-[#1A1A1A]',
                            v == null && 'text-[#9CA3AF]',
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
    </LedgerPanel>
  )
}
