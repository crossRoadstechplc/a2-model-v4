import type {
  A2FleetOutputCard,
  A2FleetWorkbookOutput,
  PeriodizedStatement,
} from '../../engine/a2Fleet';
import { hasMeaningfulChange, type DisplayFormat } from './formatters';

export type DashboardKpi = {
  id: string;
  label: string;
  value: number;
  description: string;
  format: DisplayFormat;
};

export type TrendSeries = {
  id: string;
  label: string;
  values: number[];
  colorClassName: string;
  format: DisplayFormat;
};

export type IntegrityMessage = {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning';
};

export function getStatementRow(statement: PeriodizedStatement, key: string) {
  return statement.rows.find((row) => row.key === key);
}

export function getStatementValue(
  statement: PeriodizedStatement,
  key: string,
  periodIndex: number,
) {
  return getStatementRow(statement, key)?.values[periodIndex] ?? 0;
}

export function getLastStatementValue(statement: PeriodizedStatement, key: string) {
  return getStatementValue(statement, key, statement.periods.length - 1);
}

export function getSeries(statement: PeriodizedStatement, key: string) {
  return getStatementRow(statement, key)?.values ?? [];
}

export function buildExecutiveKpis(results: A2FleetOutputCard[] | null) {
  return (
    results?.map<DashboardKpi>((item) => ({
      id: item.id,
      label: item.label,
      value: item.value,
      description: item.description,
      format: item.format,
    })) ?? []
  );
}

export function buildFleetOverviewKpis(output: A2FleetWorkbookOutput): DashboardKpi[] {
  const derivedPeriod = output.derivedAssumptions.periods[
    output.derivedAssumptions.periods.length - 1
  ];
  const incomePeriod =
    output.incomeStatement.periods[output.incomeStatement.periods.length - 1];
  const cashPeriod = output.cashFlow.periods[output.cashFlow.periods.length - 1];
  const valuationPeriod =
    output.valuationSummary.periods[output.valuationSummary.periods.length - 1];

  return [
    {
      id: 'trucks_in_operation',
      label: 'Trucks in Operation',
      value: getLastStatementValue(output.derivedAssumptions, 'trucks_in_operation'),
      description: `Operating fleet in ${derivedPeriod}.`,
      format: 'integer',
    },
    {
      id: 'chargeable_tonnes',
      label: 'Chargeable Tonnes',
      value: getLastStatementValue(output.derivedAssumptions, 'chargeable_tonnes'),
      description: `Fleet throughput in ${derivedPeriod}.`,
      format: 'number',
    },
    {
      id: 'revenue',
      label: 'Revenue',
      value: getLastStatementValue(output.incomeStatement, 'revenue') / 1_000_000,
      description: `Income statement revenue in ${incomePeriod}.`,
      format: 'currencyM',
    },
    {
      id: 'ebitda',
      label: 'EBITDA',
      value: getLastStatementValue(output.incomeStatement, 'ebitda') / 1_000_000,
      description: `Operating earnings in ${incomePeriod}.`,
      format: 'currencyM',
    },
    {
      id: 'closing_cash',
      label: 'Closing Cash',
      value: getLastStatementValue(output.cashFlow, 'closing_cash') / 1_000_000,
      description: `Ending liquidity in ${cashPeriod}.`,
      format: 'currencyM',
    },
    {
      id: 'investor_25_stake_value',
      label: 'Investor 25% Stake Value',
      value:
        getLastStatementValue(output.valuationSummary, 'investor_25_stake_value') /
        1_000_000,
      description: `Investor value snapshot in ${valuationPeriod}.`,
      format: 'currencyM',
    },
  ];
}

export function buildFleetMetricKpis(output: A2FleetWorkbookOutput): DashboardKpi[] {
  const metricsPeriod = output.keyMetrics.periods[output.keyMetrics.periods.length - 1];
  const balancePeriod =
    output.balanceSheet.periods[output.balanceSheet.periods.length - 1];

  return [
    {
      id: 'ebitda_margin',
      label: 'EBITDA Margin',
      value: getLastStatementValue(output.keyMetrics, 'ebitda_margin') * 100,
      description: `Margin in ${metricsPeriod}.`,
      format: 'percent',
    },
    {
      id: 'net_margin',
      label: 'Net Margin',
      value: getLastStatementValue(output.keyMetrics, 'net_margin') * 100,
      description: `Net margin in ${metricsPeriod}.`,
      format: 'percent',
    },
    {
      id: 'roe',
      label: 'ROE',
      value: getLastStatementValue(output.keyMetrics, 'roe') * 100,
      description: `Return on equity in ${metricsPeriod}.`,
      format: 'percent',
    },
    {
      id: 'total_assets',
      label: 'Total Assets',
      value: getLastStatementValue(output.balanceSheet, 'total_assets') / 1_000_000,
      description: `Balance sheet scale in ${balancePeriod}.`,
      format: 'currencyM',
    },
  ];
}

