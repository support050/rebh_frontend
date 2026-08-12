'use client'

import type { ReactNode } from 'react'
import clsx from 'clsx'

/**
 * Shared "paper ledger" skeuomorphic chrome.
 * Signature element: a red margin rule + brass hole-punch rail down the
 * left edge of every panel, like loose-leaf ledger paper in a binder.
 */

export const PAPER_TEXTURE =
    'bg-[#F3EAD3] bg-[radial-gradient(circle_at_1px_1px,rgba(139,109,58,0.08)_1px,transparent_0)] [background-size:13px_13px]'

export const INK = '#3C2A18'
export const INK_SOFT = '#7A6244'
export const BRASS = '#A9803F'

export function HolePunchRail({ count = 7 }: { count?: number }) {
    return (
        <div className="pointer-events-none absolute left-0 top-0 z-20 flex h-full w-7 flex-col items-center justify-evenly py-4">
            {Array.from({ length: count }).map((_, i) => (
                <span
                    key={i}
                    className="h-[9px] w-[9px] rounded-full bg-[#EAE0C4] shadow-[inset_0_1px_2px_rgba(60,42,24,0.5),0_1px_0_rgba(255,255,255,0.65)]"
                />
            ))}
        </div>
    )
}

export function LedgerPanel({
    children,
    className = '',
    rail = true,
}: {
    children: ReactNode
    className?: string
    rail?: boolean
}) {
    return (
        <div
            className={clsx(
                'relative overflow-hidden rounded-[3px] border border-[#C6AF7C]',
                'shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_14px_28px_-8px_rgba(60,42,24,0.28),0_3px_6px_rgba(60,42,24,0.14)]',
                PAPER_TEXTURE,
                rail && 'pl-8',
                className,
            )}
        >
            {rail && (
                <>
                    <HolePunchRail />
                    <div className="pointer-events-none absolute left-7 top-0 h-full w-px bg-[#B5453A]/45" />
                </>
            )}
            {children}
        </div>
    )
}

/** Rubber-stamp style toggle button, for switch-groups (view mode, language, chart type, filters). */
export function StampButton({
    active,
    children,
    onClick,
    size = 'md',
}: {
    active: boolean
    children: ReactNode
    onClick: () => void
    size?: 'sm' | 'md'
}) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                'relative font-serif font-semibold uppercase tracking-[0.06em] transition-all duration-150',
                size === 'sm' ? 'rounded-[4px] px-2.5 py-1 text-[10px]' : 'rounded-[5px] px-3.5 py-1.5 text-[11px]',
                active
                    ? '-rotate-1 border-2 border-[#8C3B32] bg-[#FBF6E9] text-[#8C3B32] shadow-[0_2px_0_#8C3B32,inset_0_0_0_1px_rgba(140,59,50,0.15)]'
                    : 'rotate-0 border-2 border-[#C6AF7C]/70 bg-[#EFE3C4]/70 text-[#7A6244] shadow-[0_1px_0_rgba(60,42,24,0.15)] hover:border-[#B5453A]/40 hover:text-[#8C3B32]',
            )}
        >
            {children}
        </button>
    )
}

/** Small washi-tape strip decoration for card corners. */
export function WashiTape({ rotate = -6, color = '#C9A66B' }: { rotate?: number; color?: string }) {
    return (
        <div
            className="pointer-events-none absolute -top-2 left-4 h-4 w-14 opacity-70 mix-blend-multiply"
            style={{
                backgroundColor: color,
                transform: `rotate(${rotate}deg)`,
                boxShadow: '0 1px 2px rgba(60,42,24,0.25)',
                maskImage:
                    'repeating-linear-gradient(90deg, black 0 6px, rgba(0,0,0,0.75) 6px 7px)',
            }}
        />
    )
}