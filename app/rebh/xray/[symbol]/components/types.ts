export interface XRayStoryEntry {
  text: string;
  signal: "green" | "amber" | "red";
  formula: string;
}

export interface XRayStory {
  cash: XRayStoryEntry;
  margin: XRayStoryEntry;
  leverage: XRayStoryEntry;
  quality: XRayStoryEntry;
  funding: XRayStoryEntry;
  headline: string;
  subtitle: string;
}

export interface AlignedMetrics {
  rev: number;
  net: number;
  gp: number;
  cfo: number;
  fcf: number;
  capex: number;
  cff: number;
  borrowings: number;
  ca: number;
  cl: number;
  eq: number;
  ta: number;
  totalDebt: number;
  nm: number | null;
  gm: number | null;
  curRatio: number | null;
  deRatio: number | null;
  cfoNi: number | null;
  fcfYield: number | null;
  fScore: number | null;
  beneish: number | null;
  nmPrev: number | null;
}

export interface RedFlag {
  severity?: string;
  status_symbol?: string;
  title_ar?: string;
  title_en?: string;
  detail?: string;
}

export const SIG_COLOR = {
  green: {
    bg: "bg-[#F0FDF4]",
    border: "border-[#BBF7D0]",
    text: "text-[#166534]",
    dot: "bg-[#16A34A]",
    badge: "bg-[#BBF7D0] text-[#166534]",
    glyph: "✓",
    colorHex: "#16A34A",
  },
  amber: {
    bg: "bg-[#FFFBEB]",
    border: "border-[#FDE68A]",
    text: "text-[#92400E]",
    dot: "bg-[#D97706]",
    badge: "bg-[#FDE68A] text-[#92400E]",
    glyph: "◑",
    colorHex: "#D97706",
  },
  red: {
    bg: "bg-[#FEF2F2]",
    border: "border-[#FECACA]",
    text: "text-[#991B1B]",
    dot: "bg-[#DC2626]",
    badge: "bg-[#FECACA] text-[#991B1B]",
    glyph: "✗",
    colorHex: "#DC2626",
  },
  neutral: {
    bg: "bg-[#F8FAFC]",
    border: "border-[#E2E8F0]",
    text: "text-[#475569]",
    dot: "bg-[#94A3B8]",
    badge: "bg-[#E2E8F0] text-[#475569]",
    glyph: "—",
    colorHex: "#94A3B8",
  },
} as const;
