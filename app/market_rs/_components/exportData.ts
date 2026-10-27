import * as XLSX from 'xlsx';

export type ExportFormat = 'png' | 'pdf' | 'csv' | 'xlsx' | 'xls' | 'txt';

export interface ExportTableData {
    title: string;
    filenamePrefix: string;
    headers: string[];
    rows: (string | number | null | undefined)[][];
}

export function exportTableAsFormat(
    format: 'csv' | 'xlsx' | 'xls' | 'txt' | 'pdf',
    data: ExportTableData,
): void {
    const today = new Date().toISOString().split('T')[0];
    const filename = `${data.filenamePrefix}_${today}.${format}`;

    const cleanRows = data.rows.map(row =>
        row.map(cell => (cell === null || cell === undefined ? '-' : cell))
    );

    if (format === 'csv' || format === 'txt') {
        const sep = format === 'csv' ? ',' : '\t';
        const esc = (v: any) => {
            if (v == null) return '';
            const s = String(v);
            return s.includes(sep) || s.includes('"') || s.includes('\n')
                ? `"${s.replace(/"/g, '""')}"`
                : s;
        };

        const allLines = [data.headers, ...cleanRows].map(r => r.map(esc).join(sep)).join('\n');
        const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8;';
        const blob = new Blob([allLines], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
    }

    if (format === 'xlsx' || format === 'xls') {
        const aoa = [data.headers, ...cleanRows];
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, data.title.slice(0, 31) || 'Sheet1');
        XLSX.writeFile(wb, filename);
        return;
    }

    if (format === 'pdf') {
        import('jspdf').then(jsPDF => {
            import('jspdf-autotable').then(autoTable => {
                try {
                    const doc = new jsPDF.default({ orientation: 'landscape' });
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(40, 40, 40);
                    doc.text(data.title, 14, 16);

                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(120, 120, 120);
                    doc.text(`Generated on ${today}`, 14, 22);

                    autoTable.default(doc, {
                        startY: 26,
                        head: [data.headers],
                        body: cleanRows.map(r => r.map(c => String(c))),
                        theme: 'striped',
                        styles: { fontSize: 8 },
                        headStyles: { fillColor: [41, 128, 185] },
                    });

                    doc.save(filename);
                } catch (err) {
                    console.error('[export] PDF execution error:', err);
                }
            }).catch(err => {
                console.error('[export] Failed to load jspdf-autotable:', err);
            });
        }).catch(err => {
            console.error('[export] Failed to load jspdf:', err);
        });
    }
}
