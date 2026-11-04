import EconomicIndicatorView from '../../economic-indicators/_components/EconomicIndicatorView';
import { spreadMetadata } from '../_data/spreadMetadata';

export default function BBBCorporateSpreadPage() {
  return (
    <EconomicIndicatorView
      indicatorCode="BAMLC0A4CBBB"
      title="ICE BofA BBB US Corporate Index Option-Adjusted Spread"
      yAxisLabel="Percent"
      metadata={spreadMetadata.BAMLC0A4CBBB}
      showHeader={true}
    />
  );
}
