'use client'

import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { fmtAxisNum, fmtNum, periodLabel } from '@/lib/xbrl-format'
import type { FinancialItem, PeriodMeta } from '@/types/xbrl-financials'

// Primary accent first, then the status palette (info / positive / neutral / negative),
// plus two extra hues for decks that need more than four series.
const COLORS = ['#8C3B32', '#2563EB', '#16A34A', '#D97706', '#DC2626', '#7C3AED']

const DEFAULT_METRICS: Record<string, string[]> = {
  balance_sheet: ['total assets', 'total equity', 'total liabilities'],
  income_statement: ['total operating income', 'profit (loss) for the period', 'total operating expenses'],
  cash_flow: ['net cash from operating', 'net cash from investing', 'net cash from financing'],
}

import { type LangMode } from './XbrlCompanyDashboard'
import { getLabel } from './XbrlFinancialTable'
import { LedgerPanel, StampButton } from './Xbrlledgerchrome'

interface Props {
  items: FinancialItem[]
  periods: string[]
  periodMeta?: PeriodMeta[]
  sectionKey: string
  loading?: boolean
  langMode?: LangMode
}

function findItem(items: FinancialItem[], frag: string): FinancialItem | undefined {
  return items.find((i) => !i.is_header && !(i as any).is_unmapped && i.label.toLowerCase().includes(frag.toLowerCase()))
}

export function XbrlFinancialChart({ items, periods, periodMeta, sectionKey, loading, langMode = 'both' }: Props) {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar')

  const cleanKey = useMemo(() => sectionKey.replace('standardized_', ''), [sectionKey])
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(new Set(DEFAULT_METRICS[cleanKey] ?? []))

  useEffect(() => {
    setActiveMetrics(new Set(DEFAULT_METRICS[cleanKey] ?? []))
  }, [cleanKey])

  // Chartable items MUST NOT be unmapped (to keep standard charts clean)
  const chartableItems = useMemo(
    () => items.filter((i) => !i.is_header && !(i as any).is_unmapped && Object.values(i.values).some((v) => typeof v === 'number')),
    [items],
  )

  const selectedItems = useMemo(() => {
    const result: FinancialItem[] = []
    const defaults = DEFAULT_METRICS[cleanKey] ?? []

    activeMetrics.forEach((frag) => {
      const item = findItem(items, frag)
      if (item) result.push(item)
    })
    if (result.length === 0) {
      defaults.forEach((frag) => {
        const item = findItem(items, frag)
        if (item) result.push(item)
      })
    }
    // Fallback: If still empty, choose first 3 chartable items!
    if (result.length === 0 && chartableItems.length > 0) {
      return chartableItems.slice(0, 3)
    }
    return result
  }, [items, activeMetrics, cleanKey, chartableItems])

  const chartData = useMemo(
    () =>
      periods.map((p) => {
        const row: Record<string, string | number | null> = { period: periodLabel(p) }
        selectedItems.forEach((item) => {
          const v = item.values[p]
          const mappedLabel = getLabel(item.label, item.label_ar, langMode)
          row[mappedLabel] = typeof v === 'number' ? v : null
        })
        return row
      }),
    [periods, selectedItems, langMode],
  )

  function toggleMetric(label: string) {
    const frag = label.toLowerCase().slice(0, 40)
    setActiveMetrics((prev) => {
      const next = new Set(prev)
      const existing = [...next].find(
        (m) => label.toLowerCase().includes(m) || m.includes(label.toLowerCase().slice(0, 20)),
      )
      if (existing) {
        next.delete(existing)
      } else {
        if (next.size >= 4) {
          const first = next.values().next().value
          if (first) next.delete(first)
        }
        next.add(frag)
      }
      return next
    })
  }

  function isActive(label: string) {
    return [...activeMetrics].some(
      (m) => label.toLowerCase().includes(m) || m.includes(label.toLowerCase().slice(0, 20)),
    )
  }

  if (loading) {
    return (
      <LedgerPanel className="p-6">
        <div className="mb-4 h-4 w-40 animate-pulse rounded-full bg-[#F3F4F6]" />
        <div className="h-[240px] w-full animate-pulse rounded-[4px] bg-[#F3F4F6]" />
      </LedgerPanel>
    )
  }

  return (
    <LedgerPanel className="p-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="font-sans text-[13px] font-bold uppercase tracking-[0.08em] text-[#1A1A1A]">Trend Chart</span>
        <div className="flex gap-1.5">
          {(['bar', 'line'] as const).map((t) => (
            <StampButton key={t} active={chartType === t} onClick={() => setChartType(t)} size="sm">
              {t}
            </StampButton>
          ))}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {chartableItems.slice(0, 18).map((item) => {
          const displayLabel = getLabel(item.label, item.label_ar, langMode)
          return (
            <button
              key={item.label}
              onClick={() => toggleMetric(item.label)}
              className={clsx(
                'whitespace-nowrap rounded-[4px] border px-2.5 py-1 font-sans text-[10px] font-medium transition-colors',
                isActive(item.label)
                  ? 'border-[#E5E7EB] bg-white text-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                  : 'border-[#E5E7EB] bg-[#F3F4F6] text-[#6B7280] hover:text-[#1A1A1A]',
              )}
            >
              {displayLabel.length > 32 ? `${displayLabel.slice(0, 30)}...` : displayLabel}
            </button>
          )
        })}
      </div>

      <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-2">
        <ResponsiveContainer width="100%" height={260}>
          {chartType === 'bar' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Inter, Tajawal, sans-serif' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Inter, Tajawal, sans-serif' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => fmtAxisNum(v)}
                width={56}
              />
              <Tooltip
                contentStyle={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: 4,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: 12,
                  fontFamily: 'Inter, Tajawal, sans-serif',
                  color: '#1A1A1A',
                }}
                cursor={{ fill: 'rgba(140,59,50,0.04)' }}
              />
              {selectedItems.map((item, i) => {
                const mappedLabel = getLabel(item.label, item.label_ar, langMode)
                return (
                  <Bar key={item.label} dataKey={mappedLabel} fill={COLORS[i % COLORS.length]} radius={[2, 2, 0, 0]} fillOpacity={0.9} />
                )
              })}
            </BarChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Inter, Tajawal, sans-serif' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Inter, Tajawal, sans-serif' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => fmtAxisNum(v)}
                width={56}
              />
              <Tooltip
                contentStyle={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: 4,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: 12,
                  fontFamily: 'Inter, Tajawal, sans-serif',
                  color: '#1A1A1A',
                }}
              />
              {selectedItems.map((item, i) => {
                const mappedLabel = getLabel(item.label, item.label_ar, langMode)
                return (
                  <Line
                    key={item.label}
                    dataKey={mappedLabel}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2.25}
                    dot={{ r: 3, fill: COLORS[i % COLORS.length], strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                )
              })}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </LedgerPanel>
  )
}