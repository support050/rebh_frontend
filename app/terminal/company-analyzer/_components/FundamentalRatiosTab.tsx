"use client";

import React, { useState } from "react";

export interface RatioRowItem {
  k: string;
  n: string;
  s: (number | null)[] | null;
  cur: number | null;
  p: number | null;
  pk: string | null;
  f: string;
  inv?: boolean;
  x?: number;
  pct?: boolean;
}

export interface RatioGroupItem {
  t: string;
  rows: RatioRowItem[];
  note?: string;
}

interface Props {
  ratioGroups: RatioGroupItem[];
  rg: number;
  setRg: (idx: number) => void;
  hl: string | null;
  setHl: (k: string | null) => void;
  periodsQ: string[];
  peersCount: number;
  peersMap: Record<string, [string, string, number][]>;
  currentSym: string;
}

const PANEL = "rounded-[4px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]";
const MUTED_BAND = "bg-[#F3F4F6]";
const PILL_ACTIVE =
  "border-[#8C3B32] bg-[#8C3B32]/10 font-bold text-[#8C3B32] shadow-[0_1px_3px_rgba(0,0,0,0.06)]";
const PILL_INACTIVE = "border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F3F4F6]";

function fmt(v: number | null | undefined, d = 1) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("en-US", { maximumFractionDigits: d });
}

function pctS(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(1) + "%";
}

