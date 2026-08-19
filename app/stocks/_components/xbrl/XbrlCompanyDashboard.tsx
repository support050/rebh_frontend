'use client'

import { useEffect, useMemo, useState } from 'react'

import { useCompany, useKpis } from '@/hooks/useXbrlFinancials'
import type { EquityMatrixItem, PeriodMeta, SectionKey } from '@/types/xbrl-financials'
import { XbrlEquityTable } from './XbrlEquityTable'
import { XbrlFinancialChart } from './XbrlFinancialChart'
import { XbrlFinancialTable } from './XbrlFinancialTable'
import { XbrlKpiGrid } from './XbrlKpiCard'
import { LedgerPanel, StampButton } from './Xbrlledgerchrome'
import { XbrlSidebar } from './XbrlSidebar'
import { XbrlTopBar } from './XbrlTopBar'

export type ViewMode = 'standardized' | 'raw'
export type LangMode = 'ar' | 'en' | 'both'

export function XbrlCompanyDashboard({ symbol }: { symbol: string }) {
  const [baseSection, setBaseSection] = useState<SectionKey>('income_statement')
  const [viewMode, setViewMode] = useState<ViewMode>('standardized')
  const [langMode, setLangMode] = useState<LangMode>('both')

  const { data: company, loading: companyLoading, error } = useCompany(symbol)

  const [signalsData, setSignalsData] = useState<Array<{ type: string; neg: boolean; rule: string; text: string }>>([])
  const [trustBadge, setTrustBadge] = useState<{ verified: boolean; badge_label: string; badge_status: string; pass_rate_pct: number } | null>(null)

  useEffect(() => {
    if (symbol) {
      import('@/lib/xbrl-api').then(({ getSignals, getTrustBadge }) => {
        getSignals(symbol).then((res) => setSignalsData(res.signals || [])).catch(() => setSignalsData([]))
        getTrustBadge(symbol).then((res) => setTrustBadge(res)).catch(() => setTrustBadge(null))
      })
    }
  }, [symbol])

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
    <div className="min-h-screen bg-[#F7F8FA] font-sans text-[#1A1A1A] antialiased">
      <XbrlTopBar meta={company?.meta} />
      <div className="relative flex">
        <XbrlSidebar availableSections={availableSections} currentSection={baseSection} onSelect={setBaseSection} />
        <main className="flex-1 min-w-0 space-y-5 p-6">
          
          {/* Trust Badge & Signals Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-[#E5E7EB] bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2">
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                فحص الموثوقية:
              </span>
              {trustBadge ? (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    trustBadge.verified
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {trustBadge.badge_label} ({trustBadge.pass_rate_pct}%)
                </span>
              ) : (
                <span className="text-xs text-[#9CA3AF]">جاري الفحص...</span>
              )}
            </div>

            {signalsData.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                  إشارات النمو:
                </span>
                {signalsData.map((sig, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 rounded-[4px] px-2.5 py-1 text-xs font-medium ${
                      sig.neg
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                    title={sig.rule}
                  >
                    {sig.text}
                  </span>
                ))}
              </div>
            )}
          </div>

          <LedgerPanel className="flex flex-wrap justify-between items-center gap-4 p-3">
            {/* View Mode Switcher — hidden for equity and info sections */}
            {!isEquityMatrix && !isInfoSection ? (
              <div className="flex items-center gap-1.5">
                <span className="px-1 font-sans text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">View</span>
                <StampButton active={viewMode === 'standardized'} onClick={() => setViewMode('standardized')}>
                  Standardized
                </StampButton>
                <StampButton active={viewMode === 'raw'} onClick={() => setViewMode('raw')}>
                  Raw Data
                </StampButton>
              </div>
            ) : (
              <div />
            )}

            {/* Language Switcher */}
            <div className="flex items-center gap-1.5">
              <span className="px-1 font-sans text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Language</span>
              <StampButton active={langMode === 'ar'} onClick={() => setLangMode('ar')}>
                العربية
              </StampButton>
              <StampButton active={langMode === 'en'} onClick={() => setLangMode('en')}>
                English
              </StampButton>
              <StampButton active={langMode === 'both'} onClick={() => setLangMode('both')}>
                Both
              </StampButton>
            </div>
          </LedgerPanel>

          {error ? (
            <div className="rounded-[4px] border border-[#FECACA] bg-[#FEF2F2] p-4 font-sans text-sm text-[#DC2626] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              ✖ {error}
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