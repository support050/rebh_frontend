"use client";
import { useEffect, useState } from "react";
import { authFetch } from '@/lib/api/authFetch';
import {
  ComposedChart, Line, Area, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { RSPoint, RSLineSummary, RSLineResponse } from "@/types/rs-line";
import { getCsrfToken } from '@/lib/api/authFetch';

interface Props {
  symbol: string; benchmark?: string; startDate?: string;
  ma1Type?: "EMA" | "SMA"; ma1Period?: number;
  ma2Type?: "EMA" | "SMA"; ma2Period?: number;
}

// ─── Date Formatter ───────────────────────────────────────
function formatTick(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

// ─── Sparkline ────────────────────────────────────────────
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (!values.length) return null;
  const w = 40, h = 24;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="opacity-80">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Custom Dots ──────────────────────────────────────────
const RSLineDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  return <circle cx={cx} cy={cy} r={1.5} fill={payload.rs_up ? "#3b82f6" : "#ec4899"} stroke="none" />;
};

const RsnhbpDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload.rsnhbp || !cx || !cy) return null;
  return <circle cx={cx} cy={cy} r={5} fill="#ec4899" stroke="#fff" strokeWidth={1.5} />;
};

const CrossDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  if (payload.cross_bull) return <polygon points={`${cx},${cy - 10} ${cx - 6},${cy} ${cx + 6},${cy}`} fill="#16a34a" />;
  if (payload.cross_bear) return <polygon points={`${cx},${cy + 10} ${cx - 6},${cy} ${cx + 6},${cy}`} fill="#dc2626" />;
  return null;
};

// ─── Active Dot ───────────────────────────────────────────
const PremiumActiveDot = (props: any) => {
  const { cx, cy } = props;
  if (!cx || !cy) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill="#3b82f6" fillOpacity={0.15} />
      <circle cx={cx} cy={cy} r={5} fill="#3b82f6" stroke="#fff" strokeWidth={2} />
    </g>
  );
};

