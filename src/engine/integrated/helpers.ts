import type { PeriodizedStatement } from '../a2Fleet';

export type RowSeries = {
  key: string;
  label: string;
  unit: string;
  values: number[];
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function buildZeroSeries(length: number) {
  return Array.from({ length }, () => 0);
}

export function shiftWithLeadingZero(values: number[]) {
  return [0, ...values];
}

export function addSeries(...series: number[][]) {
  const length = series[0]?.length ?? 0;
  return Array.from({ length }, (_, index) =>
    series.reduce((total, item) => total + (item[index] ?? 0), 0),
  );
}

export function subtractSeries(base: number[], ...series: number[][]) {
  const length = base.length;
  return Array.from({ length }, (_, index) =>
    series.reduce((total, item) => total - (item[index] ?? 0), base[index] ?? 0),
  );
}

export function multiplySeries(values: number[], multiplier: number) {
  return values.map((value) => value * multiplier);
}

export function multiplySeriesBySeries(left: number[], right: number[]) {
  return left.map((value, index) => value * (right[index] ?? 0));
}

export function mapSeries(values: number[], mapper: (value: number, index: number) => number) {
  return values.map(mapper);
}

export function rollingAdditions(values: number[]) {
  let running = 0;
  return values.map((value) => {
    running += value;
    return running;
  });
}

export function calculateLinearDepreciation(capex: number[], assetLifeYears: number) {
  const safeLife = Math.max(1, Math.round(assetLifeYears));
  const depreciation = buildZeroSeries(capex.length);

  capex.forEach((value, periodIndex) => {
    for (let offset = 0; offset < safeLife; offset += 1) {
      const targetIndex = periodIndex + offset;
      if (targetIndex >= depreciation.length) {
        break;
      }
      depreciation[targetIndex] += value / safeLife;
    }
  });

  return depreciation;
}

export function buildNetAssetSeries(capex: number[], depreciation: number[]) {
  let cumulativeCapex = 0;
  let cumulativeDepreciation = 0;

  return capex.map((value, index) => {
    cumulativeCapex += value;
    cumulativeDepreciation += depreciation[index] ?? 0;
    return cumulativeCapex - cumulativeDepreciation;
  });
}

export function deriveSeriesDelta(current: number[], previous: number[]) {
  return current.map((value, index) => value - (previous[index] ?? 0));
}

export function toPercentSeries(values: number[]) {
  return values.map((value) => value * 100);
}

export function buildStatement(
  sheet: string,
  periods: string[],
  rows: RowSeries[],
): PeriodizedStatement {
  return {
    sheet: sheet as PeriodizedStatement['sheet'],
    periods,
    rows: rows.map((row) => ({
      key: row.key,
      label: row.label,
      unit: row.unit,
      cells: periods.map((_period, index) => `${String.fromCharCode(67 + index)}${index + 3}`),
      values: row.values,
    })),
  };
}

export function getAssumption(values: Record<string, number>, key: string) {
  return values[key] ?? 0;
}
