'use client';
import FredReferenceBubble from './_components/FredReferenceBubble';

export default function EconomicIndicatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /* Light-theme-only scope: no `dark:` variants below, and color-scheme is
       pinned to light so native controls (date inputs) never invert when the
       site-wide next-themes `html.dark` class is active. */
    <div className="w-full px-4 py-8 [color-scheme:light]">
      {/* ── Content ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        {children}
      </div>

      {/* Floating "View on FRED®" reference bubble (bottom-right) */}
      <FredReferenceBubble />
    </div>
  );
}
