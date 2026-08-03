import type { ReactNode } from 'react'
import Link from 'next/link'

import type { CompanyMeta } from '@/types/xbrl-financials'

interface Props {
  meta?: CompanyMeta
}

export function XbrlTopBar({ meta }: Props) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-white/60 bg-white/70 px-6 backdrop-blur-md shadow-[0_1px_0_rgba(17,24,39,0.04)]">
      <Link
        href="/"
        className="whitespace-nowrap font-[Outfit,Inter,sans-serif] text-[16px] font-bold tracking-tight text-[#4338CA]"
      >
        XBRL Viewer
      </Link>
      <div className="h-5 w-px bg-gray-200" />
      {meta ? (
        <>
          <span className="truncate text-[14px] font-semibold text-[#111827]">{meta.company_name}</span>
          <div className="flex flex-wrap items-center gap-2">
            {meta.symbol && (
              <span className="text-[12px] text-gray-500">
                <span className="text-gray-400">Symbol&nbsp;</span>
                <span className="font-mono font-semibold text-gray-700">{meta.symbol}</span>
              </span>
            )}
            {meta.sector && <span className="hidden text-[11px] text-gray-400 sm:inline">{meta.sector}</span>}
            {meta.currency && <Badge>{meta.currency}</Badge>}
            {meta.rounding && <Badge variant="amber">{meta.rounding}</Badge>}
            {meta.status && <Badge variant="green">{meta.status}</Badge>}
          </div>
        </>
      ) : (
        <span className="text-[13px] text-gray-400">No company selected</span>
      )}
      <div className="ml-auto">
        <Link
          href="/stocks"
          className="rounded-full border border-white/70 bg-white/80 px-4 py-1.5 text-[12px] font-medium text-gray-600 shadow-sm backdrop-blur-md transition-colors hover:bg-white hover:text-[#111827]"
        >
          Back to Stocks
        </Link>
      </div>
    </header>
  )
}

function Badge({
  children,
  variant = 'blue',
}: {
  children: ReactNode
  variant?: 'blue' | 'green' | 'amber'
}) {
  const cls = {
    blue: 'border-indigo-200 bg-indigo-50 text-indigo-600',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-600',
    amber: 'border-amber-200 bg-amber-50 text-amber-600',
  }[variant]

  return <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${cls}`}>{children}</span>
}