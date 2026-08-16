'use client'

import clsx from 'clsx'

import { NAVIGABLE_SECTIONS, SECTION_LABELS, type SectionKey } from '@/types/xbrl-financials'

const SECTION_ICONS: Record<string, string> = {
  balance_sheet: '🏛',
  income_statement: '📈',
  cash_flow: '💧',
  other_comprehensive_income: '📋',
  equity_changes: '⚖',
}

interface Props {
  availableSections: string[]
  currentSection: SectionKey
  onSelect: (s: SectionKey) => void
}

export function XbrlSidebar({ availableSections, currentSection, onSelect }: Props) {
  const sections = NAVIGABLE_SECTIONS.filter((s) => availableSections.includes(s) || availableSections.includes(`standardized_${s}`))

  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-[236px] min-w-[236px] overflow-y-auto overflow-x-hidden border-r border-[#E5E7EB] bg-white px-3 py-6">
      <p className="px-2 pb-3 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
        Financial Statements
      </p>
      <div className="space-y-1">
        {sections.map((sec) => {
          const active = currentSection === sec
          return (
            <button
              key={sec}
              onClick={() => onSelect(sec)}
              className={clsx(
                'group relative flex w-full items-center gap-2.5 rounded-[4px] border px-3 py-2.5 text-left text-[12.5px] font-semibold transition-colors duration-150',
                active
                  ? 'border-[#E5E7EB] bg-white text-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                  : 'border-transparent bg-transparent text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#1A1A1A]',
              )}
            >
              {active && <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-[#8C3B32]" />}
              <span className="text-[14px] opacity-80">{SECTION_ICONS[sec] ?? '📄'}</span>
              <span className="truncate">{SECTION_LABELS[sec] ?? sec}</span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}