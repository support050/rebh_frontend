'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { API_BASE_URL } from '@/lib/api/config';
import { authFetch } from '@/lib/api/authFetch';
import { LedgerPanel, StampButton } from '../../_components/xbrl/Xbrlledgerchrome';

interface FinancialPeriod {
    period_end_date: string;
    period_type: 'Annually' | 'Quarterly';
    metrics: Record<string, string>;
}

interface HistoricalFinancials {
    symbol: string;
    company_name: string | null;
    balance_sheets: FinancialPeriod[];
    income_statements: FinancialPeriod[];
    cash_flows: FinancialPeriod[];
}

type ReportType = 'balance_sheets' | 'income_statements' | 'cash_flows';
type PeriodType = 'Annually' | 'Quarterly';

const REPORT_TABS: { key: ReportType; label: string; icon: string }[] = [
    { key: 'income_statements', label: 'Income Statement', icon: '📈' },
    { key: 'balance_sheets', label: 'Balance Sheet', icon: '🏛' },
    { key: 'cash_flows', label: 'Cash Flows', icon: '💧' },
];

const TOTAL_FRAGS = [
    'total assets',
    'total liabilities',
    'total equity',
    'total shareholders',
    'total liabilities and',
    'gross profit',
    'operating profit',
    'profit for the period',
    'net profit',
    'net income',
    'total operating income',
    'total operating expenses',
    'net cash from operating',
    'net cash from investing',
    'net cash from financing',
    'net change in cash',
];

const HIDDEN_METRICS = ['all currency in'];
const FOOTER_METRICS = ['all figures in', 'last update date'];

const STICKY_COL =
    'sticky left-0 z-20 min-w-[280px] whitespace-normal break-words border-t border-[#E5E7EB] px-5 py-2.5 text-left font-sans leading-snug';

function normalizeMetric(name: string) {
    return name.trim().toLowerCase();
}

function isHiddenMetric(name: string) {
    return HIDDEN_METRICS.includes(normalizeMetric(name));
}

function footerRank(name: string) {
    return FOOTER_METRICS.indexOf(normalizeMetric(name));
}

function isTotal(label: string) {
    return TOTAL_FRAGS.some((f) => label.toLowerCase().includes(f));
}

function isNegativeValue(value: string) {
    const cleaned = value.replace(/,/g, '').trim();
    return cleaned.startsWith('(') || cleaned.startsWith('-');
}

