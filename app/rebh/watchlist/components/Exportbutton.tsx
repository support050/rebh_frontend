"use client";

import React, { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";

// ---------------------------------------------------------------------------
// Generic export helpers — no external dependencies (no xlsx/sheetjs needed).
// CSV is exported natively. "Excel" is exported as an HTML-table .xls file,
// which Excel / Google Sheets / LibreOffice open natively (UTF-8 BOM included
// so any non-ASCII company names still render correctly).
// ---------------------------------------------------------------------------

export interface ExportColumn<T> {
    /** Header label shown in the exported file */
    label: string;
    /** How to read the value out of a row */
    value: (row: T) => string | number | null | undefined;
}

function formatCell(v: string | number | null | undefined): string {
    if (v === null || v === undefined || Number.isNaN(v)) return "";
    return String(v);
}

function csvEscape(v: string): string {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
        return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
}

function downloadBlob(content: BlobPart, mime: string, filename: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export function exportToCsv<T>(rows: T[], columns: ExportColumn<T>[], filename: string) {
    const header = columns.map((c) => csvEscape(c.label)).join(",");
    const lines = rows.map((row) =>
        columns.map((c) => csvEscape(formatCell(c.value(row)))).join(",")
    );
    // UTF-8 BOM so Excel opens non-ASCII text correctly instead of mojibake.
    const csv = "\uFEFF" + [header, ...lines].join("\r\n");
    downloadBlob(csv, "text/csv;charset=utf-8;", filename);
}

export function exportToExcel<T>(rows: T[], columns: ExportColumn<T>[], filename: string) {
    const escapeHtml = (v: string) =>
        v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const headerRow = `<tr>${columns
        .map((c) => `<th style="background:#F3F4F6;font-weight:600;">${escapeHtml(c.label)}</th>`)
        .join("")}</tr>`;

    const bodyRows = rows
        .map(
            (row) =>
                `<tr>${columns
                    .map((c) => `<td>${escapeHtml(formatCell(c.value(row)))}</td>`)
                    .join("")}</tr>`
        )
        .join("");

    const html = `
    <html dir="ltr">
      <head><meta charset="UTF-8" /></head>
      <body>
        <table border="1">
          <thead>${headerRow}</thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </body>
    </html>`;

    downloadBlob("\uFEFF" + html, "application/vnd.ms-excel;charset=utf-8;", filename);
}

// ---------------------------------------------------------------------------
// ExportButton
// ---------------------------------------------------------------------------

interface ExportButtonProps<T> {
    /** Rows to export — pass whatever is currently visible (already filtered by tab/screen/search/sector). */
    rows: T[];
    columns: ExportColumn<T>[];
    /** Base filename without extension, e.g. "rebh-Quality" */
    filenameBase: string;
    /** Optional label shown next to the count, e.g. current screen/tab name */
    contextLabel?: string;
    disabled?: boolean;
}

export function ExportButton<T>({
    rows,
    columns,
    filenameBase,
    contextLabel,
    disabled,
}: ExportButtonProps<T>) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    const stamp = new Date().toISOString().slice(0, 10);
    const safeBase = filenameBase.trim() || "export";

    const handleCsv = () => {
        exportToCsv(rows, columns, `${safeBase}-${stamp}.csv`);
        setOpen(false);
    };

    const handleExcel = () => {
        exportToExcel(rows, columns, `${safeBase}-${stamp}.xls`);
        setOpen(false);
    };

    const isDisabled = disabled || rows.length === 0;

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                disabled={isDisabled}
                className="inline-flex items-center gap-1.5 rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#6B7280] transition-colors hover:border-[#8C3B32]/40 hover:text-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B32]/40"
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <Download className="h-3.5 w-3.5" />
                <span>
                    Export{contextLabel ? ` (${contextLabel})` : ""} · {rows.length}
                </span>
                <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-[4px] border border-[#E5E7EB] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={handleCsv}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#1A1A1A] hover:bg-[#F3F4F6]"
                    >
                        <FileText className="h-3.5 w-3.5 text-[#6B7280]" />
                        CSV
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={handleExcel}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#1A1A1A] hover:bg-[#F3F4F6]"
                    >
                        <FileSpreadsheet className="h-3.5 w-3.5 text-[#6B7280]" />
                        Excel (.xls)
                    </button>
                </div>
            )}
        </div>
    );
}