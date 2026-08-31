"use client";

import type { CompanyKey, CompanyTemplate } from "../types";

const STATIC_TABS: [CompanyKey, string, string][] = [
  ["bank", "بنك الرياض 1010", "البنوك"],
  ["petro", "أسمنت السعودية 3030", "الدورية"],
  ["gen", "مهارة 1831", "خدمات"],
  ["ins", "التعاونية 8010", "التأمين · IFRS 17"],
  ["fin", "نايفات 4081", "شركات التمويل"],
  ["reit", "الرياض ريت 4340", "صناديق الريت"],
];

interface Props {
  activeKey: CompanyKey;
  onSelect: (key: CompanyKey) => void;
  themeBtnLabel: string;
  onToggleTheme: () => void;
  companiesData?: Record<string, CompanyTemplate>;
}

export default function TemplateSwitcher({ activeKey, onSelect, themeBtnLabel, onToggleTheme, companiesData }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E7EB] dark:border-[#2C2C2A] bg-white dark:bg-[#1A1A19] px-7 py-3 transition-colors">
      <span className="text-[12px] text-[#6B7280] dark:text-[#898781]">قالب لكل تصنيف:</span>
      {STATIC_TABS.map(([key, staticName, staticDesc]) => {
        const comp = companiesData?.[key];
        const displayName = comp
          ? (comp.en && comp.en !== comp.symbol ? `${comp.en} ${comp.symbol}` : comp.symbol)
          : staticName;
        const desc = comp ? comp.tmpl : staticDesc;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`flex flex-col items-start rounded-[4px] border px-3 py-1.5 text-right transition-colors ${activeKey === key
                ? "border-[#8C3B32] dark:border-[#3987E5] bg-[#8C3B32]/5 dark:bg-[#3987E5]/15 font-bold text-[#1A1A1A] dark:text-[#F2F1ED] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                : "border-[#E5E7EB] dark:border-[#2C2C2A] bg-white dark:bg-[#1A1A19] text-[#6B7280] dark:text-[#898781] hover:bg-[#F3F4F6] dark:hover:bg-[#222220]"
              }`}
          >
            <span className="text-[12.5px]">{displayName}</span>
            <small className="text-[10px] text-[#9CA3AF] dark:text-[#898781]">{desc}</small>
          </button>
        );
      })}
      <a
        href="/terminal/forensic-audit"
        className="flex flex-col items-start rounded-[4px] border border-[#8C3B32]/25 dark:border-[#3987E5]/25 bg-[#8C3B32]/[0.04] dark:bg-[#3987E5]/[0.08] px-3 py-1.5 text-right text-[#8C3B32] dark:text-[#3987E5] hover:bg-[#8C3B32]/10 dark:hover:bg-[#3987E5]/15 transition-colors"
      >
        <span className="text-[12.5px] font-bold">ورقة التدقيق المالي ↗</span>
        <small className="text-[10px] text-[#8C3B32]/70 dark:text-[#3987E5]/70">فحص أي سهم (تدقيق XBRL كامل)</small>
      </a>
      <button
        onClick={onToggleTheme}
        className="mr-auto rounded-[4px] border border-[#E5E7EB] dark:border-[#2C2C2A] px-3 py-1 text-[12px] text-[#6B7280] dark:text-[#898781] hover:bg-[#F3F4F6] dark:hover:bg-[#222220] transition-colors"
      >
        {themeBtnLabel}
      </button>
    </div>
  );
}