// ─── Glassmorphism Tooltip ────────────────────────────────
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d: RSPoint = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(0,0,0,0.08)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      borderRadius: 12,
      padding: "12px 14px",
      minWidth: 180,
      fontSize: 12,
    }}>
      <p style={{ color: "#94a3b8", marginBottom: 8, fontWeight: 500 }}>{d.date}</p>
      <p style={{ color: "#334155", fontFamily: "monospace", marginBottom: 4 }}>
        RS Line: <span style={{ color: d.rs_up ? "#3b82f6" : "#ec4899", fontWeight: 700 }}>{d.rs_line.toFixed(2)}</span>
      </p>
      {d.ma1 && <p style={{ color: "#ef4444", fontFamily: "monospace", marginBottom: 4 }}>EMA(21): {d.ma1.toFixed(2)}</p>}
      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
        {d.cross_bull && <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>▲ Bull Cross</span>}
        {d.cross_bear && <span style={{ background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>▼ Bear Cross</span>}
        {d.rsnhbp && <span style={{ background: "#fce7f3", color: "#db2777", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>● RSNHBP</span>}
      </div>
    </div>
  );
};

// ─── Summary Card with Sparkline ─────────────────────────
const SummaryCard = ({ summary, sparkData }: { summary: RSLineSummary; sparkData: number[] }) => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
      <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wide mb-1">RS Line</p>
      <div className="flex items-end justify-between">
        <p className={`text-lg font-mono font-bold ${summary.direction === "up" ? "text-blue-600" : "text-pink-600"}`}>{summary.rs_line.toFixed(2)}</p>
        <Sparkline values={sparkData} color={summary.direction === "up" ? "#3b82f6" : "#ec4899"} />
      </div>
    </div>
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
      <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wide mb-1">RS MA (EMA 21)</p>
      <p className="text-red-500 text-lg font-mono font-bold">{summary.ma1.toFixed(2)}</p>
    </div>
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
      <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wide mb-1">Status</p>
      <p className={`text-sm font-bold ${summary.position === "above_ma" ? "text-emerald-600" : "text-red-500"}`}>{summary.position === "above_ma" ? "✅ Above MA" : "⚠️ Below MA"}</p>
    </div>
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
      <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wide mb-1">Last Bull Cross</p>
      <p className="text-emerald-600 text-sm font-mono font-semibold">{summary.last_bull_cross || "—"}</p>
    </div>
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
      <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wide mb-1">Last Bear Cross</p>
      <p className="text-red-500 text-sm font-mono font-semibold">{summary.last_bear_cross || "—"}</p>
    </div>
    {summary.signal_today && (
      <div className={`col-span-2 md:col-span-5 rounded-xl p-3 border text-center font-bold text-sm ${summary.signal_today === "bullish_cross" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
        {summary.signal_today === "bullish_cross" ? "🔔 BULLISH CROSSOVER Today" : "🔔 BEARISH CROSSOVER Today"}
      </div>
    )}
    {summary.rsnhbp_today && (
      <div className="col-span-2 md:col-span-5 rounded-xl p-3 border border-pink-200 bg-pink-50 text-center text-pink-700 font-bold text-sm">🟣 RS New High Before Price</div>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────
export default function RSLineChart({
  symbol, benchmark = "^TASI.SR", startDate = "2022-01-01",
  ma1Type = "EMA", ma1Period = 8, ma2Type = "SMA", ma2Period = 50,
}: Props) {
  const [data, setData] = useState<RSPoint[]>([]);
  const [summary, setSummary] = useState<RSLineSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); setError(null);
      try {
        const res = await authFetch("/api/indicators/rs-line/", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
          credentials: "include",
          body: JSON.stringify({ symbol, benchmark, start_date: startDate, ma1_type: ma1Type, ma1_period: ma1Period, ma2_type: ma2Type, ma2_period: ma2Period, scale_factor: 3000 }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: RSLineResponse = await res.json();
        setData(json.data); setSummary(json.summary);
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [symbol, benchmark, startDate, ma1Type, ma1Period, ma2Type, ma2Period]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Loading RS Line...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-red-200 shadow-sm">
      <p className="text-red-500 text-sm">❌ {error}</p>
    </div>
  );

  const displayData = data.length > 500 ? data.slice(-500) : data;
  const rsValues = displayData.map(d => d.rs_line).filter(Boolean);
  const yMin = Math.min(...rsValues) * 0.99;
  const yMax = Math.max(...rsValues) * 1.01;
  const sparkData = displayData.slice(-30).map(d => d.rs_line).filter(Boolean);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dashMove {
          from { stroke-dashoffset: 20; }
          to   { stroke-dashoffset: 0; }
        }
        .chart-enter { animation: fadeSlideUp 0.4s ease-out; }
      `}</style>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-slate-900 font-bold text-base">RS Line — <span className="text-blue-600">{symbol}</span></h2>
          <p className="text-slate-400 text-xs mt-0.5">vs {benchmark} · EMA(21)</p>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" /> RS Line Up</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-pink-500 inline-block rounded" /> RS Line Down</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-500 inline-block rounded" /> EMA(21)</span>
        </div>
      </div>
      {summary && <SummaryCard summary={summary} sparkData={sparkData} />}
      <div className="chart-enter">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="rsLineGradBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="rsLineGradPink" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={Math.floor(displayData.length / 6)}
              tickFormatter={formatTick}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => v.toFixed(2)}
              width={45}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone"
              dataKey="rs_line"
              stroke="none"
              fill="url(#rsLineGradBlue)"
              fillOpacity={1}
              legendType="none"
            />
            <Line type="monotone" dataKey="ma1" stroke="#ef4444" strokeWidth={1.5} dot={false} connectNulls />
            <Line
              type="monotone"
              dataKey="rs_line"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={<RSLineDot />}
              activeDot={<PremiumActiveDot />}
              name="RS Line"
            />
            <Scatter dataKey="rs_line" shape={<CrossDot />} name="Crossover" />
            <Line type="monotone" dataKey="rs_line" stroke="transparent" dot={<RsnhbpDot />} activeDot={false} legendType="none" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-400">
        <span className="text-green-600 font-medium">▲ Bull Cross</span>
        <span className="text-red-500 font-medium">▼ Bear Cross</span>
        <span className="text-pink-500 font-medium">● RS New High Before Price</span>
        <span className="ml-auto">{displayData.length} Days</span>
      </div>
    </div>
  );
}