'use client';

import { Search, FileSpreadsheet, FileText } from 'lucide-react';
import { useState } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import Link from 'next/link';

export function StocksTopBar() {
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();

    const currentSymbol = (params?.symbol as string) || '1010';
    const [query, setQuery] = useState('');

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && query.trim()) {
            const symbol = query.trim().toUpperCase();

            if (pathname?.includes('/reports')) {
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

            <div className="flex items-center gap-2">
                <Link
                    href={`/stocks/${currentSymbol}/financials`}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
                >
                    <FileSpreadsheet className="w-4 h-4" />
                    Financials
                </Link>

                <Link
                    href={`/stocks/${currentSymbol}/reports`}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all"
                >
                    <FileText className="w-4 h-4" />
                    Reports
                </Link>
            </div>
        </div>
    );
}