export default function StockFinancialsPage() {
    const params = useParams();
    const symbol = ((params?.symbol as string) || '').toUpperCase();

    const [financialData, setFinancialData] = useState<HistoricalFinancials | null>(null);
    const [activeReportType, setActiveReportType] = useState<ReportType>('income_statements');
    const [periodType, setPeriodType] = useState<PeriodType>('Annually');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (symbol) {
            fetchFinancials(symbol);
        }
    }, [symbol]);

    const fetchFinancials = async (sym: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch(`${API_BASE_URL}/api/scraper/financials/${sym}`, {
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to fetch financial data');
            const data = await res.json();
            setFinancialData(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to fetch financial data');
            setFinancialData(null);
        } finally {
            setLoading(false);
        }
    };

    const reportData = useMemo(() => {
        if (!financialData) return [];
        return (financialData[activeReportType] || []).filter((p) => p.period_type === periodType);
    }, [financialData, activeReportType, periodType]);

    const periods = useMemo(
        () => reportData.map((p) => p.period_end_date).sort().reverse(),
        [reportData],
    );

    const metricNames = useMemo(() => {
        const metrics = new Set<string>();
        reportData.forEach((period) => {
            Object.keys(period.metrics).forEach((key) => metrics.add(key));
        });

        const body: string[] = [];
        const footer: string[] = [];
        Array.from(metrics).forEach((name) => {
            if (isHiddenMetric(name)) return;
            if (footerRank(name) >= 0) footer.push(name);
            else body.push(name);
        });
        footer.sort((a, b) => footerRank(a) - footerRank(b));

        const q = search.trim().toLowerCase();
        const filteredBody = q ? body.filter((name) => name.toLowerCase().includes(q)) : body;
        return [...filteredBody, ...footer];
    }, [reportData, search]);

    return (
        <div className="w-full bg-[#F7F8FA] font-sans text-[#1A1A1A] antialiased">
            <div className="relative flex w-full">
                <aside className="sticky top-0 h-[calc(100vh-8rem)] w-[236px] min-w-[236px] overflow-y-auto overflow-x-hidden border-r border-[#E5E7EB] bg-white px-3 py-6">
                    <p className="px-2 pb-3 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
                        Financial Statements
                    </p>
                    <div className="space-y-1">
                        {REPORT_TABS.map((tab) => {
                            const active = activeReportType === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveReportType(tab.key)}
                                    className={clsx(
                                        'group relative flex w-full items-center gap-2.5 rounded-[4px] border px-3 py-2.5 text-left text-[12.5px] font-semibold transition-colors duration-150',
                                        active
                                            ? 'border-[#E5E7EB] bg-white text-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                                            : 'border-transparent bg-transparent text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#1A1A1A]',
                                    )}
                                >
                                    {active && (
                                        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-[#8C3B32]" />
                                    )}
                                    <span className="text-[14px] opacity-80">{tab.icon}</span>
                                    <span className="truncate">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                <main className="min-w-0 flex-1 space-y-5 p-6">
                    <LedgerPanel className="flex flex-wrap items-center justify-between gap-4 p-3">
                        <div className="flex items-center gap-1.5">
                            <span className="px-1 font-sans text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                                Period
                            </span>
                            <StampButton active={periodType === 'Annually'} onClick={() => setPeriodType('Annually')}>
                                Annual
                            </StampButton>
                            <StampButton active={periodType === 'Quarterly'} onClick={() => setPeriodType('Quarterly')}>
                                Quarterly
                            </StampButton>
                        </div>

                        {financialData && (
                            <div className="flex flex-wrap items-center gap-2 font-sans text-[11px] text-[#6B7280]">
                                <span className="font-bold text-[#1A1A1A]">{financialData.symbol}</span>
                                {financialData.company_name && <span>{financialData.company_name}</span>}
                                <span className="text-[#D1D5DB]">|</span>
                                <span>BS {financialData.balance_sheets.length}</span>
                                <span>IS {financialData.income_statements.length}</span>
                                <span>CF {financialData.cash_flows.length}</span>
                            </div>
                        )}
                    </LedgerPanel>

                    {error ? (
                        <div className="rounded-[4px] border border-[#FECACA] bg-[#FEF2F2] p-4 font-sans text-sm text-[#DC2626] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                            ✖ {error}
                            <button
                                onClick={() => symbol && fetchFinancials(symbol)}
                                className="ml-3 rounded-[4px] border border-[#FECACA] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider hover:bg-[#FEF2F2]"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <LedgerPanel>
                            <div className="flex flex-wrap items-center gap-3 border-b border-[#E5E7EB] px-5 py-4">
                                <span className="font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-[#6B7280]">
                                    Line Items
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search line items..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-9 w-56 rounded-[4px] border border-[#E5E7EB] bg-white px-4 font-sans text-[12px] text-[#1A1A1A] placeholder:text-[#9CA3AF] outline-none transition-colors focus:border-[#8C3B32]/50"
                                />
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-separate border-spacing-0 text-[13px]">
                                    <thead>
                                        <tr>
                                            <th className="sticky left-0 z-30 min-w-[280px] border-b border-[#E5E7EB] bg-[#F3F4F6] px-5 py-3 text-left font-sans text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                                                Line Item
                                            </th>
                                            {periods.map((period) => (
                                                <th
                                                    key={period}
                                                    className="whitespace-nowrap border-b border-[#E5E7EB] bg-[#F3F4F6] px-4 py-3 text-right font-sans text-[10px] font-bold uppercase tracking-wider text-[#6B7280]"
                                                >
                                                    {period}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td
                                                    colSpan={Math.max(periods.length, 1) + 1}
                                                    className="px-5 py-16 text-center font-sans italic text-[#6B7280]"
                                                >
                                                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-[#8C3B32]" />
                                                    Loading ledger…
                                                </td>
                                            </tr>
                                        ) : periods.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={2}
                                                    className="px-5 py-16 text-center font-sans italic text-[#6B7280]"
                                                >
                                                    No {periodType.toLowerCase()} data available for this report type.
                                                </td>
                                            </tr>
                                        ) : metricNames.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={periods.length + 1}
                                                    className="px-5 py-16 text-center font-sans italic text-[#6B7280]"
                                                >
                                                    No results for &quot;{search}&quot;
                                                </td>
                                            </tr>
                                        ) : (
                                            metricNames.map((metricName) => {
                                                const band = isTotal(metricName);
                                                return (
                                                    <tr key={metricName} className="group">
                                                        <td
                                                            className={clsx(
                                                                STICKY_COL,
                                                                band
                                                                    ? 'bg-[#F3F4F6] font-bold text-[#1A1A1A]'
                                                                    : 'bg-white text-[#1A1A1A] group-hover:bg-[#F9FAFB]',
                                                            )}
                                                        >
                                                            {metricName}
                                                        </td>
                                                        {periods.map((period) => {
                                                            const periodData = reportData.find(
                                                                (p) => p.period_end_date === period,
                                                            );
                                                            const value = periodData?.metrics[metricName] || '';
                                                            const empty = !value || value === '-';
                                                            const negative = !empty && isNegativeValue(value);
                                                            return (
                                                                <td
                                                                    key={period}
                                                                    className={clsx(
                                                                        'min-w-[160px] border-t border-[#E5E7EB] px-4 py-2.5 text-right font-sans tabular-nums whitespace-nowrap',
                                                                        band
                                                                            ? 'bg-[#F3F4F6] font-bold text-[#1A1A1A]'
                                                                            : 'group-hover:bg-[#F9FAFB]',
                                                                        empty && 'text-[#9CA3AF]',
                                                                        negative && !band && 'text-[#DC2626]',
                                                                        !band && !empty && !negative && 'text-[#1A1A1A]',
                                                                    )}
                                                                >
                                                                    {empty ? '—' : value}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </LedgerPanel>
                    )}
                </main>
            </div>
        </div>
    );
}