export default function FundamentalRatiosTab({
  ratioGroups,
  rg,
  setRg,
  hl,
  setHl,
  periodsQ,
  peersCount,
  peersMap,
  currentSym,
}: Props) {
  const [activePeersPk, setActivePeersPk] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {/* L3 Groups */}
      <div className="flex flex-wrap gap-2">
        {ratioGroups.map((g, idx) => (
          <button
            key={idx}
            onClick={() => {
              setRg(idx);
              setHl(null);
            }}
            className={`rounded-full border px-3.5 py-1 text-[11.5px] transition-colors ${
              rg === idx ? PILL_ACTIVE : PILL_INACTIVE
            }`}
          >
            {g.t}
          </button>
        ))}
      </div>

      <div className={`${PANEL} overflow-hidden`}>
        <h3 className="px-4 pt-3 text-[13px] font-bold text-[#1A1A1A]">
          نسب {ratioGroups[rg]?.t} — سلاسل زمنية من الأرقام الحقيقية
        </h3>
        <div className="px-4 pb-2 text-[10.5px] text-[#6B7280]">
          مرّر على اسم أي نسبة لمعادلتها · عمود &quot;مقابل القطاع&quot; = المئين الفعلي وسط أقران القطاع المحدثين من قاعدة
          ربح ({peersCount} شركات) · زر &quot;الأقران&quot; يفتح الترتيب الحقيقي
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className={`border-b border-[#E5E7EB] ${MUTED_BAND}`}>
                <th
                  className={`sticky inset-inline-start-0 z-10 ${MUTED_BAND} px-3 py-2 text-right text-[10.5px] font-semibold text-[#6B7280]`}
                >
                  النسبة
                </th>
                {periodsQ.map((p) => (
                  <th key={p} className="px-2.5 py-2 text-left text-[10.5px] font-semibold text-[#6B7280]">
                    {p}
                  </th>
                ))}
                <th className="px-2.5 py-2 text-left text-[10.5px] font-semibold text-[#6B7280]">
                  الحالي (TTM)
                </th>
                <th className="px-2.5 py-2 text-left text-[10.5px] font-semibold text-[#6B7280]">
                  مقابل القطاع
                </th>
                <th className="px-2.5 py-2 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {ratioGroups[rg]?.rows.map((r) => {
                const isHl = hl === r.k;
                const pVal = r.p;
                const verdict =
                  pVal == null ? (
                    <span className="rounded bg-[#F3F4F6] px-1.5 text-[10px] text-[#6B7280]">—</span>
                  ) : pVal >= 67 ? (
                    <span className="rounded bg-[#16A34A]/10 px-1.5 text-[10px] font-bold text-[#16A34A]">
                      إيجابي
                    </span>
                  ) : pVal >= 34 ? (
                    <span className="rounded bg-[#F3F4F6] px-1.5 text-[10px] text-[#6B7280]">محايد</span>
                  ) : (
                    <span className="rounded bg-[#DC2626]/10 px-1.5 text-[10px] font-bold text-[#DC2626]">
                      سلبي
                    </span>
                  );

                const curTxt =
                  r.cur == null
                    ? "—"
                    : "x" in r && r.x
                    ? fmt(r.cur, 2)
                    : "pct" in r && r.pct
                    ? pctS(r.cur)
                    : fmt(r.cur, 1) + "%";

                return (
                  <React.Fragment key={r.k}>
                    <tr
                      data-k={r.k}
                      className={`border-b border-[#E5E7EB] ${
                        isHl ? "bg-[#8C3B32]/10" : "hover:bg-[#F3F4F6]"
                      }`}
                    >
                      <td
                        className="sticky inset-inline-start-0 z-10 whitespace-nowrap bg-white px-3 py-2 text-right font-medium text-[#1A1A1A] shadow-[-1px_0_0_#E5E7EB_inset]"
                        title={`المعادلة: ${r.f}`}
                      >
                        {r.n}
                      </td>

                      {!r.s ? (
                        <td colSpan={periodsQ.length} className="px-2.5 py-2 text-[11px] text-[#9CA3AF]">
                          السلسلة الربعية قادمة — القيمة الحالية TTM حقيقية
                        </td>
                      ) : (
                        r.s.map((val, idx) => (
                          <td
                            key={idx}
                            className={`whitespace-nowrap px-2.5 py-2 text-left tabular-nums ${
                              val == null
                                ? "text-[#9CA3AF]"
                                : "pct" in r && r.pct && val < 0
                                ? "text-[#DC2626]"
                                : "text-[#1A1A1A]"
                            }`}
                            dir="ltr"
                          >
                            {val == null ? "·" : "pct" in r && r.pct ? pctS(val) : fmt(val, 1) + "%"}
                          </td>
                        ))
                      )}

                      <td
                        className="whitespace-nowrap px-2.5 py-2 text-left font-bold tabular-nums text-[#1A1A1A]"
                        dir="ltr"
                      >
                        {curTxt}
                      </td>

                      <td className="whitespace-nowrap px-2.5 py-2 text-left">
                        {pVal == null ? (
                          verdict
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-[54px] overflow-hidden rounded-full bg-[#F3F4F6]">
                              <div
                                className="h-full rounded-full bg-[#8C3B32]"
                                style={{ width: `${pVal}%` }}
                              />
                            </div>
                            <span className="text-[10.5px] tabular-nums text-[#1A1A1A]" dir="ltr">
                              {pVal}
                            </span>
                            {verdict}
                          </div>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-2.5 py-2 text-left">
                        {r.pk && (
                          <button
                            onClick={() =>
                              setActivePeersPk(activePeersPk === r.pk ? null : (r.pk as string))
                            }
                            className="rounded border border-[#E5E7EB] px-2 py-0.5 text-[10.5px] text-[#8C3B32] hover:bg-[#F3F4F6]"
                          >
                            الأقران ▾
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* PEERS EXPANDED ROW */}
                    {activePeersPk && activePeersPk === r.pk && (
                      <tr className={MUTED_BAND}>
                        <td colSpan={periodsQ.length + 4} className="p-3.5">
                          <b className="mb-2 block text-[11px] text-[#1A1A1A]">
                            ترتيب القطاع الفعلي ({peersMap[activePeersPk]?.length || 0} شركة محدثة — من قاعدة
                            ربح):
                          </b>
                          <div className="space-y-1">
                            {(() => {
                              const peersList: [string, string, number][] = peersMap[activePeersPk] || [];
                              const maxVal = peersList.length > 0
                                ? Math.max(...peersList.map((p) => Math.abs(p[2] || 0)), 1e-9)
                                : 1;

                              return peersList.map(([symCode, name, val]: [string, string, number]) => {
                                const isMe = symCode === currentSym;
                                const absVal = Math.abs(val || 0);
                                const barW = Math.max(Math.min(100, (absVal / maxVal) * 100), 2);

                                return (
                                  <div key={symCode} className="flex items-center gap-2 text-[11px]">
                                    <span
                                      className={`w-[140px] truncate text-right ${
                                        isMe ? "font-bold text-[#8C3B32]" : "text-[#6B7280]"
                                      }`}
                                      title={name}
                                    >
                                      {name.replace(/Co\.|Ltd\.|Company|Corporation|for Investment|Holding/gi, "").trim()}{" "}
                                      {isMe ? "◀" : ""}
                                    </span>
                                    <div className="h-2.5 flex-1 max-w-[400px] overflow-hidden rounded-full bg-[#E5E7EB]">
                                      <div
                                        className={`h-full rounded-full transition-all ${
                                          isMe ? "bg-[#8C3B32]" : "bg-[#9CA3AF]"
                                        }`}
                                        style={{ width: `${barW}%` }}
                                      />
                                    </div>
                                    <span className="w-12 text-left text-[10.5px] font-semibold tabular-nums text-[#1A1A1A]" dir="ltr">
                                      {fmt(val, 1)}
                                    </span>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-[#E5E7EB] px-4 py-2.5 text-[11px] text-[#9CA3AF]">
          <span>° محسوب من TTM/أرباع حقيقية · المئين من الشركات المحدثة في القطاع فقط</span>
          <span>{ratioGroups[rg]?.note || ""}</span>
        </div>
      </div>
    </div>
  );
}
