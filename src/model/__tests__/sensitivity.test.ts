import { getBaseAssumptionBundle } from '../assumptions';
import { kpiTargetDefinitions } from '../analysisTargets';
import {
  calculateOneWaySensitivity,
  calculateTornadoSensitivity,
  calculateTwoWaySensitivity,
} from '../sensitivity';

describe('sensitivity calculations', () => {
  it('runs one-way sensitivity and responds directionally to revenue drivers', () => {
    const baseValues = getBaseAssumptionBundle().baseValues;
    const target = kpiTargetDefinitions.find((item) => item.id === 'platform_revenue');

    expect(target).toBeDefined();

    const result = calculateOneWaySensitivity({
      baseValues,
      variableKey: 'integrated.platform.fee_per_swap_usd',
      target: target!,
      shocks: [-10, 0, 10],
    });

    expect(result.points).toHaveLength(3);
    expect(result.points[2]?.kpiValue ?? 0).toBeGreaterThan(result.points[0]?.kpiValue ?? 0);
  });

  it('builds two-way matrices and tornado rankings', () => {
    const baseValues = getBaseAssumptionBundle().baseValues;
    const target = kpiTargetDefinitions.find((item) => item.id === 'platform_revenue');

    expect(target).toBeDefined();

    const matrix = calculateTwoWaySensitivity({
      baseValues,
      xKey: 'integrated.platform.fee_per_swap_usd',
      yKey: 'integrated.platform.subscription_per_truck_per_month_usd',
      target: target!,
      shocks: [-15, 0, 15],
    });
    const tornado = calculateTornadoSensitivity({
      baseValues,
      variableKeys: [
        'integrated.platform.fee_per_swap_usd',
        'integrated.platform.subscription_per_truck_per_month_usd',
        'integrated.energy.pack_cost_usd',
      ],
      target: target!,
      shockPct: 10,
    });

    expect(matrix).toHaveLength(3);
    expect(matrix[0]).toHaveLength(3);
    expect(tornado).toHaveLength(3);
    expect(tornado[0]!.maxAbsDelta).toBeGreaterThanOrEqual(tornado[1]!.maxAbsDelta);
  });
});
