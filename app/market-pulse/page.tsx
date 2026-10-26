"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { API_BASE_URL } from "@/lib/api/config";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
interface MarketRecord {
  [key: string]: unknown; // index signature — required for useMultiSort generic constraint
  id: number; date: string; open: number; high: number; low: number; close: number;
  volume_traded: number; value_traded: number | null; no_of_trades: number | null;
  change: number | null; change_pct: number | null; volume_change_pct: number | null;
  ema_21: number | null; sma_50: number | null; sma_150: number | null; sma_200: number | null;
  market_pulse: string | null; buy_switch: string | null; rd: string | null; rd_count: number | null;
  ftd: string | null; ftd_low: number | null; rd_low: number | null;
  ftd_undercut: string | null; failed_rally_attempt: string | null; day_undercut_21: string | null;
  overdue_break_below_21ma: string | null; trending_below_21ma: string | null;
  living_below_21ma: string | null; break_below_50ma: string | null; s11: string | null;
  ftd_1: string | null; additional_ftd: string | null; low_above_21ma: string | null;
  trending_above_21ma: string | null; living_above_21ma: string | null; low_above_50ma: string | null;
  dd_sd: string | null; distribution_days: number | null; cluster: number | null;
  current_outlook: string | null; distribution_days_2: number | null; cluster_1: number | null;
  distribution_day_fall_of: number | null; year: number | null; month: number | null;
  day_v_close_21: number | null; atr_pct: number | null; atr: number | null; tr: number | null;
  high_minus_low: number | null; high_minus_prev_close: number | null;
  prev_close_minus_low: number | null; opn_close: number | null; close_pct: number | null;
  mv: number | null; ftd_r: number | null;
}

interface Averages {
  avg_change: number | null; avg_change_pct: number | null; avg_volume_change_pct: number | null;
  avg_ema_21: number | null; avg_sma_50: number | null; avg_sma_150: number | null;
  avg_sma_200: number | null; avg_rd_count: number | null; avg_distribution_days: number | null;
  avg_cluster: number | null; avg_distribution_day_fall_of: number | null;
  avg_day_v_close_21: number | null; avg_atr_pct: number | null; avg_atr: number | null;
  avg_tr: number | null; avg_high_minus_low: number | null; avg_high_minus_prev_close: number | null;
  avg_prev_close_minus_low: number | null; avg_opn_close: number | null;
  avg_close_pct: number | null; avg_mv: number | null; avg_ftd_r: number | null;
}

interface SortConfig { key: string; direction: "asc" | "desc"; }

interface ColDef {
  key: string; label: string; group: string; sortable?: boolean;
  fmt?: (v: unknown) => string; color?: (v: unknown) => string;
  badge?: (v: unknown) => { label: string; cls: string } | null;
  align?: "left" | "right";
}

// ── Formatters ─────────────────────────────────────────────────────────────────
const n = (v: unknown, d = 2) =>
  v == null ? "—" : Number(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const pct = (v: unknown, d = 2) => {
  if (v == null) return "—";
  const num = Number(v);
  const formatted = Math.abs(num * 100).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  return num < 0 ? `(${formatted}%)` : `${formatted}%`;
};

const vol = (v: unknown) =>
  v == null ? "—" : Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 });

const chgColor = (v: unknown) => (v == null ? "" : Number(v) >= 0 ? "positive" : "negative");

const outlookBadge = (v: unknown): { label: string; cls: string } | null => {
  if (!v) return null;
  const s = String(v);
  const map: Record<string, string> = {
    FTD: "badge-ftd", RD: "badge-rd", PRD: "badge-prd", DD: "badge-dd", SD: "badge-sd",
  };
  return map[s] ? { label: s, cls: map[s] } : { label: s, cls: "badge-neutral" };
};

const textBadge = (cls: string) => (v: unknown): { label: string; cls: string } | null => {
  if (!v || v === "0" || v === "false") return null;
  return { label: String(v), cls };
};

