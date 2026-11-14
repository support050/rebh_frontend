import React from 'react';

export const metadata = {
  title: 'Historical Treasury Yield Spread (10Y-2Y) | LUMIVST',
  description: '10-Year Treasury Constant Maturity Minus 2-Year Treasury Constant Maturity.',
};

export default function HistoricalTreasuryYieldSpreadPage() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Historical Treasury Yield Spread (10Y-2Y)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          10-Year Treasury Constant Maturity Minus 2-Year Treasury Constant Maturity (FRED: T10Y2Y).
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm flex flex-col items-center justify-center min-h-[350px] text-center">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          Historical Treasury Yield Spread (10Y-2Y)
        </h3>
        <p className="text-sm text-gray-500 mt-2 max-w-md">
          This page is currently being prepared. Data integration and interactive visualization will be available soon.
        </p>
      </div>
    </div>
  );
}

