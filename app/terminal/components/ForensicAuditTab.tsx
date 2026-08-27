import React from "react";

interface AuditSummaryTabProps {
  auditData: {
    pass: number;
    na: number;
    fixed: number;
    mixed: number;
    withheld: number;
    audit_checks: string[];
    refuse_list: { type: string; text: string }[];
  };
}

export function ForensicAuditTab({ auditData }: AuditSummaryTabProps) {
  return (
    <div className="space-y-4">
      <div className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#9CA3AF]">
        Forensic Audit — Burry layer · what the engine checked, found, fixed and refuses to show
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          value={`${auditData.pass}`}
          label="balance sheets pass A = L + E°"
          sub={`of ${auditData.pass + auditData.na} with balance sheets`}
          color="up"
        />
        <KpiCard
          value={`${auditData.fixed}`}
          label="recovered from the double-count bug°"
          sub="recovery verified to the riyal on 2 companies"
          color="accent"
        />
        <KpiCard
          value={`${auditData.mixed}`}
          label="mixed-scale companies auto-normalized"
          sub="riyals vs thousands — scale field required at source"
          color=""
        />
        <KpiCard
          value={`${auditData.withheld}`}
          label="values withheld rather than shown wrong"
          sub="Maaden 4 fields · stale-priced 50 · implausible NI 1"
          color=""
        />
      </div>

      {/* The Double-Count Discovery */}
      <div className="rounded-[4px] border border-[#E5E7EB] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h3 className="border-b border-[#E5E7EB] px-4 py-3 font-bold text-[12.5px] text-[#1A1A1A]">
          The Double-Count Discovery{" "}
          <span className="font-normal text-[10px] text-[#9CA3AF]">· found today by running A = L + E on every pulled balance sheet</span>
        </h3>
        <div className="rounded-[4px] border border-[#E5E7EB] bg-[#F7F8FA] mx-4 my-3 p-3.5 text-[12px] leading-[1.7] text-[#6B7280] font-sans">
          The platform&apos;s standardized balance-sheet layer reports <b className="text-[#1A1A1A]">inflated totals in {auditData.fixed} of 220 companies</b>:
          published Total Assets = true assets + non-current assets counted twice (same for Total Liabilities).
          The engine detected it because the accounting identity failed with a gap exactly equal to the non-current subtotal,
          derived the exact recovery — <b className="text-[#1A1A1A]">TA<sub>true</sub> = (TA<sub>std</sub> + Current Assets) / 2</b> — and
          verified it to the riyal against raw filings for Dar Al Arkan (40,435.2m) and Saudi Cement (3,203m).
          All {auditData.pass} checkable balance sheets now pass. <b className="text-[#1A1A1A]">Root-cause fix assigned to the developer as priority #1</b> — the aggregator sums line items and subtotals together.
        </div>

        {/* Audit Integrity Checks */}
        <div className="grid grid-cols-1 gap-2.5 px-4 pb-4 sm:grid-cols-2" style={{ gridAutoRows: "auto" }}>
          {auditData.audit_checks.map((chk, idx) => (
            <div key={idx} className="rounded-[4px] border border-[#E5E7EB] bg-white p-3 text-[11px]">
              <b className="text-[#16A34A]">✓</b> <span className="text-[#1A1A1A]">{chk}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-[#E5E7EB] bg-[#F3F4F6] px-4 py-2.5 text-[10px] text-[#6B7280]">
          A verification badge is rendered only from an actual passing check — never from hope. Failing companies show &quot;under review&quot;, not wrong numbers.
        </div>
      </div>

      {/* What we refuse to display */}
      <div className="rounded-[4px] border border-[#E5E7EB] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h3 className="border-b border-[#E5E7EB] px-4 py-3 font-bold text-[12.5px] text-[#1A1A1A]">
          What we refuse to display <span className="font-normal text-[10px] text-[#9CA3AF]">· honesty as a feature</span>
        </h3>
        <div className="grid grid-cols-1 gap-2.5 p-4 sm:grid-cols-2">
          {auditData.refuse_list.map((item, idx) => (
            <div key={idx} className="rounded-[4px] border border-[#FECACA] bg-[#FEF2F2] p-3 text-[11px] text-[#1A1A1A]">
              <b className="text-[#DC2626]">⚑</b> {item.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ value, label, sub, color }: { value: string; label: string; sub: string; color: string }) {
  const colorClass =
    color === "up" ? "text-[#16A34A]" : color === "accent" ? "text-[#8C3B32]" : color === "down" ? "text-[#DC2626]" : "text-[#1A1A1A]";

  return (
    <div className="rounded-[4px] border border-[#E5E7EB] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className={`text-[22px] font-extrabold ${colorClass}`}>{value}</div>
      <div className="mt-1 text-[11px] text-[#1A1A1A]">{label}</div>
      <div className="text-[10px] text-[#9CA3AF]">{sub}</div>
    </div>
  );
}