// Column definitions
// ──────────────────────────────────────────────────────────────────────────────
// Financial-concept audit (2026-10-20): the two pattern groups used to be headed
// "Buy Signals" / "Sell Signals". Every column under them is a measured price /
// volume pattern (21-day MA position, undercut, follow-through…), so the groups
// are named for what is detected — a technical pattern — never a buy or sell
// instruction. Column keys and backend fields are untouched.
// ──────────────────────────────────────────────────────────────────────────────
const COLS: ColDef[] = [
  { key: "open", label: "Open", group: "Price", sortable: true, fmt: n, align: "right" },
  { key: "high", label: "High", group: "Price", sortable: true, fmt: n, align: "right" },
  { key: "low", label: "Low", group: "Price", sortable: true, fmt: n, align: "right" },
  { key: "close", label: "Close", group: "Price", sortable: true, fmt: n, align: "right", color: chgColor },
  { key: "volume_traded", label: "Volume", group: "Volume", sortable: true, fmt: vol, align: "right" },
  { key: "value_traded", label: "Value", group: "Volume", sortable: false, fmt: vol, align: "right" },
  { key: "no_of_trades", label: "Trades", group: "Volume", sortable: false, fmt: vol, align: "right" },
  { key: "change", label: "Chg", group: "Change", sortable: true, fmt: (v) => n(v, 2), align: "right", color: chgColor },
  { key: "change_pct", label: "Change %", group: "Change", sortable: true, fmt: pct, align: "right", color: chgColor },
  { key: "volume_change_pct", label: "Volume change %", group: "Change", sortable: true, fmt: pct, align: "right", color: chgColor },
  { key: "ema_21", label: "EMA 21", group: "Moving Averages", sortable: true, fmt: (v) => n(v, 0), align: "right" },
  { key: "sma_50", label: "SMA 50", group: "Moving Averages", sortable: true, fmt: (v) => n(v, 0), align: "right" },
  { key: "sma_150", label: "SMA 150", group: "Moving Averages", sortable: true, fmt: (v) => n(v, 0), align: "right" },
  { key: "sma_200", label: "SMA 200", group: "Moving Averages", sortable: true, fmt: (v) => n(v, 0), align: "right" },
  { key: "market_pulse", label: "Market Pulse", group: "Status", sortable: false },
  // Name kept from the source market-pulse model's "Buy Switch" column
  // (=IF(FTD,"ON","")); the parenthetical says what actually gates it, so the
  // header reads as a model flag rather than an instruction.
  { key: "buy_switch", label: "Buy Switch (FTD gate)", group: "Status", sortable: false, badge: textBadge("badge-bull-sm") },
  { key: "rd", label: "RD", group: "Status", sortable: false, badge: textBadge("badge-purple-sm") },
  { key: "rd_count", label: "RD-Count", group: "Status", sortable: true, fmt: (v) => (v == null ? "—" : String(v)), align: "right" },
  { key: "ftd", label: "FTD", group: "FTD", sortable: false, badge: textBadge("badge-blue-sm") },
  { key: "ftd_low", label: "FTD Low", group: "FTD", sortable: true, fmt: n, align: "right" },
  { key: "rd_low", label: "RD Low", group: "FTD", sortable: true, fmt: n, align: "right" },
  { key: "ftd_undercut", label: "FTD Undercut", group: "Weakness Patterns", sortable: false, badge: textBadge("badge-sell-sm") },
  { key: "failed_rally_attempt", label: "Failed Rally Attempt", group: "Weakness Patterns", sortable: false, badge: textBadge("badge-sell-sm") },
  { key: "day_undercut_21", label: "21 Day Undercut", group: "Weakness Patterns", sortable: false, badge: textBadge("badge-sell-sm") },
  { key: "overdue_break_below_21ma", label: "Overdue Break Below 21-Day MA", group: "Weakness Patterns", sortable: false, badge: textBadge("badge-sell-sm") },
  { key: "trending_below_21ma", label: "Trending Below 21-Day MA", group: "Weakness Patterns", sortable: false, badge: textBadge("badge-sell-sm") },
  { key: "living_below_21ma", label: "Living Below 21-Day MA", group: "Weakness Patterns", sortable: false, badge: textBadge("badge-sell-sm") },
  { key: "break_below_50ma", label: "Break Below 50-Day MA", group: "Weakness Patterns", sortable: false, badge: textBadge("badge-sell-sm") },
  { key: "s11", label: "S11", group: "Weakness Patterns", sortable: false, badge: textBadge("badge-sell-sm") },
  { key: "ftd_1", label: "FTD", group: "Strength Patterns", sortable: false, badge: textBadge("badge-buy-sm") },
  { key: "additional_ftd", label: "Additional FTD", group: "Strength Patterns", sortable: false, badge: textBadge("badge-buy-sm") },
  { key: "low_above_21ma", label: "Low Above 21-day MA", group: "Strength Patterns", sortable: false, badge: textBadge("badge-buy-sm") },
  { key: "trending_above_21ma", label: "Trending Above 21-Day MA", group: "Strength Patterns", sortable: false, badge: textBadge("badge-buy-sm") },
  { key: "living_above_21ma", label: "Living Above 21-Day MA", group: "Strength Patterns", sortable: false, badge: textBadge("badge-buy-sm") },
  { key: "low_above_50ma", label: "Low Above 50-day MA", group: "Strength Patterns", sortable: false, badge: textBadge("badge-buy-sm") },
  { key: "dd_sd", label: "DD/SD", group: "Distribution", sortable: false, badge: outlookBadge },
  { key: "distribution_days", label: "Distribution days", group: "Distribution", sortable: true, fmt: (v) => n(v, 0), align: "right" },
  { key: "cluster", label: "Cluster", group: "Distribution", sortable: true, fmt: (v) => n(v, 0), align: "right" },
  { key: "current_outlook", label: "Outlook", group: "Distribution", sortable: false, badge: outlookBadge },
  { key: "distribution_days_2", label: "Distribution days (AR)", group: "Distribution", sortable: true, fmt: (v) => n(v, 0), align: "right" },
  { key: "cluster_1", label: "Cluster (AS)", group: "Distribution", sortable: true, fmt: (v) => n(v, 0), align: "right" },
  { key: "distribution_day_fall_of", label: "Distribution day fall of", group: "Distribution", sortable: true, fmt: pct, align: "right" },
  { key: "year", label: "Year", group: "Time", sortable: true, fmt: (v) => (v == null ? "—" : String(v)), align: "right" },
  { key: "month", label: "Month", group: "Time", sortable: true, fmt: (v) => (v == null ? "—" : String(v)), align: "right" },
  { key: "day_v_close_21", label: "21 Day v Close", group: "Volatility", sortable: true, fmt: pct, align: "right", color: chgColor },
  { key: "atr_pct", label: "ATR %", group: "Volatility", sortable: true, fmt: pct, align: "right" },
  { key: "atr", label: "ATR", group: "Volatility", sortable: true, fmt: n, align: "right" },
  { key: "tr", label: "TR", group: "Volatility", sortable: true, fmt: n, align: "right" },
  { key: "high_minus_low", label: "High minus low", group: "Volatility", sortable: true, fmt: n, align: "right" },
  { key: "high_minus_prev_close", label: "High minus previous close", group: "Volatility", sortable: true, fmt: n, align: "right" },
  { key: "prev_close_minus_low", label: "Previous close minus low", group: "Volatility", sortable: true, fmt: n, align: "right" },
  { key: "opn_close", label: "OPN+Close", group: "Volatility", sortable: true, fmt: n, align: "right" },
  { key: "close_pct", label: "Close %", group: "Volatility", sortable: true, fmt: pct, align: "right" },
  { key: "mv", label: "MV", group: "Velocity", sortable: true, fmt: (v) => n(v, 4), align: "right" },
  { key: "ftd_r", label: "FTD-R", group: "Velocity", sortable: true, fmt: pct, align: "right" },
];

