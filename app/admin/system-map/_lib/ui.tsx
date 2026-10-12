'use client';
/**
 * Small shared bits for the System Map panels. Kept tiny on purpose — the only
 * reusable visual language on this page is "a status, always with words".
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MapStatus } from '@/lib/services/admin';
import { STATUS_HINT, STATUS_LABEL } from './format';

export function StatusDot({ status, label }: { status: MapStatus; label?: string }) {
  return (
    <span className="sm-dot" data-s={status} role="img" aria-label={label ?? STATUS_LABEL[status]} />
  );
}

/** Colour is never the only carrier: every pill prints its verdict as text. */
export function StatusPill({ status }: { status: MapStatus }) {
  return (
    <span className="sm-pill" data-s={status} title={STATUS_HINT[status]}>
      <StatusDot status={status} />
      {STATUS_LABEL[status]}
    </span>
  );
}

/**
 * Clipboard with a 2s "Copied" confirmation and a document.execCommand fallback,
 * because navigator.clipboard is unavailable over plain http on non-localhost.
 */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = useCallback(async () => {
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        ok = true;
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } catch {
      ok = false;
    }
    if (!ok) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button type="button" className="sm-btn sm-btn-ghost" onClick={copy} aria-live="polite">
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
