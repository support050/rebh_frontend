/**
 * guruExportLogic.ts — Export logic for the Guru Scans board.
 *
 * Supported formats:
 *   png   → Board screenshot (html-to-image, respects dark/light mode)
 *   pdf   → PDF with one table per scan (sharp vector text, coloured RS / Stage)
 *   csv   → One row per scan × stock, UTF-8 BOM
 *   xlsx  → Excel workbook: Summary + All Stocks + one sheet per scan
 *   xls   → Same workbook in Excel 97-2003 format
 *   txt   → Tab-delimited flat export, one block per scan
 *   tv    → TradingView watchlist (.txt) — one section per scan, TADAWUL:symbol
 */

export type ExportFormat = 'png' | 'pdf' | 'csv' | 'xlsx' | 'xls' | 'txt' | 'pine';

export interface ExportColumn {
  key: string;
  label: string;
}

export interface GuruRow {
  name?: string;
  chg_pct: number | null;
  rs: number | null;
  stage: number | null;
  count: number;
}

export interface GuruPayload {
  date: string;
  columns: Record<string, number[]>;
  rows: Record<string, GuruRow>;
  counts: Record<string, number>;
}

export interface ExportOptions {
  data: GuruPayload;
  columns: ExportColumn[];
  boardEl: HTMLElement | null;
  isDark: boolean;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, name: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}

