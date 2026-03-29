import { getBaseAssumptionBundle } from '../../../model/assumptions';
import { migrateLegacyAssumptionValues } from '../../../model/referenceWorkbookInputs';
import { normalizeA2FleetAssumptions } from '../normalizeAssumptions';

describe('a2 fleet assumption normalization', () => {
  it('maps stable assumption keys into workbook input cells', () => {
    const baseValues = getBaseAssumptionBundle().baseValues;
    const normalized = normalizeA2FleetAssumptions(baseValues);

    expect(normalized.workbookInputBySheet.ASSUMPTIONS_DATA?.D5).toBe(714);
    expect(normalized.workbookInputBySheet.ASSUMPTIONS_DATA?.C28).toBe(70000);
    expect(normalized.workbookInputBySheet.ASSUMPTIONS_DATA?.C15).toBe(7);
    expect(normalized.workbookInputBySheet['POWER CALCULATIONS']?.C4).toBe(60000);
    expect(normalized.workbookInputBySheet['CAPEX & DEPRECIATION']?.C6).toBe(8);
    expect(normalized.workbookInputBySheet['VALUATION SUMMARY']?.C4).toBe(10);
  });

  it('keeps integrated placeholders out of workbook-backed input cells', () => {
    const baseValues = getBaseAssumptionBundle().baseValues;
    const normalized = normalizeA2FleetAssumptions(baseValues);

    expect(
      normalized.workbookInputByKey['ASSUMPTIONS_DATA!integrated.global.discount_rate_pct'],
    ).toBeUndefined();
    expect(normalized.ignoredKeys).toContain('integrated.global.discount_rate_pct');
  });

  it('migrates legacy workbook-backed aliases into canonical workbook keys', () => {
    const migrated = migrateLegacyAssumptionValues({
      'a2_fleet.average_kilometres_per_truck_per_year.quantity': 65000,
      'a2_fleet.cost_per_kw_of_energy.cy_2027': 8.25,
    });

    expect(migrated['a2_fleet.average_kilometres_per_truck_per_year.quantity']).toBeUndefined();
    expect(
      migrated['a2_fleet.power_calculations.average_kilometres_per_truck_per_year.quantity'],
    ).toBe(65000);
    expect(migrated['a2_fleet.cost_per_kw_of_energy.cy_2027']).toBeUndefined();
    expect(
      migrated['a2_fleet.power_calculations.purchase_rate_per_kw.quantity'],
    ).toBe(8.25);
  });
});
