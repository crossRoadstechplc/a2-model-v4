import type { ScenarioPayload } from './schemas';
import type { AssumptionValueMap } from './assumptions';
import {
  evaluateModelSet,
  getKpiTargetValue,
  type KpiTargetDefinition,
} from './analysisTargets';

export type ScenarioComparisonMetric = {
  id: string;
  label: string;
  format: KpiTargetDefinition['format'];
  valuesByScenarioId: Record<string, number>;
  weightedValue: number;
};

export type ScenarioComparisonEntry = {
  id: string;
  name: string;
  probability: number;
  assumptionValues: AssumptionValueMap;
};

export type ScenarioComparisonResult = {
  scenarios: ScenarioComparisonEntry[];
  metrics: ScenarioComparisonMetric[];
  totalProbability: number;
};

export function buildScenarioComparison(params: {
  scenarios: ScenarioPayload[];
  targets: KpiTargetDefinition[];
}) {
  const evaluated = params.scenarios.map((scenario) => {
    const outputs = evaluateModelSet(scenario.assumptionValues);
    return {
      scenario,
      outputs,
    };
  });
  const totalProbability = params.scenarios.reduce(
    (total, scenario) => total + scenario.probability,
    0,
  );

  return {
    scenarios: params.scenarios.map((scenario) => ({
      id: scenario.id,
      name: scenario.name,
      probability: scenario.probability,
      assumptionValues: scenario.assumptionValues,
    })),
    metrics: params.targets.map((target) => {
      const valuesByScenarioId = Object.fromEntries(
        evaluated.map((entry) => [
          entry.scenario.id,
          getKpiTargetValue(target.id, entry.outputs),
        ]),
      ) as Record<string, number>;
      const weightedValue = evaluated.reduce((total, entry) => {
        const value = valuesByScenarioId[entry.scenario.id] ?? 0;
        return total + value * (entry.scenario.probability / 100);
      }, 0);

      return {
        id: target.id,
        label: target.label,
        format: target.format,
        valuesByScenarioId,
        weightedValue,
      };
    }),
    totalProbability,
  } satisfies ScenarioComparisonResult;
}
