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
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-[236px] min-w-[236px] overflow-y-auto overflow-x-hidden border-r border-[#E5E7EB] bg-white py-6 pl-3 pr-0">
      <p className="px-3 pb-4 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-[#6B7280]">
        📑 Statements Binder
      </p>
      <div className="space-y-2.5">
        {sections.map((sec) => {
          const active = currentSection === sec
          return (
            <button
              key={sec}
              onClick={() => onSelect(sec)}
              className={clsx(
                'group relative flex w-[92%] items-center gap-2.5 py-2.5 pl-3.5 pr-3 text-left text-[12.5px] font-semibold transition-all duration-150',
                'rounded-l-[10px] rounded-r-[3px] border border-r-0',
                active
                  ? 'w-full translate-x-0 border-[#E5E7EB] bg-[#F9FAFB] text-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                  : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#1A1A1A]',
              )}
              style={{
                // tab "cut" shape like a manila folder tab
                clipPath: 'polygon(0 0, 100% 0, 96% 50%, 100% 100%, 0 100%)',
              }}
            >
              <span className="text-[14px] opacity-80">{SECTION_ICONS[sec] ?? '📄'}</span>
              <span className="truncate">{SECTION_LABELS[sec] ?? sec}</span>
              {active && <span className="absolute -left-[1px] top-0 h-full w-[3px] rounded-l-[10px] bg-[#8C3B32]" />}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
