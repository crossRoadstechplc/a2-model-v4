import { getBaseAssumptionBundle } from '../../../model/assumptions';
import { runA2FleetWorkbook } from '../../a2Fleet';
import { calculatePlatformModule } from '../platform';

function getRowValue(
  rows: Array<{ key: string; values: number[] }>,
  key: string,
  index: number,
) {
  return rows.find((row) => row.key === key)?.values[index] ?? 0;
}

describe('integrated platform module', () => {
  it('sizes throughput and infrastructure from fleet-linked demand', () => {
    const assumptions = getBaseAssumptionBundle().baseValues;
    const fleet = runA2FleetWorkbook(assumptions);
    const platform = calculatePlatformModule({
      assumptions,
      fleet,
      serviceFactor: 1,
    });

    const trucks2027 =
      fleet.derivedAssumptions.rows.find(
        (row) => row.key === 'number_of_trucks_cumalative',
      )
        ?.values[0] ?? 0;
    const swapsPerTruck =
      assumptions['a2_fleet.number_of_swaps_per_truck_per_day.quantity'];
    const uptime = assumptions['integrated.energy.network_uptime_pct'] / 100;
    const annualCapacity =
      assumptions['integrated.platform.annual_swaps_capacity_per_site'];
    const targetUtilization =
      assumptions['integrated.platform.target_site_utilization_pct'] / 100;
    const feePerSwap = assumptions['integrated.platform.fee_per_swap_usd'];
    const subscriptionPerTruckPerMonth =
      assumptions['integrated.platform.subscription_per_truck_per_month_usd'];

    const expectedSwapDemand =
      trucks2027 * swapsPerTruck * 303 * Math.min(1.05, Math.max(0.6, uptime));
    const expectedRequiredSites = Math.ceil(
      expectedSwapDemand /
        Math.max(annualCapacity * Math.max(targetUtilization, 0.25), 1),
    );
    const expectedInternalRevenue =
      expectedSwapDemand * feePerSwap + trucks2027 * subscriptionPerTruckPerMonth * 12;

    expect(getRowValue(platform.operations.rows, 'swap_demand', 1)).toBeCloseTo(
      expectedSwapDemand,
      6,
    );
    expect(getRowValue(platform.operations.rows, 'required_sites', 1)).toBe(
      expectedRequiredSites,
    );
    expect(
      getRowValue(platform.incomeStatement.rows, 'fleet_internal_revenue', 1),
    ).toBeCloseTo(expectedInternalRevenue, 6);
    expect(platform.capacity.byPeriod[1]?.truckCount).toBe(trucks2027);
    expect(platform.capacity.byPeriod[1]?.stations).toBe(7);
    expect(platform.capacity.byPeriod[1]?.totalSockets).toBeGreaterThan(0);
    expect(platform.capacity.byPeriod[1]?.maxDailySwaps).toBeGreaterThan(0);
    expect(platform.returnsSummary.returnsMetrics.projectIrr.status).toBe('ready');
    expect(platform.returnsSummary.returnsMetrics.equityIrr.status).toBe('pending');
    expect(platform.returnsSummary.terminalValuePolicy?.method).toBe('netAssets');
  });

  it('responds to service-factor changes and remains deterministic', () => {
    const assumptions = getBaseAssumptionBundle().baseValues;
    const fleet = runA2FleetWorkbook(assumptions);

    const lowerService = calculatePlatformModule({
      assumptions,
      fleet,
      serviceFactor: 0.82,
    });
    const higherService = calculatePlatformModule({
      assumptions,
      fleet,
      serviceFactor: 1,
    });
    const repeated = calculatePlatformModule({
      assumptions,
      fleet,
      serviceFactor: 1,
    });

    const lastIndex = higherService.periods.length - 1;

    expect(
      getRowValue(higherService.operations.rows, 'swap_demand', lastIndex),
    ).toBeGreaterThan(getRowValue(lowerService.operations.rows, 'swap_demand', lastIndex));
    expect(higherService).toEqual(repeated);
  });
});
