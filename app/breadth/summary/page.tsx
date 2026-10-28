'use client';
/**
 * /breadth/summary — "خلاصة اليوم" (Daily Read, Arabic RTL).
 * CR3 §12 zero-404 fix: the reference exposes the Arabic one-liner only as the
 * `summary:ar` custom-dashboard widget (template line 675); this page renders
 * the same read full-size, driven by GET /api/rebh/breadth/summary (backend
 * route added in rebh_breadth.py, regime phrase map _REGIME_AR).
 */
import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api/config';
import { authFetch } from '@/lib/api/authFetch';
import { BreadthView, PageHead } from '../_lib/BreadthView';
import { REGIME_ICONS } from '../_engine/types';

interface SummaryResp {
  date: string;
  score: number;
  regime: string;
  regime_since: string;
  ar: string;
  line: string;
}

export default function BreadthSummaryPage() {
  const [data, setData] = useState<SummaryResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    authFetch(`${API_BASE_URL}/api/rebh/breadth/summary`, { headers: { Accept: 'application/json' } })
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const j = (await res.json()) as SummaryResp;
        if (live) setData(j);
      })
      .catch((e: Error) => live && setError(e.message));
    return () => { live = false; };
  }, []);

  return (
    <BreadthView keys={[]}>
      <PageHead
        title="Daily Read — خلاصة السوق اليوم (عربي)"
        note="سطر واحد يلخّص حالة الاتساع: الدرجة، النظام، وسيازه التاريخي — من نفس محرك /breadth (نقطة API: GET /api/rebh/breadth/summary)."
      />
      <div
        dir="rtl"
        className="rounded-lg border p-4 text-[15px] leading-8"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
      >
        {error ? (
          <b style={{ color: 'var(--critical)' }}>تعذّر تحميل الملخص — {error}</b>
        ) : !data ? (
          <span style={{ color: 'var(--text2)' }}>…جارٍ التحميل</span>
        ) : (
          <>
            <div>
              <b>{data.date}</b> · درجة الاتساع <b>{data.score}</b> / 100 · النظام{' '}
              <b>
                {REGIME_ICONS[data.regime] ?? ''} {data.regime}
              </b>{' '}
              منذ {data.regime_since}
            </div>
            <div style={{ marginTop: 6, fontWeight: 700 }}>{data.ar}</div>
          </>
        )}
      </div>
      <p className="note" style={{ marginTop: 10 }}>
        السياق حسب النظام (مرجع CR3 سطر 675): Washout = تشبّع بيع تاريخي — أفضل سياق دخول · Weak = اتساع
        ضعيف بلا تشبّع بيع — الانتظار حتى Washout أو ثرست · Neutral = لا ميزة — حياد · Healthy/Strong =
        مشاركة صحية — الاتجاه مدعوم.
      </p>
    </BreadthView>
  );
}
