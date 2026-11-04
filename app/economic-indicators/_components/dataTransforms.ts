/* ─────────────────────────────────────────────
   Data transformation utilities for Economic Indicators
   All transformations are frontend-only (no backend needed).
───────────────────────────────────────────── */

export interface DataPoint {
  date: string;
  value: number;
}

/* ─────────────────────────────────────────────
   1. Units Transformation
   Transforms the raw series values based on 
   the selected units option.
───────────────────────────────────────────── */
export function applyUnitsTransform(
  data: DataPoint[],
  units: string,
  frequency: string = 'Monthly'
): DataPoint[] {
  if (!data || data.length === 0) return [];

  const periodsPerYear = getPeriodsPerYear(frequency);

  // If the selected units is the original/default, return as-is
  const lowerUnits = units.toLowerCase();
  if (
    lowerUnits.includes('thousands of persons') && !lowerUnits.includes('change') ||
    units === 'Percent' ||
    units === 'Number' ||
    units === 'Select'
  ) {
    return data;
  }

  switch (units) {
    case 'Change':
    case 'Change, Thousands of Persons':
      return computeChange(data);

    case 'Change from Year Ago':
    case 'Change from Year Ago, Thousands of Persons':
      return computeChangeFromYearAgo(data, periodsPerYear);

    case 'Percent Change':
      return computePercentChange(data);

    case 'Percent Change from Year Ago':
      return computePercentChangeFromYearAgo(data, periodsPerYear);

    case 'Compounded Annual Rate of Change':
      return computeCompoundedAnnualRate(data, periodsPerYear);

    case 'Continuously Compounded Rate of Change':
      return computeContinuouslyCompoundedRate(data);

    case 'Continuously Compounded Annual Rate of Change':
      return computeContinuouslyCompoundedAnnualRate(data, periodsPerYear);

    case 'Index (Scale value to 100 for chosen date)':
      return computeIndex(data);

    case 'Natural Log':
      return computeNaturalLog(data);

    default:
      return data;
  }
}

/* ─────────────────────────────────────────────
   2. Frequency Aggregation
   Aggregates data to a lower frequency. Grouping is
   idempotent: when the source is already at (or coarser than)
   the target frequency every bucket holds a single point, so the
   output equals the input — that lets one code path serve monthly
   series (UNRATE) and daily ones (ICE BofA spreads) alike.
───────────────────────────────────────────── */

/* Bucket key for a date at the requested frequency; null = no aggregation. */
function getPeriodKey(dateStr: string, targetFrequency: string): string | null {
  const d = new Date(dateStr + 'T12:00:00');
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed

  switch (targetFrequency) {
    case 'Daily':
      return null;
    case 'Weekly': {
      // Bucket by the Monday of the ISO week (keeps Sat/Sun together).
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return monday.toDateString();
    }
    case 'Quarterly':
      return `${year}-Q${Math.floor(month / 3) + 1}`;
    case 'Semiannual':
      return `${year}-H${month < 6 ? 1 : 2}`;
    case 'Annual':
      return `${year}`;
    case 'Monthly':
    default:
      return `${year}-${month}`;
  }
}

export function applyFrequencyTransform(
  data: DataPoint[],
  targetFrequency: string
): DataPoint[] {
  if (!data || data.length === 0) return [];
  if (targetFrequency === 'Daily') return data;

  const grouped: Map<string, DataPoint[]> = new Map();

  for (const point of data) {
    const periodKey = getPeriodKey(point.date, targetFrequency);
    if (periodKey === null) return data;

    if (!grouped.has(periodKey)) {
      grouped.set(periodKey, []);
    }
    grouped.get(periodKey)!.push(point);
  }

  const result: DataPoint[] = [];
  for (const [, points] of grouped) {
    // Only include complete periods or the last period
    if (points.length > 0) {
      const avg = points.reduce((sum, p) => sum + p.value, 0) / points.length;
      // Use the last date in the period as representative
      result.push({
        date: points[points.length - 1].date,
        value: Math.round(avg * 1000) / 1000,
      });
    }
  }

  return result;
}

/* ─────────────────────────────────────────────
   3. Output Units Transformation
   Applied after formula (same logic as units).
───────────────────────────────────────────── */
export function applyOutputUnitsTransform(
  data: DataPoint[],
  outputUnits: string,
  frequency: string = 'Monthly'
): DataPoint[] {
  if (!data || data.length === 0) return [];
  if (outputUnits === 'Select') return data;
  return applyUnitsTransform(data, outputUnits, frequency);
}

