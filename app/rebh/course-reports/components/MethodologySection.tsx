"use client";

import React from "react";

interface Props {
  sectionId: string;
}

const METHODOLOGY_SECTIONS: Record<string, {
  title: string;
  subtitle: string;
  content: React.ReactNode;
}> = {
  m1: {
    title: "خريطة اختيار الطريقة",
    subtitle: "شجرة القرار — من أين أبدأ؟",
    content: (
      <div className="space-y-4 text-xs text-[#aab6c6] leading-relaxed">
        <div className="bg-[#182130] border border-[#1d2735] rounded-lg p-4 border-r-2 border-r-[#d9b64a]">
          <h4 className="text-white font-bold mb-2">السؤال الأول: هل الشركة تربح؟</h4>
          <div className="space-y-1.5">
            <p><span className="text-emerald-400 font-bold">✓ نعم →</span> انتقل للسؤال الثاني.</p>
            <p><span className="text-rose-400 font-bold">✗ لا →</span> <span className="text-[#63a5f0]">P/S (راجع الباب السادس)</span> إذا كانت تبيع. إذا لم تبع بعد: <span className="text-[#63a5f0]">rNPV أو الافتراض على الحقيقة</span>.</p>
          </div>
        </div>
        <div className="bg-[#182130] border border-[#1d2735] rounded-lg p-4 border-r-2 border-r-[#3987e5]">
          <h4 className="text-white font-bold mb-2">السؤال الثاني: ما نوع الشركة؟</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {[
              { type: "بنك أو تأمين", path: "عدة العسيري (NII, NIM, CASA, LDR, مخصصات/إيراد) — الباب الرابع" },
              { type: "دورية (سلعة/إسمنت)", path: "نطاقات التاريخية + P/BV + إشارة الخروج — الباب الثالث" },
              { type: "عقارية", path: "القيمة الدائمة + NAV + FFO — الباب الأول" },
              { type: "دفاعية أو نمو", path: "المعادلات التسع (بدون نمو / جوردون / عابر) — الباب الثاني" },
            ].map((item, i) => (
              <div key={i} className="bg-[#0e141d] rounded p-3 border border-[#1d2735]">
                <div className="text-white font-bold">{item.type}</div>
                <div className="text-[#5f6d80] mt-1">{item.path}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#182130] border border-[#1d2735] rounded-lg p-4 border-r-2 border-r-[#2ecc71]">
          <h4 className="text-white font-bold mb-2">القاعدة الذهبية — الترتيب</h4>
          <p>الـ IRR على أفقك مقارنة بعتبتك (R المطلوب) هو المُقرر فوق كل الأدوات. الـ DCF والقيمة العادلة أدوات مساعدة لا مُقررة.</p>
        </div>
      </div>
    ),
  },
  m2: {
    title: "العادية والنمو",
    subtitle: "المعادلات التسع والمناطق ولينش",
    content: (
      <div className="space-y-4 text-xs text-[#aab6c6]">
        <div className="bg-[#182130] border border-[#1d2735] rounded-lg p-4 border-r-2 border-r-[#d9b64a]">
          <h4 className="text-white font-bold mb-3">المعادلات التسع — المربع (3 عدسات × 3 إيقاعات)</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-[#1d2735] text-[#5f6d80]">
                  <th className="py-1.5 px-2 text-right">العدسة</th>
                  <th className="py-1.5 px-2 text-left font-mono">بدون نمو X/R</th>
                  <th className="py-1.5 px-2 text-left font-mono">جوردون X(1+GL)/(R−GL)</th>
                  <th className="py-1.5 px-2 text-left font-mono">عابر + X(N/2)(GS−GL)/(R−GL)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1d2735]/50">
                {["التوزيعات", "الأرباح", "التدفق الحر (صافي الدين°)"].map((row, i) => (
                  <tr key={i}>
                    <td className="py-1.5 px-2 text-white font-bold">{row}</td>
                    <td className="py-1.5 px-2 text-left font-mono text-[#63a5f0]">السعر الذهبي</td>
                    <td className="py-1.5 px-2 text-left font-mono text-[#d9b64a]">السعر الفضي</td>
                    <td className="py-1.5 px-2 text-left font-mono text-orange-400">السعر البرونزي</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { zone: "ذهبية", color: "text-emerald-400", border: "border-r-emerald-400", desc: "السعر ≤ بدون نمو — هامش الأمان الأكبر" },
            { zone: "فضية", color: "text-[#d9b64a]", border: "border-r-[#d9b64a]", desc: "بدون نمو < السعر ≤ جوردون" },
            { zone: "برونزية", color: "text-orange-400", border: "border-r-orange-400", desc: "جوردون < السعر ≤ عابر — نقطة دخول GS فقط" },
          ].map((z, i) => (
            <div key={i} className={`bg-[#182130] border border-[#1d2735] border-r-2 ${z.border} rounded-lg p-3`}>
              <div className={`font-bold ${z.color}`}>{z.zone}</div>
              <div className="text-[#5f6d80] mt-1">{z.desc}</div>
            </div>
          ))}
        </div>
        <div className="bg-[#182130] border border-[#1d2735] rounded-lg p-4 border-r-2 border-r-[#3987e5]">
          <h4 className="text-white font-bold mb-2">عداد لينش للفرص</h4>
          <p>1–2 فرصة من مئة شركة = قمة السوق. 20–30% فرصاً = قاع السوق. يُستخدم كمقياس نفسي جماعي لا كأداة دخول مباشرة.</p>
        </div>
      </div>
    ),
  },
  m3: {
    title: "شركات الدورات",
    subtitle: "النطاقات وإشارة الخروج",
    content: (
      <div className="space-y-4 text-xs text-[#aab6c6]">
        <div className="bg-[#182130] border border-[#1d2735] rounded-lg p-4 border-r-2 border-r-orange-400">
          <h4 className="text-white font-bold mb-2">لماذا تفشل معادلات النمو مع الدوريات؟</h4>
          <p>الأرباح في ذروة الدورة تضخّم المكرر الأمامي وتُظهر السهم رخيصاً — والعكس في القاع. القاعدة: مكرر منخفض في الذروة = إشارة خروج، ومكرر مرتفع في القاع = إشارة دخول.</p>
        </div>
        <div className="bg-[#182130] border border-[#1d2735] rounded-lg p-4 border-r-2 border-r-[#d9b64a]">
          <h4 className="text-white font-bold mb-3">أدوات الدوريات</h4>
          <div className="space-y-2">
            {[
              { tool: "P/BV التاريخي", usage: "الشراء في الجزء السفلي من النطاق التاريخي (مثلاً 0.8–1.5× للإسمنت)" },
              { tool: "P/S وسطي الدورة", usage: "مقارنة السعر بالإيراد وسط الدورة لا بذروتها" },
              { tool: "Normalized EPS", usage: "متوسط الأرباح على دورة كاملة (5–7 سنوات) لا آخر ربع" },
              { tool: "إشارة الخروج", usage: "ارتفاع P/BV لأعلى الثلث التاريخي + تحسن الهوامش = بيع وانتظار" },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 border-b border-[#1d2735]/50 pb-2 last:border-0 last:pb-0">
                <span className="text-[#d9b64a] font-bold shrink-0">{item.tool}:</span>
                <span>{item.usage}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  m4: {
    title: "البنوك والتأمين",
    subtitle: "عدة العسيري كاملة",
    content: (
      <div className="space-y-4 text-xs text-[#aab6c6]">
        <div className="bg-[#182130] border border-[#1d2735] rounded-lg p-4 border-r-2 border-r-[#3987e5]">
          <h4 className="text-white font-bold mb-3">المقاييس الرئيسية للبنك (عدة العسيري)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#1d2735] text-[#5f6d80]">
                  <th className="py-1.5 px-2 text-right">المقياس</th>
                  <th className="py-1.5 px-2 text-left">المعادلة</th>
                  <th className="py-1.5 px-2 text-right">الحدود المرجعية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1d2735]/50">
                {[
                  { m: "NIM (هامش صافي التمويل)", f: "صافي دخل التمويل / الأصول المدرة", t: "≥3% ممتاز · 2–3% جيد" },
                  { m: "CASA %", f: "الحسابات الجارية والتوفير / إجمالي الودائع", t: "↑ كلما ارتفع كلما انخفضت تكلفة الأموال" },
                  { m: "LDR (نسبة التمويل للودائع)", f: "إجمالي التمويل / إجمالي الودائع", t: "80–90% مثالي · >100% محفوف بالمخاطر" },
                  { m: "المخصصات / الإيراد", f: "مخصصات خسائر التمويل / إجمالي الدخل", t: "أقل = أحسن · >30% ضغط كبير" },
                  { m: "CAR (كفاية رأس المال)", f: "رأس المال الأساسي / الأصول الموزونة بالمخاطر", t: "≥12% قوي" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-2 text-white font-bold">{row.m}</td>
                    <td className="py-2 px-2 font-mono text-[#63a5f0]">{row.f}</td>
                    <td className="py-2 px-2 text-[#5f6d80]">{row.t}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-[#182130] border border-[#1d2735] rounded-lg p-4 border-r-2 border-r-[#d9b64a]">
          <h4 className="text-white font-bold mb-2">لماذا عناصر السلامة الصناعية لا تنطبق على البنوك؟</h4>
          <p>البنك بطبيعته يملك نسب دين/أصول عالية ({'&lt;'}80%) لأن الودائع التزامات لا ديون بالمفهوم الصناعي. قاعدة الدورة: وزن التعويض 100% على بورتر للبنوك.</p>
        </div>
      </div>
    ),
  },
  m5: {
    title: "القوائم والنسب",
    subtitle: "السلامة والكفاءة والأعلام",
    content: (
      <div className="space-y-4 text-xs text-[#aab6c6]">
        <div className="bg-[#182130] border border-[#1d2735] rounded-lg p-4 border-r-2 border-r-[#d9b64a]">
          <h4 className="text-white font-bold mb-3">عناصر السلامة الخمسة — الحدود الحرفية</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#1d2735] text-[#5f6d80]">
                  <th className="py-1.5 px-2 text-right">العنصر</th>
                  <th className="py-1.5 px-2 text-right">+1 (ممتاز)</th>
                  <th className="py-1.5 px-2 text-right">0 (مقبول)</th>
                  <th className="py-1.5 px-2 text-right">−1 (ضعيف)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1d2735]/50">
                {[
                  { el: "ROE", good: "≥15%", ok: "10–15%", bad: "<10%" },
                  { el: "ROA", good: "≥10%", ok: "6–10%", bad: "≤6%" },
                  { el: "نسبة التداول", good: "≥2×", ok: "1–2×", bad: "≤1×" },
                  { el: "الدين/الأصول", good: "≤40%", ok: "40–60%", bad: "≥60%" },
                  { el: "تغطية الفائدة", good: "≥10×", ok: "6–10×", bad: "≤6×" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="py-1.5 px-2 text-white font-bold">{row.el}</td>
                    <td className="py-1.5 px-2 text-emerald-400">{row.good}</td>
                    <td className="py-1.5 px-2 text-amber-300">{row.ok}</td>
                    <td className="py-1.5 px-2 text-rose-400">{row.bad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-[#182130] border border-[#1d2735] rounded-lg p-4 border-r-2 border-r-rose-400">
          <h4 className="text-white font-bold mb-2">الأعلام الحمراء الحسابية°</h4>
          <div className="space-y-1.5">
            {[
              "تسارع الذمم المدينة > تسارع الإيراد — إشارة أرباح ورقية",
              "التدفق النقدي التشغيلي سالب مع صافي ربح موجب — فجوة نوعية",
              "انخفاض المخزون مع ارتفاع التكلفة — احتمال إدارة أرباح",
              "توزيعات أعلى من التدفق الحر — اقتراض لتوزيع",
              "تضخم المخصصات أو العكس فجأة — بينيش M-Score",
            ].map((flag, i) => (
              <div key={i} className="flex items-start gap-2 border-r-2 border-r-rose-400/60 pr-2 py-0.5">
                <span className="text-rose-400 font-bold shrink-0">⚑</span>
                <span>{flag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  m6: {
    title: "لم تربح أو لم تبع بعد",
    subtitle: "P/S والافتراض على الحقيقة وrNPV",
    content: (
      <div className="space-y-4 text-xs text-[#aab6c6]">
        <div className="bg-[#182130] border border-[#1d2735] rounded-lg p-4 border-r-2 border-r-[#d9b64a]">
          <h4 className="text-white font-bold mb-3">متى تستخدم P/S؟</h4>
          <p className="mb-2">الشركة تبيع لكنها لم تربح بعد (هوامش صافية سالبة أو شبه صفر). شرط الاستخدام: <span className="text-[#63a5f0]">وجود طريق واضح للربحية</span>.</p>
          <div className="font-mono bg-[#0e141d] rounded p-3 text-[#63a5f0] border border-[#1d2735]">
            P/S المستهدف = (هامش صافي مستهدف ÷ هامش صافي متوسط القطاع) × P/S القطاع
          </div>
        </div>
        <div className="bg-[#182130] border border-[#1d2735] rounded-lg p-4 border-r-2 border-r-[#3987e5]">
          <h4 className="text-white font-bold mb-3">rNPV — القيمة الحالية المعدلة للمخاطر</h4>
          <p className="mb-2">للشركات ذات الأصول غير المعلنة أو المراحل (بيوتك، عقود حكومية كبرى):</p>
          <div className="font-mono bg-[#0e141d] rounded p-3 text-[#63a5f0] border border-[#1d2735]">
            rNPV = Σ (PV كل مرحلة × احتمال نجاحها) − Σ (PV التكاليف المرجحة)
          </div>
          <p className="mt-2 text-[#5f6d80]">الخطأ الشائع: NPV الساذجة تتجاهل احتمال الفشل الذي يصل لـ 88% في المراحل المبكرة للبيوتك.</p>
        </div>
        <div className="bg-[#182130] border border-[#1d2735] rounded-lg p-4 border-r-2 border-r-rose-400">
          <h4 className="text-white font-bold mb-2">الافتراض على الحقيقة (الشركة لم تبع بعد)</h4>
          <div className="font-mono bg-[#0e141d] rounded p-3 text-[#63a5f0] border border-[#1d2735]">
            قطاع مقاس × حصة سوقية 1–2% مسببة ومدافع عنها → إيراد افتراضي → هامش القطاع → ربح → تقييم
          </div>
          <p className="mt-2 text-[#5f6d80]">تُطبق على الموقّع من العقود فقط — لا على التوقعات والأمنيات.</p>
        </div>
      </div>
    ),
  },
  m7: {
    title: "منهجية أبو سعد نفسه",
    subtitle: "العقيدة والقرار والانضباط",
    content: (
      <div className="space-y-4 text-xs text-[#aab6c6]">
        <div className="bg-[#182130] border border-[#1d2735] rounded-lg p-4 border-r-2 border-r-[#d9b64a]">
          <h4 className="text-white font-bold mb-3">العقيدة الاستثمارية — المبادئ العشرة</h4>
          <div className="space-y-1.5">
            {[
              "استثمر ما تفهمه فقط — سلة تخلط ما تفهم بما لا تفهم خطر",
              "الـ IRR المُقرر — ليس الـ DCF ولا القيمة العادلة مباشرة",
              "الأفق 3–5 سنوات — أقل من ذلك مضاربة لا استثمار",
              "النمو GS العابر — لا تُسعّر نمواً خارقاً لا تعرف مصدره",
              "لست مستثمر قيمة حتى تشتري تحت المنطقة الذهبية",
              "المنطقة البرونزية آخر نقطة دخول — ما فوقها تكلفة",
              "بوابة الشراء: IRR > R المطلوب + شراء مطلعين + اختراق فني",
              "قاعدة الـ 3%: لا تخاطر بأكثر من 3% من رأس المال في صفقة",
              "التنويع مقابل التركيز: عدد الأسهم التي تعرفها جيداً",
              "الصبر فضيلة — المنصة تعرض ولا توصي، والقرار لك وحدك",
            ].map((p, i) => (
              <div key={i} className="flex items-start gap-2 py-0.5">
                <span className="text-[#d9b64a] font-mono shrink-0">{i + 1}.</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  m8: {
    title: "كل الطرق — الجدول الجامع",
    subtitle: "كل طريقة: متى ومتى لا وأين تعيش",
    content: (
      <div className="space-y-4 text-xs text-[#aab6c6]">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-[#1d2735] bg-[#0e141d] text-[#5f6d80]">
                <th className="py-2 px-3 text-right">الطريقة</th>
                <th className="py-2 px-3 text-right">القاعدة/المعادلة</th>
                <th className="py-2 px-3 text-right">متى تُستخدم</th>
                <th className="py-2 px-3 text-right">متى لا تُستخدم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1d2735]/60">
              {[
                { m: "المربع التسعة", f: "X/R · جوردون · عابر", w: "دفاعية ونمو رابحة", nw: "دورية وبنوك" },
                { m: "P/BV التاريخي", f: "سعر ÷ قيمة الدفترية", w: "الدوريات في قاع الدورة", nw: "شركات نمو (أصول لا تعكس القيمة)" },
                { m: "عدة البنوك", f: "NII · NIM · CASA · LDR", w: "البنوك والتأمين حصراً", nw: "أي شركة غير مالية" },
                { m: "P/S", f: "سعر ÷ إيراد للسهم", w: "خاسرة بطريق واضح للربح", nw: "خاسرة بلا مسار ربح" },
                { m: "rNPV", f: "Σ(PV×احتمال) − تكاليف", w: "مراحل (بيوتك/عقود)", nw: "شركات ناضجة رابحة" },
                { m: "Beneish M°", f: ">−1.78 = احتمال تلاعب", w: "قراءة مستمرة لكل شركة", nw: "كمؤشر دخول وحيد" },
                { m: "Altman Z°", f: "درجات الإفلاس المركبة", w: "تقييم المتانة الائتمانية", nw: "البنوك (نموذج مختلف)" },
                { m: "Piotroski F°", f: "9 نقاط جودة مالية", w: "فلترة قوائم مقبولة", nw: "كأداة تقييم وحيدة" },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="py-2 px-3 text-white font-bold">{row.m}</td>
                  <td className="py-2 px-3 font-mono text-[#63a5f0]">{row.f}</td>
                  <td className="py-2 px-3 text-emerald-400/90">{row.w}</td>
                  <td className="py-2 px-3 text-rose-400/90">{row.nw}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-[#182130] border border-[#1d2735] rounded-lg p-4 border-r-2 border-r-[#d9b64a]">
          <p className="text-white">كل طريقة في هذا الجدول إما تعمل حية على المنصة الآن (° من السحب المتحقق)، أو معلنة بمكانها في المنهج — <b>ولا توجد طريقة وردت في الدورة بلا مصير معلن.</b></p>
          <p className="mt-2 text-[#5f6d80]">والمُقرر فوقها جميعاً واحد: الـ IRR على أفقك مقابل عتبتك — والمنصة تعرض ولا توصي.</p>
        </div>
      </div>
    ),
  },
};

export default function MethodologySection({ sectionId }: Props) {
  const section = METHODOLOGY_SECTIONS[sectionId];
  if (!section) return null;

  return (
    <div className="space-y-4">
      <div className="bg-[#0e141d] border border-[#1d2735] rounded-xl p-4">
        <h2 className="text-base font-black text-white">{section.title}</h2>
        <p className="text-xs text-[#5f6d80] mt-1">{section.subtitle}</p>
      </div>
      <div>{section.content}</div>
    </div>
  );
}
