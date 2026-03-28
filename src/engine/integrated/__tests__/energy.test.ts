import { getBaseAssumptionBundle } from '../../../model/assumptions';
import { runA2FleetWorkbook } from '../../a2Fleet';
import { calculateEnergyModule } from '../energy';
import { calculatePlatformModule } from '../platform';

function getRowValue(
  rows: Array<{ key: string; values: number[] }>,
  key: string,
  index: number,
) {
  return rows.find((row) => row.key === key)?.values[index] ?? 0;
}

describe('integrated energy module', () => {
  it('sizes batteries and provisions from fleet and platform demand', () => {
    const assumptions = getBaseAssumptionBundle().baseValues;
    const fleet = runA2FleetWorkbook(assumptions);
    const platform = calculatePlatformModule({
      assumptions,
      fleet,
      serviceFactor: 1,
    });
    const energy = calculateEnergyModule({
      assumptions,
      fleet,
      platform: {
        periods: platform.periods,
        swapDemand: platform.derived.swapDemand,
        requiredSites: platform.derived.requiredSites,
        chargersRequired: platform.derived.chargersRequired,
        externalRevenue: platform.derived.externalRevenue,
      },
      serviceFactor: 1,
    });

    const trucks2027 =
      fleet.derivedAssumptions.rows.find((row) => row.key === 'trucks_in_operation')
        ?.values[0] ?? 0;
    const packsPerTruck = assumptions['integrated.energy.battery_packs_per_truck'];
    const spareBuffer =
      assumptions['integrated.energy.spare_battery_buffer_pct'] / 100;
    const provisionRate = assumptions['integrated.energy.provision_rate_pct'] / 100;

    const expectedRequired = trucks2027 * packsPerTruck * (1 + spareBuffer);
    const expectedProvisioned = expectedRequired * provisionRate;

    expect(
      getRowValue(energy.operations.rows, 'battery_packs_required', 1),
    ).toBeCloseTo(expectedRequired, 6);
    expect(
      getRowValue(energy.operations.rows, 'battery_packs_provisioned', 1),
    ).toBeCloseTo(expectedProvisioned, 6);
    expect(getRowValue(energy.operations.rows, 'battery_replacements', 1)).toBeGreaterThan(0);
    expect(energy.returnsSummary.returnsMetrics.projectIrr.status).toBe('ready');
    expect(energy.returnsSummary.returnsMetrics.equityIrr.status).toBe('pending');
    expect(energy.returnsSummary.terminalValuePolicy?.method).toBe('netAssets');
  });

  it('supports manual replacement overrides', () => {
    const assumptions = getBaseAssumptionBundle().baseValues;
    const fleet = runA2FleetWorkbook(assumptions);
    const platform = calculatePlatformModule({
      assumptions,
      fleet,
      serviceFactor: 0.94,
    });
    const energy = calculateEnergyModule({
      assumptions,
      fleet,
      platform: {
        periods: platform.periods,
        swapDemand: platform.derived.swapDemand,
        requiredSites: platform.derived.requiredSites,
        chargersRequired: platform.derived.chargersRequired,
        externalRevenue: platform.derived.externalRevenue,
      },
      serviceFactor: 0.94,
      replacementRateOverride: 0.12,
    });

    const lastIndex = energy.periods.length - 1;

    expect(
      getRowValue(energy.operations.rows, 'replacement_rate', lastIndex),
    ).toBeCloseTo(0.12, 6);
    expect(
      getRowValue(energy.operations.rows, 'battery_replacements', lastIndex),
    ).toBeCloseTo(
      getRowValue(energy.operations.rows, 'battery_packs_required', lastIndex) * 0.12,
      6,
    );
  });
});
