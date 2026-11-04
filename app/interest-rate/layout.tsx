import RateReferenceBubble from './_components/RateReferenceBubble';

export default function InterestRateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /* These two pages replicate third-party tool chrome (QuikStrike /
       Investing.com) that owns its own white background, so no card wrapper
       here — unlike /economic-indicators. color-scheme is pinned to light so
       the site-wide dark theme never inverts the replicated screens. */
    <div className="w-full [color-scheme:light]">
      {children}
      <RateReferenceBubble />
    </div>
  );
}
