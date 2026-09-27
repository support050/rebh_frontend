"use client";

import React from "react";

export interface BadgeProps {
    tone: "warning" | "danger" | "neutral";
    title?: string;
    children: React.ReactNode;
    className?: string;
}

/**
 * Shared Badge component for flags (stale ⚑, isolated/Munger, grade badge, honesty marks, etc.).
 * Preserves exact color tokens per tone.
 */
export function Badge({ tone, title, children, className = "" }: BadgeProps) {
    const toneStyles = {
        warning: "border-[#B45309]/30 bg-[#B45309]/10 text-[#B45309]",
        danger: "border-[#DC2626]/30 bg-[#DC2626]/10 text-[#DC2626]",
        neutral: "border-[#E5E7EB] text-[#6B7280]",
    };

    return (
        <span
            title={title}
            className={`rounded-full border px-1.5 py-0.5 font-medium ${toneStyles[tone]} ${className}`}
        >
            {children}
        </span>
    );
}
