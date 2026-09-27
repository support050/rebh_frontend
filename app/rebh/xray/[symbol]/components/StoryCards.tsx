import React from "react";
import { Activity, Droplets, Flame, Anchor, Zap, Wind } from "lucide-react";
import { XRayStory, XRayStoryEntry, SIG_COLOR } from "./types";

interface StoryCardProps {
  icon: React.ReactNode;
  title: string;
  entry: XRayStoryEntry;
  showFormula: boolean;
}

export function StoryCard({ icon, title, entry, showFormula }: StoryCardProps) {
  const c = SIG_COLOR[entry.signal];
  return (
    <div className={`rounded-[8px] border ${c.border} ${c.bg} p-4 space-y-2 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)]`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`${c.text}`}>{icon}</span>
          <span className="text-xs font-bold text-[#0F172A]">{title}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${c.badge}`}>
          <span>{c.glyph}</span>
          <span>{entry.signal === "green" ? "إيجابي" : entry.signal === "amber" ? "انتبه" : "سلبي"}</span>
        </span>
      </div>
      <p className="text-xs text-[#374151] leading-relaxed">{entry.text}</p>
      {showFormula && (
        <div className="border-t border-current/10 pt-2 text-[10px] font-mono text-[#64748B]">
          {entry.formula}
        </div>
      )}
    </div>
  );
}

interface StorySectionProps {
  story: XRayStory;
  showFormulas: boolean;
}

export function StoryNarrativeSection({ story, showFormulas }: StorySectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
        <Activity size={15} className="text-[#8C3B32]" />
        قصة X-Ray — بطاقات القراءة السردية
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <StoryCard
          icon={<Droplets size={14} />}
          title="قصة التدفق النقدي"
          entry={story.cash}
          showFormula={showFormulas}
        />
        <StoryCard
          icon={<Flame size={14} />}
          title="قصة الهوامش"
          entry={story.margin}
          showFormula={showFormulas}
        />
        <StoryCard
          icon={<Anchor size={14} />}
          title="قصة الرافعة والديون"
          entry={story.leverage}
          showFormula={showFormulas}
        />
        <StoryCard
          icon={<Zap size={14} />}
          title="قصة جودة الأرباح"
          entry={story.quality}
          showFormula={showFormulas}
        />
        <StoryCard
          icon={<Wind size={14} />}
          title="قصة التمويل والتوزيعات"
          entry={story.funding}
          showFormula={showFormulas}
        />
      </div>
    </div>
  );
}
