'use client';

import React, { useEffect, useState } from 'react';
import GuruFocusIndicatorView, { IndicatorRow } from '../_components/GuruFocusIndicatorView';
import { API_BASE_URL } from '@/lib/api/config';

export default function SP500PERatioPage() {
  const [data, setData] = useState<IndicatorRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/economic-indicators/SP500_PE?limit=50000`)
      .then((res) => res.json())
      .then((json) => {
        const arr = Array.isArray(json) ? json : [];
        const sorted = arr.sort((a: IndicatorRow, b: IndicatorRow) =>
          a.report_date.localeCompare(b.report_date)
        );
        setData(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching S&P 500 PE Ratio:', err);
        setLoading(false);
      });
  }, []);

  return (
    <GuruFocusIndicatorView
      title="S&P 500 PE Ratio"
      code="SP500_PE"
      metricLabel="PE Ratio"
      isPercent={false}
      valueDecimals={3}
      data={data}
      loading={loading}
      description="The Price-to-Earnings (P/E) ratio is a key valuation metric comparing the current S&P 500 index price against aggregate corporate earnings."
      sourceUrl="https://www.gurufocus.com/economic_indicators/57/sp-500-pe-ratio"
    />
  );
}
