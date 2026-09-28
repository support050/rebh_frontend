/* eslint-disable @typescript-eslint/no-explicit-any */
// Builds the "Company Memo" PDF fully on the client with jsPDF + jspdf-autotable
// Arabic is supported through the Amiri font (served from /public/fonts) + jsPDF's built-in processArabic().

export interface CompanyMemoPdfData {
  symbol: string;
  name: string;
  sector: string;
  industryClass: string;
  currency: string;
  price: number;
  marketCap: number; // in millions (same unit used on the page)
  pe?: number | string | null;
  pb?: number | string | null;
  roe?: number | string | null;
  netMargin?: number | string | null;
  fcfYield?: number | string | null;
  fScore: number;
  grades: Record<string, { g: string; p: number; b?: string }>;
  rebhScoreOverride?: number | null;
  marketRank?: number | null;
  sectorRank?: number | null;
  isFresh: boolean;
  staleReason?: string | null;
  quarantineReason?: string | null;
  balanceIdentity?: any;
  buyGate?: any;
  capitalStructure?: any;
  zones?: any;
  irrDecision?: any;
  reverseDcf?: any;
  buildUp?: any;
  safety?: any;
  marginOfSafety?: number | null;
  bankMetrics?: any;
  cyclicalBands?: any;
  psLadder?: any;
  redFlags: any[];
  shariah?: any;
  classData?: any;
  quarterly?: any;
  currentQName: string;
  qoqDelta?: string | null;
  yoyDelta?: string | null;
  note?: string | null;
}

const FONT_REGULAR_URL = "/fonts/Amiri-Regular.ttf";
const FONT_BOLD_URL = "/fonts/Amiri-Bold.ttf";

let fontCache: { regular: string; bold: string } | null = null;

async function fetchFontBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font not found: ${url}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)) as any);
  }
  return btoa(bin);
}

async function loadFonts() {
  if (!fontCache) {
    const [regular, bold] = await Promise.all([
      fetchFontBase64(FONT_REGULAR_URL),
      fetchFontBase64(FONT_BOLD_URL),
    ]);
    fontCache = { regular, bold };
  }
  return fontCache;
}

// Glyphs that Amiri does not contain (they would render as blanks in the PDF)
const UNSUPPORTED = /[\u2713\u2714\u2691\u2248\u2399\u274C\u26A0\uFE0F\u00B0\u2264\u2265\u2605\u2606\u221E]/g;
const clean = (s: unknown) =>
  String(s ?? "").replace(UNSUPPORTED, "").replace(/[ \t]{2,}/g, " ").trim();

const has = (v: any) => v !== null && v !== undefined && v !== "" && !Number.isNaN(v);
const val = (v: any, suffix = "") => (has(v) ? `${v}${suffix}` : "—");
const num = (v: any) => (has(v) && !Number.isNaN(Number(v)) ? Math.round(Number(v)).toLocaleString("en-US") : "—");

const GRADE_LABELS: Record<string, string> = {
  Cash: "الربحية والكاش (Cash)",
  "الربحية والكفاءة": "الربحية والكاش (Cash)",
  Balance: "الميزانية والديون (Balance)",
  "المتانة المالية والسيولة": "الميزانية والديون (Balance)",
  Valuation: "جاذبية التقييم (Valuation)",
  "التقييم ومضاعفات السوق": "جاذبية التقييم (Valuation)",
  Growth: "النمو والزخم (Growth)",
  "النمو وتوليد النقد": "النمو والزخم (Growth)",
  Safety: "الأمان والملاءة (Safety)",
  "سلامة الأرباح والحوكمة": "الأمان والملاءة (Safety)",
  Profitability: "الربحية (Profitability)",
};

