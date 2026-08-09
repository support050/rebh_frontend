'use client';

import { Search, FileSpreadsheet, FileText, LayoutGrid, Table } from 'lucide-react';
import { useState } from 'react';
import { useRouter, useParams, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export function StocksTopBar() {
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Get symbol from route params OR query string (for dashboard/financials)
    const currentSymbol = (params?.symbol as string) || searchParams.get('symbol') || '1010';
    const [query, setQuery] = useState('');

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && query.trim()) {
            const symbol = query.trim().toUpperCase();

            // Check if we are currently on a specific tab
            // This allows switching stocks while staying on the same view (Reports, Details, etc.)
            if (pathname?.includes('/dashboard/financials')) {
                router.push(`/dashboard/financials?symbol=${symbol}`);
            } else if (pathname?.includes('/reports')) {
                router.push(`/stocks/${symbol}/reports`);
            } else if (pathname?.includes('/financials')) {
                router.push(`/stocks/${symbol}/financials`);
            } else {
                router.push(`/stocks/${symbol}`);
            }
        }
    };

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
            {/* Search Bar */}
            <div className="relative max-w-md w-full">
                <input
                    type="text"
                    placeholder="Search Symbols (e.g. 1010, 1120)..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleSearch}
                />
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-2">
                <Link
                    href="/dashboard/financials"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
                >
                    <FileSpreadsheet className="w-4 h-4" />
                    Financials
                </Link>

                <Link
                    href={`/stocks/${currentSymbol || '1010'}/reports`}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all"
                >
                    <FileText className="w-4 h-4" />
                    Reports
                </Link>



                <Link
                    href="/rs-screener"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                >
                    <LayoutGrid className="w-4 h-4" />
                    RS Matrix
                </Link>
            </div>


        </div>
    );
}
