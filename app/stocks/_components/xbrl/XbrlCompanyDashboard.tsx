'use client'

import { useMemo, useState } from 'react'

import { useCompany, useKpis } from '@/hooks/useXbrlFinancials'
import type { EquityMatrixItem, PeriodMeta, SectionKey } from '@/types/xbrl-financials'
import { XbrlEquityTable } from './XbrlEquityTable'
import { XbrlFinancialChart } from './XbrlFinancialChart'
import { XbrlFinancialTable } from './XbrlFinancialTable'
import { XbrlKpiGrid } from './XbrlKpiCard'
import { XbrlSidebar } from './XbrlSidebar'
import { XbrlTopBar } from './XbrlTopBar'

export type ViewMode = 'standardized' | 'raw'
export type LangMode = 'ar' | 'en' | 'both'

export function XbrlCompanyDashboard({ symbol }: { symbol: string }) {
  const [baseSection, setBaseSection] = useState<SectionKey>('income_statement')
  const [viewMode, setViewMode] = useState<ViewMode>('standardized')
  const [langMode, setLangMode] = useState<LangMode>('both')

  const { data: company, loading: companyLoading, error } = useCompany(symbol)

  const isEquityMatrix = baseSection === 'equity_changes'
  const isInfoSection = baseSection === 'filing_info' || baseSection === 'auditors_report'

  // Resolve actual section to show based on view mode
  // Info sections (filing_info, auditors_report) don't have standardized versions
  const actualSectionKey = ((viewMode === 'standardized' && !isEquityMatrix && !isInfoSection)
    ? `standardized_${baseSection}`
    : baseSection) as SectionKey

  // KPI always uses standardized section if available (not for info sections)
  const kpiSection = (!isEquityMatrix && !isInfoSection ? `standardized_${baseSection}` : baseSection) as SectionKey
  const { data: kpisData, loading: kpisLoading } = useKpis(symbol, kpiSection)

  const availableSections = useMemo(() => Object.keys(company?.sections ?? {}), [company?.sections])
  const currentSection = company?.sections?.[actualSectionKey] || company?.sections?.[baseSection]

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans text-[#111827] antialiased">
      {/* ambient background accents */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#4338CA]/[0.05] blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-[#22c55e]/[0.04] blur-3xl" />
      </div>

      <XbrlTopBar meta={company?.meta} />
      <div className="relative flex">
        <XbrlSidebar availableSections={availableSections} currentSection={baseSection} onSelect={setBaseSection} />
        <main className="flex-1 min-w-0 space-y-5 p-6">
          <div className="flex flex-wrap justify-between items-center gap-4 rounded-2xl border border-white/70 bg-white/70 p-1.5 shadow-[0_2px_12px_rgba(17,24,39,0.04)] backdrop-blur-md">

            {/* View Mode Switcher — hidden for equity and info sections */}
            {!isEquityMatrix && !isInfoSection ? (
              <div className="flex items-center rounded-full bg-gray-100/70 p-1">
                <button
                  onClick={() => setViewMode('standardized')}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all ${viewMode === 'standardized' ? 'bg-[#4338CA] text-white shadow-sm' : 'text-gray-500 hover:text-[#111827]'
                    }`}
                >
                  Standardized View
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all ${viewMode === 'raw' ? 'bg-[#4338CA] text-white shadow-sm' : 'text-gray-500 hover:text-[#111827]'
                    }`}
                >
                  Raw Data
                </button>
              </div>
            ) : (
              <div />
            )}

            {/* Language Switcher */}
            <div className="flex items-center gap-1 rounded-full bg-gray-100/70 p-1">
              <span className="px-2 text-[10px] font-medium text-gray-400">Language</span>
              <button
                onClick={() => setLangMode('ar')}
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${langMode === 'ar' ? 'bg-[#4338CA] text-white shadow-sm' : 'text-gray-500 hover:text-[#111827]'
                  }`}
              >
                العربية
              </button>
              <button
                onClick={() => setLangMode('en')}
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${langMode === 'en' ? 'bg-[#4338CA] text-white shadow-sm' : 'text-gray-500 hover:text-[#111827]'
                  }`}
              >
                English
              </button>
              <button
                onClick={() => setLangMode('both')}
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${langMode === 'both' ? 'bg-[#4338CA] text-white shadow-sm' : 'text-gray-500 hover:text-[#111827]'
                  }`}
              >
                Both / معاً
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50/80 p-4 text-sm text-red-600 backdrop-blur-md">
              {error}
            </div>
          ) : isEquityMatrix ? (
            /* Equity Changes — pivot table (rows=items, cols=components) */
            <XbrlEquityTable
              items={(currentSection?.items ?? []) as unknown as EquityMatrixItem[]}
              periods={currentSection?.periods ?? []}
              periodMeta={currentSection?.period_meta as PeriodMeta[]}
              components={currentSection?.components ?? []}
              loading={companyLoading}
              langMode={langMode}
            />
          ) : (
            /* Standard sections — KPIs + Chart + Table */
            <>
              {viewMode === 'standardized' && !isInfoSection && (
                <XbrlKpiGrid kpis={kpisData?.kpis} loading={kpisLoading} />
              )}
              {viewMode === 'standardized' && !isInfoSection && (
                <XbrlFinancialChart
                  items={currentSection?.items ?? []}
                  periods={currentSection?.periods ?? []}
                  periodMeta={currentSection?.period_meta as PeriodMeta[]}
                  sectionKey={actualSectionKey}
                  loading={companyLoading}
                  langMode={langMode}
                />
              )}
              <XbrlFinancialTable
                items={currentSection?.items ?? []}
                periods={currentSection?.periods ?? []}
                periodMeta={currentSection?.period_meta as PeriodMeta[]}
                sectionKey={actualSectionKey}
                loading={companyLoading}
                langMode={langMode}
              />
            </>
          )}
        </main>
      </div>
    </div>
  )
}