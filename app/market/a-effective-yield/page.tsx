import EconomicIndicatorView from '../../economic-indicators/_components/EconomicIndicatorView';
import { indicatorMetadata } from '../../economic-indicators/_data/indicatorMetadata';
import FredReferenceBubble from '../../economic-indicators/_components/FredReferenceBubble';

export default function AEffectiveYieldPage() {
  return (
    <div className="w-full px-4 py-8 [color-scheme:light]">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <EconomicIndicatorView
          indicatorCode="BAMLC0A3CAEY"
          title="ICE BofA Single-A US Corporate Index, Effective Yield"
          yAxisLabel="Percent"
          metadata={indicatorMetadata.BAMLC0A3CAEY}
        />
      </div>

      {/* Floating "View on FRED®" reference bubble (bottom-right) */}
      <FredReferenceBubble />
    </div>
  );
}
