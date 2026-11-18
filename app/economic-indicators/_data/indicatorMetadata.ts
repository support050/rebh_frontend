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
  BAMLC0A3CAEY: {
    code: 'BAMLC0A3CAEY',
    title: 'ICE BofA Single-A US Corporate Index, Effective Yield',
    units: 'Percent, Not Seasonally Adjusted',
    frequency: 'Daily, Close',
    source: 'Ice Data Indices, LLC',
    sourceLink: 'https://fred.stlouisfed.org/series/BAMLC0A3CAEY',
    releaseTitle: 'ICE BofA Indices',
    releaseLink: 'https://www.theice.com/market-data/indices',
    fredLink: 'https://fred.stlouisfed.org/series/BAMLC0A3CAEY',
    notes: 'Starting in April 2026, this series will only include 3 years of observations. For more data, go to the source.\n\nThis data represents the effective yield of the ICE BofA Single-A US Corporate Index, a subset of the ICE BofA US Corporate Master Index tracking the performance of US dollar denominated investment grade rated corporate debt publicly issued in the US domestic market. This subset includes all securities with a given investment grade rating A. When the last calendar day of the month takes place on the weekend, weekend observations will occur as a result of month ending accrued interest adjustments.\n\nCertain indices and index data included in FRED are the property of ICE Data Indices, LLC ("ICE DATA") and used under license. ICE® IS A REGISTERED TRADEMARK OF ICE DATA OR ITS AFFILIATES AND BOFA® IS A REGISTERED TRADEMARK OF BANK OF AMERICA CORPORATION LICENSED BY BANK OF AMERICA CORPORATION AND ITS AFFILIATES ("BOFA") AND MAY NOT BE USED WITHOUT BOFA\'S PRIOR WRITTEN APPROVAL. ICE DATA, ITS AFFILIATES AND THEIR RESPECTIVE THIRD PARTY SUPPLIERS DISCLAIM ANY AND ALL WARRANTIES AND REPRESENTATIONS, EXPRESS AND/OR IMPLIED, INCLUDING ANY WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE OR USE, INCLUDING WITH REGARD TO THE INDICES, INDEX DATA AND ANY DATA INCLUDED IN, RELATED TO, OR DERIVED THEREFROM. NEITHER ICE DATA, NOR ITS AFFILIATES OR THEIR RESPECTIVE THIRD PARTY PROVIDERS SHALL BE SUBJECT TO ANY DAMAGES OR LIABILITY WITH RESPECT TO THE ADEQUACY, ACCURACY, TIMELINESS OR COMPLETENESS OF THE INDICES OR THE INDEX DATA OR ANY COMPONENT THEREOF. THE INDICES AND INDEX DATA AND ALL COMPONENTS THEREOF ARE PROVIDED ON AN "AS IS" BASIS AND YOUR USE IS AT YOUR OWN RISK. ICE DATA, ITS AFFILIATES AND THEIR RESPECTIVE THIRD PARTY SUPPLIERS DO NOT SPONSOR, ENDORSE, OR RECOMMEND FRED, OR ANY OF ITS PRODUCTS OR SERVICES.\n\nCopyright, 2023, ICE Data Indices. Reproduction of this data in any form is prohibited except with the prior written permission of ICE Data Indices.\n\nThe end of day Index values, Index returns, and Index statistics ("Top Level Data") are being provided for your internal use only and you are not authorized or permitted to publish, distribute or otherwise furnish Top Level Data to any third-party without prior written approval of ICE Data.\n\nNeither ICE Data, its affiliates nor any of its third party suppliers shall have any liability for the accuracy or completeness of the Top Level Data furnished through FRED, or for delays, interruptions or omissions therein nor for any lost profits, direct, indirect, special or consequential damages.\n\nThe Top Level Data is not investment advice and a reference to a particular investment or security, a credit rating or any observation concerning a security or investment provided in the Top Level Data is not a recommendation to buy, sell or hold such investment or security or make any other investment decisions.',
    suggestedCitation: 'Ice Data Indices, LLC, ICE BofA Single-A US Corporate Index Effective Yield [BAMLC0A3CAEY], retrieved from FRED, Federal Reserve Bank of St. Louis; https://fred.stlouisfed.org/series/BAMLC0A3CAEY, November 17, 2026.',
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
