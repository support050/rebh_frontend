'use client';

import React, { useEffect, useState } from 'react';
import GuruFocusIndicatorView, { IndicatorRow } from '../_components/GuruFocusIndicatorView';
import { API_BASE_URL } from '@/lib/api/config';

export default function SP500PERatioForwardEstimatePage() {
  const [data, setData] = useState<IndicatorRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/economic-indicators/SP500_FPE?limit=50000`)
      .then((res) => res.json())
      .then((json) => {
        const arr = Array.isArray(json) ? json : [];
        // Sort ascending by date (chart needs oldest→newest)
        const sorted = arr.sort((a: IndicatorRow, b: IndicatorRow) =>
          a.report_date.localeCompare(b.report_date)
        );
        setData(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching S&P 500 Forward PE Ratio:', err);
        setLoading(false);
      });
  }, []);

  return (
    <GuruFocusIndicatorView
      title="S&P 500 PE Ratio with Forward Estimate"
      code="SP500_FPE"
      metricLabel="Forward PE Ratio"
      isPercent={false}
      valueDecimals={3}
      data={data}
      loading={loading}
      description="The S&P 500 P/E Ratio with Forward Estimate uses analyst consensus earnings forecasts for the next 12 months, providing a forward-looking valuation metric for the index."
      sourceUrl="https://www.gurufocus.com/economic_indicators/6061/sp-500-pe-ratio-with-forward-estimate"
    />
  );
}
