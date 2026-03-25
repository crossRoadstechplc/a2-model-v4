import type { A2FleetWorkbookOutput } from './stages';

export type A2FleetOutputCard = {
  id: string;
  label: string;
  value: number;
  format: 'currencyM' | 'percent' | 'multiple';
  description: string;
};

function getRowValue(
  rows: A2FleetWorkbookOutput['incomeStatement']['rows'],
  key: string,
  index: number,
) {
  const row = rows.find((item) => item.key === key);
  return row?.values[index] ?? 0;
}

export function buildA2FleetOutputCards(
  output: A2FleetWorkbookOutput,
): A2FleetOutputCard[] {
  const lastIncomeIndex = output.incomeStatement.periods.length - 1;
  const lastCashIndex = output.cashFlow.periods.length - 1;
  const lastBalanceIndex = output.balanceSheet.periods.length - 1;
  const lastMetricIndex = output.keyMetrics.periods.length - 1;
  const lastValuationIndex = output.valuationSummary.periods.length - 1;

  return [
    {
      id: 'investor_25_stake_value',
      label: 'Investor 25% Stake Value',
      value: getRowValue(
        output.valuationSummary.rows,
        'investor_25_stake_value',
        lastValuationIndex,
      ) / 1_000_000,
      format: 'currencyM',
      description: `Workbook replication output for ${output.valuationSummary.periods[lastValuationIndex]}.`,
    },
    {
      id: 'revenue_cy_2037',
      label: 'Revenue',
      value: getRowValue(output.incomeStatement.rows, 'revenue', lastIncomeIndex) / 1_000_000,
      format: 'currencyM',
      description: `Income statement revenue for ${output.incomeStatement.periods[lastIncomeIndex]}.`,
    },
    {
      id: 'ebitda_cy_2037',
      label: 'EBITDA',
      value: getRowValue(output.incomeStatement.rows, 'ebitda', lastIncomeIndex) / 1_000_000,
      format: 'currencyM',
      description: `Workbook EBITDA for ${output.incomeStatement.periods[lastIncomeIndex]}.`,
    },
    {
      id: 'ebitda_margin_cy_2037',
      label: 'EBITDA Margin',
      value: getRowValue(output.keyMetrics.rows, 'ebitda_margin', lastMetricIndex) * 100,
      format: 'percent',
      description: `Key metric margin for ${output.keyMetrics.periods[lastMetricIndex]}.`,
    },
    {
      id: 'closing_cash_cy_2037',
      label: 'Closing Cash',
      value: getRowValue(output.cashFlow.rows, 'closing_cash', lastCashIndex) / 1_000_000,
      format: 'currencyM',
      description: `Cash flow closing cash balance for ${output.cashFlow.periods[lastCashIndex]}.`,
    },
    {
      id: 'total_assets_cy_2037',
      label: 'Total Assets',
      value: getRowValue(output.balanceSheet.rows, 'total_assets', lastBalanceIndex) / 1_000_000,
      format: 'currencyM',
      description: `Balance sheet total assets for ${output.balanceSheet.periods[lastBalanceIndex]}.`,
    },
  ];
}