function safeFilename(s: string): string {
  return s.trim().replace(/[\s<>:"/\\|?*\x00-\x1F]+/g, '_').slice(0, 60);
}

function csvCell(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function stageLabel(s: number | null): string {
  if (s == null) return '—';
  return ['', 'Base', 'Uptrend', 'Top', 'Decline'][s] ?? `S${s}`;
}

function chgStr(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return '';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

function allSymbols(data: GuruPayload): number[] {
  const seen = new Set<number>();
  for (const syms of Object.values(data.columns)) {
    for (const s of syms) seen.add(s);
  }
  return [...seen];
}

// ─── PNG ─────────────────────────────────────────────────────────────────────
// isDark → dark background so the exported image matches what the user sees

async function exportPng({ data, boardEl, isDark }: ExportOptions): Promise<void> {
  if (!boardEl) throw new Error('Board element not available');
  const { toBlob } = await import('html-to-image');
  const bg = isDark ? '#030712' : '#f3f4f6';
  const blob = await toBlob(boardEl, {
    pixelRatio: Math.min(window.devicePixelRatio * 1.5, 3),
    backgroundColor: bg,
    cacheBust: true,
  });
  if (!blob) throw new Error('html-to-image returned null');
  downloadBlob(blob, `guru_scans_${safeFilename(data.date)}.png`);
}

// ─── PDF (tables — vector text) ───────────────────────────────────────────────

async function exportPdf({ data, columns }: ExportOptions): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  pdf.setFontSize(14);
  pdf.setTextColor(30);
  pdf.text('Guru Stock Scans · Tadawul', 14, 16);
  pdf.setFontSize(9);
  pdf.setTextColor(100);
  pdf.text(`As of ${data.date}  ·  ${Object.keys(data.rows).length} unique names across 9 scans`, 14, 22);

  let yStart = 30;

  for (const col of columns) {
    const syms = data.columns[col.key] ?? [];
    if (syms.length === 0) continue;

    if (yStart > 170) { pdf.addPage(); yStart = 14; }

    pdf.setFontSize(10);
    pdf.setTextColor(40);
    pdf.text(`${col.label}  (${syms.length})`, 14, yStart);
    yStart += 2;

    const tableRows = syms.map((sym) => {
      const r = data.rows[String(sym)];
      return [
        String(sym),
        r?.name ?? '—',
        chgStr(r?.chg_pct ?? null),
        r?.rs != null ? String(r.rs) : '—',
        r?.stage != null ? `S${r.stage} ${stageLabel(r.stage)}` : '—',
        String(r?.count ?? 1),
      ];
    });

    autoTable(pdf, {
      startY: yStart,
      head: [['Symbol', 'Company', 'Chg%', 'RS', 'Stage', 'Scans']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 78, 216], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 20 },
        1: { cellWidth: 55 },
        2: { cellWidth: 18, halign: 'right' },
        3: { cellWidth: 14, halign: 'center' },
        4: { cellWidth: 32 },
        5: { cellWidth: 14, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 3) {
          const v = Number(hookData.cell.raw);
          if (v >= 80) hookData.cell.styles.fillColor = [5, 150, 105];
          else if (v >= 60) hookData.cell.styles.fillColor = [16, 185, 129];
          else if (v >= 40) hookData.cell.styles.fillColor = [245, 158, 11];
          else if (!isNaN(v)) hookData.cell.styles.fillColor = [239, 68, 68];
          if (!isNaN(v)) hookData.cell.styles.textColor = 255;
        }
        if (hookData.section === 'body' && hookData.column.index === 4) {
          const raw = String(hookData.cell.raw);
          if (raw.startsWith('S2')) hookData.cell.styles.textColor = [5, 150, 105];
          else if (raw.startsWith('S4')) hookData.cell.styles.textColor = [239, 68, 68];
          else if (raw.startsWith('S3')) hookData.cell.styles.textColor = [245, 158, 11];
          else if (raw.startsWith('S1')) hookData.cell.styles.textColor = [14, 165, 233];
        }
      },
    });

    yStart = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  pdf.save(`guru_scans_${safeFilename(data.date)}.pdf`);
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

function exportCsv({ data, columns }: ExportOptions): void {
  const header = ['Scanner', 'Symbol', 'Company', 'Chg%', 'RS Rating', 'Stage', 'Stage Label', 'Total Scans'];
  const rows: string[] = [header.map(csvCell).join(',')];
  for (const col of columns) {
    for (const sym of data.columns[col.key] ?? []) {
      const r = data.rows[String(sym)];
      rows.push([
        col.label,
        sym,
        r?.name ?? '',
        chgStr(r?.chg_pct ?? null),
        r?.rs ?? '',
        r?.stage != null ? `S${r.stage}` : '',
        stageLabel(r?.stage ?? null),
        r?.count ?? '',
      ].map(csvCell).join(','));
    }
  }
  downloadBlob(
    new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8' }),
    `guru_scans_${safeFilename(data.date)}.csv`,
  );
}

// ─── XLSX / XLS ───────────────────────────────────────────────────────────────

async function exportExcel({ data, columns }: ExportOptions, format: 'xlsx' | 'xls'): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryRows: (string | number)[][] = [
    ['Guru Stock Scans · Tadawul'],
    [`Date: ${data.date}`, '', `Unique names: ${Object.keys(data.rows).length}`],
    [],
    ['Scanner', 'Count', 'Symbols'],
  ];
  for (const col of columns) {
    const syms = data.columns[col.key] ?? [];
    summaryRows.push([col.label, syms.length, syms.join(', ')]);
  }
  const wsSum = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSum['!cols'] = [{ wch: 36 }, { wch: 10 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsSum, 'Summary');

  // All Stocks sheet
  const scanKeys = columns.map((c) => c.key);
  const allHeader = ['Symbol', 'Company', 'Chg%', 'RS Rating', 'Stage', 'Stage Label', 'Scan Count', ...columns.map((c) => c.label)];
  const allRows: (string | number | boolean)[][] = [allHeader];
  for (const sym of allSymbols(data)) {
    const r = data.rows[String(sym)];
    allRows.push([
      sym,
      r?.name ?? '',
      r?.chg_pct ?? '',
      r?.rs ?? '',
      r?.stage ?? '',
      stageLabel(r?.stage ?? null),
      r?.count ?? '',
      ...scanKeys.map((k) => (data.columns[k] ?? []).includes(sym)),
    ]);
  }
  const wsAll = XLSX.utils.aoa_to_sheet(allRows);
  wsAll['!cols'] = [{ wch: 10 }, { wch: 32 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 12 }, ...columns.map(() => ({ wch: 28 }))];
  XLSX.utils.book_append_sheet(wb, wsAll, 'All Stocks');

  // One sheet per scanner
  for (const col of columns) {
    const syms = data.columns[col.key] ?? [];
    const rows: (string | number)[][] = [['Symbol', 'Company', 'Chg%', 'RS Rating', 'Stage', 'Stage Label', 'Total Scans']];
    for (const sym of syms) {
      const r = data.rows[String(sym)];
      rows.push([
        sym,
        r?.name ?? '',
        r?.chg_pct ?? '',
        r?.rs ?? '',
        r?.stage ?? '',
        stageLabel(r?.stage ?? null),
        r?.count ?? '',
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 10 }, { wch: 32 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, col.label.slice(0, 31));
  }

  const bookType = format === 'xlsx' ? 'xlsx' : 'xls';
  const buf = XLSX.write(wb, { type: 'array', bookType });
  const mime = format === 'xlsx'
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'application/vnd.ms-excel';
  downloadBlob(new Blob([buf], { type: mime }), `guru_scans_${safeFilename(data.date)}.${format}`);
}

// ─── TXT ─────────────────────────────────────────────────────────────────────

function exportTxt({ data, columns }: ExportOptions): void {
  const lines: string[] = [`Guru Stock Scans · Tadawul  —  ${data.date}`, ''];
  for (const col of columns) {
    const syms = data.columns[col.key] ?? [];
    lines.push(`=== ${col.label} (${syms.length}) ===`);
    lines.push(['Symbol', 'Company', 'Chg%', 'RS', 'Stage', 'Scans'].join('\t'));
    for (const sym of syms) {
      const r = data.rows[String(sym)];
      lines.push([
        sym,
        r?.name ?? '',
        chgStr(r?.chg_pct ?? null),
        r?.rs ?? '—',
        r?.stage != null ? `S${r.stage}` : '—',
        r?.count ?? '',
      ].join('\t'));
    }
    lines.push('');
  }
  downloadBlob(
    new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/plain;charset=utf-8' }),
    `guru_scans_${safeFilename(data.date)}.txt`,
  );
}

// ─── Pine Script v5 indicator ────────────────────────────────────────────────
// Applies to any TADAWUL stock (daily chart).
// Shows a corner table: which Guru scans include this symbol, RS Rating, Stage.
// Same pattern as the breadth exportPine — data embedded via map.put() calls.

function exportPine({ data, columns }: ExportOptions): void {
  const L: string[] = [];

  // Build per-symbol lookup: sym → scan labels[]
  const symScans = new Map<string, string[]>();
  for (const col of columns) {
    for (const sym of data.columns[col.key] ?? []) {
      const k = String(sym);
      if (!symScans.has(k)) symScans.set(k, []);
      symScans.get(k)!.push(col.label.replace(/"/g, "'"));
    }
  }

  L.push('//@version=5');
  L.push(`indicator("Guru Scans · Tadawul  —  ${data.date}", overlay=true, max_bars_back=10)`);
  L.push(`// Generated by rebh.ai  |  Apply to any TADAWUL stock (daily chart)  |  Snapshot: ${data.date}`);
  L.push(`// Shows which Guru scanners included this symbol and its RS Rating / Weinstein Stage.`);
  L.push('');

  L.push('ticker = str.upper(syminfo.ticker)');
  L.push('');

  // Maps declaration
  L.push('var scans_map = map.new<string, string>()');
  L.push('var rs_map    = map.new<string, int>()');
  L.push('var stage_map = map.new<string, int>()');
  L.push('');

  // Data population block
  L.push('if barstate.isfirst');
  for (const [sym, scanList] of symScans) {
    const r = data.rows[sym];
    L.push(`    map.put(scans_map, "${sym}", "${scanList.join(' · ')}")`);
    if (r?.rs != null)    L.push(`    map.put(rs_map,    "${sym}", ${r.rs})`);
    if (r?.stage != null) L.push(`    map.put(stage_map, "${sym}", ${r.stage})`);
  }
  L.push('');

  // Runtime lookups
  L.push('scans     = map.contains(scans_map, ticker) ? map.get(scans_map, ticker) : ""');
  L.push('rs_num    = map.contains(rs_map,    ticker) ? map.get(rs_map,    ticker) : 0');
  L.push('stage_num = map.contains(stage_map, ticker) ? map.get(stage_map, ticker) : 0');
  L.push('');
  L.push('rs_str    = rs_num    > 0 ? str.tostring(rs_num)    : "—"');
  L.push('stage_str = stage_num > 0 ? "S" + str.tostring(stage_num) : "—"');
  L.push('');

  // Colours
  L.push('rs_col = rs_num >= 80 ? color.new(color.green,   0) :');
  L.push('         rs_num >= 60 ? color.new(color.teal,    0) :');
  L.push('         rs_num >= 40 ? color.new(color.orange,  0) :');
  L.push('         rs_num  > 0  ? color.new(color.red,     0) : color.new(color.gray, 60)');
  L.push('');
  L.push('stage_col = stage_num == 2 ? color.new(color.green,  0) :');
  L.push('            stage_num == 1 ? color.new(color.blue,   0) :');
  L.push('            stage_num == 3 ? color.new(color.orange, 0) :');
  L.push('            stage_num == 4 ? color.new(color.red,    0) : color.new(color.gray, 60)');
  L.push('');

  // Table — 4 rows × 2 cols
  L.push('var table t = table.new(position.top_right, 2, 4,');
  L.push('     bgcolor      = color.new(color.black, 55),');
  L.push('     border_color = color.new(color.gray,  40),');
  L.push('     border_width = 1,');
  L.push('     frame_color  = color.new(color.gray,  30),');
  L.push('     frame_width  = 1)');
  L.push('');
  L.push('if barstate.islast');
  L.push(`    table.cell(t, 0, 0, "Guru Scans · ${data.date}", text_color=color.white, bgcolor=color.new(color.navy, 10), text_size=size.small)`);
  L.push('    table.merge_cells(t, 0, 0, 1, 0)');
  L.push('    table.cell(t, 0, 1, "RS Rating", text_color=color.new(color.gray, 10), text_size=size.small)');
  L.push('    table.cell(t, 1, 1, rs_str,      text_color=color.white, bgcolor=rs_col,    text_size=size.small)');
  L.push('    table.cell(t, 0, 2, "Stage",     text_color=color.new(color.gray, 10), text_size=size.small)');
  L.push('    table.cell(t, 1, 2, stage_str,   text_color=color.white, bgcolor=stage_col, text_size=size.small)');
  L.push('    in_scans_col = scans != "" ? color.new(color.green, 35) : color.new(color.gray, 60)');
  L.push('    in_scans_txt = scans != "" ? scans : "Not in any Guru scan"');
  L.push('    table.cell(t, 0, 3, "Scans",      text_color=color.new(color.gray, 10), text_size=size.small)');
  L.push('    table.cell(t, 1, 3, in_scans_txt, text_color=color.white, bgcolor=in_scans_col, text_size=size.tiny)');

  // 144KB guard (same as breadth)
  const bytes = new Blob([L.join('\n')]).size;
  if (bytes > 140_000) {
    L.splice(2, 0, `// WARNING: ${Math.round(bytes / 1024)}KB may exceed TradingView's ~144KB script limit.`);
  }

  downloadBlob(
    new Blob([L.join('\n')], { type: 'text/plain' }),
    `guru_scans_${safeFilename(data.date)}.pine`,
  );
}

// ─── Main dispatcher ─────────────────────────────────────────────────────────

export async function exportGuru(format: ExportFormat, opts: ExportOptions): Promise<void> {
  switch (format) {
    case 'png':  return exportPng(opts);
    case 'pdf':  return exportPdf(opts);
    case 'csv':  return exportCsv(opts);
    case 'xlsx': return exportExcel(opts, 'xlsx');
    case 'xls':  return exportExcel(opts, 'xls');
    case 'txt':  return exportTxt(opts);
    case 'pine': return exportPine(opts);
    default:     throw new Error(`Unknown export format: ${format as string}`);
  }
}
