import {
  assumptionMetadata,
  type AssumptionMetadata,
  type AssumptionValueMap,
} from '../../model/assumptions';
import { assumptionsSchema } from '../../model/schemas';
import type { WorkbookSheetName } from './reference';

export type NormalizedAssumptions = {
  assumptionValues: AssumptionValueMap;
  workbookInputBySheet: Partial<Record<WorkbookSheetName, Record<string, number>>>;
  workbookInputByKey: Record<string, number>;
  referenceAssumptions: Array<{
    key: string;
    cell: string;
    sheet: WorkbookSheetName;
    value: number;
    metadata: AssumptionMetadata;
  }>;
  ignoredKeys: string[];
};

function isWorkbookBackedMetadata(
  metadata: AssumptionMetadata,
): metadata is AssumptionMetadata & {
  workbook: NonNullable<AssumptionMetadata['workbook']>;
} {
  return Boolean(metadata.workbook);
}

export function normalizeA2FleetAssumptions(
  assumptions: AssumptionValueMap,
): NormalizedAssumptions {
  const parsed = assumptionsSchema.parse(assumptions);
  const workbookInputBySheet: Partial<
    Record<WorkbookSheetName, Record<string, number>>
  > = {};
  const workbookInputByKey: Record<string, number> = {};
  const referenceAssumptions: NormalizedAssumptions['referenceAssumptions'] = [];
  const ignoredKeys: string[] = [];

  assumptionMetadata.forEach((metadata) => {
    const value = parsed[metadata.key];

    if (!isWorkbookBackedMetadata(metadata)) {
      ignoredKeys.push(metadata.key);
      return;
    }

    const sheet = metadata.workbook.sheet as WorkbookSheetName;
    const cell = metadata.workbook.cell;

    workbookInputBySheet[sheet] ??= {};
    workbookInputBySheet[sheet][cell] = value;
    workbookInputByKey[`${sheet}!${cell}`] = value;
    referenceAssumptions.push({
      key: metadata.key,
      cell,
      sheet,
      value,
      metadata,
    });
  });

  return {
    assumptionValues: parsed,
    workbookInputBySheet,
    workbookInputByKey,
    referenceAssumptions,
    ignoredKeys,
  };
}
