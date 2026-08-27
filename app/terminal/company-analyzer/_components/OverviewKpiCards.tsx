"use client";

import React from "react";

interface Props {
  isBank: boolean;
  lastNet: number;
  lastRev: number;
  lastGn: number | null;
  lastGr: number | null;
  netTtm: number | null;
  peCur: number | null;
  tiles: readonly (readonly [string, number | null, number | null, string, string])[];
  onTileClick: (key: string) => void;
}

const PANEL = "rounded-[4px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]";

function fmt(v: number | null | undefined, d = 1) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("en-US", { maximumFractionDigits: d });
}

function pctS(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(1) + "%";
}

export default function OverviewKpiCards({
  isBank,
  lastNet,
  lastRev,
  lastGn,
  lastGr,
  netTtm,
  peCur,
  tiles,
  onTileClick,
}: Props) {
  return (
    <div className="space-y-3.5">
      {/* 4 KPIs */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`${PANEL} p-3.5`}>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
            صافي الربح (آخر ربع)
          </h4>
          <div className="text-[20px] font-bold tabular-nums text-[#1A1A1A]" dir="ltr">
            {fmt(lastNet, 1)} م
          </div>
          <div className={`text-[11px] font-bold ${lastGn && lastGn >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
            {pctS(lastGn)} على أساس سنوي
          </div>
        </div>

        <div className={`${PANEL} p-3.5`}>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
            {isBank ? "دخل العمولات (آخر ربع)" : "الإيرادات (آخر ربع)"}
          </h4>
          <div className="text-[20px] font-bold tabular-nums text-[#1A1A1A]" dir="ltr">
            {fmt(lastRev, 1)} م
          </div>
          <div className={`text-[11px] font-bold ${lastGr && lastGr >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
            {pctS(lastGr)} على أساس سنوي
          </div>
        </div>

        <div className={`${PANEL} p-3.5`}>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">صافي الربح TTM °</h4>
          <div className="text-[20px] font-bold tabular-nums text-[#1A1A1A]" dir="ltr">
            {fmt(netTtm, 0)} م
          </div>
          <div className="text-[11px] text-[#9CA3AF]">من 4 أرباع حقيقية</div>
        </div>

        <div className={`${PANEL} p-3.5`}>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">مكرر الربحية P/E °</h4>
          <div className="text-[20px] font-bold tabular-nums text-[#1A1A1A]" dir="ltr">
            {fmt(peCur, 1)}
          </div>
          <div className="text-[11px] text-[#9CA3AF]">من 4 أرباع حقيقية</div>
        </div>
      </div>

      {/* DERIVED RATIO TILES */}
      <div>
        <div className="mb-2 text-[12px] font-bold text-[#6B7280]">
          النسب المشتقة °{" "}
          <span className="font-normal">
            · كل بطاقة تفتح سلسلتها الزمنية في التحليل الأساسي — قاعدة &quot;بطاقة ← سلسلة&quot;
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {tiles.map(([h, v, p, u, key]) => (
            <div
              key={key}
              onClick={() => onTileClick(key)}
              className={`${PANEL} cursor-pointer p-3 transition-colors hover:border-[#8C3B32]`}
            >
              <h5 className="text-[10.5px] font-semibold uppercase tracking-wide text-[#6B7280]">{h}</h5>
              <div className="text-[16px] font-bold tabular-nums text-[#1A1A1A]" dir="ltr">
                {v == null ? "—" : fmt(v, 1)}
                {u === "%" ? "%" : ""}
              </div>
              <div className={`text-[10.5px] ${p != null && p >= 60 ? "text-[#16A34A]" : "text-[#9CA3AF]"}`}>
                {p != null ? `المئين ${p} في القطاع` : "—"}
              </div>
              <span className="mt-1 block text-[10px] text-[#8C3B32]">↗ السلسلة الزمنية</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
