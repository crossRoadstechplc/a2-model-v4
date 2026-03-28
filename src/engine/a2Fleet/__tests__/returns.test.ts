import { getBaseAssumptionBundle } from '../../../model/assumptions';
import { calculateIrr } from '../../returns';
import { runA2FleetWorkbook } from '../stages';
import {
  buildFleetProjectCashFlowSeries,
  buildFleetWorkbookEquityIrrSeries,
  getFleetWorkbookEquityIrrValue,
} from '../returns';

describe('a2 fleet returns builders', () => {
  it('builds the literal workbook-equity IRR series from INCOME STATEMENT!C19:O19', () => {
    const output = runA2FleetWorkbook(getBaseAssumptionBundle().baseValues);
    const series = buildFleetWorkbookEquityIrrSeries(output.workbookValuesBySheet);

    expect(series[0]).toBeCloseTo(-61_480_000, 6);
    expect(series[series.length - 1]).toBeCloseTo(224_483_819.973694, 6);
    expect(series).toHaveLength(13);
  });

  it('matches the workbook IRR reference value within tolerance', () => {
    const output = runA2FleetWorkbook(getBaseAssumptionBundle().baseValues);
    const series = buildFleetWorkbookEquityIrrSeries(output.workbookValuesBySheet);
    const workbookIrr = getFleetWorkbookEquityIrrValue(output.workbookValuesBySheet);

    expect(workbookIrr).toBeCloseTo(0.165670780707392, 10);
    expect(calculateIrr(series)).toBeCloseTo(workbookIrr ?? 0, 10);
  });

  it('adds terminal enterprise value only in the final project cash flow period', () => {
    const output = runA2FleetWorkbook(getBaseAssumptionBundle().baseValues);
    const projectCashFlow = buildFleetProjectCashFlowSeries({
      incomeStatement: output.incomeStatement,
      cashFlow: output.cashFlow,
      valuationSummary: output.valuationSummary,
    });

    const beforeTerminal = projectCashFlow.series[projectCashFlow.series.length - 2];
    const withTerminal = projectCashFlow.series[projectCashFlow.series.length - 1];

    expect(projectCashFlow.terminalValuePolicy.method).toBe('enterpriseMultiple');
    expect(withTerminal).toBeGreaterThan(beforeTerminal);
  });
});
