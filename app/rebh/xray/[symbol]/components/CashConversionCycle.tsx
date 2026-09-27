import React from "react";
import { Zap, ArrowLeft } from "lucide-react";
import { SectionPanel, KpiCard } from "./CommonCards";

interface CashConversionCycleProps {
  dso: number | null;
  dIO: number | null;
  dPO: number | null;
  cfoNi: number | null;
  ta: number;
  fcf: number;
  debtCover: number | null;
  opm: number | null;
  workingCapital: number;
  showFormulas: boolean;
}

export function CashConversionCycleSection({
  dso,
  dIO,
  dPO,
  cfoNi,
  ta,
  fcf,
  debtCover,
  opm,
  workingCapital,
  showFormulas,
}: CashConversionCycleProps) {
  const fcfYield = ta > 0 ? (fcf / ta) * 100 : null;

  return (
    <SectionPanel className="space-y-4">
      <div className="flex flex-wrap items-center justify-between border-b border-[#E5E7EB] pb-3 gap-2">
        <div>
          <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
            <Zap size={15} className="text-[#8C3B32]" />
            دورة التحويل النقدي المباشرة — Cash Conversion Cycle (CCC)
          </h3>
          <p className="text-xs text-[#6B7280] mt-0.5">
            كم يوماً يحتاج الريال من خروجه كمخزون حتى عودته كاش في الحساب البنكي
          </p>
        </div>
        {dso != null && dIO != null && dPO != null && (
          <span className="inline-flex items-center gap-1.5 text-xs font-black font-mono px-3.5 py-1.5 rounded-full bg-gradient-to-l from-[#16A34A] to-[#15803D] text-white shadow-[0_2px_8px_rgba(22,163,74,0.35)] tabular-nums">
            CCC {Math.max(0, dso + dIO - dPO)} يوم عمل
          </span>
        )}
      </div>

      {/* Connected Cash-Flow Pipeline: DSO → DIO → DPO */}
      <div className="flex flex-col md:flex-row items-stretch gap-0">
        {[
          {
            label: "فترة التحصيل",
            code: "DSO",
            val: dso,
            color: "#D97706",
            bg: "#FFFBEB",
            border: "#FDE68A",
            formula: "الذمم المدينة ÷ الإيراد × 365",
          },
          {
            label: "فترة بقاء المخزون",
            code: "DIO",
            val: dIO,
            color: "#2563EB",
            bg: "#EFF6FF",
            border: "#BFDBFE",
            formula: "المخزون ÷ تكلفة المبيعات × 365",
          },
          {
            label: "فترة سداد الموردين",
            code: "DPO",
            val: dPO,
            color: "#16A34A",
            bg: "#F0FDF4",
            border: "#BBF7D0",
            formula: "الدائنون ÷ تكلفة المبيعات × 365",
          },
        ].map((stage, i, arr) => (
          <React.Fragment key={stage.code}>
            <div
              className="flex-1 rounded-[8px] p-3.5 text-center transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_4px_14px_rgba(15,23,42,0.08)]"
              style={{ backgroundColor: stage.bg, border: `1px solid ${stage.border}` }}
            >
              <span
                className="text-[9px] font-black tracking-wide font-mono block"
                style={{ color: stage.color }}
              >
                {stage.code}
              </span>
              <span className="text-[10px] font-semibold text-[#64748B] block mt-0.5">
                {stage.label}
              </span>
              <span
                className="text-xl font-black font-mono block mt-1.5 tabular-nums"
                style={{ color: stage.color }}
              >
                {stage.val != null ? `${stage.val} يوم` : "—"}
              </span>
              <span className="text-[9.5px] text-[#94A3B8] block mt-1">{stage.formula}</span>
            </div>
            {i < arr.length - 1 && (
              <div className="flex items-center justify-center px-1 shrink-0 rotate-90 md:rotate-0">
                <ArrowLeft size={16} className="text-[#CBD5E1]" strokeWidth={2.5} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Additional Working Capital & Quality KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
        <KpiCard
          label="CFO/NI (تحويل الأرباح)"
          val={cfoNi}
          unit="%"
          color={
            cfoNi != null
              ? cfoNi >= 100
                ? "#16A34A"
                : cfoNi >= 60
                  ? "#D97706"
                  : "#DC2626"
              : "#94A3B8"
          }
          note={
            cfoNi != null
              ? cfoNi >= 100
                ? "✓ كاش ممتاز"
                : cfoNi >= 60
                  ? "◑ مقبول"
                  : "✗ جودة منخفضة"
              : "—"
          }
          formula="CFO ÷ صافي الربح × 100"
          showFormula={showFormulas}
          tooltipText="نسبة صافي الربح المحاسبي المحول فعلياً إلى تدفق نقدي تشغيلي داخل البنك"
        />

        <KpiCard
          label="FCF Yield على الأصول"
          val={fcfYield}
          unit="%"
          color={
            fcfYield != null
              ? fcfYield > 5
                ? "#16A34A"
                : fcfYield > 0
                  ? "#D97706"
                  : "#DC2626"
              : "#94A3B8"
          }
          note={
            fcfYield != null
              ? fcfYield > 5
                ? "✓ عائد نقدي قوي"
                : fcfYield > 0
                  ? "◑ معقول"
                  : "✗ FCF سلبي"
              : "—"
          }
          formula="FCF ÷ إجمالي الأصول × 100"
          showFormula={showFormulas}
          tooltipText="عائد التدفق الحر الفعلي المولد من كل ريال مستثمر في أصول الشركة"
        />

        <KpiCard
          label="تغطية الدين بالتشغيل"
          val={debtCover}
          unit="× سنوات"
          color={
            debtCover != null
              ? debtCover <= 3
                ? "#16A34A"
                : debtCover <= 6
                  ? "#D97706"
                  : "#DC2626"
              : "#94A3B8"
          }
          note={
            debtCover != null
              ? debtCover <= 3
                ? "✓ تسديد سريع"
                : debtCover <= 6
                  ? "◑ متوسط"
                  : "✗ عبء ديون مرتفع"
              : "—"
          }
          formula="إجمالي الديون ÷ CFO"
          showFormula={showFormulas}
          tooltipText="عدد السنوات اللازمة لسداد كافة ديون الشركة باستخدام تدفقها التشغيلي الحالي"
        />

        <KpiCard
          label="هامش التشغيل (EBIT%)"
          val={opm}
          unit="%"
          color={
            opm != null
              ? opm >= 15
                ? "#16A34A"
                : opm >= 5
                  ? "#D97706"
                  : "#DC2626"
              : "#94A3B8"
          }
          note={
            opm != null
              ? opm >= 15
                ? "✓ ربحية تشغيلية قوية"
                : opm >= 5
                  ? "◑ معقول"
                  : "✗ ضغط تشغيلي"
              : "—"
          }
          formula="الربح التشغيلي ÷ الإيرادات × 100"
          showFormula={showFormulas}
          tooltipText="هامش أرباح النشاط الأساسي قبل خصم تكاليف التمويل والزكاة والضرائب"
        />

        <KpiCard
          label="رأس المال العامل"
          val={workingCapital}
          unit="M SAR"
          color={workingCapital >= 0 ? "#16A34A" : "#DC2626"}
          note="الأصول المتداولة − الالتزامات المتداولة"
          formula="رأس المال العامل = الأصول المتداولة − الالتزامات المتداولة"
          showFormula={showFormulas}
          tooltipText="السيولة الصافية المتاحة لتمويل العمليات اليومية للشركة"
          maxFractionDigits={0}
        />

        <KpiCard
          label="DSO ≈"
          val={dso}
          unit="يوم"
          color="#D97706"
          note={dso != null ? "≈ ذمم ÷ إيراد سنوي × 365" : "🔌 لا مصدر"}
          formula="DSO التقريبي = الذمم المدينة ÷ الإيرادات × 365"
          showFormula={showFormulas}
          tooltipText="متوسط عدد الأيام التي تستغرقها الشركة لتحصيل مستحقاتها من العملاء"
          maxFractionDigits={0}
        />

        <KpiCard
          label="DIO / DPO"
          val={dIO != null && dPO != null ? dIO + dPO : null}
          unit="يوم"
          color="#94A3B8"
          note={
            dIO != null && dPO != null
              ? `DIO ${dIO} · DPO ${dPO}`
              : "🔌 بيانات المخزون/الموردين غير متاحة"
          }
          formula="DIO = المخزون ÷ COGS × 365 · DPO = الدائنون ÷ COGS × 365"
          showFormula={showFormulas}
          tooltipText="مدة دوران المخزون وفترة سداد الموردين"
          maxFractionDigits={0}
        />
      </div>
    </SectionPanel>
  );
}