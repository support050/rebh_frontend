export interface IndicatorMetadata {
  code: string;
  title: string;
  observations?: string;
  observationDate?: string;  // Date of the latest observation
  updated?: string;
  nextRelease?: string;
  /** FRED's release-calendar page for this series' release, e.g.
   *  https://fred.stlouisfed.org/releases/calendar?rid=209&y=2026 */
  releaseCalendarUrl?: string;
  units: string;
  frequency: string;
  dateRange?: string;
  source: string;
  sourceLink?: string;   // Link to source organization
  releaseTitle?: string;
  releaseLink?: string;  // Link to official release page (e.g., DOL, BLS)
  fredLink?: string;     // Link to FRED series page
  notes?: string;
  suggestedCitation?: string;
}

export const indicatorMetadata: Record<string, IndicatorMetadata> = {
  IC4WSA: {
    code: 'IC4WSA',
    title: '4-Week Moving Average of Initial Claims',
    observations: '210,750',
    observationDate: '2026-04-18',
    updated: 'Apr 23, 2026 7:49 AM CDT',
    nextRelease: 'Apr 30, 2026',
    units: 'Number, Seasonally Adjusted',
    frequency: 'Weekly, Ending Saturday',
    dateRange: '1967-01-28 to 2026-04-18',
    source: 'U.S. Employment and Training Administration via FRED®',
    releaseTitle: 'Unemployment Insurance Weekly Claims Report',
    releaseLink: 'https://www.dol.gov/ui/data.pdf',
    fredLink: 'https://fred.stlouisfed.org/series/IC4WSA',
    notes: 'An initial claim is a claim filed by an unemployed individual after a separation from an employer. The claim requests a determination of basic eligibility for the Unemployment Insurance program.',
    suggestedCitation: 'U.S. Employment and Training Administration, 4-Week Moving Average of Initial Claims [IC4WSA], retrieved from FRED, Federal Reserve Bank of St. Louis; https://fred.stlouisfed.org/series/IC4WSA, April 30, 2026.',
  },
  UNRATE: {
    code: 'UNRATE',
    title: 'Unemployment Rate',
    observations: '4.3',
    observationDate: '2026-03-01',
    updated: 'Apr 3, 2026 8:19 AM CDT',
    nextRelease: 'May 8, 2026',
    units: 'Percent, Seasonally Adjusted',
    frequency: 'Monthly',
    dateRange: '1948-01-01 to 2026-03-01',
    source: 'U.S. Bureau of Labor Statistics',
    sourceLink: 'https://www.bls.gov/',
    releaseTitle: 'Employment Situation',
    releaseLink: 'https://www.bls.gov/news.release/empsit.htm',
    fredLink: 'https://fred.stlouisfed.org/series/UNRATE',
    notes: 'The unemployment rate represents the number of unemployed as a percentage of the labor force. Labor force data are restricted to people 16 years of age and older, who currently reside in 1 of the 50 states or the District of Columbia, who do not reside in institutions (e.g., penal and mental facilities, homes for the aged), and who are not on active duty in the Armed Forces.\n\nThis rate is also defined as the U-3 measure of labor underutilization.\n\nThe series comes from the \'Current Population Survey (Household Survey)\'\n\nThe source code is: LNS14000000',
    suggestedCitation: 'U.S. Bureau of Labor Statistics, Unemployment Rate [UNRATE], retrieved from FRED, Federal Reserve Bank of St. Louis; https://fred.stlouisfed.org/series/UNRATE, .',
  },
  PAYEMS: {
    code: 'PAYEMS',
    title: 'All Employees, Total Nonfarm',
    observations: '158,637',
    observationDate: '2026-03-01',
    updated: 'Apr 3, 2026 8:19 AM CDT',
    nextRelease: 'May 8, 2026',
    units: 'Thousands of Persons, Seasonally Adjusted',
    frequency: 'Monthly',
    dateRange: '1939-01-01 to 2026-03-01',
    source: 'U.S. Bureau of Labor Statistics',
    sourceLink: 'https://www.bls.gov/',
    releaseTitle: 'Employment Situation',
    releaseLink: 'https://www.bls.gov/ces/',
    fredLink: 'https://fred.stlouisfed.org/series/PAYEMS',
    notes: 'All Employees: Total Nonfarm, commonly known as Total Nonfarm Payroll, is a measure of the number of U.S. workers in the economy that excludes proprietors, private household employees, unpaid volunteers, farm employees, and the unincorporated self-employed. This measure accounts for approximately 80 percent of the workers who contribute to Gross Domestic Product (GDP).\n\nThis measure provides useful insights into the current economic situation because it can represent the number of jobs added or lost in an economy. Increases in employment might indicate that businesses are hiring which might also suggest that businesses are growing. Additionally, those who are newly employed have increased their personal incomes, which means (all else constant) their disposable incomes have also increased, thus fostering further economic expansion.\n\nGenerally, the U.S. labor force and levels of employment and unemployment are subject to fluctuations due to seasonal changes in weather, major holidays, and the opening and closing of schools. The Bureau of Labor Statistics (BLS) adjusts the data to offset the seasonal effects to show non-seasonal changes: for example, women\'s participation in the labor force; or a general decline in the number of employees, a possible indication of a downturn in the economy. To closely examine seasonal and non-seasonal changes, the BLS releases two monthly statistical measures: the seasonally adjusted All Employees: Total Nonfarm (PAYEMS) and All Employees: Total Nonfarm (PAYNSA), which is not seasonally adjusted.\n\nThe series comes from the \'Current Employment Statistics (Establishment Survey).\'\n\nThe source code is: CES0000000001',
    suggestedCitation: 'U.S. Bureau of Labor Statistics, All Employees, Total Nonfarm [PAYEMS], retrieved from FRED, Federal Reserve Bank of St. Louis; https://fred.stlouisfed.org/series/PAYEMS, April 30, 2026.',
  },
};
