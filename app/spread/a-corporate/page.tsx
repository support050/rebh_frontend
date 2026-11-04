import EconomicIndicatorView from '../../economic-indicators/_components/EconomicIndicatorView';
import { spreadMetadata } from '../_data/spreadMetadata';

export default function ACorporateSpreadPage() {
  return (
    <EconomicIndicatorView
      indicatorCode="BAMLC0A3CA"
      title="ICE BofA Single-A US Corporate Index Option-Adjusted Spread"
      yAxisLabel="Percent"
      metadata={spreadMetadata.BAMLC0A3CA}
      showHeader={true}
    />
  );
}