export async function generateCompanyMemoPdf(data: CompanyMemoPdfData): Promise<void> {
  const [jspdfMod, autoTableMod] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const JsPDF: any = (jspdfMod as any).jsPDF ?? (jspdfMod as any).default;
  const autoTable: any = (autoTableMod as any).default ?? (autoTableMod as any).autoTable;
  const fonts = await loadFonts();

  const doc: any = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.addFileToVFS("Amiri-Regular.ttf", fonts.regular);
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  doc.addFileToVFS("Amiri-Bold.ttf", fonts.bold);
  doc.addFont("Amiri-Bold.ttf", "Amiri", "bold");

  const W: number = doc.internal.pageSize.getWidth();
  const H: number = doc.internal.pageSize.getHeight();
  const M = 14;
  const R = W - M;
  const CW = W - M * 2;
  let y = 0;

  // jsPDF's built-in bidi assumes an LTR paragraph, so mixed Arabic/Latin lines come out
  // in the wrong order. We shape + reorder ourselves (RTL paragraph) and tell jsPDF the
  // text is already visual (isInputVisual/isOutputVisual) so it leaves it alone.
  const origText = doc.text.bind(doc);
  doc.text = (t: any, x: number, yy: number, opts?: any, ...rest: any[]) =>
    origText(t, x, yy, { ...(opts || {}), isInputVisual: true, isOutputVisual: true }, ...rest);

  const AR_RE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const LAT_RE = /[A-Za-z]/;
  const MIRROR: Record<string, string> = { "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{", "<": ">", ">": "<" };
  const mirrorStr = (str: string) => str.replace(/[()[\]{}<>]/g, (c) => MIRROR[c] ?? c);
  const revWord = (w: string) =>
    w
      .split(/([0-9][0-9.,]*%?|[A-Za-z]+)/)
      .reverse()
      .map((part) => (/^([0-9][0-9.,]*%?|[A-Za-z]+)$/.test(part) ? part : mirrorStr(part.split("").reverse().join(""))))
      .join("");

  const vis = (input: unknown): string => {
    const s = clean(input);
    if (!AR_RE.test(s)) return s; // pure Latin/numbers: nothing to reorder
    const shaped: string = doc.processArabic(s); // contextual letter forms (logical order)
    const toks = shaped.split(/ +/).filter(Boolean).map((t) => ({
      t,
      k: AR_RE.test(t) ? "A" : LAT_RE.test(t) ? "L" : /[0-9]/.test(t) ? "D" : "P",
    }));
    const isLtr = (i: number) => i < toks.length && (toks[i].k === "L" || toks[i].k === "D");
    const units: string[] = [];
    let i = 0;
    while (i < toks.length) {
      if (isLtr(i)) {
        // keep runs of Latin words / numbers ("12.50 SAR", "REBH ONE") in LTR order
        const run = [toks[i].t];
        let j = i;
        while (true) {
          if (isLtr(j + 1)) { run.push(toks[j + 1].t); j += 1; }
          else if (j + 2 < toks.length && toks[j + 1].k === "P" && isLtr(j + 2)) { run.push(toks[j + 1].t, toks[j + 2].t); j += 2; }
          else break;
        }
        units.push(run.join(" "));
        i = j + 1;
      } else if (toks[i].k === "A") {
        units.push(revWord(toks[i].t));
        i += 1;
      } else {
        units.push(mirrorStr(toks[i].t));
        i += 1;
      }
    }
    return units.reverse().join(" ");
  };
  const setFont = (style: "normal" | "bold", size: number) => {
    doc.setFont("Amiri", style);
    doc.setFontSize(size);
  };
  const ensure = (h: number) => {
    if (y + h > H - 18) {
      doc.addPage();
      y = M;
    }
  };

  // ── building blocks ────────────────────────────────────────────────────────
  const heading = (title: string, tableRows = 3) => {
    // keep the heading together with the start of what follows (no orphan headings)
    ensure(18 + Math.min((tableRows + 1) * 8.5, H - 60));
    y += 3;
    doc.setFillColor(243, 244, 246);
    doc.setDrawColor(229, 231, 235);
    doc.rect(M, y, CW, 8, "FD");
    doc.setFillColor(140, 59, 50);
    doc.rect(R - 1.4, y, 1.4, 8, "F");
    setFont("bold", 11);
    doc.setTextColor(26, 26, 26);
    doc.text(vis(title), R - 4, y + 5.6, { align: "right" });
    y += 12;
  };

  const paragraph = (
    text: string,
    o: { size?: number; bold?: boolean; color?: [number, number, number]; bullet?: boolean } = {}
  ) => {
    const size = o.size ?? 10;
    const lineH = size * 0.52;
    const indent = o.bullet ? 5 : 0;
    setFont(o.bold ? "bold" : "normal", size);
    const c = o.color ?? [55, 65, 81];
    doc.setTextColor(c[0], c[1], c[2]);
    const lines: string[] = doc.splitTextToSize(clean(text), (CW - indent) * 0.94);
    lines.forEach((ln, i) => {
      ensure(lineH + 1);
      if (o.bullet && i === 0) {
        doc.setFillColor(c[0], c[1], c[2]);
        doc.circle(R - 1.2, y - 1.2, 0.6, "F");
      }
      doc.text(vis(ln), R - indent, y, { align: "right" });
      y += lineH;
    });
    y += 1.2;
  };

  const tableCommon = {
    margin: { left: M, right: M },
    theme: "grid",
    styles: {
      font: "Amiri",
      fontSize: 10,
      cellPadding: 2.2,
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.2,
      minCellHeight: 7,
      valign: "middle",
    },
    headStyles: { fillColor: [243, 244, 246], textColor: [75, 85, 99], font: "Amiri", fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    willDrawCell: (d: any) => {
      // keep the original (logical) lines: autotable may draw a cell again (repeated header row)
      if (!d.cell.__orig) d.cell.__orig = [...(d.cell.text as string[])];
      d.cell.text = (d.cell.text.length ? (d.cell.__orig as string[]) : []).map((t: string) => vis(t));
    },
  };

  // label (right) / value (left)
  const keepTogether = (rowCount: number) => ensure(Math.min((rowCount + 1) * 8.5, H - 60));

  const kvTable = (rows: [string, any][]) => {
    if (rows.length === 0) return;
    keepTogether(rows.length);
    autoTable(doc, {
      ...tableCommon,
      startY: y,
      body: rows.map(([k, v]) => [clean(v) || "—", clean(k)]),
      columnStyles: {
        0: { halign: "left", cellWidth: CW * 0.4 },
        1: { halign: "right", cellWidth: CW * 0.6, fontStyle: "bold" },
      },
    });
    y = doc.lastAutoTable.finalY + 5;
  };

  // multi-column RTL grid: first logical column sits on the right
  const rtlGrid = (head: string[], rows: any[][], labelWidth?: number) => {
    const n = head.length;
    keepTogether(rows.length);
    const rev = (arr: any[]) => [...arr].reverse();
    const columnStyles: Record<number, any> = {};
    for (let i = 0; i < n; i++) columnStyles[i] = { halign: "center" };
    columnStyles[n - 1] = { halign: "right", fontStyle: "bold", ...(labelWidth ? { cellWidth: labelWidth } : {}) };
    autoTable(doc, {
      ...tableCommon,
      startY: y,
      head: [rev(head).map(clean)],
      body: rows.map((r) => rev(r).map((c) => clean(has(c) ? c : "—"))),
      columnStyles,
      styles: { ...tableCommon.styles, fontSize: n > 6 ? 8.5 : 10, cellPadding: n > 6 ? 1.8 : 2.2 },
    });
    y = doc.lastAutoTable.finalY + 5;
  };

  // ── derived values ─────────────────────────────────────────────────────────
  const dims = ["Valuation", "Growth", "Profitability", "Balance", "Cash"];
  const ps = dims.map((k) => (data.grades?.[k] ? data.grades[k].p : null)).filter((x): x is number => x != null);
  const comp = ps.length > 0 ? ps.reduce((a, b) => a + b, 0) / ps.length : 50;
  const score = data.rebhScoreOverride != null ? data.rebhScoreOverride : Math.round(40 + comp * 0.6);
  const currency = data.currency === "SAR" ? "ر.س" : data.currency;
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0];

  // ── header band ────────────────────────────────────────────────────────────
  doc.setFillColor(140, 59, 50);
  doc.rect(0, 0, W, 30, "F");
  doc.setTextColor(255, 255, 255);
  setFont("bold", 17);
  doc.text(vis(`${data.name} - ${data.symbol}`), R, 13, { align: "right" });
  setFont("normal", 10);
  doc.text(vis(`مذكرة استثمارية - REBH ONE - ${data.classData?.sector || data.sector}`), R, 21, { align: "right" });
  setFont("normal", 10);
  doc.text(dateStr, M, 13);
  y = 38;

  if (data.quarantineReason) {
    paragraph(`تم عزل السهم في سلة الحجر المالي: ${data.quarantineReason}`, { bold: true, color: [220, 38, 38] });
  } else if (!data.isFresh) {
    paragraph(`تنبيه حداثة البيانات: ${data.staleReason || "القوائم المالية تجاوزت المدة النظامية دون تحديث"}`, {
      color: [180, 83, 9],
    });
  }

  // ── snapshot ───────────────────────────────────────────────────────────────
  heading("لقطة سريعة", 2);
  rtlGrid(
    ["السعر الحالي", "القيمة السوقية", "مكرر الأرباح P/E", "جودة بيوتروسكي", "REBH Score"],
    [[
      data.price ? `${data.price.toFixed(2)} ${currency}` : "—",
      data.marketCap ? `${(data.marketCap / 1000).toFixed(1)}B` : "—",
      has(data.pe) ? `${data.pe}x` : "—",
      `${data.fScore}/9`,
      `${score}/100`,
    ]]
  );
  const rankRows: [string, any][] = [];
  if (has(data.sectorRank)) rankRows.push(["الرتبة القطاعية", `#${data.sectorRank}`]);
  if (has(data.marketRank)) rankRows.push(["الرتبة في تاسي", `#${data.marketRank}`]);
  if (rankRows.length) kvTable(rankRows);

  // ── classification ─────────────────────────────────────────────────────────
  if (data.classData) {
    const c = data.classData;
    heading("تصنيف ركائز العمل", 6);
    kvTable([
      ["القطاع", c.sector || data.sector],
      ["هيكل السوق", c.market_form || "منافسة قطاعية"],
      ["المرونة السعرية", c.price_elasticity || "—"],
      ["مصفوفة BCG", c.bcg_position || "—"],
      ["الهيمنة", c.dominance || "—"],
      ["مسار التجزئة", c.retail_path || "Mixed Commercial"],
    ]);
  }

  // ── buy gate ───────────────────────────────────────────────────────────────
  if (data.buyGate) {
    const g = data.buyGate;
    heading("أطروحة الاستثمار وبوابة الشراء");
    paragraph(g.gate_passed ? "الحالة: مجتاز لبوابة الشراء والاستثمار" : "الحالة: لم يجتز شروط البوابة بعد", {
      bold: true,
      size: 11,
      color: g.gate_passed ? [22, 163, 74] : [220, 38, 38],
    });
    const pass: string[] = g.pass_conditions || [];
    const fail: string[] = g.fail_reasons || [];
    paragraph(`الشروط المحققة بنجاح: ${pass.length}`, { bold: true, color: [26, 26, 26] });
    if (pass.length) pass.forEach((p) => paragraph(p, { bullet: true }));
    else paragraph("لا توجد شروط مكتملة معلنة.");
    paragraph(`النقاط المعلقة أو التحذيرات: ${fail.length}`, { bold: true, color: [26, 26, 26] });
    if (fail.length) fail.forEach((f) => paragraph(f, { bullet: true }));
    else paragraph("لا توجد أي معوقات مانعة للشراء وفق محددات المنهجية.");
  }

  // ── factor scoreboard ──────────────────────────────────────────────────────
  const gradeEntries = Object.entries(data.grades || {});
  if (gradeEntries.length) {
    heading("لوحة درجات العوامل (Factor Scoreboard)", gradeEntries.length);
    rtlGrid(
      ["العامل", "الدرجة", "مئين القطاع"],
      gradeEntries.map(([k, v]) => [GRADE_LABELS[k] || k, v.g, `${v.p}%`]),
      CW * 0.55
    );
  }

  // ── capital structure ──────────────────────────────────────────────────────
  if (data.capitalStructure) {
    const cs = data.capitalStructure;
    const m = (v: any) => (has(v) ? `${Number(v).toLocaleString("en-US")} مليون` : "—");
    heading("هيكل رأس المال وقيمة المنشأة", 6);
    kvTable([
      ["القيمة السوقية (Market Cap)", m(cs.market_cap)],
      ["إجمالي الديون (Total Debt)", m(cs.total_debt)],
      ["النقد وما في حكمه (Cash)", m(cs.cash)],
      ["صافي الدين", m(cs.net_debt)],
      ["قيمة المنشأة (EV)", m(cs.enterprise_value)],
      ["الدين إلى الملكية D/E", has(cs.debt_to_equity_pct) ? `${cs.debt_to_equity_pct}%` : "—"],
    ]);
  }

  // ── valuation ──────────────────────────────────────────────────────────────
  heading("مضاعفات التقييم ونطاقات الأسعار العادلة", 14);
  const z = data.zones || {};
  const upTo = (v: any) => (has(v) ? `حتى ${v} ${currency}` : "—");
  kvTable([
    ["مكرر الأرباح P/E", has(data.pe) ? `${data.pe}x` : "—"],
    ["القيمة الدفترية P/B", has(data.pb) ? `${data.pb}x` : "—"],
    ["العائد على الملكية ROE", data.roe ?? "—"],
    ["صافي الهامش NPM", has(data.netMargin) ? `${data.netMargin}%` : "—"],
    ["عائد التدفق FCF Yield", has(data.fcfYield) ? `${data.fcfYield}%` : "—"],
    ["العائد الداخلي IRR لخمس سنوات", has(data.irrDecision?.irr_pct) ? `${data.irrDecision.irr_pct}%` : "—"],
    ["المنطقة الحالية", z.current_zone || "—"],
    ["المنطقة الذهبية (Gold)", upTo(z.gold_max)],
    ["المنطقة الفضية (Silver)", upTo(z.silver_max)],
    ["المنطقة البرونزية (Bronze)", upTo(z.bronze_max)],
    ["هامش الأمان الحالي", has(data.marginOfSafety) ? `${data.marginOfSafety}%` : "—"],
    ["النمو الضمني المسعر (Reverse DCF)", has(data.reverseDcf?.implied_growth_pct) ? `${data.reverseDcf.implied_growth_pct}%` : "—"],
    ["العائد الخالي من المخاطر", has(data.buildUp?.risk_free_rate_pct) ? `${data.buildUp.risk_free_rate_pct}%` : "—"],
    ["معدل الخصم المطلوب R", has(data.buildUp?.required_return_r_pct) ? `${data.buildUp.required_return_r_pct}%` : "—"],
  ]);

  // ── safety cluster ─────────────────────────────────────────────────────────
  if (Array.isArray(data.safety?.details) && data.safety.details.length) {
    heading("عنقود السلامة والعائد المطلوب", data.safety.details.length);
    rtlGrid(
      ["المعيار", "القيمة", "الدرجة", "التقييم"],
      data.safety.details.map((it: any) => [
        it.name,
        it.val,
        it.score > 0 ? "+1" : it.score === 0 ? "0" : "-1",
        it.score > 0 ? "أمان" : it.score === 0 ? "محايد" : "خطر",
      ]),
      CW * 0.4
    );
  }

  // ── specialised sections ───────────────────────────────────────────────────
  if (data.bankMetrics?.is_bank) {
    const b = data.bankMetrics;
    heading("مختبر وعدة التحليل المصرفي", 4);
    kvTable([
      ["هامش الفائدة الصافي NIM", val(b.nim_pct, "%")],
      ["الودائع الجارية CASA", val(b.casa_pct, "%")],
      ["القروض للودائع LDR", val(b.ldr_pct, "%")],
      ["تكلفة المخاطر COR", val(b.cost_of_risk_pct, "%")],
    ]);
  }

  if (data.cyclicalBands?.is_cyclical) {
    const c = data.cyclicalBands;
    heading("نطاقات الأسهم الدورية");
    paragraph(
      `شراء القاع الدقيق: 14-16x على أقل ربح دوري واضح بقيمة ${val(c.lowest_cycle_eps)} ${currency}، أي من ${val(c.buy_band_min)} إلى ${val(c.buy_band_max)} ${currency}.`
    );
  }

  if (data.psLadder?.is_loss_maker) {
    const p = data.psLadder;
    heading("سلم مضاعف المبيعات (P/S Ladder)", 3);
    kvTable([
      ["نطاق رخيص", val(p.cheap_ps, "x P/S")],
      ["نطاق معتدل", val(p.medium_ps, "x P/S")],
      ["نطاق الخطر", val(p.danger_ps, "x P/S")],
    ]);
  }

  // ── red flags & shariah ────────────────────────────────────────────────────
  heading("الرايات المحاسبية والضوابط الشرعية");
  if (data.redFlags.length) {
    data.redFlags.forEach((f: any) => paragraph(`${f.title_ar}: ${f.detail}`, { bullet: true }));
  } else {
    paragraph("لا توجد رايات حمراء محاسبية مكتشفة في القوائم المالية الأخيرة.");
  }
  if (data.shariah) {
    paragraph(
      data.shariah.is_compliant ? "الشرعية: متوافق كمياً مع الضوابط الشرعية" : "الشرعية: تحت المراجعة الشرعية",
      { bold: true, color: [26, 26, 26] }
    );
  }

  // ── quarterly snapshot ─────────────────────────────────────────────────────
  const q = data.quarterly || {};
  const periods: string[] = Array.isArray(q.periods) ? q.periods.slice(-9) : [];
  if (periods.length) {
    const rowsDef: [string, any][] = [
      ["الإيرادات", q.rev],
      ["إجمالي الربح", q.gp],
      ["الربح التشغيلي", q.op],
      ["صافي الربح", q.net_profit ?? q.net],
    ];
    const rows = rowsDef
      .filter(([, arr]) => Array.isArray(arr) && arr.length)
      .map(([label, arr]) => [label, ...arr.slice(-periods.length).map((v: any) => num(v))]);
    if (rows.length) {
      heading("الأرباع المالية الأخيرة", rows.length);
      rtlGrid(["البند", ...periods], rows, 30);
      paragraph("القيم بملايين الريالات.", { size: 8.5, color: [107, 114, 128] });
    }
  }

  // ── statement diagnostics ──────────────────────────────────────────────────
  heading("تشخيص القوائم وما الذي تغير", 4);
  const bi = data.balanceIdentity || { is_valid: true };
  const signed = (v: any) => (has(v) ? `${Number(v) >= 0 ? "+" : ""}${v}%` : "—");
  kvTable([
    ["فحص توازن الميزانية (A = L + E)", bi.is_valid ? "مطابق ضمن هامش التفاوت" : `فارق: ${bi.discrepancy ?? "غير محدد"}`],
    ["حداثة القوائم المالية", data.isFresh ? "محدثة وفق جدول الإفصاح" : data.staleReason || "متأخرة"],
    [`التغير الفصلي QoQ (${data.currentQName})`, signed(data.qoqDelta)],
    ["التغير السنوي YoY", signed(data.yoyDelta)],
  ]);

  // ── analyst note ───────────────────────────────────────────────────────────
  if (data.note && data.note.trim()) {
    heading("ملاحظاتي وقراري التحليلي");
    data.note
      .split(/\r?\n/)
      .filter((l) => l.trim())
      .forEach((l) => paragraph(l));
  }

  // ── footer on every page ───────────────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(229, 231, 235);
    doc.line(M, H - 13, R, H - 13);
    setFont("normal", 8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      vis("منصة REBH - أداة تعليمية وتحليلية وفق منهجية مشعل الخرفشي - لا تقدم أي توصيات بيع أو شراء مباشرة."),
      R,
      H - 8,
      { align: "right" }
    );
    doc.text(`${i} / ${total}`, M, H - 8);
  }

  doc.save(`REBH_${data.symbol}_Memo_${dateStr}.pdf`);
}
