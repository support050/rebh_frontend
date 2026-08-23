"use client";

import type { SectorPulse } from "../types";

interface Props {
  pulseData: SectorPulse[];
}

export default function EarningsBreadthPulse({ pulseData }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a19] p-4">
      <h3 className="text-[14px] font-bold text-[#fff]">نبض القطاعات — Earnings Breadth °</h3>
      <div className="mb-2 text-[11.5px] text-[#898781]">
        تجميع نفس القوالب عبر السوق: ٪ الشركات التي تتسارع أرباحها في كل قطاع، مقروءاً بجوار اتجاه مؤشر سعر القطاع —
        الافتراق بينهما هو الإشارة (منهج Dow). بيانات توضيحية لعرض الموديول.
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-[#383835] text-[11.5px] text-[#898781]">
              <th className="py-2 text-right">القطاع</th>
              <th className="py-2 text-left">شركات متسارعة</th>
              <th className="py-2 text-left">متباطئة</th>
              <th className="py-2 text-left">Breadth</th>
              <th className="py-2 text-left"></th>
              <th className="py-2 text-left">مؤشر سعر القطاع</th>
              <th className="py-2 text-left">القراءة</th>
            </tr>
          </thead>
          <tbody>
            {pulseData.map((p, idx) => {
              const tot = p.up + p.dn;
              const b = Math.round((p.up / (tot || 1)) * 100);
              return (
                <tr key={idx} className="border-b border-[#2c2c2a]">
                  <td className="py-2 text-right font-bold text-[#fff]">{p.s}</td>
                  <td className="py-2 text-left tabular-nums">{p.up}</td>
                  <td className="py-2 text-left tabular-nums">{p.dn}</td>
                  <td className="py-2 text-left font-bold tabular-nums">{b}%</td>
                  <td className="py-2 text-left">
                    <div className="h-2 w-[130px] overflow-hidden rounded-full bg-[#262624]">
                      <div className="h-full rounded-full bg-[#3987e5]" style={{ width: `${b}%` }} />
                    </div>
                  </td>
                  <td className="py-2 text-left font-bold tabular-nums" dir="ltr">
                    {p.px}
                  </td>
                  <td className="py-2 text-left">
                    {p.div ? (
                      <span className="text-[11px] font-bold text-[#e66767]">
                        ⚠ افتراق: الأرباح تتسارع والسعر يهبط — إشارة داو
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#898781]">متوافقان</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
