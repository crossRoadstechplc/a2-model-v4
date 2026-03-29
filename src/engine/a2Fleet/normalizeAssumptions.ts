import {
  assumptionMetadata,
  type AssumptionMetadata,
  type AssumptionValueMap,
} from '../../model/assumptions';
import { migrateLegacyAssumptionValues } from '../../model/referenceWorkbookInputs';
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
    metadata: {
      key: string;
      workbook: {
        sheet: WorkbookSheetName;
        cell: string;
      };
    };
  }>;
  ignoredKeys: string[];
};

type WorkbookMappedAssumptionMetadata = AssumptionMetadata & {
  workbook: {
    sheet: WorkbookSheetName;
    cell: string;
    row: number;
    rowLabel: string;
    columnLabel: string;
  };
};

export function normalizeA2FleetAssumptions(
  assumptions: AssumptionValueMap,
): NormalizedAssumptions {
  const parsed = assumptionsSchema.parse(migrateLegacyAssumptionValues(assumptions));
  const workbookInputBySheet: Partial<
    Record<WorkbookSheetName, Record<string, number>>
  > = {};
  const workbookInputByKey: Record<string, number> = {};
  const referenceAssumptions: NormalizedAssumptions['referenceAssumptions'] = [];
  const handledKeys = new Set<string>();

  assumptionMetadata
    .filter(
      (
        metadata,
      ): metadata is WorkbookMappedAssumptionMetadata => Boolean(metadata.workbook),
    )
    .forEach((metadata) => {
      const value = parsed[metadata.key];

      workbookInputBySheet[metadata.workbook.sheet] ??= {};
      workbookInputBySheet[metadata.workbook.sheet]![metadata.workbook.cell] = value;
      workbookInputByKey[`${metadata.workbook.sheet}!${metadata.workbook.cell}`] = value;
      referenceAssumptions.push({
        key: metadata.key,
        cell: metadata.workbook.cell,
        sheet: metadata.workbook.sheet,
        value,
        metadata: {
          key: metadata.key,
          workbook: {
            sheet: metadata.workbook.sheet,
            cell: metadata.workbook.cell,
          },
        },
      });
      handledKeys.add(metadata.key);
    });

  const ignoredKeys = Object.keys(parsed).filter((key) => !handledKeys.has(key));

  return {
    assumptionValues: parsed,
    workbookInputBySheet,
    workbookInputByKey,
    referenceAssumptions,
    ignoredKeys,
  };
}
