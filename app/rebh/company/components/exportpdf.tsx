/* eslint-disable @typescript-eslint/no-explicit-any */
// Builds the "Company Memo" PDF fully on the client with jsPDF + jspdf-autotable
// English-only, left-to-right layout. The Amiri font (served from /public/fonts) is still loaded so that any
// Arabic strings returned by the backend keep rendering correctly (via jsPDF's processArabic() + vis()).

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
    // NOTE: the Arabic keys are backend API keys and MUST stay unchanged; only the display values are English.
    Cash: "Profitability & Cash (Cash)",
    "الربحية والكفاءة": "Profitability & Cash (Cash)",
    Balance: "Balance Sheet & Debt (Balance)",
    "المتانة المالية والسيولة": "Balance Sheet & Debt (Balance)",
    Valuation: "Valuation Appeal (Valuation)",
    "التقييم ومضاعفات السوق": "Valuation Appeal (Valuation)",
    Growth: "Growth & Momentum (Growth)",
    "النمو وتوليد النقد": "Growth & Momentum (Growth)",
    Safety: "Safety & Solvency (Safety)",
    "سلامة الأرباح والحوكمة": "Safety & Solvency (Safety)",
    Profitability: "Profitability (Profitability)",
};

export async function generateCompanyMemoPdf(data: CompanyMemoPdfData): Promise<void> {
    const [jspdfMod, autoTableMod] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
    const JsPDF: any =
        (jspdfMod as any).jsPDF ??
        (jspdfMod as any).default?.jsPDF ??
        (jspdfMod as any).default;
    const autoTable: any =
        (autoTableMod as any).default?.autoTable ??
        (autoTableMod as any).autoTable ??
        (autoTableMod as any).default;
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

    // jsPDF's built-in bidi assumes an LTR paragraph, so mixed Arabic/Latin lines can come out
    // in the wrong order. Any backend Arabic text is shaped + reordered by vis() below, and jsPDF is told
    // the text is already visual (isInputVisual/isOutputVisual) so it leaves it alone.
    // Pure English strings pass through vis() untouched.
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
        // Base direction: LTR (English) unless the first strong token is Arabic.
        const firstStrong = toks.find((tk) => tk.k === "A" || tk.k === "L");
        if (firstStrong && firstStrong.k === "L") {
            // LTR paragraph: keep token order, but lay out each run of Arabic words in visual (reversed) order
            const out: string[] = [];
            let a = 0;
            while (a < toks.length) {
                if (toks[a].k === "A") {
                    const run: string[] = [];
                    while (a < toks.length && toks[a].k === "A") { run.push(revWord(toks[a].t)); a += 1; }
                    out.push(run.reverse().join(" "));
                } else {
                    out.push(toks[a].t);
                    a += 1;
                }
            }
            return out.join(" ");
        }
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
        doc.rect(M, y, 1.4, 8, "F");
        setFont("bold", 11);
        doc.setTextColor(26, 26, 26);
        doc.text(vis(title), M + 4, y + 5.6, { align: "left" });
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
                doc.circle(M + 1.2, y - 1.2, 0.6, "F");
            }
            doc.text(vis(ln), M + indent, y, { align: "left" });
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

    // label (left) / value (right)
    const keepTogether = (rowCount: number) => ensure(Math.min((rowCount + 1) * 8.5, H - 60));

    const kvTable = (rows: [string, any][]) => {
        if (rows.length === 0) return;
        keepTogether(rows.length);
        autoTable(doc, {
            ...tableCommon,
            startY: y,
            body: rows.map(([k, v]) => [clean(k), clean(v) || "—"]),
            columnStyles: {
                0: { halign: "left", cellWidth: CW * 0.6, fontStyle: "bold" },
                1: { halign: "right", cellWidth: CW * 0.4 },
            },
        });
        y = doc.lastAutoTable.finalY + 5;
    };

    // multi-column LTR grid: first logical column (the label) sits on the left
    const dataGrid = (head: string[], rows: any[][], labelWidth?: number) => {
        const n = head.length;
        keepTogether(rows.length);
        const columnStyles: Record<number, any> = {};
        for (let i = 0; i < n; i++) columnStyles[i] = { halign: "center" };
        columnStyles[0] = { halign: "left", fontStyle: "bold", ...(labelWidth ? { cellWidth: labelWidth } : {}) };
        autoTable(doc, {
            ...tableCommon,
            startY: y,
            head: [head.map(clean)],
            body: rows.map((r) => r.map((c) => clean(has(c) ? c : "—"))),
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
    const currency = data.currency;
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];

    // ── header band ────────────────────────────────────────────────────────────
    doc.setFillColor(140, 59, 50);
    doc.rect(0, 0, W, 30, "F");
    doc.setTextColor(255, 255, 255);
    setFont("bold", 17);
    doc.text(vis(`${data.name} - ${data.symbol}`), M, 13, { align: "left" });
    setFont("normal", 10);
    doc.text(vis(`Investment Memo - REBH ONE - ${data.sector || data.classData?.sector}`), M, 21, { align: "left" });
    setFont("normal", 10);
    doc.text(dateStr, R, 13, { align: "right" });
    y = 38;

    if (data.quarantineReason) {
        paragraph(`Stock placed in the Too-Hard Pile (Quarantine): ${data.quarantineReason}`, { bold: true, color: [220, 38, 38] });
    } else if (!data.isFresh) {
        paragraph(`Data freshness warning: ${data.staleReason || "Financial statements have exceeded the statutory period without an update"}`, {
            color: [180, 83, 9],
        });
    }

    // ── snapshot ───────────────────────────────────────────────────────────────
    heading("Quick Snapshot", 2);
    dataGrid(
        ["Current Price", "Market Cap", "P/E Ratio", "Piotroski F-Score", "REBH Score"],
        [[
            data.price ? `${data.price.toFixed(2)} ${currency}` : "—",
            data.marketCap ? `${(data.marketCap / 1000).toFixed(1)}B` : "—",
            has(data.pe) ? `${data.pe}x` : "—",
            `${data.fScore}/9`,
            `${score}/100`,
        ]]
    );
    const rankRows: [string, any][] = [];
    if (has(data.sectorRank)) rankRows.push(["Sector Rank", `#${data.sectorRank}`]);
    if (has(data.marketRank)) rankRows.push(["TASI Rank", `#${data.marketRank}`]);
    if (rankRows.length) kvTable(rankRows);

    // ── classification ─────────────────────────────────────────────────────────
    if (data.classData) {
        const c = data.classData;
        heading("Business Pillars Classification", 6);
        kvTable([
            ["Sector", data.sector || c.sector],
            ["Market Structure", c.market_form || "Sector Competition"],
            ["Price Elasticity", c.price_elasticity || "—"],
            ["BCG Matrix", c.bcg_position || "—"],
            ["Dominance", c.dominance || "—"],
            ["Retail Path", c.retail_path || "Mixed Commercial"],
        ]);
    }

    // ── buy gate ───────────────────────────────────────────────────────────────
    if (data.buyGate) {
        const g = data.buyGate;
        heading("Investment Thesis & Buy Gate");
        paragraph(g.gate_passed ? "Status: Buy Gate passed" : "Status: Gate criteria not yet met", {
            bold: true,
            size: 11,
            color: g.gate_passed ? [22, 163, 74] : [220, 38, 38],
        });
        const pass: string[] = g.pass_conditions || [];
        const fail: string[] = g.fail_reasons || [];
        paragraph(`Conditions met: ${pass.length}`, { bold: true, color: [26, 26, 26] });
        if (pass.length) pass.forEach((p) => paragraph(p, { bullet: true }));
        else paragraph("No completed conditions disclosed.");
        paragraph(`Pending items or warnings: ${fail.length}`, { bold: true, color: [26, 26, 26] });
        if (fail.length) fail.forEach((f) => paragraph(f, { bullet: true }));
        else paragraph("No blocking issues to a buy under the methodology's criteria.");
    }

    // ── factor scoreboard ──────────────────────────────────────────────────────
    const gradeEntries = Object.entries(data.grades || {});
    if (gradeEntries.length) {
        heading("Factor Scoreboard", gradeEntries.length);
        dataGrid(
            ["Factor", "Grade", "Sector Percentile"],
            gradeEntries.map(([k, v]) => [GRADE_LABELS[k] || k, v.g, `${v.p}%`]),
            CW * 0.55
        );
    }

    // ── capital structure ──────────────────────────────────────────────────────
    if (data.capitalStructure) {
        const cs = data.capitalStructure;
        const m = (v: any) => (has(v) ? `${Number(v).toLocaleString("en-US")} M` : "—");
        heading("Capital Structure & Enterprise Value", 6);
        kvTable([
            ["Market Cap", m(cs.market_cap)],
            ["Total Debt", m(cs.total_debt)],
            ["Cash & Cash Equivalents", m(cs.cash)],
            ["Net Debt", m(cs.net_debt)],
            ["Enterprise Value (EV)", m(cs.enterprise_value)],
            ["Debt-to-Equity (D/E)", has(cs.debt_to_equity_pct) ? `${cs.debt_to_equity_pct}%` : "—"],
        ]);
    }

    // ── valuation ──────────────────────────────────────────────────────────────
    heading("Valuation Multiples & Fair Value Price Bands", 14);
    const z = data.zones || {};
    const upTo = (v: any) => (has(v) ? `Up to ${v} ${currency}` : "—");
    kvTable([
        ["P/E Ratio", has(data.pe) ? `${data.pe}x` : "—"],
        ["P/B Ratio", has(data.pb) ? `${data.pb}x` : "—"],
        ["Return on Equity (ROE)", data.roe ?? "—"],
        ["Net Profit Margin (NPM)", has(data.netMargin) ? `${data.netMargin}%` : "—"],
        ["FCF Yield", has(data.fcfYield) ? `${data.fcfYield}%` : "—"],
        ["5-Year Internal Rate of Return (IRR)", has(data.irrDecision?.irr_pct) ? `${data.irrDecision.irr_pct}%` : "—"],
        ["Current Zone", z.current_zone || "—"],
        ["Gold Zone", upTo(z.gold_max)],
        ["Silver Zone", upTo(z.silver_max)],
        ["Bronze Zone", upTo(z.bronze_max)],
        ["Current Margin of Safety", has(data.marginOfSafety) ? `${data.marginOfSafety}%` : "—"],
        ["Priced-in Implied Growth (Reverse DCF)", has(data.reverseDcf?.implied_growth_pct) ? `${data.reverseDcf.implied_growth_pct}%` : "—"],
        ["Risk-Free Rate", has(data.buildUp?.risk_free_rate_pct) ? `${data.buildUp.risk_free_rate_pct}%` : "—"],
        ["Required Discount Rate (R)", has(data.buildUp?.required_return_r_pct) ? `${data.buildUp.required_return_r_pct}%` : "—"],
    ]);

    // ── safety cluster ─────────────────────────────────────────────────────────
    if (Array.isArray(data.safety?.details) && data.safety.details.length) {
        heading("Safety Cluster & Required Return", data.safety.details.length);
        dataGrid(
            ["Criterion", "Value", "Score", "Assessment"],
            data.safety.details.map((it: any) => [
                it.name,
                it.val,
                it.score > 0 ? "+1" : it.score === 0 ? "0" : "-1",
                it.score > 0 ? "Safe" : it.score === 0 ? "Neutral" : "Risk",
            ]),
            CW * 0.4
        );
    }

    // ── specialised sections ───────────────────────────────────────────────────
    if (data.bankMetrics?.is_bank) {
        const b = data.bankMetrics;
        heading("Banking Analysis Lab & Toolkit", 4);
        kvTable([
            ["Net Interest Margin (NIM)", val(b.nim_pct, "%")],
            ["Current Deposits (CASA)", val(b.casa_pct, "%")],
            ["Loan-to-Deposit Ratio (LDR)", val(b.ldr_pct, "%")],
            ["Cost of Risk (COR)", val(b.cost_of_risk_pct, "%")],
        ]);
    }

    if (data.cyclicalBands?.is_cyclical) {
        const c = data.cyclicalBands;
        heading("Cyclical Stock Bands");
        paragraph(
            `Precision trough entry: 14-16x on the lowest clear cyclical earnings of ${val(c.lowest_cycle_eps)} ${currency}, i.e. from ${val(c.buy_band_min)} to ${val(c.buy_band_max)} ${currency}.`
        );
    }

    if (data.psLadder?.is_loss_maker) {
        const p = data.psLadder;
        heading("P/S Ladder (Price-to-Sales)", 3);
        kvTable([
            ["Cheap Range", val(p.cheap_ps, "x P/S")],
            ["Moderate Range", val(p.medium_ps, "x P/S")],
            ["Danger Range", val(p.danger_ps, "x P/S")],
        ]);
    }

    // ── red flags & shariah ────────────────────────────────────────────────────
    heading("Forensic Red Flags & Shariah Screens");
    if (data.redFlags.length) {
        data.redFlags.forEach((f: any) => paragraph(`${f.title_en || f.title_ar}: ${f.detail}`, { bullet: true }));
    } else {
        paragraph("No accounting red flags detected in the latest financial statements.");
    }
    if (data.shariah) {
        paragraph(
            data.shariah.is_compliant ? "Shariah: quantitatively compliant with Shariah screens" : "Shariah: under Shariah review",
            { bold: true, color: [26, 26, 26] }
        );
    }

    // ── quarterly snapshot ─────────────────────────────────────────────────────
    const q = data.quarterly || {};
    const periods: string[] = Array.isArray(q.periods) ? q.periods.slice(-9) : [];
    if (periods.length) {
        const rowsDef: [string, any][] = [
            ["Revenue", q.rev],
            ["Gross Profit", q.gp],
            ["Operating Profit (EBIT)", q.op],
            ["Net Income", q.net_profit ?? q.net],
        ];
        const rows = rowsDef
            .filter(([, arr]) => Array.isArray(arr) && arr.length)
            .map(([label, arr]) => [label, ...arr.slice(-periods.length).map((v: any) => num(v))]);
        if (rows.length) {
            heading("Recent Quarterly Financials", rows.length);
            dataGrid(["Line Item", ...periods], rows, 30);
            paragraph("Values in SAR millions.", { size: 8.5, color: [107, 114, 128] });
        }
    }

    // ── statement diagnostics ──────────────────────────────────────────────────
    heading("Statement Diagnostics & What Changed", 4);
    const bi = data.balanceIdentity || { is_valid: true };
    const signed = (v: any) => (has(v) ? `${Number(v) >= 0 ? "+" : ""}${v}%` : "—");
    kvTable([
        ["Balance Sheet equilibrium check (A = L + E)", bi.is_valid ? "Reconciled within tolerance" : `Discrepancy: ${bi.discrepancy ?? "N/A"}`],
        ["Financial statements freshness", data.isFresh ? "Up to date per disclosure schedule" : data.staleReason || "Delayed"],
        [`Quarter-over-Quarter (QoQ) change (${data.currentQName})`, signed(data.qoqDelta)],
        ["Year-over-Year (YoY) change", signed(data.yoyDelta)],
    ]);

    // ── analyst note ───────────────────────────────────────────────────────────
    if (data.note && data.note.trim()) {
        heading("My Analyst Notes & Thesis");
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
            vis("REBH Platform - Educational and analytical tool based on the Mishaal Al-Kharfashi methodology - provides no direct buy or sell recommendations."),
            M,
            H - 8,
            { align: "left" }
        );
        doc.text(`${i} / ${total}`, R, H - 8, { align: "right" });
    }

    doc.save(`REBH_${data.symbol}_Memo_${dateStr}.pdf`);
}