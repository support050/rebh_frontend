"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Activity, ShieldCheck, CheckCircle2, AlertTriangle, 
  Database, RefreshCw, FileText, ArrowUpRight, Scale 
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/config";

interface HealthMetric {
  metric: string;
  metricAr: string;
  state: string;
  stateType: "ok" | "warn" | "danger";
  detail: string;
  fix: string;
}

export default function RebhHealthPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rebh/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Error fetching health stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#eef1f5] font-sans pb-16 antialiased">
      {/* Header */}
      <header className="border-b border-[#1e2836] bg-gradient-to-b from-[#0d1118] to-[#0a0c10] px-6 md:px-10 py-7">
        <div className="max-w-6xl mx-auto flex items-start gap-4">
          <div className="p-3 bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl text-[#10b981]">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-mono font-bold tracking-wider text-[#10b981] uppercase mb-1">
              REBH FORENSIC AUDIT · الرقابة والتدقيق المحاسبي الحي
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-50 tracking-tight">
              Data Health <span className="text-[#3987e5] font-normal">— المنصة تدقق بياناتها علناً</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              الصفحة التي لا تملكها أي منصة مالية أخرى: نعلن عن كل رقم تحققنا منه، وكل فجوة في البيانات مع سببها والحل البرمجي المخصص لها. لا نخفي نقصاً ولا نزيّف نسبة.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-10 pt-8">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-4">
            <div className="flex justify-between items-center text-slate-400 text-xs mb-2">
              <span>فحص الهوية المحاسبية A = L + E</span>
              <ShieldCheck className="w-4 h-4 text-[#10b981]" />
            </div>
            <div className="text-2xl font-mono font-black text-[#10b981]">
              {loading ? <span className="animate-pulse bg-[#1e2836] rounded w-16 h-7 inline-block" /> : `${stats?.balance_sheets_passed ?? 0} Pass`}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">مطابقة تامة بنسبة {loading ? '—' : `${stats?.identity_pass_pct ?? 0}%`} لكل القوائم المفحوصة</div>
          </div>

          <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-4">
            <div className="flex justify-between items-center text-slate-400 text-xs mb-2">
              <span>الشركات المقيّمة بنجاح</span>
              <Scale className="w-4 h-4 text-[#3987e5]" />
            </div>
            <div className="text-2xl font-mono font-black text-[#63a5f0]">
              {loading ? <span className="animate-pulse bg-[#1e2836] rounded w-12 h-7 inline-block" /> : `${stats?.valued_count ?? 0} شركة`}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">قوائم حديثة ومكتملة تخضع لمصفوفات التقييم</div>
          </div>

          <div className="bg-[#121924] border border-[#1e2836] rounded-xl p-4">
            <div className="flex justify-between items-center text-slate-400 text-xs mb-2">
              <span>في سلة مونجر (Quarantine)</span>
              <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
            </div>
            <div className="text-2xl font-mono font-black text-[#f59e0b]">
              {loading ? <span className="animate-pulse bg-[#1e2836] rounded w-12 h-7 inline-block" /> : `${stats?.quarantine_count ?? 0} شركة`}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              <Link href="/rebh/quarantine" className="text-[#f59e0b] underline hover:text-white">
                محظورة من التسعير بأمانة حتى التحديث
              </Link>
            </div>
          </div>
        </div>

        {/* The Double-Count Discovery Box */}
        <div className="bg-gradient-to-r from-[#3987e5]/10 via-[#121924] to-[#121924] border border-[#3987e5]/30 rounded-xl p-5 mb-8">
          <div className="flex items-center gap-2 text-[#3987e5] font-bold text-xs uppercase font-mono mb-2">
            <Database className="w-4 h-4" />
            اكتشاف وحل مشكلة التكرار المحاسبي (The Double-Count Discovery)
          </div>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            عند سحب بعض القوائم القياسية من تداول، تم رصد جمع الأصول غير المتداولة مع الإجمالي بشكل مكرر لدى 165 شركة. بدلاً من عرض أرقام مضللة، قام محرك المنصة باشتقاق صيغة الاسترداد الدقيقة المعتمدة <span className="font-mono text-[#d9b64a] bg-black/40 px-2 py-0.5 rounded">TA_true = (TA_std + CA) / 2</span> ومطابقتها حتى آخر هللة مع الإفصاحات الرسمية (مثل دار الأركان 40,435 مليون ر.س وإسمنت السعودية 3,203 مليون ر.س).
          </p>
        </div>

        {/* Audit Table */}
        <div className="bg-[#121924] border border-[#1e2836] rounded-xl overflow-hidden shadow-xl mb-8">
          <div className="px-5 py-4 border-b border-[#1e2836] flex justify-between items-center">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              سجل التدقيق المحاسبي والفجوات المعلنة (Audit Matrix)
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Live API Verified</span>
          </div>

          <div className="divide-y divide-[#1e2836]">
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-sm">جاري تحميل سجل التدقيق...</div>
            ) : (stats?.audit_matrix || []).length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">لا توجد بيانات تدقيق متاحة حالياً</div>
            ) : (stats?.audit_matrix || []).map((item: any, idx: number) => (
              <div key={idx} className="p-5 hover:bg-white/[0.02] transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100">{item.metricAr}</span>
                    <span className="text-xs text-slate-500 font-mono">({item.metric})</span>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                    item.stateType === "ok" 
                      ? "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30" 
                      : "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/30"
                  }`}>
                    {item.stateType === "ok" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {item.state}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-2">
                  {item.detail}
                </p>

                <div className="text-[11px] font-mono text-[#d9b64a] bg-black/30 border border-[#d9b64a]/20 rounded px-3 py-1.5 inline-block">
                  <span className="text-slate-500 font-bold">الحل المبرمج / الإجراء: </span>
                  {item.fix}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <footer className="text-center text-xs text-slate-600 space-y-1">
          <p>منصة ربح المالية · تدقيق حسابي مؤتمت · ° محسوب · ⚑ إشارة خطر · 🔌 مصدر ناقص مسمى علناً</p>
        </footer>
      </main>
    </div>
  );
}
