"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ReportsTabs() {
  const pathname = usePathname();

  const tabs = [
    { name: 'Substantial Shareholders', href: '/market-reports/substantial-shareholders' },
    { name: 'Net Short Positions', href: '/market-reports/net-short-positions' },
    { name: 'Foreign Headroom', href: '/market-reports/foreign-headroom' },
    { name: 'Share Buybacks', href: '/market-reports/share-buybacks' },
    { name: 'SBL Positions', href: '/market-reports/sbl-positions' },
    { name: 'Historical Reports', href: '/market-reports/historical-reports' },
  ];

  return (
    <div className="flex flex-wrap gap-3 mb-8 border-b border-gray-200 pb-4">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname?.startsWith(tab.href + '/');
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
