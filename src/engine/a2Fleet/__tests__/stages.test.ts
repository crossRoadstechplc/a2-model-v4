import { getBaseAssumptionBundle } from '../../../model/assumptions';
import {
  buildDerivedAssumptions,
  calculateBalanceSheet,
  calculateCapexDepreciation,
  calculateCashFlow,
  calculateIncomeStatement,
  calculateKeyMetrics,
  calculateRevenueProjection,
  calculateSourceUseOfFunds,
  calculateValuationSummary,
  normalizeAssumptions,
  runA2FleetWorkbook,
} from '../stages';

function getRowValue(
  rows: Array<{ key: string; values: number[] }>,
  key: string,
  index: number,
) {
  const row = rows.find((item) => item.key === key);
  return row?.values[index] ?? 0;
}

describe('a2 fleet workbook stages', () => {
  it('runs the staged workbook pipeline in order', () => {
    const baseValues = getBaseAssumptionBundle().baseValues;
    const normalized = normalizeAssumptions(baseValues);
    const derived = buildDerivedAssumptions(normalized);
    const revenue = calculateRevenueProjection(derived.context);
    const capex = calculateCapexDepreciation(revenue.context);
    const sourceUse = calculateSourceUseOfFunds(capex.context);
    const income = calculateIncomeStatement(sourceUse.context);
    const cash = calculateCashFlow(income.context);
    const balance = calculateBalanceSheet(cash.context);
    const valuation = calculateValuationSummary(balance.context);
    const metrics = calculateKeyMetrics(valuation.context);

    expect(derived.statement.sheet).toBe('ASSUMPTIONS_DATA');
    expect(revenue.statement.sheet).toBe('REVENUE PROJECTION');
    expect(capex.statement.sheet).toBe('CAPEX & DEPRECIATION');
    expect(sourceUse.statement.sheet).toBe('SOURCE_USE OF FUNDS');
    expect(income.statement.sheet).toBe('INCOME STATEMENT ');
    expect(cash.statement.sheet).toBe('CASH FLOW');
    expect(balance.statement.sheet).toBe('BALANCE SHEET');
    expect(valuation.statement.sheet).toBe('VALUATION SUMMARY');
    expect(metrics.statement.sheet).toBe('KEY METRICS');
  });

  it('matches the workbook baseline targets within tolerance', () => {
    const output = runA2FleetWorkbook(getBaseAssumptionBundle().baseValues);

    expect(output.baselineComparison.every((item) => item.withinTolerance)).toBe(true);
  });

  it('calculates cumulative return metrics outside the statement row model', () => {
    const output = runA2FleetWorkbook(getBaseAssumptionBundle().baseValues);
    const equityIrr = output.returnsSummary.returnsMetrics.equityIrr;
    const projectIrr = output.returnsSummary.returnsMetrics.projectIrr;

    expect(output.incomeStatement.rows.find((row) => row.key === 'irr')).toBeUndefined();
    expect(output.valuationSummary.rows.find((row) => row.key === 'irr')).toBeUndefined();
    expect(output.returnsSummary.cashFlowSeries?.[0]).toBeLessThan(0);
    expect(
      output.returnsSummary.seriesDefinitions.some((item) => item.type === 'workbookParity'),
    ).toBe(true);
    expect(equityIrr?.status).toBe('ready');
    expect(equityIrr?.value).not.toBeNull();
    expect(equityIrr?.value).toBeCloseTo(16.5670780707392, 8);
    expect(projectIrr?.status).toBe('ready');
  });

  it('cascades assumption changes through fleet, revenue, and valuation outputs', () => {
    const baseValues = getBaseAssumptionBundle().baseValues;
    const output = runA2FleetWorkbook({
      ...baseValues,
      'a2_fleet.number_of_trucks.cy_2027': 800,
    });

    expect(getRowValue(output.derivedAssumptions.rows, 'trucks_in_operation', 0)).toBe(800);
    expect(getRowValue(output.derivedAssumptions.rows, 'trucks_in_operation', 1)).toBe(1514);
    expect(getRowValue(output.revenueProjection.rows, 'revenue_from_freight_charges', 0)).toBeGreaterThan(
      34_893_870.9677419,
    );
    expect(getRowValue(output.valuationSummary.rows, 'investor_25_stake_value', 5)).toBeGreaterThan(
      0,
    );
  });

  it('remains pure and deterministic for identical inputs', () => {
    const baseValues = getBaseAssumptionBundle().baseValues;
    const frozenInput = Object.freeze({ ...baseValues });

    const first = runA2FleetWorkbook(frozenInput);
    const second = runA2FleetWorkbook(frozenInput);

    expect(first).toEqual(second);
    expect(frozenInput['a2_fleet.number_of_trucks.cy_2027']).toBe(714);
  });

  it('preserves the retained earnings plug quirk on the balance sheet', () => {
    const output = runA2FleetWorkbook(getBaseAssumptionBundle().baseValues);
    const lastIndex = output.balanceSheet.periods.length - 1;
    const totalAssets = getRowValue(output.balanceSheet.rows, 'total_assets', lastIndex);
    const equity = getRowValue(output.balanceSheet.rows, 'equity', lastIndex);
    const retainedEarnings = getRowValue(
      output.balanceSheet.rows,
      'retained_earnings',
      lastIndex,
    );

    expect(retainedEarnings).toBeCloseTo(totalAssets - equity, 6);
  });
});
