"use client";

import React, { useState } from "react";
import {
    BookOpen,
    Brain,
    ChevronDown,
    ChevronUp,
    Cpu,
    Layers,
    ShieldCheck,
    TrendingUp,
} from "lucide-react";

interface Section {
    id: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    content: React.ReactNode;
}

function SectionPanel({ s, open, onToggle }: { s: Section; open: boolean; onToggle: () => void }) {
    return (
        <div className="border border-[#E5E7EB] rounded-[4px] overflow-hidden">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-[#F9FAFB] transition-colors text-left"
                aria-expanded={open}
            >
                <div className="flex items-center gap-2.5">
                    <span className="text-[#8C3B32]">{s.icon}</span>
                    <div>
                        <div className="text-[12.5px] font-bold text-[#1A1A1A]">{s.title}</div>
                        <div className="text-[10.5px] text-[#9CA3AF] font-normal">{s.subtitle}</div>
                    </div>
                </div>
                {open ? (
                    <ChevronUp size={14} className="text-[#9CA3AF] shrink-0" />
                ) : (
                    <ChevronDown size={14} className="text-[#9CA3AF] shrink-0" />
                )}
            </button>

            {open && (
                <div className="px-4 pb-4 pt-2 bg-[#FAFAFA] border-t border-[#F3F4F6] text-[12px] text-[#374151] leading-relaxed">
                    {s.content}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────
// Section content components
// ─────────────────────────────────────────

function CommandmentList() {
    const items = [
        "Find what suits us, not what suits everyone — the art of selection, not auditing everything.",
        "Three entry conditions: a clear operating story, a fair price (IRR > 15%), and a sufficient margin of safety.",
        "The information pyramid: financial statements first, then the annual report, then management — never the reverse.",
        "The GoPro lesson: if you can't value a company, don't enter it — the unknown is not an opportunity.",
        "Against familiarity: your fondness for a company or its product has no bearing on the buy decision — the numbers rule.",
        "Decide on IRR relative to R — if it doesn't exceed 15%, do not enter under any circumstances.",
        "The 'you are not a value investor' gate: verify earnings and revenue acceleration before entry.",
        "Self-assessment 4–6/10: give every trade an objective score — don't sugarcoat the truth to yourself.",
        "Cut-Cut (case: Al Rajhi 20.14%): in a crisis, cut and rebuild — don't freeze.",
        "Mathematical discipline over clever selection: without positive Expectancy, it is better not to trade.",
    ];

    return (
        <ol className="space-y-2.5 mt-1">
            {items.map((text, i) => (
                <li key={i} className="flex gap-2.5">
                    <span className="shrink-0 w-6 h-6 flex items-center justify-center bg-[#8C3B32] text-white text-[10px] font-bold rounded-full font-mono">
                        {i + 1}
                    </span>
                    <span className="pt-0.5">{text}</span>
                </li>
            ))}
        </ol>
    );
}

function PortfolioRules() {
    return (
        <div className="space-y-3">
            <div className="p-3 bg-white rounded-[4px] border border-[#E5E7EB]">
                <div className="font-bold text-[#8C3B32] mb-1">The 100 − Age Rule</div>
                <p>Equity allocation = 100 − your age. The remainder goes into lower-risk assets. Goal: protect capital as you get older.</p>
            </div>
            <div className="p-3 bg-white rounded-[4px] border border-[#E5E7EB]">
                <div className="font-bold text-[#8C3B32] mb-1">The 3% Rule — Position Sizing, Not the Stop-Loss</div>
                <p>
                    Size of each trade = <span className="font-mono font-bold">(Capital × 3%) ÷ maximum expected loss per share</span>.<br />
                    The stop-loss is not the first line of defense — <strong>position size is the shield.</strong> Never let a stop-loss compensate for an oversized position.
                </p>
            </div>
            <div className="p-3 bg-white rounded-[4px] border border-[#E5E7EB]">
                <div className="font-bold text-[#8C3B32] mb-1">Expectancy (Minervini) — the Threshold for Staying in the Market</div>
                <p>
                    <span className="font-mono font-bold">E = (Win% × Average Gain) − (Loss% × Average Loss)</span><br />
                    It must be <strong className="text-[#16A34A]">positive</strong> consistently.
                    Negative expectancy means your methodology is losing you money — stop trading and review.
                </p>
                <div className="mt-2 text-[11px] text-[#9CA3AF]">
                    Example: 60% × 8% − 40% × 3% = +3.6% ✓ Positive expectancy
                </div>
            </div>
        </div>
    );
}

interface ThoughtEntry {
    situation: string;
    thought: string;
    feeling: string;
    action: string;
    review: string;
}

function PsychologyStation() {
    const [log, setLog] = useState<ThoughtEntry>({ situation: "", thought: "", feeling: "5", action: "", review: "" });
    const [saved, setSaved] = useState(false);

    function handleSave() {
        if (!log.situation && !log.thought) return;
        try {
            const existing: unknown[] = JSON.parse(localStorage.getItem("rebh-thought-log-v1") || "[]");
            existing.unshift({ ...log, date: new Date().toISOString() });
            localStorage.setItem("rebh-thought-log-v1", JSON.stringify(existing.slice(0, 50)));
            setLog({ situation: "", thought: "", feeling: "5", action: "", review: "" });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch { /* ignore */ }
    }

    const inputCls = "w-full bg-white border border-[#E5E7EB] rounded-[4px] px-3 py-1.5 text-[12px] text-[#1A1A1A] outline-none focus:border-[#8C3B32] focus:ring-1 focus:ring-[#8C3B32]/20 placeholder:text-[#D1D5DB]";

    const stopTriggers = [
        "You lost more than 3% of the portfolio in a single day — stop trading for the day.",
        "Three consecutive losing trades — take a break.",
        "You feel pressure to win it back quickly (revenge trading) — close the screen.",
        "You decided to change your strategy while a trade is open — stop.",
        "You traded on a tip without your own analysis — reassess yourself.",
        "You can't sleep well because of an open trade — the position exceeds your psychological capacity.",
        "You check prices every minute — that is a symptom, not analysis.",
    ];

    const thinkingErrors = [
        "Confirmation bias: you look for what supports your view, not what refutes it.",
        "Overconfidence: 'I know more than the market' — nobody does.",
        "Recency bias: the latest headline overshadows all of history.",
        "Mean-reversion fallacy: stocks don't necessarily return to their average.",
        "Fear of missing out (FOMO): drives you to buy at the top.",
        "Loss aversion: an open loss hurts more than an equivalent gain pleases.",
        "Illusion of control: you think you control what you don't.",
    ];

    return (
        <div className="space-y-5">
            <div>
                <div className="font-bold text-[#1A1A1A] mb-2 flex items-center gap-1.5">
                    <Brain size={13} className="text-[#8C3B32]" />
                    Thought Log
                    <span className="text-[10px] text-[#9CA3AF] font-normal ml-1">(5 fields · saved locally)</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    {[
                        { key: "situation" as const, label: "① Situation / Event", ph: "What happened in the market or in your trade?" },
                        { key: "thought" as const, label: "② Automatic Thought / Interpretation", ph: "What crossed your mind immediately?" },
                        { key: "action" as const, label: "④ Action Taken", ph: "What did you do next?" },
                        { key: "review" as const, label: "⑤ Review / Lesson", ph: "What will you do going forward?" },
                    ].map(({ key, label, ph }) => (
                        <label key={key} className="flex flex-col gap-1">
                            <span className="text-[10.5px] font-medium text-[#6B7280]">{label}</span>
                            <input
                                value={log[key]}
                                onChange={e => setLog(p => ({ ...p, [key]: e.target.value }))}
                                placeholder={ph}
                                className={inputCls}
                            />
                        </label>
                    ))}
                    <label className="flex flex-col gap-1">
                        <span className="text-[10.5px] font-medium text-[#6B7280]">③ Emotional Intensity (1–10)</span>
                        <div className="flex items-center gap-3">
                            <input
                                type="range" min="1" max="10" value={log.feeling}
                                onChange={e => setLog(p => ({ ...p, feeling: e.target.value }))}
                                className="flex-1 accent-[#8C3B32]"
                            />
                            <span className="font-mono font-bold text-[#8C3B32] w-5 text-center">{log.feeling}</span>
                        </div>
                    </label>
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    className="mt-2 px-4 py-1.5 text-[11.5px] font-bold bg-[#8C3B32] text-white rounded-[4px] hover:bg-[#78322A] transition"
                >
                    {saved ? "✓ Saved" : "Save Entry"}
                </button>
            </div>

            <div>
                <div className="font-bold text-[#1A1A1A] mb-2 flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-[#DC2626]" />
                    The Seven Stop Triggers
                </div>
                <ol className="space-y-1.5">
                    {stopTriggers.map((t, i) => (
                        <li key={i} className="flex gap-2 items-start">
                            <span className="shrink-0 text-[10px] font-bold text-[#DC2626] mt-0.5 font-mono w-4">{i + 1}.</span>
                            <span>{t}</span>
                        </li>
                    ))}
                </ol>
            </div>

            <div>
                <div className="font-bold text-[#1A1A1A] mb-2 flex items-center gap-1.5">
                    <Cpu size={13} className="text-[#B45309]" />
                    Seven Common Thinking Errors
                </div>
                <ol className="space-y-1.5">
                    {thinkingErrors.map((e, i) => (
                        <li key={i} className="flex gap-2 items-start">
                            <span className="shrink-0 text-[10px] font-bold text-[#B45309] mt-0.5 font-mono w-4">{i + 1}.</span>
                            <span>{e}</span>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}

function AIRules() {
    const verificationBlock = [
        "Is the primary data source identified and reliable? (no bare assertions)",
        "Are the figures derived from official statements — not from secondary summaries?",
        "Is there a conflict between different data points? (e.g. net income doesn't reconcile with cash flow)",
        "Are the assumptions explicit and disclosed? (≈ not °)",
        "Is confidence in the answer ≤ 7/10? — if so, treat it as a probable hallucination and stop.",
        "Does the analysis recommend a direct buy or sell? — if yes, stop using it.",
        "Did you cross-check the result with your own analysis? — never rely on AI alone.",
    ];

    const riseTemplate = [
        { label: "R — Role", desc: "Define the role: a financial analyst specializing in quantitative methodology, not a stock recommender." },
        { label: "I — Input", desc: "Supply raw data (financial statements, computed ratios) — don't ask for a general opinion." },
        { label: "S — Steps", desc: "Request the analysis step by step following the course methodology (Safety → Porter → IRR)." },
        { label: "E — Evaluate", desc: "Evaluate the outputs yourself — AI complements your own analysis, it does not replace it." },
    ];

    return (
        <div className="space-y-4">
            <div>
                <div className="font-bold text-[#1A1A1A] mb-2 flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-[#2563EB]" />
                    The Seven-Point Verification Block
                    <span className="text-[10px] text-[#9CA3AF] font-normal ml-1">(confidence ≤ 7/10 = hallucination)</span>
                </div>
                <ol className="space-y-1.5">
                    {verificationBlock.map((q, i) => (
                        <li key={i} className="flex gap-2 items-start">
                            <span className="shrink-0 text-[10px] font-bold text-[#2563EB] mt-0.5 font-mono w-4">{i + 1}.</span>
                            <span>{q}</span>
                        </li>
                    ))}
                </ol>
            </div>
            <div>
                <div className="font-bold text-[#1A1A1A] mb-2 flex items-center gap-1.5">
                    <Layers size={13} className="text-[#2563EB]" />
                    RISE Template — Using AI Honestly
                </div>
                <div className="space-y-2">
                    {riseTemplate.map((r) => (
                        <div key={r.label} className="flex gap-2.5 items-start p-2.5 bg-white border border-[#E5E7EB] rounded-[4px]">
                            <span className="shrink-0 font-mono font-black text-[#2563EB] text-[11px] w-24">{r.label}</span>
                            <span className="text-[11.5px]">{r.desc}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────
// Main export
// ─────────────────────────────────────────

export function RulebookAccordion() {
    const [openId, setOpenId] = useState<string | null>(null);
    const [rootOpen, setRootOpen] = useState(false);

    const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

    const sections: Section[] = [
        {
            id: "commandments",
            icon: <BookOpen size={15} />,
            title: "The Ten Commandments — Abu Saad's Commandments",
            subtitle: "Principles of selection, analysis and discipline",
            content: <CommandmentList />,
        },
        {
            id: "portfolio",
            icon: <TrendingUp size={15} />,
            title: "Portfolio & Risk Rules",
            subtitle: "100−Age · 3% position size · Expectancy",
            content: <PortfolioRules />,
        },
        {
            id: "psychology",
            icon: <Brain size={15} />,
            title: "Psychology Station",
            subtitle: "Thought Log · Seven Stop Triggers · Thinking Errors",
            content: <PsychologyStation />,
        },
        {
            id: "ai",
            icon: <Cpu size={15} />,
            title: "AI Usage Rules",
            subtitle: "Verification Block · RISE Template",
            content: <AIRules />,
        },
    ];

    return (
        <div dir="ltr" className="mt-6 border border-[#E5E7EB] rounded-[4px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <button
                type="button"
                onClick={() => setRootOpen((p) => !p)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-white hover:bg-[#FAFAFA] transition-colors text-left border-b border-[#E5E7EB]"
            >
                <div className="flex items-center gap-2.5">
                    <BookOpen size={16} className="text-[#8C3B32]" />
                    <div>
                        <span className="text-[13px] font-black text-[#1A1A1A]">
                            Door 7 — The Complete Abu Saad Methodology
                        </span>
                        <span className="ml-2 text-[10px] font-mono text-[#6B7280] bg-[#F3F4F6] border border-[#E5E7EB] rounded px-1.5 py-0.5">
                            Rulebook · Door 7
                        </span>
                    </div>
                </div>
                {rootOpen ? (
                    <ChevronUp size={15} className="text-[#9CA3AF] shrink-0" />
                ) : (
                    <ChevronDown size={15} className="text-[#9CA3AF] shrink-0" />
                )}
            </button>

            {rootOpen && (
                <div className="p-4 bg-[#F7F8FA] space-y-2">
                    <p className="text-[11.5px] text-[#6B7280] mb-3 leading-relaxed">
                        “Anyone who opens the site finds everything Abu Saad said in the course, in full.”
                        Door 7 is the operating wisdom: commandments and rules a trader consults when planning, not in the middle of a crisis.
                    </p>
                    <div className="space-y-1.5">
                        {sections.map((s) => (
                            <SectionPanel
                                key={s.id}
                                s={s}
                                open={openId === s.id}
                                onToggle={() => toggle(s.id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}