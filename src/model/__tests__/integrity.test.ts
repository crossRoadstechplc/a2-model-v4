import { getBaseAssumptionBundle } from '../assumptions';
import { runA2FleetWorkbook } from '../../engine/a2Fleet';
import { runIntegratedModel } from '../../engine/integrated';
import { buildIntegrityChecks, groupIntegrityChecks } from '../integrity';

describe('integrity check aggregation', () => {
  it('returns a critical state before any successful calculation', () => {
    const checks = buildIntegrityChecks({
      runState: 'empty',
      hasSuccessfulCalculation: false,
      workbook: null,
      integrated: null,
    });
    const grouped = groupIntegrityChecks(checks);

    expect(grouped.critical).toHaveLength(1);
    expect(grouped.critical[0]?.title).toMatch(/not yet calculated/i);
  });

  it('aggregates reconciliation, convergence, and elimination checks from real outputs', () => {
    const assumptions = getBaseAssumptionBundle().baseValues;
    const workbook = runA2FleetWorkbook(assumptions);
    const integrated = runIntegratedModel(assumptions, workbook);
    const checks = buildIntegrityChecks({
      runState: 'ready',
      hasSuccessfulCalculation: true,
      workbook,
      integrated,
    });
    const grouped = groupIntegrityChecks(checks);

    expect(checks.some((item) => item.category === 'convergence')).toBe(true);
    expect(checks.some((item) => item.category === 'elimination')).toBe(true);
    expect(checks.some((item) => item.category === 'capacity')).toBe(true);
    expect(grouped.critical).toHaveLength(0);
    expect(grouped.info.length + grouped.warning.length).toBeGreaterThan(0);
  });
});
