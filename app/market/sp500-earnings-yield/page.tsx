'use client';

import React, { useEffect, useState } from 'react';
import GuruFocusIndicatorView, { IndicatorRow } from '../_components/GuruFocusIndicatorView';
import { API_BASE_URL } from '@/lib/api/config';

export default function SP500EarningsYieldPage() {
  const [data, setData] = useState<IndicatorRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/economic-indicators/SP500_EY?limit=50000`)
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
        console.error('Error fetching S&P 500 Earnings Yield:', err);
        setLoading(false);
      });
  }, []);

  return (
    <GuruFocusIndicatorView
      title="S&P 500 Earnings Yield"
      code="SP500_EY"
      metricLabel="Earnings Yield"
      isPercent={true}
      valueDecimals={3}
      data={data}
      loading={loading}
      description="Historically, S&P 500 Earnings Yield has ranged from lows during market peaks to highs during deep market recessions."
      sourceUrl="https://www.gurufocus.com/economic_indicators/151/sp-500-earnings-yield"
    />
  );
}