export function buildRevenueAndEbitdaSeries(output: A2FleetWorkbookOutput): TrendSeries[] {
  return [
    {
      id: 'revenue',
      label: 'Revenue',
      values: getSeries(output.incomeStatement, 'revenue').map((value) => value / 1_000_000),
      colorClassName: 'text-app-accent',
      format: 'currencyM',
    },
    {
      id: 'ebitda',
      label: 'EBITDA',
      values: getSeries(output.incomeStatement, 'ebitda').map((value) => value / 1_000_000),
      colorClassName: 'text-app-success',
      format: 'currencyM',
    },
  ];
}

export function buildCashSeries(output: A2FleetWorkbookOutput): TrendSeries[] {
  return [
    {
      id: 'closing_cash',
      label: 'Closing Cash',
      values: getSeries(output.cashFlow, 'closing_cash').map((value) => value / 1_000_000),
      colorClassName: 'text-app-warning',
      format: 'currencyM',
    },
  ];
}

export function buildOperationsSeries(output: A2FleetWorkbookOutput): TrendSeries[] {
  return [
    {
      id: 'trucks_in_operation',
      label: 'Trucks in Operation',
      values: getSeries(output.derivedAssumptions, 'trucks_in_operation'),
      colorClassName: 'text-app-accent',
      format: 'integer',
    },
    {
      id: 'chargeable_tonnes',
      label: 'Chargeable Tonnes',
      values: getSeries(output.derivedAssumptions, 'chargeable_tonnes'),
      colorClassName: 'text-app-success',
      format: 'number',
    },
  ];
}

export function buildEnergyCostSeries(output: A2FleetWorkbookOutput): TrendSeries[] {
  return [
    {
      id: 'energy_cost',
      label: 'Energy Cost',
      values: getSeries(output.derivedAssumptions, 'energy_cost').map((value) => value / 1_000_000),
      colorClassName: 'text-app-warning',
      format: 'currencyM',
    },
  ];
}

export function buildIntegrityMessages(output: A2FleetWorkbookOutput): IntegrityMessage[] {
  const messages: IntegrityMessage[] = [];
  const failedBaselineTargets = output.baselineComparison.filter(
    (item) => !item.withinTolerance,
  );
  const closingCashRow = getStatementRow(output.cashFlow, 'closing_cash');
  const netMarginRow = getStatementRow(output.keyMetrics, 'net_margin');
  const revenueRow = getStatementRow(output.incomeStatement, 'revenue');
  const energyRow = getStatementRow(output.incomeStatement, 'battery_charge');
  const assetsRow = getStatementRow(output.balanceSheet, 'total_assets');
  const equityRow = getStatementRow(output.balanceSheet, 'total_equity');

  if (failedBaselineTargets.length > 0) {
    messages.push({
      id: 'baseline-tolerance',
      title: 'Workbook parity outside tolerance',
      message: `${failedBaselineTargets.length} baseline targets drifted outside the configured replication tolerance.`,
      severity: 'warning',
    });
  } else {
    messages.push({
      id: 'baseline-parity',
      title: 'Workbook baseline validated',
      message: 'Current baseline targets are within the configured workbook replication tolerance.',
      severity: 'info',
    });
  }

  if (closingCashRow?.values.some((value) => value < 0)) {
    messages.push({
      id: 'negative-cash',
      title: 'Liquidity shortfall',
      message: 'Closing cash drops below zero in at least one forecast year.',
      severity: 'warning',
    });
  }

  if (netMarginRow?.values.some((value) => value < 0)) {
    messages.push({
      id: 'negative-margin',
      title: 'Negative net margin',
      message: 'Net income turns negative in at least one projected year.',
      severity: 'warning',
    });
  }

  if (
    revenueRow &&
    energyRow &&
    energyRow.values.some((value, index) => value > revenueRow.values[index] * 0.7)
  ) {
    messages.push({
      id: 'energy-burden',
      title: 'High energy cost burden',
      message: 'Battery charging expense exceeds 70% of revenue in at least one year.',
      severity: 'warning',
    });
  }

  if (
    assetsRow &&
    equityRow &&
    assetsRow.values.some((value, index) =>
      hasMeaningfulChange(value, equityRow.values[index]),
    )
  ) {
    messages.push({
      id: 'balance-sheet-plug',
      title: 'Balance sheet uses a plug',
      message: 'Retained earnings absorb the gap between total assets and equity, matching workbook behavior.',
      severity: 'info',
    });
  }

  return messages;
}
