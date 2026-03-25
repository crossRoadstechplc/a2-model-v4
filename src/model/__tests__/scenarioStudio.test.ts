import { getBaseAssumptionBundle } from '../assumptions';
import { kpiTargetDefinitions } from '../analysisTargets';
import { buildScenarioComparison } from '../scenarioStudio';

describe('scenario comparison logic', () => {
  it('compares scenarios side by side and computes weighted KPI values', () => {
    const baseValues = getBaseAssumptionBundle().baseValues;
    const target = kpiTargetDefinitions.find((item) => item.id === 'platform_revenue');

    expect(target).toBeDefined();

    const comparison = buildScenarioComparison({
      scenarios: [
        {
          id: 'base',
          name: 'Base',
          probability: 60,
          assumptionValues: baseValues,
          createdAt: 1,
          updatedAt: 1,
          sourceScenarioId: null,
          isDirty: false,
          kind: 'base',
        },
        {
          id: 'upside',
          name: 'Upside',
          probability: 40,
          assumptionValues: {
            ...baseValues,
            'integrated.platform.fee_per_swap_usd': 40,
          },
          createdAt: 1,
          updatedAt: 1,
          sourceScenarioId: 'base',
          isDirty: false,
          kind: 'saved',
        },
      ],
      targets: [target!],
    });

    const metric = comparison.metrics[0];
    const baseValue = metric.valuesByScenarioId.base;
    const upsideValue = metric.valuesByScenarioId.upside;

    expect(comparison.totalProbability).toBe(100);
    expect(upsideValue).toBeGreaterThan(baseValue);
    expect(metric.weightedValue).toBeCloseTo(baseValue * 0.6 + upsideValue * 0.4, 6);
  });
});
