import type { AssumptionMetadata, AssumptionValueMap } from './assumptions';
import { formatAssumptionValue } from './assumptions';
import type { DisplayCurrency } from './displayCurrency';
import {
  evaluateModelSet,
  getKpiTargetValue,
  kpiTargetDefinitions,
  kpiTargetMap,
} from './analysisTargets';

export function buildKpiExplanation(kpiId: string | null) {
  if (!kpiId) {
    return null;
  }

  const definition = kpiTargetMap.get(kpiId);
  if (!definition) {
    return null;
  }

  return definition;
}

export function buildFormulaTrace(kpiId: string | null) {
  const definition = kpiId ? kpiTargetMap.get(kpiId) : undefined;
  return definition?.trace ?? [];
}

export function buildAssumptionDependencySummary(
  metadataByKey: Record<string, AssumptionMetadata>,
  assumptionKey: string | null,
) {
  if (!assumptionKey) {
    return null;
  }

  const metadata = metadataByKey[assumptionKey];
  if (!metadata) {
    return null;
  }

  return {
    label: metadata.label,
    groupId: metadata.groupId,
    dependencyTag: metadata.dependencyTag ?? 'Unspecified',
    helperText: metadata.helperText ?? 'No helper text has been recorded for this assumption yet.',
    unit: metadata.unit,
  };
}

export function buildSelectedAssumptionImpact(params: {
  assumptionKey: string | null;
  selectedKpiId: string | null;
  metadataByKey: Record<string, AssumptionMetadata>;
  currentValues: AssumptionValueMap;
  baseValues: AssumptionValueMap;
  displayCurrency?: DisplayCurrency;
  fxRate?: number;
}) {
  if (!params.assumptionKey) {
    return null;
  }

  const metadata = params.metadataByKey[params.assumptionKey];
  if (!metadata) {
    return null;
  }

  const target =
    kpiTargetDefinitions.find((item) => item.id === params.selectedKpiId) ??
    kpiTargetDefinitions[0];
  const currentValue = params.currentValues[params.assumptionKey];
  const baseValue = params.baseValues[params.assumptionKey];
  const shockPct = 10;
  const lowValues = {
    ...params.currentValues,
    [params.assumptionKey]: currentValue * (1 - shockPct / 100),
  };
  const highValues = {
    ...params.currentValues,
    [params.assumptionKey]: currentValue * (1 + shockPct / 100),
  };
  const currentOutputs = evaluateModelSet(params.currentValues);
  const lowOutputs = evaluateModelSet(lowValues);
  const highOutputs = evaluateModelSet(highValues);

  return {
    label: metadata.label,
    baseLabel: formatAssumptionValue(metadata, baseValue, {
      displayCurrency: params.displayCurrency,
      fxRate: params.fxRate,
    }),
    currentLabel: formatAssumptionValue(metadata, currentValue, {
      displayCurrency: params.displayCurrency,
      fxRate: params.fxRate,
    }),
    targetLabel: target.label,
    currentKpiValue: getKpiTargetValue(target.id, currentOutputs),
    lowKpiValue: getKpiTargetValue(target.id, lowOutputs),
    highKpiValue: getKpiTargetValue(target.id, highOutputs),
  };
}
