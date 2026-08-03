import clsx from 'clsx'

import { fmtNum, fmtPct } from '@/lib/xbrl-format'
import type { KPI } from '@/types/xbrl-financials'

interface Props {
  kpi: KPI
  loading?: boolean
}

export function XbrlKpiCard({ kpi, loading }: Props) {
  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/60 p-5 backdrop-blur-md">
        <div className="mb-3 h-3 w-24 animate-pulse rounded-full bg-gray-200/70" />
        <div className="h-7 w-32 animate-pulse rounded-md bg-gray-200/70" />
        <div className="mt-3 h-3 w-16 animate-pulse rounded-full bg-gray-200/70" />
      </div>
    )
  }

  const pct = fmtPct(kpi.value, kpi.prev_value)
  const isUp = pct?.startsWith('+')
  const isDown = pct?.startsWith('-')

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-5 shadow-[0_4px_20px_rgba(17,24,39,0.05)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(67,56,202,0.10)]">
      {/* ambient glow */}
      <div
        className={clsx(
          'pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl transition-opacity duration-300',
          isUp && 'bg-[#22c55e]/25',
          isDown && 'bg-[#ef4444]/25',
          !isUp && !isDown && 'bg-[#4338CA]/15',
        )}
      />
      <p className="relative mb-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">{kpi.label}</p>
      <p className="num relative text-[24px] font-bold leading-none tracking-tight text-[#111827]">{fmtNum(kpi.value)}</p>
      <div className="relative mt-3 flex items-center gap-2">
        {pct && (
          <span
            className={clsx(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
              isUp && 'bg-[#22c55e]/10 text-[#16a34a]',
              isDown && 'bg-[#ef4444]/10 text-[#dc2626]',
              !isUp && !isDown && 'text-gray-500',
            )}
          >
            {isUp ? '▲' : isDown ? '▼' : ''} {pct}
          </span>
        )}
        {kpi.prev_period && <span className="text-[10px] text-gray-400">vs {kpi.prev_period}</span>}
      </div>
    </div>
  )
}

export function XbrlKpiGrid({ kpis, loading }: { kpis?: KPI[]; loading?: boolean }) {
  const items = loading ? Array(4).fill(null) : kpis ?? []
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((kpi, i) => (loading ? <XbrlKpiCard key={i} kpi={{} as KPI} loading /> : <XbrlKpiCard key={`${kpi.label}-${i}`} kpi={kpi} />))}
    </div>
  )
}