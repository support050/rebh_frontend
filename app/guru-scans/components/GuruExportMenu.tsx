'use client';
/**
 * GuruExportMenu.tsx — Export dropdown for the Guru Scans board.
 * 6 formats: PNG · PDF · CSV · XLSX · XLS · TXT
 */
import React, { useEffect, useRef, useState } from 'react';
import { exportGuru, type ExportColumn, type ExportFormat, type GuruPayload } from './guruExportLogic';

interface Props {
  data: GuruPayload | undefined;
  columns: ExportColumn[];
  boardRef: React.RefObject<HTMLElement | null>;
  isDark: boolean;
}

const GROUPS: { label: string; items: { id: ExportFormat; label: string }[] }[] = [
  {
    label: 'Image',
    items: [{ id: 'png', label: 'PNG — Screenshot' }],
  },
  {
    label: 'Document',
    items: [{ id: 'pdf', label: 'PDF — Tables' }],
  },
  {
    label: 'Data',
    items: [
      { id: 'csv',  label: 'CSV'  },
      { id: 'xlsx', label: 'XLSX — Excel' },
      { id: 'xls',  label: 'XLS  — Excel ' },
      { id: 'txt',  label: 'TXT  — Text' },
    ],
  },
];

const GuruExportMenu = React.memo(function GuruExportMenu({ data, columns, boardRef, isDark }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // close on outside-click / Escape
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // auto-dismiss error after 7 s
  useEffect(() => {
    if (!exportError) return;
    const t = setTimeout(() => setExportError(null), 7000);
    return () => clearTimeout(t);
  }, [exportError]);

  const run = async (id: ExportFormat) => {
    if (busy || !data) return;
    setOpen(false);
    setExportError(null);
    setBusy(id);
    try {
      await exportGuru(id, { data, columns, boardEl: boardRef.current, isDark });
    } catch (e) {
      console.error('Guru export failed', e);
      setExportError(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={!data || busy !== null}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        {busy ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 10a6 6 0 1 0 1.8-4.3M4 4v3h3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Exporting…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M10 3v10m0 0-3.5-3.5M10 13l3.5-3.5M4 17h12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export ▾
          </>
        )}
      </button>

      {/* dropdown */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          {GROUPS.map((g, gi) => (
            <div key={g.label}>
              {gi > 0 && <div className="mx-3 my-1 border-t border-gray-100 dark:border-gray-700" />}
              <p className="px-3 pb-0.5 pt-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                {g.label}
              </p>
              {g.items.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  role="menuitem"
                  onClick={() => void run(it.id)}
                  className="w-full rounded-md px-3 py-1.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  {it.label}
                </button>
              ))}
            </div>
          ))}
          <div className="pb-1" />
        </div>
      )}

      {/* inline error toast */}
      {exportError && (
        <div
          role="alert"
          className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800 shadow-lg dark:border-red-700/60 dark:bg-red-900/40 dark:text-red-200"
        >
          {exportError}
        </div>
      )}
    </div>
  );
});

export default GuruExportMenu;