/* ─────────────────────────────────────────────
   4. Get display label for the Y-axis
───────────────────────────────────────────── */
export function getTransformedYAxisLabel(
  originalLabel: string,
  units: string,
  outputUnits: string
): string {
  // If output units is set, it overrides
  const activeUnits = outputUnits !== 'Select' ? outputUnits : units;

  if (activeUnits.includes('Percent Change')) return 'Percent Change';
  if (activeUnits.includes('Change from Year Ago')) return 'Change from Year Ago';
  if (activeUnits === 'Change' || activeUnits.includes('Change,')) return 'Change';
  if (activeUnits.includes('Compounded Annual')) return 'Compounded Annual Rate (%)';
  if (activeUnits.includes('Continuously Compounded Annual')) return 'Continuously Compounded Annual Rate (%)';
  if (activeUnits.includes('Continuously Compounded')) return 'Continuously Compounded Rate (%)';
  if (activeUnits === 'Index (Scale value to 100 for chosen date)') return 'Index (First Date = 100)';
  if (activeUnits === 'Natural Log') return 'Natural Log';

  return originalLabel;
}

/* ─────────────────────────────────────────────
   Internal helpers
───────────────────────────────────────────── */
function getPeriodsPerYear(frequency: string): number {
  switch (frequency) {
    case 'Daily': return 252;
    case 'Weekly': return 52;
    case 'Monthly': return 12;
    case 'Quarterly': return 4;
    case 'Semiannual': return 2;
    case 'Annual': return 1;
    default: return 12;
  }
}

/** Change: value(t) - value(t-1) */
function computeChange(data: DataPoint[]): DataPoint[] {
  const result: DataPoint[] = [];
  for (let i = 1; i < data.length; i++) {
    result.push({
      date: data[i].date,
      value: Math.round((data[i].value - data[i - 1].value) * 1000) / 1000,
    });
  }
  return result;
}

/** Change from Year Ago: value(t) - value(t-12) */
function computeChangeFromYearAgo(data: DataPoint[], periodsPerYear: number): DataPoint[] {
  const result: DataPoint[] = [];
  for (let i = periodsPerYear; i < data.length; i++) {
    result.push({
      date: data[i].date,
      value: Math.round((data[i].value - data[i - periodsPerYear].value) * 1000) / 1000,
    });
  }
  return result;
}

/** Percent Change: ((value(t) - value(t-1)) / value(t-1)) * 100 */
function computePercentChange(data: DataPoint[]): DataPoint[] {
  const result: DataPoint[] = [];
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1].value;
    if (prev !== 0) {
      result.push({
        date: data[i].date,
        value: Math.round(((data[i].value - prev) / Math.abs(prev)) * 100 * 1000) / 1000,
      });
    }
  }
  return result;
}

/** Percent Change from Year Ago */
function computePercentChangeFromYearAgo(data: DataPoint[], periodsPerYear: number): DataPoint[] {
  const result: DataPoint[] = [];
  for (let i = periodsPerYear; i < data.length; i++) {
    const prev = data[i - periodsPerYear].value;
    if (prev !== 0) {
      result.push({
        date: data[i].date,
        value: Math.round(((data[i].value - prev) / Math.abs(prev)) * 100 * 1000) / 1000,
      });
    }
  }
  return result;
}

/** Compounded Annual Rate of Change: ((value(t)/value(t-1))^periodsPerYear - 1) * 100 */
function computeCompoundedAnnualRate(data: DataPoint[], periodsPerYear: number): DataPoint[] {
  const result: DataPoint[] = [];
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1].value;
    if (prev > 0 && data[i].value > 0) {
      const ratio = data[i].value / prev;
      const annualized = (Math.pow(ratio, periodsPerYear) - 1) * 100;
      result.push({
        date: data[i].date,
        value: Math.round(annualized * 1000) / 1000,
      });
    }
  }
  return result;
}

/** Continuously Compounded Rate: ln(value(t)/value(t-1)) * 100 */
function computeContinuouslyCompoundedRate(data: DataPoint[]): DataPoint[] {
  const result: DataPoint[] = [];
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1].value;
    if (prev > 0 && data[i].value > 0) {
      result.push({
        date: data[i].date,
        value: Math.round(Math.log(data[i].value / prev) * 100 * 1000) / 1000,
      });
    }
  }
  return result;
}

/** Continuously Compounded Annual Rate: ln(value(t)/value(t-1)) * periodsPerYear * 100 */
function computeContinuouslyCompoundedAnnualRate(data: DataPoint[], periodsPerYear: number): DataPoint[] {
  const result: DataPoint[] = [];
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1].value;
    if (prev > 0 && data[i].value > 0) {
      result.push({
        date: data[i].date,
        value: Math.round(Math.log(data[i].value / prev) * periodsPerYear * 100 * 1000) / 1000,
      });
    }
  }
  return result;
}

