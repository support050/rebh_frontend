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
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-[220px] min-w-[220px] overflow-y-auto border-r border-white/60 bg-white/50 px-3 py-6 backdrop-blur-md">
      <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Statements</p>
      <div className="space-y-1">
        {sections.map((sec) => (
          <button
            key={sec}
            onClick={() => onSelect(sec)}
            className={clsx(
              'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-150',
              currentSection === sec
                ? 'bg-white text-[#4338CA] shadow-[0_2px_10px_rgba(67,56,202,0.12)] border border-indigo-100'
                : 'border border-transparent text-gray-500 hover:bg-white/70 hover:text-[#111827]',
            )}
          >
            <span className="text-[15px] opacity-80">{SECTION_ICONS[sec] ?? '📄'}</span>
            {SECTION_LABELS[sec] ?? sec}
          </button>
        ))}
      </div>
    </aside>
  )
}