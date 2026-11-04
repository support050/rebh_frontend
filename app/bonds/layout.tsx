import BondsReferenceBubble from './_components/BondsReferenceBubble';

/**
 * Shared shell for the three /bonds Treasury yield-curve pages. Mounts the
 * floating BondsReferenceBubble once so every route under /bonds gets the
 * "View Official Source on Treasury.gov" action pinned bottom-right (the bubble
 * itself reads usePathname and renders nothing outside the mapped routes).
 */
export default function BondsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BondsReferenceBubble />
    </>
  );
}
