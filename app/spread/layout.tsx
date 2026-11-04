'use client';
import FredReferenceBubble from '../economic-indicators/_components/FredReferenceBubble';

export default function SpreadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /* Same shell as the economic-indicator pages: a single white content card,
       light-theme-only scope (no `dark:` variants) and color-scheme pinned to
       light so native controls (date inputs) never invert under the site-wide
       next-themes `html.dark` class. */
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
