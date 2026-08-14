'use client';

import { useState, useEffect } from 'react';
import { FileText, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api/config';

interface OfficialFiling {
    id: number;
    period: string; // 'Annual', 'Q1'...
    year: number;
    file_url: string | null;
    published_date: string | null;
    file_type: 'pdf' | 'excel' | 'other' | null;
    source?: string; // Added for UI tracking
    language?: string; // 'en' | 'ar'
}

const CATEGORIES = [
    'Financial Statements',
    'XBRL',
    'Board Report',
    'ESG Report'
];

const PERIOD_ORDER = ['Annual', 'Q4', 'Q3', 'Q2', 'Q1'];

export default function FinancialReportsTable({ symbol }: { symbol: string }) {
    const [data, setData] = useState<Record<string, OfficialFiling[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(CATEGORIES[0]);
    const [years, setYears] = useState<number[]>([]);
    const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>('en');

    useEffect(() => {
        if (symbol) fetchReports();
    }, [symbol]);

    const fetchReports = async () => {
        setLoading(true);
        setError(null);
        setData({}); // Clear previous data strictly
        setYears([]); // Clear previous years
        try {
            const res = await fetch(`${API_BASE_URL}/api/reports/${symbol}`);

            if (!res.ok) {
                throw new Error('Failed to fetch reports');
            }

            const json = await res.json();

            // DATA NORMALIZATION: Ensure 'language' field exists, default to 'en' if missing
            const normalizedJson: Record<string, OfficialFiling[]> = {};
            Object.keys(json).forEach(key => {
                normalizedJson[key] = json[key].map((item: any) => ({
                    ...item,
                    language: item.language || 'en'
                }));
            });

            setData(normalizedJson);

            // Extract all unique years
            const allYears = new Set<number>();
            Object.values(normalizedJson).forEach((list: any) => {
                list.forEach((d: any) => allYears.add(d.year));
            });
            setYears(Array.from(allYears).sort((a, b) => b - a));

        } catch (e: any) {
            setError(e.message || 'Error loading reports');
        } finally {
            setLoading(false);
        }
    };

    // Flatten all data to verify content exists
    const hasData = Object.values(data).some(arr => arr.length > 0);

    // Columns configuration
    // Q1..Annual columns will now aggregate both Financial Statements and XBRL
    const COLUMNS = [
        { label: 'Q1', key: 'Q1', source: 'Financial Statements' },
        { label: 'Q2', key: 'Q2', source: 'Financial Statements' },
        { label: 'Q3', key: 'Q3', source: 'Financial Statements' },
        { label: 'Q4', key: 'Q4', source: 'Financial Statements' },
        { label: 'Annual', key: 'Annual', source: 'Financial Statements' },
        { label: 'Board Report', key: 'ANY', source: 'Board Report' },
        { label: 'Sustainability Report', key: 'ANY', source: 'ESG Report' },
    ];

    const getCellData = (year: number, col: typeof COLUMNS[0]) => {
        // Start with the main source (e.g., Financial Statements)
        let items: OfficialFiling[] = [];

        // Helper to push items from a source
        const pushSourceItems = (sourceName: string) => {
            const sourceList = data[sourceName] || [];
            // FILTER BY LANGUAGE HERE
            const langFilteredList = sourceList.filter(item => item.language === currentLanguage);

            if (col.key === 'ANY') {
                // For Board/ESG, take all for the year (usually one)
                const match = langFilteredList.find(i => i.year === year);
                if (match) items.push({ ...match, source: sourceName });
            } else {
                // For Periods, match exact period
                const matches = langFilteredList.filter(i => i.year === year && i.period === col.key);
                items.push(...matches.map(m => ({ ...m, source: sourceName })));
            }
        };

        pushSourceItems(col.source);

        // If this is a Financial Statement period column, ALSO fetch XBRL for this period
        if (col.source === 'Financial Statements') {
            const xbrlList = data['XBRL'] || [];
            // FILTER XBRL BY LANGUAGE TOO
            const xbrlFiltered = xbrlList.filter(item => item.language === currentLanguage);

            // Find XBRL for same year and period
            const xbrlMatches = xbrlFiltered.filter(i => i.year === year && i.period === col.key);
            items.push(...xbrlMatches.map(m => ({ ...m, source: 'XBRL' })));
        }

        // DEDUPLICATION:
        // Ensure we don't show the exact same file (same URL) twice.
        const uniqueItems = Array.from(new Map(items.map(item => [item.file_url, item])).values());

        return uniqueItems;
    };

    const renderFileIcons = (items: OfficialFiling[]) => {
        if (!items || items.length === 0) return <span className="text-gray-300 select-none">-</span>;

        return (
            <div className="flex flex-wrap justify-center gap-1.5 align-middle">
                {items.map((item, i) => (
                    <a
                        key={i}
                        href={item.file_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-col items-center justify-center p-1 rounded hover:bg-gray-100 transition-all group relative"
                        title={`${item.period} (${item.file_type || 'File'}) - Published: ${item.published_date || 'N/A'}`}
                    >
                        {item.file_type === 'excel' || item.source === 'XBRL' ? ( // Check source or type for XBRL icon
                            <FileSpreadsheet className="w-5 h-5 text-green-600 hover:scale-110 transition-transform" />
                        ) : (
                            <FileText className="w-5 h-5 text-[#d32f2f] hover:scale-110 transition-transform" />
                        )}
                    </a>
                ))}
            </div>
        );
    };

    if (loading) return (
        <div className="flex justify-center p-8 bg-white rounded-lg border shadow-sm mt-6">
            <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border shadow-sm mt-6 text-red-500">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p>{error}</p>
            <button onClick={fetchReports} className="mt-2 text-sm underline hover:text-red-700">Retry</button>
        </div>
    );

    if (!hasData) {
        return (
            <div className="p-8 bg-white rounded-lg border shadow-sm mt-6 text-center text-gray-500">
                <p>No official filings available for this company.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-300 shadow-sm mt-8 overflow-hidden font-sans">
            {/* Language Toggle Header */}
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-700">Available Reports</h3>
                <div className="flex bg-gray-200 rounded-lg p-1">
                    <button
                        onClick={() => setCurrentLanguage('en')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${currentLanguage === 'en'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        English
                    </button>
                    <button
                        onClick={() => setCurrentLanguage('ar')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${currentLanguage === 'ar'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        العربية
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
                    <thead>
                        {/* Level 1 Header */}
                        <tr className="bg-gray-100 text-gray-800 border-b border-gray-300">
                            <th rowSpan={2} className="px-4 py-2 font-bold text-center border-r border-gray-300 w-20 bg-gray-50">Year</th>
                            {/* Expanded colspan to cover just FinStatements columns, which now usually include XBRL */}
                            <th colSpan={5} className="px-4 py-2 font-bold text-center border-r border-gray-300 bg-gray-200 text-gray-700">
                                Financial Reports (Statements & XBRL)
                            </th>
                            <th rowSpan={2} className="px-2 py-2 font-bold text-center border-r border-gray-300 w-24 bg-gray-50 text-gray-700">Board Report</th>
                            <th rowSpan={2} className="px-2 py-2 font-bold text-center w-24 bg-gray-50 text-gray-700">ESG Report</th>
                        </tr>
                        {/* Level 2 Sub-Header for Periods */}
                        <tr className="bg-[#fce4d6] text-gray-700 border-b border-gray-300">
                            <th className="px-3 py-2 font-semibold text-center border-r border-gray-300 border-t border-gray-300">Q1</th>
                            <th className="px-3 py-2 font-semibold text-center border-r border-gray-300 border-t border-gray-300">Q2</th>
                            <th className="px-3 py-2 font-semibold text-center border-r border-gray-300 border-t border-gray-300">Q3</th>
                            <th className="px-3 py-2 font-semibold text-center border-r border-gray-300 border-t border-gray-300">Q4</th>
                            <th className="px-3 py-2 font-semibold text-center border-r border-gray-300 border-t border-gray-300">Annual</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {years.map((year) => (
                            <tr key={year} className="hover:bg-gray-50 transition-colors">
                                {/* Year Column */}
                                <td className="px-4 py-3 font-bold text-center text-gray-900 bg-gray-50 border-r border-gray-300">
                                    {year}
                                </td>

                                {/* Financial Statements & XBRL Columns */}
                                {['Q1', 'Q2', 'Q3', 'Q4', 'Annual'].map(period => (
                                    <td key={period} className="px-2 py-3 text-center border-r border-gray-200 align-middle">
                                        {/* Pass proper column object reference to helper */}
                                        {renderFileIcons(getCellData(year, COLUMNS.find(c => c.key === period)!))}
                                    </td>
                                ))}

                                {/* Board Report */}
                                <td className="px-2 py-3 text-center border-r border-gray-200 align-middle">
                                    {renderFileIcons(getCellData(year, COLUMNS.find(c => c.source === 'Board Report')!))}
                                </td>

                                {/* ESG Report */}
                                <td className="px-2 py-3 text-center align-middle">
                                    {renderFileIcons(getCellData(year, COLUMNS.find(c => c.source === 'ESG Report')!))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
