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
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-[1.2px] text-[#898781]">
        FORENSIC AUDIT — BURRY LAYER · what the engine checked, found, fixed and refuses to show
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          color="gold"
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
      <div className="rounded-xl border border-white/10 bg-[#1a1a19] overflow-hidden">
        <h3 className="border-b border-white/10 px-3.5 py-2.5 font-bold text-[12.5px]">
          The Double-Count Discovery{" "}
          <span className="font-normal text-[10px] text-[#898781]">· found today by running A = L + E on every pulled balance sheet</span>
        </h3>
        <div className="rounded-lg bg-[#222220] mx-3.5 my-2.5 p-3 text-[12px] leading-[1.7] text-[#c3c2b7] font-sans">
          The platform&apos;s standardized balance-sheet layer reports <b className="text-[#f2f1ed]">inflated totals in {auditData.fixed} of 220 companies</b>:
          published Total Assets = true assets + non-current assets counted twice (same for Total Liabilities).
          The engine detected it because the accounting identity failed with a gap exactly equal to the non-current subtotal,
          derived the exact recovery — <b className="text-[#f2f1ed]">TA<sub>true</sub> = (TA<sub>std</sub> + Current Assets) / 2</b> — and
          verified it to the riyal against raw filings for Dar Al Arkan (40,435.2m) and Saudi Cement (3,203m).
          All {auditData.pass} checkable balance sheets now pass. <b className="text-[#f2f1ed]">Root-cause fix assigned to the developer as priority #1</b> — the aggregator sums line items and subtotals together.
        </div>

        {/* Audit Integrity Checks */}
        <div className="grid grid-cols-1 gap-2 px-3.5 pb-3 sm:grid-cols-2" style={{ gridAutoRows: "auto" }}>
          {auditData.audit_checks.map((chk, idx) => (
            <div key={idx} className="rounded-lg border border-white/10 p-2.5 text-[11px]">
              <b className="text-[#0ca30c]">✓</b> {chk}
            </div>
          ))}
        </div>
        <div className="border-t border-[#2c2c2a] px-3.5 py-2 text-[10px] text-[#898781]">
          A verification badge is rendered only from an actual passing check — never from hope. Failing companies show &quot;under review&quot;, not wrong numbers.
        </div>
      </div>

      {/* What we refuse to display */}
      <div className="rounded-xl border border-white/10 bg-[#1a1a19] overflow-hidden">
        <h3 className="border-b border-white/10 px-3.5 py-2.5 font-bold text-[12.5px]">
          What we refuse to display <span className="font-normal text-[10px] text-[#898781]">· honesty as a feature</span>
        </h3>
        <div className="grid grid-cols-1 gap-2 p-3.5 sm:grid-cols-2">
          {auditData.refuse_list.map((item, idx) => (
            <div key={idx} className="rounded-lg border border-[#e8c464]/30 p-2.5 text-[11px]">
              <b className="text-[#e8c464]">⚑</b> {item.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ value, label, sub, color }: { value: string; label: string; sub: string; color: string }) {
  const colorClass =
    color === "up" ? "text-[#0ca30c]" : color === "gold" ? "text-[#d9b64a]" : color === "down" ? "text-[#e66767]" : "";

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a19] p-3.5">
      <div className={`text-[22px] font-extrabold ${colorClass}`}>{value}</div>
      <div className="text-[11px] text-[#c3c2b7] mt-0.5">{label}</div>
      <div className="text-[10px] text-[#898781]">{sub}</div>
    </div>
  );
}
