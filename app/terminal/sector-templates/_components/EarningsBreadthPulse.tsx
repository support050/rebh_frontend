"use client";

import type { SectorPulse } from "../types";

interface Props {
  pulseData: SectorPulse[];
}

export default function EarningsBreadthPulse({ pulseData }: Props) {
  return (
    <div className="rounded-[4px] border border-[#E5E7EB] dark:border-[#2C2C2A] bg-white dark:bg-[#1A1A19] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors">
      <h3 className="text-[14px] font-bold text-[#1A1A1A] dark:text-[#F2F1ED]">نبض القطاعات — Earnings Breadth °</h3>
      <div className="mb-2 text-[11.5px] text-[#6B7280] dark:text-[#898781]">
        تجميع نفس القوالب عبر السوق: ٪ الشركات التي تتسارع أرباحها في كل قطاع، مقروءاً بجوار اتجاه مؤشر سعر القطاع —
        الافتراق بينهما هو الإشارة (منهج Dow). بيانات توضيحية لعرض الموديول.
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-[#E5E7EB] dark:border-[#2C2C2A] bg-[#F3F4F6] dark:bg-[#222220] text-[11.5px] text-[#6B7280] dark:text-[#898781]">
              <th className="py-2 px-2 text-right">القطاع</th>
              <th className="py-2 px-2 text-left">شركات متسارعة</th>
              <th className="py-2 px-2 text-left">متباطئة</th>
              <th className="py-2 px-2 text-left">Breadth</th>
              <th className="py-2 px-2 text-left"></th>
              <th className="py-2 px-2 text-left">مؤشر سعر القطاع</th>
              <th className="py-2 px-2 text-left">القراءة</th>
            </tr>
          </thead>
          <tbody>
            {pulseData.map((p, idx) => {
              const tot = p.up + p.dn;
              const b = Math.round((p.up / (tot || 1)) * 100);
              return (
                <tr key={idx} className="border-b border-[#E5E7EB] dark:border-[#2C2C2A] hover:bg-[#F7F8FA] dark:hover:bg-[#222220] transition-colors">
                  <td className="py-2 px-2 text-right font-bold text-[#1A1A1A] dark:text-[#F2F1ED]">{p.s}</td>
                  <td className="py-2 px-2 text-left tabular-nums text-[#1A1A1A] dark:text-[#F2F1ED]">{p.up}</td>
                  <td className="py-2 px-2 text-left tabular-nums text-[#1A1A1A] dark:text-[#F2F1ED]">{p.dn}</td>
                  <td className="py-2 px-2 text-left font-bold tabular-nums text-[#1A1A1A] dark:text-[#F2F1ED]">{b}%</td>
                  <td className="py-2 px-2 text-left">
                    <div className="h-2 w-[130px] overflow-hidden rounded-full bg-[#F3F4F6] dark:bg-[#222220]">
                      <div className="h-full rounded-full bg-[#8C3B32] dark:bg-[#3987E5]" style={{ width: `${b}%` }} />
                    </div>
                  </td>
                  <td className="py-2 px-2 text-left font-bold tabular-nums text-[#1A1A1A] dark:text-[#F2F1ED]" dir="ltr">
                    {p.px}
                  </td>
                  <td className="py-2 px-2 text-left">
                    {p.div ? (
                      <span className="text-[11px] font-bold text-[#DC2626]">
                        ⚠ افتراق: الأرباح تتسارع والسعر يهبط — إشارة داو
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#9CA3AF] dark:text-[#898781]">متوافقان</span>
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