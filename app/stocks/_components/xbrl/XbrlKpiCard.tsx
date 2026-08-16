import clsx from 'clsx'

import { fmtNum, fmtPct } from '@/lib/xbrl-format'
import type { KPI } from '@/types/xbrl-financials'

const SITE_FONT = "'Tajawal', 'Inter', sans-serif"

interface Props {
  kpi: KPI
  loading?: boolean
}

export function XbrlKpiCard({ kpi, loading }: Props) {
  if (loading) {
    return (
      <div className="relative rounded-[4px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="mb-3 h-3 w-24 animate-pulse rounded-full bg-[#F3F4F6]" />
        <div className="h-7 w-32 animate-pulse rounded-sm bg-[#F3F4F6]" />
        <div className="mt-3 h-3 w-16 animate-pulse rounded-full bg-[#F3F4F6]" />
      </div>
    )
  }

  const pct = fmtPct(kpi.value, kpi.prev_value)
  const isUp = pct?.startsWith('+')
  const isDown = pct?.startsWith('-')

  return (
    <div
      className={clsx(
        'group relative rounded-[4px] border border-[#E5E7EB] bg-white p-5',
        'shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-shadow duration-150 hover:shadow-[0_4px_10px_rgba(0,0,0,0.08)]',
      )}
      style={{ fontFamily: SITE_FONT }}
    >
      <p className="mb-2 border-b border-[#E5E7EB] pb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#6B7280]">
        {kpi.label}
      </p>
      <p className="text-[23px] font-bold leading-none tracking-tight text-[#1A1A1A]" style={{ fontFamily: SITE_FONT }}>
        {fmtNum(kpi.value)}
      </p>
      <div className="mt-3 flex items-center gap-2">
        {pct && (
          <span
            className={clsx(
              'inline-flex items-center gap-0.5 rounded-[4px] border px-1.5 py-0.5 text-[10px] font-bold',
              isUp && 'border-[#86EFAC] bg-[#F0FDF4] text-[#16A34A]',
              isDown && 'border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]',
              !isUp && !isDown && 'border-[#FDE68A] bg-[#FFFBEB] text-[#D97706]',
            )}
            style={{ fontFamily: SITE_FONT }}
          >
            {isUp ? '▲' : isDown ? '▼' : '—'} {pct}
          </span>
        )}
        {kpi.prev_period && (
          <span className="text-[10px] text-[#6B7280]" style={{ fontFamily: SITE_FONT }}>
            vs {kpi.prev_period}
          </span>
        )}
      </div>
    </div>
  )
}

export function XbrlKpiGrid({ kpis, loading }: { kpis?: KPI[]; loading?: boolean }) {
  const items = loading ? Array(4).fill(null) : kpis ?? []
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((kpi, i) =>
        loading ? (
          <XbrlKpiCard key={i} kpi={{} as KPI} loading />
        ) : (
          <XbrlKpiCard key={`${kpi.label}-${i}`} kpi={kpi} />
        ),
      )}
    </div>
  )
}