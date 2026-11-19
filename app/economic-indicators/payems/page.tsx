import EconomicIndicatorView from '../_components/EconomicIndicatorView';
import { indicatorMetadata } from '../_data/indicatorMetadata';

export default function PayemsPage() {
  return (
    <EconomicIndicatorView 
      indicatorCode="PAYEMS" 
      title="All Employees, Total Nonfarm" 
      yAxisLabel="Thousands of Persons"
      metadata={indicatorMetadata.PAYEMS}
      defaultUnitsOverride="Change, Thousands of Persons"
    />
  );
}
