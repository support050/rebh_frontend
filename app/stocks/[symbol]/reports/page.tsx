'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronDown, FileText, Loader2 } from 'lucide-react';
import FinancialReportsTable from '../../_components/FinancialReportsTable';
import { API_BASE_URL } from '@/lib/api/config';
import { authFetch } from '@/lib/api/authFetch';

interface Company {
    symbol: string;
    name_en: string | null;
}

export default function ReportsPage() {
    const router = useRouter();
    const params = useParams();
    const currentSymbol = params.symbol as string;

    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    const API_BASE = API_BASE_URL;

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const res = await authFetch(`${API_BASE}/api/scraper/companies`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setCompanies(data);
            }
        } catch (err) {
            console.error('Failed to fetch companies:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSymbolChange = (symbol: string) => {
        router.push(`/stocks/${symbol}/reports`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="w-7 h-7 text-red-600" />
                                Official Financial Reports
                            </h1>
                            <p className="text-gray-500 mt-1">التقارير المالية الرسمية (PDF/Excel)</p>
                        </div>

                        {/* Company Selector */}
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <select
                                    value={currentSymbol}
                                    onChange={(e) => handleSymbolChange(e.target.value)}
                                    disabled={loading}
                                    className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[250px]"
                                >
                                    {loading ? (
                                        <option>Loading...</option>
                                    ) : companies.length === 0 ? (
                                        <option value={currentSymbol}>{currentSymbol}</option>
                                    ) : (
                                        companies.map(company => (
                                            <option key={company.symbol} value={company.symbol}>
                                                {company.symbol} - {company.name_en || 'Unknown'}
                                            </option>
                                        ))
                                    )}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
                <FinancialReportsTable symbol={currentSymbol} />
            </div>
        </div>
    );
}