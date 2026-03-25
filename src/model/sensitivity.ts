import type { AssumptionValueMap } from './assumptions';
import {
  evaluateModelSet,
  getKpiTargetValue,
  type KpiTargetDefinition,
} from './analysisTargets';

export type SensitivityPoint = {
  shockPct: number;
  value: number;
  kpiValue: number;
};

export type OneWaySensitivityResult = {
  variableKey: string;
  targetId: string;
  baseValue: number;
  baseKpiValue: number;
  points: SensitivityPoint[];
};

export type TwoWaySensitivityCell = {
  xShockPct: number;
  yShockPct: number;
  value: number;
};

export type TornadoBar = {
  variableKey: string;
  lowValue: number;
  highValue: number;
  lowDelta: number;
  highDelta: number;
  maxAbsDelta: number;
};

function applyShock(baseValue: number, shockPct: number) {
  return baseValue * (1 + shockPct / 100);
}

export function calculateOneWaySensitivity(params: {
  baseValues: AssumptionValueMap;
  variableKey: string;
  target: KpiTargetDefinition;
  shocks: number[];
}): OneWaySensitivityResult {
  const baseOutputs = evaluateModelSet(params.baseValues);
  const baseValue = params.baseValues[params.variableKey] ?? 0;
  const baseKpiValue = getKpiTargetValue(params.target.id, baseOutputs);
  const points = params.shocks.map((shockPct) => {
    const nextValues = {
      ...params.baseValues,
      [params.variableKey]: applyShock(baseValue, shockPct),
    };
    const outputs = evaluateModelSet(nextValues);

    return {
      shockPct,
      value: nextValues[params.variableKey],
      kpiValue: getKpiTargetValue(params.target.id, outputs),
    };
  });

  return {
    variableKey: params.variableKey,
    targetId: params.target.id,
    baseValue,
    baseKpiValue,
    points,
  };
}

export function calculateTwoWaySensitivity(params: {
  baseValues: AssumptionValueMap;
  xKey: string;
  yKey: string;
  target: KpiTargetDefinition;
  shocks: number[];
}) {
  const xBase = params.baseValues[params.xKey] ?? 0;
  const yBase = params.baseValues[params.yKey] ?? 0;

  return params.shocks.map((yShockPct) =>
    params.shocks.map((xShockPct) => {
      const nextValues = {
        ...params.baseValues,
        [params.xKey]: applyShock(xBase, xShockPct),
        [params.yKey]: applyShock(yBase, yShockPct),
      };
      const outputs = evaluateModelSet(nextValues);

      return {
        xShockPct,
        yShockPct,
        value: getKpiTargetValue(params.target.id, outputs),
      } satisfies TwoWaySensitivityCell;
    }),
  );
}

export function calculateTornadoSensitivity(params: {
  baseValues: AssumptionValueMap;
  variableKeys: string[];
  target: KpiTargetDefinition;
  shockPct: number;
}) {
  const baseOutputs = evaluateModelSet(params.baseValues);
  const baseValue = getKpiTargetValue(params.target.id, baseOutputs);

  return params.variableKeys
    .map((variableKey) => {
      const current = params.baseValues[variableKey] ?? 0;
      const lowOutputs = evaluateModelSet({
        ...params.baseValues,
        [variableKey]: applyShock(current, -params.shockPct),
      });
      const highOutputs = evaluateModelSet({
        ...params.baseValues,
        [variableKey]: applyShock(current, params.shockPct),
      });
      const lowValue = getKpiTargetValue(params.target.id, lowOutputs);
      const highValue = getKpiTargetValue(params.target.id, highOutputs);

      return {
        variableKey,
        lowValue,
        highValue,
        lowDelta: lowValue - baseValue,
        highDelta: highValue - baseValue,
        maxAbsDelta: Math.max(
          Math.abs(lowValue - baseValue),
          Math.abs(highValue - baseValue),
        ),
      } satisfies TornadoBar;
    })
    .sort((left, right) => right.maxAbsDelta - left.maxAbsDelta);
}
