import {
  getAssumptionGroup,
  type AssumptionGroupId,
  type AssumptionMetadata,
} from './assumptions';

export type CalculationToast = {
  id: string;
  title: string;
  message: string;
  impactedAreas: string[];
  groupLabels: string[];
  kind: 'initial' | 'recalculation';
  createdAt: number;
};

const areaMapByGroup = {
  global: [
    'Executive Summary',
    'A2 Fleet',
    'A2 Platform',
    'A2 Energy',
    'Consolidated / Corridor View',
  ],
  fleet: [
    'Executive Summary',
    'A2 Fleet',
    'A2 Platform',
    'A2 Energy',
    'Consolidated / Corridor View',
    'Integrity Checks',
  ],
  platform: ['A2 Platform', 'Consolidated / Corridor View', 'Integrity Checks'],
  energy: ['A2 Energy', 'Consolidated / Corridor View', 'Integrity Checks'],
  financing: ['A2 Fleet', 'Consolidated / Corridor View', 'Save / Export'],
  tax_fx: ['Executive Summary', 'Consolidated / Corridor View', 'Documentation'],
  timing: ['A2 Fleet', 'A2 Platform', 'A2 Energy', 'Consolidated / Corridor View'],
  overrides: ['Visible analytical outputs', 'Integrity Checks', 'Sensitivity views'],
} as const;

function uniq<T extends string>(values: T[]) {
  return Array.from(new Set(values));
}

type CalculationImpactSummary = {
  kind: 'initial' | 'recalculation';
  groupLabels: string[];
  impactedAreas: string[];
};

export function getCalculationImpactSummary(params: {
  changedKeys: string[];
  metadataByKey: Record<string, AssumptionMetadata>;
  hasSuccessfulCalculation: boolean;
}): CalculationImpactSummary {
  const changedGroups = uniq(
    params.changedKeys
      .map((key) => params.metadataByKey[key]?.groupId)
      .filter((value): value is AssumptionGroupId => Boolean(value)),
  );

  const groupLabels = changedGroups.map(
    (groupId) => getAssumptionGroup(groupId)?.title ?? groupId,
  );
  const impactedAreas = uniq(
    changedGroups.flatMap((groupId) => areaMapByGroup[groupId]),
  );

  if (!params.hasSuccessfulCalculation || impactedAreas.length === 0) {
    return {
      kind: params.hasSuccessfulCalculation ? 'recalculation' : 'initial',
      groupLabels:
        groupLabels.length > 0 ? groupLabels : ['Base assumptions'],
      impactedAreas:
        impactedAreas.length > 0
          ? impactedAreas
          : [
              'Executive Summary',
              'A2 Fleet',
              'A2 Platform',
              'A2 Energy',
              'Consolidated / Corridor View',
            ],
    };
  }

  return {
    kind: 'recalculation' as const,
    groupLabels,
    impactedAreas,
  };
}

export function buildCalculationToast(params: {
  id: string;
  changedKeys: string[];
  metadataByKey: Record<string, AssumptionMetadata>;
  hasSuccessfulCalculation: boolean;
}): CalculationToast {
  const impact = getCalculationImpactSummary(params);

  return {
    id: params.id,
    kind: impact.kind,
    createdAt: Date.now(),
    title:
      impact.kind === 'initial'
        ? 'Initial calculation started'
        : 'Recalculation started',
    message:
      impact.kind === 'initial'
        ? 'The model is building the first workbook-backed and integrated output set for exploration.'
        : `Changes in ${impact.groupLabels.join(', ')} are propagating through dependent outputs.`,
    impactedAreas: impact.impactedAreas,
    groupLabels: impact.groupLabels,
  };
}
