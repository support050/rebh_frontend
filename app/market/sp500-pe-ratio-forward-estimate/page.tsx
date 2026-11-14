import React from 'react';

export const metadata = {
  title: 'S&P 500 PE Ratio with Forward Estimate | LUMIVST',
  description: 'S&P 500 PE Ratio with Forward Estimate analysis and charts.',
};

export default function SP500PERatioWithForwardEstimatePage() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          S&P 500 PE Ratio with Forward Estimate
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Historical and forward-looking P/E ratio estimates for the S&P 500.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm flex flex-col items-center justify-center min-h-[350px] text-center">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          S&P 500 PE Ratio with Forward Estimate
        </h3>
        <p className="text-sm text-gray-500 mt-2 max-w-md">
          This page is currently being prepared. Data integration and interactive visualization will be available soon.
        </p>
      </div>
    </div>
  );
}

