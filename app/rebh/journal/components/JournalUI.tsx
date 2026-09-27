import React from "react";

interface KpiCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    valueColor?: string;
    badge?: string;
    footnote?: string;
    honestyMark?: string | string[]; // °, ≈, ⚠, 🔌
    honestyTooltip?: string;
    sublabel?: string;
}

export function KpiCard({
    icon,
    label,
    value,
    valueColor = "text-[#1A1A1A]",
    badge,
    footnote,
    honestyMark,
    honestyTooltip,
    sublabel,
}: KpiCardProps) {
    const marks = Array.isArray(honestyMark) ? honestyMark : honestyMark ? [honestyMark] : [];

    return (
        <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col justify-between transition-colors">
            <div>
                <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                        {icon}
                        {marks.map((m, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#F3F4F6] text-[10px] font-mono font-bold text-[#6B7280] cursor-help border border-[#E5E7EB]"
                                title={honestyTooltip}
                                aria-label={honestyTooltip}
                            >
                                {m}
                            </span>
                        ))}
                    </div>
                    {badge && (
                        <span className="text-[10.5px] font-extrabold text-[#8C3B32] bg-[#FBEAE8] border border-[#F0CFC9] rounded-full px-2.5 py-0.5">
                            {badge}
                        </span>
                    )}
                </div>

                <div className={`text-2xl font-black font-mono tracking-tight tabular-nums dir-ltr text-right ${valueColor}`}>
                    {value}
                </div>

                <div className="text-[11.5px] font-medium text-[#6B7280] mt-1 flex items-center justify-between">
                    <span>{label}</span>
                    {sublabel && <span className="text-[10px] font-normal text-[#9CA3AF]">{sublabel}</span>}
                </div>
            </div>

            {footnote && (
                <div className="text-[10.5px] text-[#9CA3AF] mt-2 pt-2 border-t border-[#F3F4F6] leading-normal">
                    {footnote}
                </div>
            )}
        </div>
    );
}

export function Card({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`bg-white border border-[#E5E7EB] rounded-[4px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${className}`}>
            {children}
        </div>
    );
}

export function Button({
    children,
    variant = "primary",
    size = "md",
    onClick,
    type = "button",
    disabled = false,
    className = "",
    title,
    ariaLabel,
}: {
    children: React.ReactNode;
    variant?: "primary" | "ghost" | "ghostDanger" | "smallGhost" | "smallDanger";
    size?: "sm" | "md";
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    className?: string;
    title?: string;
    ariaLabel?: string;
}) {
    const baseStyles = "inline-flex items-center justify-center font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B32]/60 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles = {
        primary: "bg-[#8C3B32] text-white hover:bg-[#78322A] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
        ghost: "bg-transparent border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#1A1A1A] rounded-[4px]",
        ghostDanger: "bg-transparent border border-[#FECACA] text-[#DC2626] hover:bg-[#FEF2F2] rounded-[4px]",
        smallGhost: "bg-transparent border border-[#E5E7EB] text-[#2563EB] hover:bg-[#EFF6FF] rounded-[4px]",
        smallDanger: "bg-transparent border border-[#FECACA] text-[#DC2626] hover:bg-[#FEF2F2] rounded-[4px]",
    };

    const sizeStyles = {
        sm: "px-2.5 py-1 text-[11px]",
        md: "px-4 py-2 text-[12.5px]",
    };

    const finalSize = (variant === "smallGhost" || variant === "smallDanger") ? "sm" : size;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            title={title}
            aria-label={ariaLabel}
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[finalSize]} ${className}`}
        >
            {children}
        </button>
    );
}

export function Field({
    label,
    error,
    required = false,
    children,
}: {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <label className="flex flex-col gap-1 text-[12px] text-[#4B5563]">
            <span className="font-medium flex items-center justify-between">
                <span>
                    {label}
                    {required && <span className="text-[#DC2626] mr-1">*</span>}
                </span>
                {error && <span className="text-[10.5px] text-[#DC2626] font-normal">{error}</span>}
            </span>
            {children}
        </label>
    );
}
