'use client';

import { useCallback, useState } from 'react';
import { EXPORT_IGNORE_ATTR } from './exportImage';

interface ExportButtonProps {
    label: string;
    busyLabel?: string;
    title?: string;
    className?: string;
    onExport: () => void | Promise<void>;
}

/**
 * Secondary action button (text only, no emoji). Owns its own loading state and is
 * tagged `data-export-ignore` so it can never leak into a captured image.
 */
export function ExportButton({ label, busyLabel = 'Exporting…', title, className = '', onExport }: ExportButtonProps) {
    const [busy, setBusy] = useState(false);

    const handleClick = useCallback(async () => {
        if (busy) return;
        setBusy(true);
        try {
            await onExport();
        } catch (err) {
            console.error('[export] failed:', err);
        } finally {
            setBusy(false);
        }
    }, [busy, onExport]);

    return (
        <button
            type="button"
            {...{ [EXPORT_IGNORE_ATTR]: '' }}
            onClick={handleClick}
            disabled={busy}
            aria-busy={busy}
            title={title}
            className={`stamp ${className}`}
            style={{ opacity: busy ? 0.6 : 1, cursor: busy ? 'progress' : undefined }}
        >
            {busy ? busyLabel : label}
        </button>
    );
}