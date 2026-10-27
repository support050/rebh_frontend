'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { EXPORT_IGNORE_ATTR } from './exportImage';
import { ExportFormat } from './exportData';

interface ExportOptionItem {
    fmt: ExportFormat;
    label: string;
    color: string;
}

const DEFAULT_OPTIONS: ExportOptionItem[] = [
    { fmt: 'png', color: 'bg-emerald-500', label: 'Image (.png)' },
    { fmt: 'pdf', color: 'bg-red-500', label: 'PDF Document (.pdf)' },
    { fmt: 'xlsx', color: 'bg-green-600', label: 'Excel (.xlsx)' },
    { fmt: 'xls', color: 'bg-blue-500', label: 'Excel 97-2003 (.xls)' },
    { fmt: 'csv', color: 'bg-emerald-600', label: 'Comma delimited (.csv)' },
    { fmt: 'txt', color: 'bg-gray-500', label: 'Text (.txt)' },
];

interface ExportButtonProps {
    label?: string;
    busyLabel?: string;
    title?: string;
    className?: string;
    formats?: ExportFormat[]; // Custom format list (e.g. omit 'png')
    onExport?: () => void | Promise<void>; // Direct image callback (legacy support)
    onExportFormat?: (format: ExportFormat) => void | Promise<void>;
}

export function ExportButton({
    label = 'Export',
    busyLabel = 'Exporting…',
    title = 'Export data',
    className = '',
    formats,
    onExport,
    onExportFormat,
}: ExportButtonProps) {
    const [open, setOpen] = useState(false);
    const [busyFmt, setBusyFmt] = useState<ExportFormat | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const availableOptions = formats
        ? DEFAULT_OPTIONS.filter(opt => formats.includes(opt.fmt))
        : DEFAULT_OPTIONS;

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = useCallback(async (fmt: ExportFormat) => {
        setOpen(false);
        if (busyFmt) return;
        setBusyFmt(fmt);
        try {
            if (onExportFormat) {
                await onExportFormat(fmt);
            } else if (fmt === 'png' && onExport) {
                await onExport();
            }
        } catch (err) {
            console.error(`[export] ${fmt} failed:`, err);
        } finally {
            setBusyFmt(null);
        }
    }, [busyFmt, onExportFormat, onExport]);

    const isBusy = busyFmt !== null;

    return (
        <div
            ref={containerRef}
            className={`relative inline-block text-left ${className}`}
            {...{ [EXPORT_IGNORE_ATTR]: '' }}
        >
            <button
                type="button"
                onClick={() => setOpen(prev => !prev)}
                disabled={isBusy}
                aria-busy={isBusy}
                title={title}
                className="stamp inline-flex items-center gap-1.5 cursor-pointer font-medium text-xs select-none"
                style={{ opacity: isBusy ? 0.6 : 1 }}
            >
                <Download className="w-3.5 h-3.5 opacity-80" />
                <span>{isBusy ? busyLabel : label}</span>
                <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    className="absolute right-0 mt-1.5 w-52 bg-white rounded-md shadow-xl border border-gray-200 py-1.5 z-50 text-xs animate-in fade-in-50 zoom-in-95 duration-100"
                    style={{ minWidth: '180px' }}
                >
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 mb-1">
                        Export Options
                    </div>
                    {availableOptions.map(({ fmt, color, label: optLabel }) => (
                        <button
                            key={fmt}
                            type="button"
                            onClick={() => handleSelect(fmt)}
                            className="w-full text-left px-3.5 py-1.5 text-gray-700 hover:bg-gray-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                            <span className={`w-2 h-2 rounded-full ${color} shrink-0`} />
                            <span className="font-medium text-[11.5px]">{optLabel}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}