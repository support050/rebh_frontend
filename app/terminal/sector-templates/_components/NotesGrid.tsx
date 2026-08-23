"use client";

import type { CompanyTemplate } from "../types";

interface Props {
  C: CompanyTemplate;
}

export default function NotesGrid({ C }: Props) {
  return (
    <details className="rounded-xl border border-white/10 bg-[#1a1a19] p-4">
      <summary className="cursor-pointer font-bold text-[13.5px] text-[#fff]">
        طبقة الإيضاحات{" "}
        <span className="font-normal text-[11.5px] text-[#898781]">
          {C.real
            ? "· أهم 3 بنود من إيضاحات الربع (توضيحية البنية — تُغذّى من الإفصاح)"
            : "· بنية توضيحية"}
        </span>
      </summary>
      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {C.notes.map((n, idx) => (
          <div key={idx} className="rounded-lg border border-[#2c2c2a] p-3 text-[12.5px]">
            <h6 className="mb-1 text-[11.5px] font-bold text-[#898781]">{n.h}</h6>
            <div className="text-[#c3c2b7]">{n.b}</div>
          </div>
        ))}
      </div>
    </details>
  );
}
