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
                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-[#F9FAFB] transition-colors text-right"
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
        "نجد ما يناسبنا، لا ما يناسب الجميع — فن الاختيار لا التدقيق في كل شيء.",
        "ثلاثة شروط للدخول: قصة تشغيلية واضحة، سعر مناسب (IRR > 15%)، حافة أمان كافية.",
        "هرم المعلومات: القوائم المالية أولاً، ثم التقرير السنوي، ثم الإدارة — ليس العكس.",
        "GoPro درس: الشركة التي لا تعرف كيف تُقيّمها لا تدخلها — المجهول ليس فرصة.",
        "ضد الألفة: حبّك للشركة أو منتجها لا علاقة له بقرار الشراء — الأرقام تحكم.",
        "القرار بالـ IRR مقارنةً بـ R — إن لم يتجاوز 15% فلا تدخل بأي حال.",
        "بوابة 'لستَ مستثمراً قيمة': تحقق من تسارع الأرباح والإيرادات قبل الدخول.",
        "محاسبة النفس 4–6/10: لكل صفقة تقييم موضوعي — لا تُطرّي الحقيقة على نفسك.",
        "Cut-Cut (الحالة: الراجحي 20.14%): في الأزمة قصّ وأعِد البناء — لا تتجمّد.",
        "الانضباط الرياضي فوق الانتقاء الذكي: بدون Expectancy موجب، الأفضل ألا تتداول.",
    ];

    const arabic = ["١","٢","٣","٤","٥","٦","٧","٨","٩","١٠"];

    return (
        <ol className="space-y-2.5 mt-1">
            {items.map((text, i) => (
                <li key={i} className="flex gap-2.5">
                    <span className="shrink-0 w-6 h-6 flex items-center justify-center bg-[#8C3B32] text-white text-[10px] font-bold rounded-full font-mono">
                        {arabic[i]}
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
                <div className="font-bold text-[#8C3B32] mb-1">قاعدة 100 − العمر</div>
                <p>نسبة الأسهم في المحفظة = 100 − عمرك. المتبقي في أصول أقل خطورة. الهدف: حماية رأس المال مع التقدم في السن.</p>
            </div>
            <div className="p-3 bg-white rounded-[4px] border border-[#E5E7EB]">
                <div className="font-bold text-[#8C3B32] mb-1">قاعدة الـ 3% — بحجم المركز لا بوقف الخسارة</div>
                <p>
                    حجم كل صفقة = <span className="font-mono font-bold">(رأس المال × 3%) ÷ أقصى خسارة متوقعة لكل سهم</span>.<br />
                    وقف الخسارة ليس خط الدفاع الأول — <strong>حجم المركز هو الدرع.</strong> لا تترك وقف الخسارة يعوّض عن مركز كبير.
                </p>
            </div>
            <div className="p-3 bg-white rounded-[4px] border border-[#E5E7EB]">
                <div className="font-bold text-[#8C3B32] mb-1">التوقع الرياضي (Minervini) — عتبة الاستمرار في السوق</div>
                <p>
                    <span className="font-mono font-bold">E = (Win% × متوسط الربح) − (Loss% × متوسط الخسارة)</span><br />
                    يجب أن يكون <strong className="text-[#16A34A]">موجباً</strong> باستمرار.
                    توقع سلبي يعني أن منهجيتك تُفقدك المال — أوقف التداول وراجع.
                </p>
                <div className="mt-2 text-[11px] text-[#9CA3AF]">
                    مثال: 60% × 8% − 40% × 3% = +3.6% ✓ توقع إيجابي
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
        "خسرت أكثر من 3% من المحفظة في يوم واحد — أوقف التداول اليوم.",
        "تداولتَ ثلاث صفقات خاسرة متتالية — خذ استراحة.",
        "تشعر بضغط للاسترداد السريع (Revenge trading) — أغلق الشاشة.",
        "قررتَ تغيير استراتيجيتك أثناء صفقة مفتوحة — أوقف.",
        "تداولتَ بناءً على نصيحة دون تحليل شخصي — راجع نفسك.",
        "لا تنام جيداً بسبب صفقة مفتوحة — المركز أكبر من طاقتك النفسية.",
        "تتابع الأسعار كل دقيقة — هذا عَرَض، ليس تحليلاً.",
    ];

    const thinkingErrors = [
        "تحيز التأكيد: تبحث عن ما يدعم رأيك لا ما يفنّده.",
        "المبالغة بالثقة: 'أعرف أكثر من السوق' — لا أحد يعرف.",
        "تحيز الحداثة: آخر خبر يطغى على كل التاريخ.",
        "خطأ الانعكاس: الأسهم لا ترجع بالضرورة لمتوسطها.",
        "الخوف من الفوات (FOMO): يقودك للدخول في القمة.",
        "تحيز الخسارة: الخسارة المعلّقة أكثر إيلاماً من المكسب المقابل.",
        "وهم التحكم: تظن أنك تتحكم فيما لا تتحكم فيه.",
    ];

    return (
        <div className="space-y-5">
            <div>
                <div className="font-bold text-[#1A1A1A] mb-2 flex items-center gap-1.5">
                    <Brain size={13} className="text-[#8C3B32]" />
                    سجل الأفكار — Thought Log
                    <span className="text-[10px] text-[#9CA3AF] font-normal mr-1">(5 حقول · يُحفظ محلياً)</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    {[
                        { key: "situation" as const, label: "① الموقف / الحدث", ph: "ما الذي حدث في السوق أو في صفقتك؟" },
                        { key: "thought" as const, label: "② الفكرة / التفسير التلقائي", ph: "ماذا خطر ببالك فوراً؟" },
                        { key: "action" as const, label: "④ الإجراء المتخذ", ph: "ماذا فعلت بعدها؟" },
                        { key: "review" as const, label: "⑤ المراجعة / الدرس", ph: "ما الذي ستفعله قادماً؟" },
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
                        <span className="text-[10.5px] font-medium text-[#6B7280]">③ شدة المشاعر (1–10)</span>
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
                    {saved ? "✓ تم الحفظ" : "حفظ السجل"}
                </button>
            </div>

            <div>
                <div className="font-bold text-[#1A1A1A] mb-2 flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-[#DC2626]" />
                    السبعة محركات الإيقاف — Stop Triggers
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
                    سبعة أخطاء تفكير شائعة
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
        "هل المصدر الأساسي للبيانات محدد وموثوق؟ (لا ادعاء مجرد)",
        "هل الأرقام مشتقة من القوائم الرسمية — لا من ملخصات ثانوية؟",
        "هل هناك تعارض بين بيانات مختلفة؟ (مثال: صافي الربح لا يتطابق مع التدفق النقدي)",
        "هل الفرضيات واضحة ومصرّح بها؟ (≈ لا °)",
        "هل الثقة في الإجابة ≤ 7/10؟ — إن كانت كذلك فهذه هلوسة محتملة، قف.",
        "هل التحليل يقترح شراءً أو بيعاً مباشراً؟ — إن كان نعم، أوقف الاستخدام.",
        "هل راجعت النتيجة بتحليلك الشخصي؟ — لا تثق بالذكاء الاصطناعي وحده.",
    ];

    const riseTemplate = [
        { label: "R — Role", desc: "حدّد دورك: محلل مالي متخصص بالمنهجية الكمّية وليس موصياً بالأسهم." },
        { label: "I — Input", desc: "أدخل البيانات الخام (القوائم المالية، النسب المحسوبة) — لا تطلب الرأي العام." },
        { label: "S — Steps", desc: "اطلب التحليل خطوة بخطوة وفق منهجية الدورة (Safety → Porter → IRR)." },
        { label: "E — Evaluate", desc: "قيّم المخرجات بنفسك — الذكاء الاصطناعي يُكمّل لا يستبدل التحليل الشخصي." },
    ];

    return (
        <div className="space-y-4">
            <div>
                <div className="font-bold text-[#1A1A1A] mb-2 flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-[#2563EB]" />
                    كتلة التحقق السبعية — Verification Block
                    <span className="text-[10px] text-[#9CA3AF] font-normal mr-1">(ثقة ≤ 7/10 = هلوسة)</span>
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
                    قالب RISE — كيف تستخدم الذكاء الاصطناعي بصدق
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
            title: "العشرة وصايا — وصايا أبو سعد",
            subtitle: "مبادئ الانتقاء والتحليل والانضباط",
            content: <CommandmentList />,
        },
        {
            id: "portfolio",
            icon: <TrendingUp size={15} />,
            title: "قواعد المحفظة والمخاطرة",
            subtitle: "100−العمر · 3% حجم المركز · Expectancy",
            content: <PortfolioRules />,
        },
        {
            id: "psychology",
            icon: <Brain size={15} />,
            title: "محطة علم النفس",
            subtitle: "Thought Log · Seven Stop Triggers · أخطاء التفكير",
            content: <PsychologyStation />,
        },
        {
            id: "ai",
            icon: <Cpu size={15} />,
            title: "قواعد الذكاء الاصطناعي",
            subtitle: "Verification Block · RISE Template",
            content: <AIRules />,
        },
    ];

    return (
        <div className="mt-6 border border-[#E5E7EB] rounded-[4px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <button
                type="button"
                onClick={() => setRootOpen((p) => !p)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-white hover:bg-[#FAFAFA] transition-colors text-right border-b border-[#E5E7EB]"
            >
                <div className="flex items-center gap-2.5">
                    <BookOpen size={16} className="text-[#8C3B32]" />
                    <div>
                        <span className="text-[13px] font-black text-[#1A1A1A]">
                            الباب السابع — منهجية أبو سعد الكاملة
                        </span>
                        <span className="mr-2 text-[10px] font-mono text-[#6B7280] bg-[#F3F4F6] border border-[#E5E7EB] rounded px-1.5 py-0.5">
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
                        «من يفتح الموقع يجد كل ما قاله أبو سعد في الدورة كاملاً.»
                        الباب السابع هو الحكمة التشغيلية؛ وصايا وقواعد يرجع إليها المتداول عند التخطيط لا عند الأزمة.
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