/** Index: (value(t) / value(0)) * 100 */
function computeIndex(data: DataPoint[]): DataPoint[] {
  if (data.length === 0) return [];
  const base = data[0].value;
  if (base === 0) return data;
  return data.map((d) => ({
    date: d.date,
    value: Math.round((d.value / base) * 100 * 1000) / 1000,
  }));
}

/** Natural Log: ln(value) */
function computeNaturalLog(data: DataPoint[]): DataPoint[] {
  return data
    .filter((d) => d.value > 0)
    .map((d) => ({
      date: d.date,
      value: Math.round(Math.log(d.value) * 10000) / 10000,
    }));
}

// ── X-Axis Tick Generators ──

export function calculateXAxisTicks(
  data: { date: string }[]
): { ticks: string[], formatType: 'MMM YYYY' | 'YYYY' } {
  if (!data || data.length === 0) {
    return { ticks: [], formatType: 'YYYY' };
  }

  const start = new Date(data[0].date);
  const end = new Date(data[data.length - 1].date);
  const diffYears = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  const ticks: string[] = [];
  let formatType: 'MMM YYYY' | 'YYYY' = 'YYYY';

  if (diffYears <= 1.5) {
    // 1 Year: Every month
    formatType = 'MMM YYYY';
    let lastYM = '';
    for (const d of data) {
      const ym = d.date.substring(0, 7);
      if (ym !== lastYM) {
        ticks.push(d.date);
        lastYM = ym;
      }
    }
  } else if (diffYears <= 5.5) {
    // 5 Years: Every 6 months (H1/H2)
    formatType = 'MMM YYYY';
    let lastYM = '';
    for (const d of data) {
      const month = parseInt(d.date.substring(5, 7));
      const h = month <= 6 ? 1 : 2;
      const yh = `${d.date.substring(0, 4)}-H${h}`;
      if (yh !== lastYM) {
        ticks.push(d.date);
        lastYM = yh;
      }
    }
  } else if (diffYears <= 12) {
    // 10 Years: Every year
    formatType = 'YYYY';
    let lastYear = -1;
    for (const d of data) {
      const year = parseInt(d.date.substring(0, 4));
      if (year !== lastYear) {
        ticks.push(d.date);
        lastYear = year;
      }
    }
  } else {
    // MAX: Every 5 years
    formatType = 'YYYY';
    let lastYear = -1;
    for (const d of data) {
      const year = parseInt(d.date.substring(0, 4));
      if (year % 5 === 0 && year !== lastYear) {
        ticks.push(d.date);
        lastYear = year;
      }
    }
  }

  return { ticks, formatType };
}

export function formatXAxisLabel(dateStr: string, formatType: 'MMM YYYY' | 'YYYY') {
  if (!dateStr) return '';
  if (formatType === 'MMM YYYY') {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  return dateStr.substring(0, 4);
}

// ── Y-Axis Tick Generators ──

export function calculateYAxisTicks(
  dataMin: number,
  dataMax: number,
  targetTickCount = 8
): { ticks: number[]; domain: [number, number] } {
  if (dataMin === dataMax) {
    return { ticks: [dataMin - 1, dataMin, dataMin + 1], domain: [dataMin - 1, dataMin + 1] };
  }
  if (isNaN(dataMin) || isNaN(dataMax)) {
    return { ticks: [0, 100], domain: [0, 100] };
  }

  const span = dataMax - dataMin;
  const roughStep = span / (targetTickCount - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep || 1)));
  const normalizedStep = roughStep / magnitude;

  let niceStep = 1;
  if (normalizedStep <= 1.2) niceStep = 1;
  else if (normalizedStep <= 2) niceStep = 2;
  else if (normalizedStep <= 2.5) niceStep = 2.5;
  else if (normalizedStep <= 4) niceStep = 4;
  else if (normalizedStep <= 5) niceStep = 5;
  else niceStep = 10;

  const step = niceStep * magnitude;

  let lowerBound = Math.floor(dataMin / step) * step;
  let upperBound = Math.ceil(dataMax / step) * step;

  // Prevent bounds from crossing 0 if data doesn't
  if (dataMin >= 0 && lowerBound < 0) lowerBound = 0;
  if (dataMax <= 0 && upperBound > 0) upperBound = 0;

  const ticks: number[] = [];
  for (let val = lowerBound; val <= upperBound + step * 0.01; val += step) {
    ticks.push(val);
  }

  return { ticks, domain: [lowerBound, upperBound] };
}
