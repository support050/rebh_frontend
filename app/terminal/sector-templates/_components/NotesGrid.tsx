"use client";

import type { CompanyTemplate } from "../types";

interface Props {
  C: CompanyTemplate;
}

export default function NotesGrid({ C }: Props) {
  return (
    <details className="rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <summary className="cursor-pointer font-bold text-[13.5px] text-[#1A1A1A]">
        طبقة الإيضاحات{" "}
        <span className="font-normal text-[11.5px] text-[#6B7280]">
          {C.real
            ? "· أهم 3 بنود من إيضاحات الربع (توضيحية البنية — تُغذّى من الإفصاح)"
            : "· بنية توضيحية"}
        </span>
      </summary>
      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {C.notes.map((n, idx) => (
          <div key={idx} className="rounded-[4px] border border-[#E5E7EB] bg-[#F7F8FA] p-3 text-[12.5px]">
            <h6 className="mb-1 text-[11.5px] font-bold text-[#6B7280]">{n.h}</h6>
            <div className="text-[#1A1A1A]">{n.b}</div>
          </div>
        ))}
      </div>
    </details>
  );
}