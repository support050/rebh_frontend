import clsx from 'clsx'

import { fmtNum, fmtPct } from '@/lib/xbrl-format'
import type { KPI } from '@/types/xbrl-financials'
import { WashiTape } from './Xbrlledgerchrome'

const SITE_FONT = "'Tajawal', 'Inter', sans-serif"

interface Props {
  kpi: KPI
  loading?: boolean
  tilt?: 'left' | 'right' | 'none'
}

export function XbrlKpiCard({ kpi, loading, tilt = 'none' }: Props) {
  const tiltClass = tilt === 'left' ? '-rotate-[0.6deg]' : tilt === 'right' ? 'rotate-[0.6deg]' : ''

  if (loading) {
    return (
      <div
        className={clsx(
          'relative overflow-hidden rounded-[3px] border border-[#E5E7EB] bg-white p-5',
          'shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
          tiltClass,
        )}
      >
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
        'group relative overflow-hidden rounded-[3px] border border-[#E5E7EB] bg-white p-5 pt-6',
        'shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
        'transition-transform duration-200 hover:-translate-y-0.5 hover:rotate-0',
        tiltClass,
      )}
      style={{ fontFamily: SITE_FONT }}
    >
      <WashiTape rotate={tilt === 'left' ? -8 : tilt === 'right' ? 6 : -4} color={isUp ? '#16A34A' : isDown ? '#DC2626' : '#8C3B32'} />

      <p className="relative mb-2 border-b border-dashed border-[#E5E7EB] pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
        {kpi.label}
      </p>
      <p className="relative text-[23px] font-bold leading-none tracking-tight text-[#1A1A1A]" style={{ fontFamily: SITE_FONT }}>
        {fmtNum(kpi.value)}
      </p>
      <div className="relative mt-3 flex items-center gap-2">
        {pct && (
          <span
            className={clsx(
              'inline-flex items-center gap-0.5 rounded-[3px] border px-1.5 py-0.5 text-[10px] font-bold',
              isUp && 'border-[#16A34A] text-[#16A34A]',
              isDown && 'border-[#DC2626] text-[#DC2626]',
              !isUp && !isDown && 'border-[#E5E7EB] text-[#6B7280]',
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
  const tilts: Array<'left' | 'right' | 'none'> = ['left', 'right', 'left', 'right']
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
      {items.map((kpi, i) =>
        loading ? (
          <XbrlKpiCard key={i} kpi={{} as KPI} loading tilt={tilts[i % 4]} />
        ) : (
          <XbrlKpiCard key={`${kpi.label}-${i}`} kpi={kpi} tilt={tilts[i % 4]} />
        ),
      )}
    </div>
  )
}
