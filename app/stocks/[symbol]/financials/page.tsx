'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api/config';
import { authFetch } from '@/lib/api/authFetch';

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

export default function StockFinancialsPage() {
    const params = useParams();
    const symbol = ((params?.symbol as string) || '').toUpperCase();

    const [financialData, setFinancialData] = useState<HistoricalFinancials | null>(null);
    const [activeReportType, setActiveReportType] = useState<ReportType>('income_statements');
    const [periodType, setPeriodType] = useState<PeriodType>('Annually');
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
                credentials: 'include'
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

    const getCurrentReportData = (): FinancialPeriod[] => {
        if (!financialData) return [];
        const data = financialData[activeReportType] || [];
        return data.filter(p => p.period_type === periodType);
    };

    const reportData = getCurrentReportData();

    const getAllMetricNames = (): string[] => {
        const metrics = new Set<string>();
        reportData.forEach(period => {
            Object.keys(period.metrics).forEach(key => metrics.add(key));
        });
        return Array.from(metrics).sort();
    };

    const metricNames = getAllMetricNames();
    const periods = reportData.map(p => p.period_end_date).sort().reverse();

    const reportTabs = [
        { key: 'income_statements', label: 'Income Statement' },
        { key: 'balance_sheets', label: 'Balance Sheet' },
        { key: 'cash_flows', label: 'Cash Flows' },
    ];

    return (
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="flex border-b border-gray-200">
                        {reportTabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveReportType(tab.key as ReportType)}
                                className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeReportType === tab.key
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}

                        <div className="ml-auto flex items-center px-4 gap-2">
                            <span className="text-sm text-gray-500">Period:</span>
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setPeriodType('Annually')}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${periodType === 'Annually'
                                        ? 'bg-white shadow text-gray-900'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Annual
                                </button>
                                <button
                                    onClick={() => setPeriodType('Quarterly')}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${periodType === 'Quarterly'
                                        ? 'bg-white shadow text-gray-900'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Quarterly
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-12 text-red-500">
                                <p>{error}</p>
                                <button
                                    onClick={() => symbol && fetchFinancials(symbol)}
                                    className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : periods.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p>No {periodType.toLowerCase()} data available for this report type.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="py-3 px-4 text-left font-semibold text-gray-900 sticky left-0 bg-gray-50 min-w-[250px]">
                                                Metric
                                            </th>
                                            {periods.map(period => (
                                                <th key={period} className="py-3 px-4 text-right font-semibold text-gray-900 min-w-[120px] whitespace-nowrap">
                                                    {period}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {metricNames.map((metricName, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-3 px-4 font-medium text-gray-900 sticky left-0 bg-white">
                                                    {metricName}
                                                </td>
                                                {periods.map(period => {
                                                    const periodData = reportData.find(p => p.period_end_date === period);
                                                    const value = periodData?.metrics[metricName] || '-';
                                                    return (
                                                        <td key={period} className="py-3 px-4 text-right text-gray-600 tabular-nums">
                                                            {value}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {financialData && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="font-semibold text-gray-900">{financialData.symbol}</span>
                            {financialData.company_name && (
                                <span>{financialData.company_name}</span>
                            )}
                            <span className="text-gray-400">|</span>
                            <span>Balance Sheets: {financialData.balance_sheets.length}</span>
                            <span>Income Statements: {financialData.income_statements.length}</span>
                            <span>Cash Flows: {financialData.cash_flows.length}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
