import { getBaseAssumptionBundle } from '../../../model/assumptions';
import { normalizeA2FleetAssumptions } from '../normalizeAssumptions';

describe('a2 fleet assumption normalization', () => {
  it('maps stable assumption keys into workbook input cells', () => {
    const baseValues = getBaseAssumptionBundle().baseValues;
    const normalized = normalizeA2FleetAssumptions(baseValues);

    expect(normalized.workbookInputBySheet.ASSUMPTIONS_DATA?.D3).toBe(714);
    expect(normalized.workbookInputBySheet.ASSUMPTIONS_DATA?.C8).toBe(70000);
    expect(normalized.workbookInputBySheet.ASSUMPTIONS_DATA?.C31).toBe(7000);
  });

  it('keeps integrated placeholders out of workbook-backed input cells', () => {
    const baseValues = getBaseAssumptionBundle().baseValues;
    const normalized = normalizeA2FleetAssumptions(baseValues);

    expect(
      normalized.workbookInputByKey['ASSUMPTIONS_DATA!integrated.global.discount_rate_pct'],
    ).toBeUndefined();
    expect(normalized.ignoredKeys).toContain('integrated.global.discount_rate_pct');
  });
});
