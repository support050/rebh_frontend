"use client";

import type { CompanyKey } from "../types";

const TABS: [CompanyKey, string, string][] = [
  ["bank", "بنك الرياض 1010", "البنوك · حقيقي + °2024"],
  ["petro", "أسمنت السعودية 3030", "الدورية · بيانات حقيقية"],
  ["gen", "مهارة 1831", "خدمات · بيانات حقيقية"],
  ["ins", "التعاونية 8010", "التأمين · IFRS 17"],
  ["fin", "نايفات 4081", "شركات التمويل"],
  ["reit", "الرياض ريت 4340", "صناديق الريت"],
];

interface Props {
  activeKey: CompanyKey;
  onSelect: (key: CompanyKey) => void;
  themeBtnLabel: string;
  onToggleTheme: () => void;
}

export default function TemplateSwitcher({ activeKey, onSelect, themeBtnLabel, onToggleTheme }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#1a1a19] px-7 py-3">
      <span className="text-[12px] text-[#898781]">قالب لكل تصنيف:</span>
      {TABS.map(([key, name, desc]) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={`flex flex-col items-start rounded-xl border px-3 py-1.5 text-right transition-colors ${
            activeKey === key
              ? "border-[#3987e5] bg-[#184f95]/30 font-bold text-[#fff]"
              : "border-white/10 bg-[#1a1a19] text-[#c3c2b7] hover:bg-[#222220]"
          }`}
        >
          <span className="text-[12.5px]">{name}</span>
          <small className="text-[10px] text-[#898781]">{desc}</small>
        </button>
      ))}
      <a
        href="/terminal/forensic-audit"
        className="flex flex-col items-start rounded-xl border border-[#e8c464]/30 bg-[#38301a]/30 px-3 py-1.5 text-right text-[#e8c464] hover:bg-[#38301a]/60 transition-colors"
      >
        <span className="text-[12.5px] font-bold">ورقة التدقيق المالي ↗</span>
        <small className="text-[10px] text-[#e8c464]/70">فحص أي سهم (تدقيق XBRL كامل)</small>
      </a>
      <button
        onClick={onToggleTheme}
        className="mr-auto rounded-lg border border-white/10 px-3 py-1 text-[12px] text-[#c3c2b7] hover:bg-[#222220]"
      >
        {themeBtnLabel}
      </button>
    </div>
  );
}
