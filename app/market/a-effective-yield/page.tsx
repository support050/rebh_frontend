import EconomicIndicatorView from '../../economic-indicators/_components/EconomicIndicatorView';
import { indicatorMetadata } from '../../economic-indicators/_data/indicatorMetadata';

export default function AEffectiveYieldPage() {
  return (
    <EconomicIndicatorView
      indicatorCode="BAMLC0A3CAEY"
      title="ICE BofA Single-A US Corporate Index, Effective Yield"
      yAxisLabel="Percent"
      metadata={indicatorMetadata.BAMLC0A3CAEY}
    />
  );
}
