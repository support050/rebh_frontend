"use client";
import { useEffect, useState } from "react";
import { authFetch } from '@/lib/api/authFetch';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { RSPoint, RSLineSummary, RSLineResponse } from "@/types/rs-line";
import { getCsrfToken } from '@/lib/api/authFetch';

interface Props {
  symbol: string; benchmark?: string; startDate?: string;
  ma1Type?: "EMA" | "SMA"; ma1Period?: number;
  ma2Type?: "EMA" | "SMA"; ma2Period?: number;
}

function formatTick(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (!values.length) return null;
  const w = 40, h = 24;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="opacity-80">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const BullCrossDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload.cross_bull || !cx || !cy) return null;
  return <g><polygon points={`${cx},${cy - 12} ${cx - 7},${cy - 2} ${cx + 7},${cy - 2}`} fill="#16a34a" opacity={0.9} /></g>;
};

const BearCrossDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload.cross_bear || !cx || !cy) return null;
  return <g><polygon points={`${cx},${cy + 12} ${cx - 7},${cy + 2} ${cx + 7},${cy + 2}`} fill="#dc2626" opacity={0.9} /></g>;
};

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

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d: RSPoint = payload[0]?.payload;
  if (!d) return null;
  const isBullZone = d.above_ma2;
  return (
    <div style={{
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(0,0,0,0.08)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      borderRadius: 12,
      padding: "12px 14px",
      minWidth: 190,
      fontSize: 12,
    }}>
      <p style={{ color: "#94a3b8", marginBottom: 8, fontWeight: 500 }}>{d.date}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ color: "#94a3b8" }}>RS Line</span>
          <span style={{ fontFamily: "monospace", fontWeight: 700, color: d.rs_up ? "#3b82f6" : "#ec4899" }}>{d.rs_line.toFixed(2)}</span>
        </div>
        {d.ma1 && <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ color: "#f97316" }}>Fast MA</span>
          <span style={{ color: "#f97316", fontFamily: "monospace" }}>{d.ma1.toFixed(2)}</span>
        </div>}
        {d.ma2 && <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ color: "#94a3b8" }}>Slow MA</span>
          <span style={{ color: "#64748b", fontFamily: "monospace" }}>{d.ma2.toFixed(2)}</span>
        </div>}
      </div>
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #f1f5f9", display: "flex", flexWrap: "wrap", gap: 4 }}>
        <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: isBullZone ? "#dcfce7" : "#fee2e2", color: isBullZone ? "#15803d" : "#dc2626" }}>{isBullZone ? "✅ Bull Zone" : "⚠️ Bear Zone"}</span>
        {d.cross_bull && <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>▲ Bull Cross</span>}
        {d.cross_bear && <span style={{ background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>▼ Bear Cross</span>}
        {d.rsnhbp && <span style={{ background: "#fce7f3", color: "#db2777", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>● RSNHBP</span>}
      </div>
    </div>
  );
};

const StatsRow = ({ summary, ma1Type, ma1Period, ma2Type, ma2Period, sparkData }: {
  summary: RSLineSummary; ma1Type: string; ma1Period: number; ma2Type: string; ma2Period: number; sparkData: number[];
}) => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-5 text-center">
    {[
      { label: "RS Line", value: summary.rs_line.toFixed(2), color: summary.direction === "up" ? "text-blue-600" : "text-pink-600", spark: true },
      { label: `${ma1Type}(${ma1Period})`, value: summary.ma1.toFixed(2), color: "text-orange-500", spark: false },
      { label: `${ma2Type}(${ma2Period})`, value: summary.ma2.toFixed(2), color: "text-slate-500", spark: false },
      { label: "Trend", value: summary.direction === "up" ? "📈 Up" : "📉 Down", color: summary.direction === "up" ? "text-blue-600" : "text-pink-600", spark: false },
      { label: "Zone", value: summary.position === "above_ma" ? "✅ Bull" : "⚠️ Bear", color: summary.position === "above_ma" ? "text-emerald-600" : "text-red-500", spark: false },
    ].map((item, i) => (
      <div key={i} className="bg-slate-50 rounded-xl py-2.5 px-3 border border-slate-200">
        <p className="text-slate-400 text-[10px] uppercase tracking-wide mb-1 font-semibold">{item.label}</p>
        <div className="flex items-end justify-between">
          <p className={`font-mono font-bold text-sm ${item.color}`}>{item.value}</p>
          {item.spark && <Sparkline values={sparkData} color={summary.direction === "up" ? "#3b82f6" : "#ec4899"} />}
        </div>
      </div>
    ))}
    {summary.signal_today === "bullish_cross" && <div className="col-span-2 md:col-span-5 bg-green-50 border border-green-200 rounded-xl py-2 text-green-700 font-bold text-sm text-center">🔔 BULLISH CROSSOVER — {ma1Type}({ma1Period}) crossed above {ma2Type}({ma2Period})</div>}
    {summary.signal_today === "bearish_cross" && <div className="col-span-2 md:col-span-5 bg-red-50 border border-red-200 rounded-xl py-2 text-red-600 font-bold text-sm text-center">🔔 BEARISH CROSSOVER — {ma1Type}({ma1Period}) crossed below {ma2Type}({ma2Period})</div>}
    {summary.rsnhbp_today && <div className="col-span-2 md:col-span-5 bg-pink-50 border border-pink-200 rounded-xl py-2 text-pink-700 font-bold text-sm text-center">🟣 RS New High Before Price</div>}
  </div>
);

function buildCloudData(data: RSPoint[]) {
  return data.map(d => ({
    ...d,
    cloud_top: d.ma1 && d.ma2 ? Math.max(d.ma1, d.ma2) : null,
    cloud_bottom: d.ma1 && d.ma2 ? Math.min(d.ma1, d.ma2) : null,
    is_bull_zone: d.ma1 && d.ma2 ? d.ma1 > d.ma2 : false,
  }));
}

export default function RSMACrossoverChart({
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
    <div className="flex items-center justify-center h-72 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Loading RS MA Crossover...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="flex items-center justify-center h-72 bg-white rounded-2xl border border-red-200 shadow-sm">
      <p className="text-red-500 text-sm">❌ {error}</p>
    </div>
  );

  const displayData = data.length > 500 ? data.slice(-500) : data;
  const cloudData = buildCloudData(displayData);
  const rsValues = displayData.map(d => d.rs_line).filter(Boolean);
  const yMin = Math.min(...rsValues) * 0.99;
  const yMax = Math.max(...rsValues) * 1.01;
  const lastBullDate = summary?.last_bull_cross;
  const lastBearDate = summary?.last_bear_cross;
  const sparkData = displayData.slice(-30).map(d => d.rs_line).filter(Boolean);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <style>{`@keyframes fadeSlideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.chart-enter{animation:fadeSlideUp 0.4s ease-out}`}</style>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-slate-900 font-bold text-base">RS MA Crossover — <span className="text-orange-500">{symbol}</span></h2>
          <p className="text-slate-400 text-xs mt-0.5">{ma1Type}({ma1Period}) / {ma2Type}({ma2Period}) vs {benchmark}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 justify-end">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" /> RS Line</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-orange-400 inline-block rounded" /> Fast MA</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-slate-300 inline-block rounded" /> Slow MA</span>
        </div>
      </div>
      {summary && <StatsRow summary={summary} ma1Type={ma1Type} ma1Period={ma1Period} ma2Type={ma2Type} ma2Period={ma2Period} sparkData={sparkData} />}
      <div className="chart-enter">
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={cloudData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="rsGradBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="bullCloudLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="bearCloudLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.floor(displayData.length / 6)} tickFormatter={formatTick} />
            <YAxis domain={[yMin, yMax]} tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v.toFixed(2)} width={45} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Area type="monotone" dataKey="cloud_top" stroke="none" fill="url(#bullCloudLight)" fillOpacity={1} connectNulls legendType="none" />
            <Area type="monotone" dataKey="cloud_bottom" stroke="none" fill="#ffffff" fillOpacity={1} connectNulls legendType="none" />
            <Area type="monotone" dataKey="rs_line" stroke="none" fill="url(#rsGradBlue)" fillOpacity={1} legendType="none" />
            <Line type="monotone" dataKey="ma2" stroke="#cbd5e1" strokeWidth={1.5} dot={false} connectNulls />
            <Line type="monotone" dataKey="ma1" stroke="#f97316" strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="rs_line" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={<PremiumActiveDot />} name="RS Line" />
            <Line type="monotone" dataKey="rs_line" stroke="transparent" dot={<BullCrossDot />} activeDot={false} legendType="none" />
            <Line type="monotone" dataKey="rs_line" stroke="transparent" dot={<BearCrossDot />} activeDot={false} legendType="none" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-3 text-[11px] text-slate-400">
        {lastBullDate && <span className="flex items-center gap-1"><span className="text-green-600 font-semibold">▲</span> Last Bull: {lastBullDate}</span>}
        {lastBearDate && <span className="flex items-center gap-1"><span className="text-red-500 font-semibold">▼</span> Last Bear: {lastBearDate}</span>}
        <span className="ml-auto">{displayData.length} Days</span>
      </div>
    </div>
  );
}