const GROUP_COLORS: Record<string, string> = {
  Price: "#1B3F6E", Volume: "#1B3F6E", Change: "#1B3F6E",
  "Moving Averages": "#214F3A", Status: "#4A2C6A",
  FTD: "#1B3F6E", "Weakness Patterns": "#6B1E1E", "Strength Patterns": "#1A4D2E",
  Distribution: "#4A3A0D", Time: "#2C3E50",
  Volatility: "#1B3F6E", Velocity: "#214F3A",
};

const API = API_BASE_URL;
const MP_STATUSES = ["Confirmed uptrend", "Uptrend under pressure", "Market in correction"];
const OUTLOOKS = ["FTD", "RD", "PRD", "DD", "SD"];
const PAGE_SIZE = 50;

// ── Multi-Priority Sort Hook ──────────────────────────────────────────────────
// Behaviour:
//   • Click unsorted column  → adds it as next priority (1, 2, 3…)
//   • Click sorted column    → toggles asc ↔ desc
//   • Click sorted column (already desc) → removes it from the list
//   • "Reset Sort" button    → clears everything
function useMultiSort<T extends Record<string, unknown>>() {
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([]);

  const handleSort = useCallback((key: string) => {
    setSortConfigs((prev) => {
      const idx = prev.findIndex((c) => c.key === key);

      // Column not yet in sort list → append as new lowest priority
      if (idx === -1) return [...prev, { key, direction: "asc" }];

      // Column already sorted asc → flip to desc
      if (prev[idx].direction === "asc") {
        const next = [...prev];
        next[idx] = { key, direction: "desc" };
        return next;
      }

      // Column already sorted desc → remove from list
      // Remaining columns keep their relative priority order
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  const clearSort = useCallback(() => setSortConfigs([]), []);

  const sortedData = useCallback(
    (data: T[]): T[] => {
      if (sortConfigs.length === 0) return data;
      return [...data].sort((a, b) => {
        for (const config of sortConfigs) {
          const aV = a[config.key];
          const bV = b[config.key];
          if (aV === bV) continue;
          if (aV == null) return 1;
          if (bV == null) return -1;
          let diff: number;
          if (typeof aV === "string" && typeof bV === "string") {
            diff = aV.localeCompare(bV);
          } else {
            diff = Number(aV) - Number(bV);
          }
          if (diff !== 0) return config.direction === "asc" ? diff : -diff;
        }
        return 0;
      });
    },
    [sortConfigs]
  );

  return { sortConfigs, handleSort, clearSort, sortedData };
}

// ── Metric Card ───────────────────────────────────────────────────────────────
function MetricCard({
  label, value, trend,
}: {
  label: string; value: string; trend?: "positive" | "negative" | "neutral";
}) {
  const trendColor =
    trend === "positive" ? "#00875A" : trend === "negative" ? "#C0392B" : "#2C3E50";
  return (
    <div
      style={{
        background: "#fff", border: "1px solid #E8ECF0", borderRadius: 6,
        padding: "10px 14px", minWidth: 120, flex: "0 0 auto",
        borderTop: `3px solid ${trendColor}`,
      }}
    >
      <div
        style={{
          fontSize: 10, color: "#6B7C93", textTransform: "uppercase",
          letterSpacing: "0.06em", fontWeight: 600, marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 15, fontWeight: 700, color: trendColor,
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Sort Indicator ────────────────────────────────────────────────────────────
function SortIndicator({ colKey, sortConfigs }: { colKey: string; sortConfigs: SortConfig[] }) {
  const idx = sortConfigs.findIndex((c) => c.key === colKey);

  if (idx === -1)
    return (
      <span style={{ color: "#BDC3CC", marginLeft: 3, fontSize: 9, opacity: 0.5, lineHeight: "8px" }}>
        ▲<br />▼
      </span>
    );

  return (
    <span style={{ marginLeft: 3, display: "inline-flex", alignItems: "center", gap: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 700 }}>
        {sortConfigs[idx].direction === "asc" ? "▲" : "▼"}
      </span>
      {/* Always show the priority number — even for single sort it shows "1" */}
      <span
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 14, height: 14, background: "#F2A900", color: "#0D2B4B",
          fontSize: 9, fontWeight: 700, borderRadius: "50%",
        }}
      >
        {idx + 1}
      </span>
    </span>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_STYLES: Record<string, React.CSSProperties> = {
  "badge-bull": { background: "#E8F5EE", border: "1px solid #00875A", color: "#005C3A", fontWeight: 700 },
  "badge-warn": { background: "#FEF3E2", border: "1px solid #E67E22", color: "#A04000", fontWeight: 700 },
  "badge-bear": { background: "#FDEDEC", border: "1px solid #C0392B", color: "#7B241C", fontWeight: 700 },
  "badge-ftd": { background: "#D4EFDF", border: "1px solid #27AE60", color: "#1E8449", fontWeight: 700 },
  "badge-rd": { background: "#FCF3CF", border: "1px solid #F1C40F", color: "#9A7D0A", fontWeight: 700 },
  "badge-prd": { background: "#FCF3CF", border: "1px solid #F1C40F", color: "#9A7D0A", fontWeight: 700 },
  "badge-dd": { background: "#FADBD8", border: "1px solid #E74C3C", color: "#943126", fontWeight: 700 },
  "badge-sd": { background: "#FADBD8", border: "1px solid #E74C3C", color: "#943126", fontWeight: 700 },
  "badge-neutral": { background: "#F4F6F9", border: "1px solid #BDC3CC", color: "#4A5568", fontWeight: 600 },
  "badge-bull-sm": { background: "#E8F5EE", color: "#005C3A", border: "1px solid #00875A" },
  "badge-purple-sm": { background: "#F0EBF8", color: "#5B2C8D", border: "1px solid #8E44AD" },
  "badge-blue-sm": { background: "#EBF5FB", color: "#1A5276", border: "1px solid #2980B9" },
  "badge-sell-sm": { background: "#FDEDEC", color: "#7B241C", border: "1px solid #C0392B" },
  "badge-buy-sm": { background: "#E8F5EE", color: "#005C3A", border: "1px solid #00875A" },
};

function Badge({ data }: { data: { label: string; cls: string } }) {
  const style = BADGE_STYLES[data.cls] ?? BADGE_STYLES["badge-neutral"];
  return (
    <span
      style={{
        display: "inline-block", padding: "2px 7px", borderRadius: 3,
        fontSize: 11, whiteSpace: "nowrap", ...style,
      }}
    >
      {data.label}
    </span>
  );
}

// ── Compute group header spans ─────────────────────────────────────────────────
function buildGroupSpans() {
  const spans: { group: string; span: number; color: string }[] = [];
  let lastGroup = "";
  let span = 0;
  for (const col of COLS) {
    if (col.group !== lastGroup) {
      if (span > 0) spans.push({ group: lastGroup, span, color: GROUP_COLORS[lastGroup] ?? "#2C3E50" });
      lastGroup = col.group;
      span = 1;
    } else {
      span++;
    }
  }
  if (span > 0) spans.push({ group: lastGroup, span, color: GROUP_COLORS[lastGroup] ?? "#2C3E50" });
  return spans;
}

const GROUP_SPANS = buildGroupSpans();

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MarketPulsePage() {
  const [allRecords, setAllRecords] = useState<MarketRecord[]>([]);
  const [avgs, setAvgs] = useState<Averages | null>(null);

  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [outlookFilter, setOutlookFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [page, setPage] = useState(0);

  const { sortConfigs, handleSort, clearSort, sortedData: applySort } = useMultiSort<MarketRecord>();
  const abortRef = useRef<AbortController | null>(null);

  // ── Main data fetch ───────────────────────────────────────────────────────
  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setInitialLoad(true);
    setError(null);

    fetch(`${API}/api/market-pulse/?skip=0&limit=100000`, {
      headers: { "X-API-Key": process.env.NEXT_PUBLIC_API_KEY ?? "" },
      signal: controller.signal,
    })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data: MarketRecord[]) => {
        setAllRecords(data);
        setInitialLoad(false);
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
        setError(e.message);
        setInitialLoad(false);
      });

    return () => controller.abort();
  }, []);

  // ── Client-side Filtering ─────────────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      if (statusFilter && r.market_pulse !== statusFilter) return false;
      if (outlookFilter && r.current_outlook !== outlookFilter) return false;
      if (yearFilter && String(r.year) !== yearFilter) return false;
      return true;
    });
  }, [allRecords, statusFilter, outlookFilter, yearFilter]);

  const sortedRecords = useMemo(
    () => applySort(filteredRecords),
    [filteredRecords, applySort]
  );

  const records = useMemo(
    () => sortedRecords.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [sortedRecords, page]
  );

  // ── Averages fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("market_pulse_status", statusFilter);
    if (outlookFilter) params.set("current_outlook", outlookFilter);
    if (yearFilter) params.set("year", yearFilter);
    fetch(`${API}/api/market-pulse/averages?${params}`, {
      headers: { "X-API-Key": process.env.NEXT_PUBLIC_API_KEY ?? "" },
    })
      .then((r) => r.json())
      .then(setAvgs)
      .catch(() => { });
  }, [statusFilter, outlookFilter, yearFilter]);

  const clearFilters = () => { setStatusFilter(""); setOutlookFilter(""); setYearFilter(""); setPage(0); };
  const hasFilters = !!(statusFilter || outlookFilter || yearFilter);

  // ── Handle sort click with shift detection ────────────────────────────────
  const onHeaderClick = useCallback(
    (key: string) => {
      handleSort(key);
      setPage(0);
    },
    [handleSort]
  );

  const inputStyle: React.CSSProperties = {
    background: "#fff", border: "1px solid #D1D9E0", borderRadius: 5,
    padding: "6px 10px", fontSize: 12, color: "#2C3E50", outline: "none",
    fontFamily: "'IBM Plex Sans', sans-serif",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 10, color: "#6B7C93", textTransform: "uppercase",
    letterSpacing: "0.06em", fontWeight: 600, display: "block", marginBottom: 4,
  };

  // Group/col header styles — no position sticky here; thead element is sticky
  const groupThStyle = (color: string): React.CSSProperties => ({
    background: color,
    color: "#ffffffCC",
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    padding: "4px 8px",
    borderRight: "1px solid rgba(255,255,255,0.15)",
    borderBottom: "1px solid rgba(255,255,255,0.2)",
    textAlign: "center",
    whiteSpace: "nowrap",
  });

  const colThStyle = (isSorted: boolean, align: "left" | "right" = "right"): React.CSSProperties => ({
    background: isSorted ? "#EBF3FF" : "#F7F9FC",
    cursor: "pointer",
    padding: "7px 8px",
    borderRight: "1px solid #E8ECF0",
    borderBottom: "2px solid #C8D0DA",
    fontSize: 11,
    fontWeight: 700,
    color: isSorted ? "#1A4A9B" : "#4A5568",
    textAlign: align,
    whiteSpace: "nowrap",
    minWidth: 70,
    userSelect: "none",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F0F2F5", fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif" }}>

      {/* ── Top navbar ── */}
      <div
        style={{
          background: "#0D2B4B", borderBottom: "3px solid #F2A900",
          padding: "0 24px", display: "flex", alignItems: "center",
          height: 52, gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F2A900" }} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: "0.04em" }}>
            MARKET PULSE
          </span>
        </div>
        <div style={{ height: 20, width: 1, background: "#ffffff20" }} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href="/market-pulse/settings"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: "rgba(255,255,255,0.1)", borderRadius: 6, textDecoration: "none", transition: "background 0.2s" }}
            title="TASI Settings"
          >
            <span style={{ fontSize: 14 }}>⚙️</span>
          </Link>
          <div style={{ height: 20, width: 1, background: "#ffffff20", margin: "0 4px" }} />
          <span style={{ color: "#A8C0D6", fontSize: 11 }}>
            {filteredRecords.length.toLocaleString()} records
          </span>
          {sortConfigs.length > 0 && (
            <button
              onClick={clearSort}
              style={{
                background: "#F2A900", color: "#0D2B4B", border: "none",
                borderRadius: 4, padding: "4px 10px", fontSize: 11,
                fontWeight: 700, cursor: "pointer",
              }}
            >
              Reset Sort ({sortConfigs.length})
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          maxWidth: 1600, margin: "0 auto", padding: "16px 24px",
          display: "flex", flexDirection: "column", gap: 14,
        }}
      >

        {/* ── Filter bar ── */}
        <div
          style={{
            background: "#fff", border: "1px solid #E0E6ED", borderRadius: 8,
            padding: "12px 16px", display: "flex", flexWrap: "wrap",
            gap: 16, alignItems: "flex-end",
          }}
        >
          <div>
            <label style={labelStyle}>Market Pulse Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              style={{ ...inputStyle, paddingRight: 28, minWidth: 180 }}
            >
              <option value="">All Statuses</option>
              {MP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Outlook</label>
            <select
              value={outlookFilter}
              onChange={(e) => { setOutlookFilter(e.target.value); setPage(0); }}
              style={{ ...inputStyle, minWidth: 100 }}
            >
              <option value="">All</option>
              {OUTLOOKS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Year</label>
            <input
              type="number" placeholder="e.g. 2024" value={yearFilter}
              onChange={(e) => { setYearFilter(e.target.value); setPage(0); }}
              style={{ ...inputStyle, width: 90 }}
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{
                background: "#fff", border: "1px solid #D1D9E0", color: "#4A5568",
                borderRadius: 5, padding: "6px 14px", fontSize: 12,
                cursor: "pointer", fontWeight: 500,
              }}
            >
              ✕ Clear Filters
            </button>
          )}

        </div>

        {/* ── Averages strip ── */}
        {avgs && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "4px 0" }}>
            {(
              [
                { label: "Avg Change", value: n(avgs.avg_change), trend: avgs.avg_change != null && avgs.avg_change >= 0 ? "positive" : "negative" },
                { label: "Avg Change %", value: pct(avgs.avg_change_pct), trend: avgs.avg_change_pct != null && avgs.avg_change_pct >= 0 ? "positive" : "negative" },
                { label: "Avg Volume change %", value: pct(avgs.avg_volume_change_pct), trend: "neutral" },
                { label: "Avg EMA 21", value: n(avgs.avg_ema_21), trend: "neutral" },
                { label: "Avg SMA 50", value: n(avgs.avg_sma_50), trend: "neutral" },
                { label: "Avg SMA 150", value: n(avgs.avg_sma_150), trend: "neutral" },
                { label: "Avg SMA 200", value: n(avgs.avg_sma_200), trend: "neutral" },
                { label: "Avg RD-Count", value: n(avgs.avg_rd_count, 1), trend: "neutral" },
                { label: "Avg Distribution days", value: n(avgs.avg_distribution_days, 1), trend: avgs.avg_distribution_days != null && avgs.avg_distribution_days > 4 ? "negative" : "neutral" },
                { label: "Avg Cluster", value: n(avgs.avg_cluster, 1), trend: "neutral" },
                { label: "Avg ATR %", value: pct(avgs.avg_atr_pct), trend: "neutral" },
                { label: "Avg ATR", value: n(avgs.avg_atr), trend: "neutral" },
                { label: "Avg Close %", value: pct(avgs.avg_close_pct), trend: "neutral" },
                { label: "Avg MV", value: n(avgs.avg_mv, 4), trend: "neutral" },
                { label: "Avg FTD-R", value: pct(avgs.avg_ftd_r), trend: "neutral" },
              ] as { label: string; value: string; trend: "positive" | "negative" | "neutral" }[]
            ).map((c) => (
              <MetricCard key={c.label} label={c.label} value={c.value} trend={c.trend} />
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div
            style={{
              background: "#FDEDEC", border: "1px solid #E74C3C", borderRadius: 8,
              padding: "12px 16px", color: "#7B241C", fontSize: 13,
            }}
          >
            ⚠ Failed to load data: {error}
          </div>
        )}

        {/* ── Table wrapper ── */}
        <div
          style={{
            background: "#fff", border: "1px solid #E0E6ED",
            borderRadius: 8, overflow: "hidden",
          }}
        >
          {initialLoad ? (
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: 200, color: "#6B7C93", gap: 10,
              }}
            >
              <div
                style={{
                  width: 20, height: 20, border: "2px solid #0D2B4B",
                  borderTopColor: "transparent", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Loading market data…
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto", overflowY: "auto",
                maxHeight: "calc(100vh - 400px)", minHeight: 400,
              }}
            >
              <table
                style={{
                  borderCollapse: "separate", borderSpacing: 0, fontSize: 12,
                  tableLayout: "fixed", minWidth: "max-content",
                }}
              >
                <thead style={{ position: "sticky", top: 0, zIndex: 30 }}>
                  {/* ── Row 1: Group headers ── */}
                  <tr>
                    {/* Date sticky header cell — row 1 */}
                    <th
                      rowSpan={2}
                      onClick={() => onHeaderClick("date")}
                      style={{
                        position: "sticky", left: 0, zIndex: 11,
                        background: "#0D2B4B",
                        color: "#F2A900",
                        fontSize: 11, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        padding: "4px 10px",
                        borderRight: "2px solid #F2A900",
                        borderBottom: "2px solid #1A4070",
                        textAlign: "left", minWidth: 96,
                        whiteSpace: "nowrap", cursor: "pointer",
                        verticalAlign: "middle",
                        userSelect: "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        Date
                        <SortIndicator colKey="date" sortConfigs={sortConfigs} />
                      </div>
                    </th>
                    {GROUP_SPANS.map((g, i) => (
                      <th key={i} colSpan={g.span} style={groupThStyle(g.color)}>
                        {g.group}
                      </th>
                    ))}
                  </tr>

                  {/* ── Row 2: Column headers ── */}
                  <tr>
                    {COLS.map((col) => {
                      const isSorted = sortConfigs.some((c) => c.key === col.key);
                      return (
                        <th
                          key={col.key}
                          onClick={col.sortable ? () => onHeaderClick(col.key) : undefined}
                          style={colThStyle(isSorted, col.align)}
                          title={col.sortable ? "Click to sort · Shift+Click to multi-sort" : undefined}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: col.align === "right" ? "flex-end" : "flex-start",
                              gap: 2,
                            }}
                          >
                            {col.label}
                            {col.sortable && (
                              <SortIndicator colKey={col.key} sortConfigs={sortConfigs} />
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {records.map((row, ri) => {
                    const baseRow = ri % 2 === 0 ? "#ffffff" : "#F9FAFB";
                    return (
                      <tr
                        key={row.id}
                        style={{ background: baseRow, transition: "background 0.1s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#EEF4FB")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = baseRow)}
                      >
                        {/* Sticky date cell */}
                        <td
                          style={{
                            position: "sticky", left: 0, zIndex: 10,
                            background: "inherit",
                            borderRight: "2px solid #D0D7E0",
                            borderBottom: "1px solid #EDF0F4",
                            padding: "6px 10px", whiteSpace: "nowrap", minWidth: 96,
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: 11.5, color: "#1B2A3B", fontWeight: 500,
                            }}
                          >
                            {row.date}
                          </div>
                        </td>

                        {COLS.map((col) => {
                          const raw = row[col.key as keyof MarketRecord];

                          // Market Pulse — colour-coded cell
                          if (col.key === "market_pulse") {
                            const pBg =
                              raw === "Confirmed uptrend" ? "#D4EFDF" :
                                raw === "Uptrend under pressure" ? "#FDEBD0" :
                                  raw === "Market in correction" ? "#FADBD8" : undefined;
                            return (
                              <td
                                key={col.key}
                                style={{
                                  background: pBg,
                                  color: pBg ? "#000" : undefined,
                                  borderRight: "1px solid #EDF0F4",
                                  borderBottom: "1px solid #EDF0F4",
                                  padding: "6px 8px", textAlign: "left",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {raw ? String(raw) : "—"}
                              </td>
                            );
                          }

                          // Badge cell
                          if (col.badge) {
                            const data = col.badge(raw);
                            return (
                              <td
                                key={col.key}
                                style={{
                                  borderRight: "1px solid #EDF0F4",
                                  borderBottom: "1px solid #EDF0F4",
                                  padding: "6px 8px", textAlign: "left",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {data ? (
                                  <Badge data={data} />
                                ) : (
                                  <span style={{ color: "#CDD3DA", fontSize: 11 }}>—</span>
                                )}
                              </td>
                            );
                          }

                          // Numeric / text cell
                          const text = col.fmt ? col.fmt(raw) : raw == null ? "—" : String(raw);
                          const colorKey = col.color ? col.color(raw) : "";
                          const textColor =
                            colorKey === "positive" ? "#00875A" :
                              colorKey === "negative" ? "#C0392B" : "#2C3E50";
                          const isNeutral = text === "—";

                          return (
                            <td
                              key={col.key}
                              style={{
                                borderRight: "1px solid #EDF0F4",
                                borderBottom: "1px solid #EDF0F4",
                                padding: "6px 8px",
                                textAlign: col.align ?? "right",
                                whiteSpace: "nowrap",
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: 11.5,
                                color: isNeutral ? "#CDD3DA" : textColor,
                                fontWeight: isNeutral ? 400 : 500,
                              }}
                            >
                              {text}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {!initialLoad && !error && (
          <div
            style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", padding: "4px 0",
            }}
          >
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              style={{
                background: "#fff", border: "1px solid #D1D9E0",
                color: page === 0 ? "#BDC3CC" : "#0D2B4B",
                borderRadius: 5, padding: "7px 18px",
                fontSize: 12, fontWeight: 600,
                cursor: page === 0 ? "not-allowed" : "pointer",
              }}
            >
              ← Previous
            </button>
            <span style={{ fontSize: 12, color: "#6B7C93" }}>
              Page <strong>{page + 1}</strong> · Showing{" "}
              <strong>{page * PAGE_SIZE + 1}–{page * PAGE_SIZE + records.length}</strong> of{" "}
              <strong>{filteredRecords.length.toLocaleString()}</strong> records
            </span>
            <button
              disabled={records.length < PAGE_SIZE}
              onClick={() => setPage((p) => p + 1)}
              style={{
                background: "#0D2B4B", border: "1px solid #0D2B4B",
                color: records.length < PAGE_SIZE ? "#BDC3CC" : "#fff",
                borderRadius: 5, padding: "7px 18px",
                fontSize: 12, fontWeight: 600,
                cursor: records.length < PAGE_SIZE ? "not-allowed" : "pointer",
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        select, input { font-family: 'IBM Plex Sans', sans-serif !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #F0F2F5; }
        ::-webkit-scrollbar-thumb { background: #C8D0DA; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #0D2B4B; }
        tbody tr:hover td { background: #EEF4FB !important; }
      `}</style>
    </div>
  );
}