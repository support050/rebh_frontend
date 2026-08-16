'use client'

import type { ReactNode } from 'react'
import clsx from 'clsx'

/**
 * Shared "White Paper" chrome primitives.
 * Design tokens: white surfaces (#FFFFFF) on a soft off-white canvas
 * (#F7F8FA), 1px #E5E7EB borders, crisp 4px radii, and a single
 * restrained accent (#8C3B32) reserved for active/selected states.
 */

export const SURFACE = '#FFFFFF'
export const BORDER = '#E5E7EB'
export const TEXT_PRIMARY = '#1A1A1A'
export const TEXT_MUTED = '#6B7280'
export const ACCENT = '#8C3B32'

/** Flat white card container used for every panel/table/chart wrapper. */
export function LedgerPanel({
    children,
    className = '',
}: {
    children: ReactNode
    className?: string
    /** @deprecated kept for backwards-compat with older call sites; no longer affects rendering */
    rail?: boolean
}) {
    return (
        <div
            className={clsx(
                'relative rounded-[4px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
                className,
            )}
        >
            {children}
        </div>
    )
}

/** Flat toggle/filter button used for switch-groups (view mode, language, chart type, filters). */
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
                'font-sans font-semibold uppercase tracking-wider transition-colors duration-150',
                'rounded-[4px] border',
                size === 'sm' ? 'px-2.5 py-1 text-[10px]' : 'px-3.5 py-1.5 text-[11px]',
                active
                    ? 'border-[#E5E7EB] bg-white text-[#1A1A1A] shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                    : 'border-[#E5E7EB] bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]/70 hover:text-[#1A1A1A]',
            )}
        >
            {children}
        </button>
    )
}

/** Small colored status/accent dot, e.g. for KPI trend or section markers. */
export function AccentDot({ color = ACCENT }: { color?: string }) {
    return <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
}