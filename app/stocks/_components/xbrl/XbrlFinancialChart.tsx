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

const COLORS = ['#4338CA', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#0891b2']

const DEFAULT_METRICS: Record<string, string[]> = {
  balance_sheet: ['total assets', 'total equity', 'total liabilities'],
  income_statement: ['total operating income', 'profit (loss) for the period', 'total operating expenses'],
  cash_flow: ['net cash from operating', 'net cash from investing', 'net cash from financing'],
}

import { type LangMode } from './XbrlCompanyDashboard'
import { getLabel } from './XbrlFinancialTable'

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
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(new Set(DEFAULT_METRICS[sectionKey] ?? []))

  useEffect(() => {
    setActiveMetrics(new Set(DEFAULT_METRICS[sectionKey] ?? []))
  }, [sectionKey])

  // Chartable items MUST NOT be unmapped (to keep standard charts clean)
  const chartableItems = useMemo(
    () => items.filter((i) => !i.is_header && !(i as any).is_unmapped && Object.values(i.values).some((v) => typeof v === 'number')),
    [items],
  )

  const selectedItems = useMemo(() => {
    const result: FinancialItem[] = []
    activeMetrics.forEach((frag) => {
      const item = findItem(items, frag)
      if (item) result.push(item)
    })
    if (result.length === 0) {
      const defaults = DEFAULT_METRICS[sectionKey] ?? []
      defaults.forEach((frag) => {
        const item = findItem(items, frag)
        if (item) result.push(item)
      })
    }
    return result
  }, [items, activeMetrics, sectionKey])

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
      <div className="rounded-2xl border border-white/60 bg-white/60 p-6 backdrop-blur-md">
        <div className="mb-4 h-4 w-40 animate-pulse rounded-full bg-gray-200/70" />
        <div className="h-[240px] w-full animate-pulse rounded-xl bg-gray-200/70" />
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-6 shadow-[0_4px_24px_rgba(17,24,39,0.05)] backdrop-blur-md">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[#4338CA]/10 blur-3xl" />

      <div className="relative mb-5 flex flex-wrap items-center gap-3">
        <span className="font-[Outfit,Inter,sans-serif] text-[14px] font-semibold text-[#111827]">Chart</span>
        <div className="flex overflow-hidden rounded-full border border-gray-200 bg-white/80 p-0.5">
          {(['bar', 'line'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setChartType(t)}
              className={clsx(
                'rounded-full px-3.5 py-1 text-[11px] font-medium capitalize transition-colors',
                chartType === t ? 'bg-[#4338CA] text-white shadow-sm' : 'bg-transparent text-gray-500 hover:text-[#111827]',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-5 flex flex-wrap gap-1.5">
        {chartableItems.slice(0, 18).map((item) => {
          const displayLabel = getLabel(item.label, item.label_ar, langMode)
          return (
            <button
              key={item.label}
              onClick={() => toggleMetric(item.label)}
              className={clsx(
                'whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors',
                isActive(item.label)
                  ? 'border-indigo-200 bg-indigo-50 text-[#4338CA]'
                  : 'border-gray-200 bg-white/70 text-gray-400 hover:text-gray-600',
              )}
            >
              {displayLabel.length > 32 ? `${displayLabel.slice(0, 30)}...` : displayLabel}
            </button>
          )
        })}
      </div>

      <ResponsiveContainer width="100%" height={260} className="relative">
        {chartType === 'bar' ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,24,39,0.06)" vertical={false} />
            <XAxis dataKey="period" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => fmtAxisNum(v)}
              width={56}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(17,24,39,0.08)',
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(17,24,39,0.10)',
                fontSize: 12,
              }}
              cursor={{ fill: 'rgba(67,56,202,0.05)' }}
            />
            {selectedItems.map((item, i) => {
              const mappedLabel = getLabel(item.label, item.label_ar, langMode)
              return (
                <Bar key={item.label} dataKey={mappedLabel} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} fillOpacity={0.9} />
              )
            })}
          </BarChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,24,39,0.06)" vertical={false} />
            <XAxis dataKey="period" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => fmtAxisNum(v)}
              width={56}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(17,24,39,0.08)',
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(17,24,39,0.10)',
                fontSize: 12,
              }}
            />
            {selectedItems.map((item, i) => {
              const mappedLabel = getLabel(item.label, item.label_ar, langMode)
              return (
                <Line
                  key={item.label}
                  dataKey={mappedLabel}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2.5}
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
  )
}