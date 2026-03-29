import referenceJson from '../../Docs/A2_Charging_Platform_Model_Replication_Reference.json';
import referenceGuideText from '../../Docs/A2_Charging_Platform_Model_Replication_Reference.txt?raw';
import { runA2FleetWorkbook, type BaselineComparison } from '../engine/a2Fleet';
import {
  A2_FLEET_BASELINE_TOLERANCE,
  type WorkbookSheetName,
} from '../engine/a2Fleet/reference';
import { normalizeA2FleetAssumptions } from '../engine/a2Fleet/normalizeAssumptions';
import { getBaseAssumptionBundle, type AssumptionMetadata } from './assumptions';
import { referenceWorkbookInputCells } from './referenceWorkbookInputs';

type BaselineTargetSpec = {
  sheet: WorkbookSheetName;
  row: number;
  series: Record<string, number>;
};

type ValidationReferenceShape = {
  model_name: string;
  source_workbook: string;
  source_reference_markdown: string;
  known_quirks_and_audit_flags: string[];
  baseline_output_targets: Record<string, BaselineTargetSpec>;
};

export type VarianceTolerance = {
  absolute: number;
  relative: number;
};

export type ValidationGateStatus = 'pass' | 'caution' | 'fail';

export type ValidationArtifactSource = {
  id: 'workbook' | 'reference_json' | 'reference_txt' | 'reference_markdown';
  label: string;
  path: string;
  availability: 'available' | 'referenced' | 'missing';
  note?: string;
};

export type AssumptionReconciliationItem = {
  key: string | null;
  label: string;
  groupId: string | null;
  unit: string;
  sheet: string;
  cell: string;
  columnLabel: string;
  row: number;
  referenceValue: number;
  appValue: number | null;
  difference: number | null;
  status: 'matched' | 'missing_in_app' | 'missing_in_reference' | 'mismatched';
  note?: string;
};

export type AssumptionNormalizationTransform = {
  key: string;
  label: string;
  groupId: string;
  sheet: string;
  cell: string;
  referenceCellId: string;
  appValue: number;
  normalizedValue: number;
  valuePreserved: boolean;
  transformation: string;
};

export type OutputVariancePeriod = {
  period: string;
  expected: number;
  actual: number;
  absoluteVariance: number;
  relativeVariance: number;
  withinTolerance: boolean;
};

export type OutputReconciliationItem = {
  targetKey: string;
  targetLabel: string;
  sectionId: string;
  sectionTitle: string;
  sheet: WorkbookSheetName;
  row: number;
  periods: OutputVariancePeriod[];
  maxAbsoluteVariance: number;
  maxRelativeVariance: number;
  withinTolerance: boolean;
  varianceThreshold: VarianceTolerance;
  knownAnomalyRelated: boolean;
  relatedQuirks: string[];
};

export type ValidationReport = {
  generatedAt: string;
  guideTitle: string;
  gateStatus: ValidationGateStatus;
  fitToProceed: boolean;
  verdict: string;
  referenceSources: ValidationArtifactSource[];
  tolerances: {
    assumptions: number;
    outputs: VarianceTolerance;
  };
  assumptions: {
    totalReferenceInputs: number;
    totalWorkbookMappedInputs: number;
    matched: AssumptionReconciliationItem[];
    missingInApp: AssumptionReconciliationItem[];
    missingInReference: AssumptionReconciliationItem[];
    mismatched: AssumptionReconciliationItem[];
    transformed: AssumptionNormalizationTransform[];
    excludedNonWorkbookInputs: number;
  };
  outputs: {
    totalTargets: number;
    passedTargets: number;
    failedTargets: number;
    sections: OutputReconciliationItem[];
    unexpectedVariances: OutputReconciliationItem[];
    knownAnomalyVariances: OutputReconciliationItem[];
  };
  knownWorkbookQuirks: string[];
  notes: string[];
};

const referenceData = referenceJson as ValidationReferenceShape;

export const ASSUMPTION_RECONCILIATION_TOLERANCE = 0.000000001;

const SECTION_TITLES: Record<string, string> = {
  power_calculations: 'Power Calculations',
  revenue_projection: 'Revenue Projection',
  capex_depreciation: 'Capex & Depreciation',
  source_use_of_funds: 'Source / Use of Funds',
  income_statement: 'Income Statement',
  cash_flow: 'Cash Flow',
  balance_sheet: 'Balance Sheet',
  valuation: 'Valuation Summary',
  key_metrics: 'Key Metrics',
};

function getGuideTitle() {
  return (
    referenceGuideText.split(/\r?\n/, 1)[0]?.trim() ||
    'A2 Charging & Platform Workbook Validation Guide'
  );
}

function buildCellId(sheet: string, cell: string) {
  return `${sheet}!${cell}`;
}

function safeRelativeVariance(actual: number, expected: number) {
  return Math.abs(actual - expected) / Math.max(Math.abs(expected), 1);
}

export function isVarianceWithinTolerance(
  actual: number,
  expected: number,
  tolerance: VarianceTolerance = A2_FLEET_BASELINE_TOLERANCE,
) {
  const absoluteVariance = Math.abs(actual - expected);
  const relativeVariance = safeRelativeVariance(actual, expected);

  return (
    absoluteVariance <= tolerance.absolute || relativeVariance <= tolerance.relative
  );
}

function isAssumptionMatch(actual: number, expected: number) {
  return Math.abs(actual - expected) <= ASSUMPTION_RECONCILIATION_TOLERANCE;
}

function getKnownAnomalyMatches(sheet: WorkbookSheetName, row: number, targetKey: string) {
  const matches = referenceData.known_quirks_and_audit_flags.filter((quirk) => {
    if (sheet === 'ASSUMPTIONS_DATA' && row === 16) {
      return /J16|hardcoded to 103/i.test(quirk);
    }

    if (sheet === 'SOURCE_USE OF FUNDS' && row === 5) {
      return /SOURCE_USE OF FUNDS!C5:M5|investor subscription \(25%\)/i.test(quirk);
    }

    if (sheet === 'INCOME STATEMENT ' && row === 10) {
      return /N10 = M10\*1\.2/i.test(quirk);
    }

    if (sheet === 'INCOME STATEMENT ' && row === 15) {
      return /N15 = M15\*1\.2/i.test(quirk);
    }

    if (sheet === 'CAPEX & DEPRECIATION' && (row === 6 || row === 7)) {
      return /P6 links|P7 links/i.test(quirk);
    }

    if (sheet === 'CAPEX & DEPRECIATION' && row === 11) {
      return /E11:P11 can go negative/i.test(quirk);
    }

    if (sheet === 'CAPEX & DEPRECIATION' && /asset_value_battery_packs/i.test(targetKey)) {
      return /BATTERY PACKS asset value row/i.test(quirk);
    }

    if (sheet === 'BALANCE SHEET' && /retained_earnings/i.test(targetKey)) {
      return /retained earnings behaves as a plug/i.test(quirk);
    }

    return false;
  });

  return {
    knownAnomalyRelated: matches.length > 0,
    relatedQuirks: matches,
  };
}

function getOutputLabel(comparison: BaselineComparison) {
  return comparison.targetKey
    .split('.')
    .slice(1)
    .join(' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getSectionId(targetKey: string) {
  return targetKey.split('.')[0] ?? 'other';
}

export function reconcileBaseAssumptions() {
  const bundle = getBaseAssumptionBundle();
  const normalized = normalizeA2FleetAssumptions(bundle.baseValues);
  const workbookMappedMetadata = bundle.metadata.filter(
    (item): item is AssumptionMetadata & { workbook: NonNullable<AssumptionMetadata['workbook']> } =>
      Boolean(item.workbook),
  );
  const metadataByCell = new Map(
    workbookMappedMetadata.map((item) => [buildCellId(item.workbook.sheet, item.workbook.cell), item]),
  );

  const matched: AssumptionReconciliationItem[] = [];
  const missingInApp: AssumptionReconciliationItem[] = [];
  const missingInReference: AssumptionReconciliationItem[] = [];
  const mismatched: AssumptionReconciliationItem[] = [];

  referenceWorkbookInputCells.forEach((referenceCell) => {
    const cellId = buildCellId(referenceCell.sheet, referenceCell.cell);
    const metadata = metadataByCell.get(cellId);

    if (!metadata) {
      missingInApp.push({
        key: null,
        label: referenceCell.row_label,
        groupId: null,
        unit: referenceCell.unit,
        sheet: referenceCell.sheet,
        cell: referenceCell.cell,
        columnLabel: referenceCell.column_label,
        row: referenceCell.row,
        referenceValue: referenceCell.base_value,
        appValue: null,
        difference: null,
        status: 'missing_in_app',
      });
      return;
    }

    const appValue = bundle.baseValues[metadata.key];
    const difference = appValue - referenceCell.base_value;
    const item: AssumptionReconciliationItem = {
      key: metadata.key,
      label: metadata.label,
      groupId: metadata.groupId,
      unit: metadata.unit,
      sheet: metadata.workbook.sheet,
      cell: metadata.workbook.cell,
      columnLabel: referenceCell.column_label,
      row: referenceCell.row,
      referenceValue: referenceCell.base_value,
      appValue,
      difference,
      status: isAssumptionMatch(appValue, referenceCell.base_value)
        ? 'matched'
        : 'mismatched',
      note: metadata.label !== referenceCell.row_label ? `Workbook row label: ${referenceCell.row_label}` : undefined,
    };

    if (item.status === 'matched') {
      matched.push(item);
    } else {
      mismatched.push(item);
    }
  });

  workbookMappedMetadata.forEach((metadata) => {
    const cellId = buildCellId(metadata.workbook.sheet, metadata.workbook.cell);

    if (
      !referenceWorkbookInputCells.some(
        (item) => buildCellId(item.sheet, item.cell) === cellId,
      )
    ) {
      missingInReference.push({
        key: metadata.key,
        label: metadata.label,
        groupId: metadata.groupId,
        unit: metadata.unit,
        sheet: metadata.workbook.sheet,
        cell: metadata.workbook.cell,
        columnLabel: metadata.workbook.columnLabel,
        row: metadata.workbook.row,
        referenceValue: Number.NaN,
        appValue: bundle.baseValues[metadata.key],
        difference: null,
        status: 'missing_in_reference',
        note: 'Workbook-mapped app assumption does not have a matching reference input cell.',
      });
    }
  });

  const transformed: AssumptionNormalizationTransform[] = normalized.referenceAssumptions.map(
    (item) => ({
      key: item.key,
      label: item.metadata.label,
      groupId: item.metadata.groupId,
      sheet: item.sheet,
      cell: item.cell,
      referenceCellId: buildCellId(item.sheet, item.cell),
      appValue: bundle.baseValues[item.key],
      normalizedValue: item.value,
      valuePreserved: isAssumptionMatch(bundle.baseValues[item.key], item.value),
      transformation: 'Stable assumption key normalized to workbook sheet/cell input.',
    }),
  );

  return {
    totalReferenceInputs: referenceWorkbookInputCells.length,
    totalWorkbookMappedInputs: workbookMappedMetadata.length,
    matched,
    missingInApp,
    missingInReference,
    mismatched,
    transformed,
    excludedNonWorkbookInputs: bundle.metadata.length - workbookMappedMetadata.length,
  };
}

export function reconcileBaselineOutputs(
  tolerance: VarianceTolerance = A2_FLEET_BASELINE_TOLERANCE,
) {
  const baseValues = getBaseAssumptionBundle().baseValues;
  const workbook = runA2FleetWorkbook(baseValues);
  const sections = workbook.baselineComparison.map<OutputReconciliationItem>((comparison) => {
    const sectionId = getSectionId(comparison.targetKey);
    const sectionTitle = SECTION_TITLES[sectionId] ?? sectionId;
    const periods = comparison.periods.map((period, index) => {
      const expected = comparison.expected[index] ?? 0;
      const actual = comparison.actual[index] ?? 0;
      const absoluteVariance = Math.abs(actual - expected);
      const relativeVariance = safeRelativeVariance(actual, expected);

      return {
        period,
        expected,
        actual,
        absoluteVariance,
        relativeVariance,
        withinTolerance: isVarianceWithinTolerance(actual, expected, tolerance),
      };
    });
    const quirkMatch = getKnownAnomalyMatches(
      comparison.sheet,
      comparison.row,
      comparison.targetKey,
    );

    return {
      targetKey: comparison.targetKey,
      targetLabel: getOutputLabel(comparison),
      sectionId,
      sectionTitle,
      sheet: comparison.sheet,
      row: comparison.row,
      periods,
      maxAbsoluteVariance: Math.max(...periods.map((item) => item.absoluteVariance), 0),
      maxRelativeVariance: Math.max(...periods.map((item) => item.relativeVariance), 0),
      withinTolerance: periods.every((item) => item.withinTolerance),
      varianceThreshold: tolerance,
      knownAnomalyRelated: quirkMatch.knownAnomalyRelated,
      relatedQuirks: quirkMatch.relatedQuirks,
    };
  });

  const unexpectedVariances = sections.filter(
    (item) => !item.withinTolerance && !item.knownAnomalyRelated,
  );
  const knownAnomalyVariances = sections.filter(
    (item) => !item.withinTolerance && item.knownAnomalyRelated,
  );

  return {
    totalTargets: sections.length,
    passedTargets: sections.filter((item) => item.withinTolerance).length,
    failedTargets: sections.filter((item) => !item.withinTolerance).length,
    sections,
    unexpectedVariances,
    knownAnomalyVariances,
  };
}

function buildReferenceSources(): ValidationArtifactSource[] {
  return [
    {
      id: 'workbook',
      label: 'Excel workbook',
      path: referenceData.source_workbook,
      availability: 'referenced',
      note: 'Workbook logic is validated through the replication engine and machine-readable reference.',
    },
    {
      id: 'reference_json',
      label: 'Machine-readable JSON reference',
      path: 'Docs/A2_Charging_Platform_Model_Replication_Reference.json',
      availability: 'available',
    },
    {
      id: 'reference_txt',
      label: 'Narrative TXT replication guide',
      path: 'Docs/A2_Charging_Platform_Model_Replication_Reference.txt',
      availability: 'available',
    },
    {
      id: 'reference_markdown',
      label: 'Companion narrative reference',
      path: referenceData.source_reference_markdown,
      availability: 'available',
    },
  ];
}

export function buildValidationReport(options?: {
  generatedAt?: string;
  outputTolerance?: VarianceTolerance;
}) {
  const assumptions = reconcileBaseAssumptions();
  const outputs = reconcileBaselineOutputs(options?.outputTolerance);
  const generatedAt = options?.generatedAt ?? new Date().toISOString();
  const unexpectedAssumptionIssues =
    assumptions.missingInApp.length +
    assumptions.missingInReference.length +
    assumptions.mismatched.length;
  const fitToProceed =
    unexpectedAssumptionIssues === 0 && outputs.unexpectedVariances.length === 0;
  const gateStatus: ValidationGateStatus = fitToProceed ? 'pass' : 'fail';
  const notes = [
    assumptions.excludedNonWorkbookInputs > 0
      ? `${assumptions.excludedNonWorkbookInputs} integrated-model assumptions are excluded from the workbook baseline reconciliation because they do not map to reference input cells.`
      : null,
    outputs.knownAnomalyVariances.length > 0
      ? `${outputs.knownAnomalyVariances.length} output variance(s) are tied to known workbook quirks and are separated from unexpected mismatches.`
      : null,
  ].filter((item): item is string => Boolean(item));

  const verdict = fitToProceed
    ? `Base coded charging/platform model matches the workbook baseline within absolute ${A2_FLEET_BASELINE_TOLERANCE.absolute} or relative ${A2_FLEET_BASELINE_TOLERANCE.relative} tolerance and is fit to proceed as the foundation for the integrated planning model.`
    : 'Base coded charging/platform model does not yet match the workbook baseline sufficiently; resolve unexpected assumption or output variances before treating it as the integrated-model foundation.';

  return {
    generatedAt,
    guideTitle: getGuideTitle(),
    gateStatus,
    fitToProceed,
    verdict,
    referenceSources: buildReferenceSources(),
    tolerances: {
      assumptions: ASSUMPTION_RECONCILIATION_TOLERANCE,
      outputs: options?.outputTolerance ?? A2_FLEET_BASELINE_TOLERANCE,
    },
    assumptions,
    outputs,
    knownWorkbookQuirks: [...referenceData.known_quirks_and_audit_flags],
    notes,
  } satisfies ValidationReport;
}

export function buildValidationJsonArtifact(report: ValidationReport) {
  return JSON.stringify(report, null, 2);
}

function buildAssumptionSectionMarkdown(report: ValidationReport) {
  const lines = [
    '## Base Assumptions Reconciliation',
    '',
    `- Matched assumptions: ${report.assumptions.matched.length}`,
    `- Missing assumptions in app: ${report.assumptions.missingInApp.length}`,
    `- Missing assumptions in reference: ${report.assumptions.missingInReference.length}`,
    `- Mismatched assumptions: ${report.assumptions.mismatched.length}`,
    `- Normalized workbook inputs: ${report.assumptions.transformed.length}`,
    '',
  ];

  if (report.assumptions.mismatched.length > 0) {
    lines.push('| Key | Cell | Reference | App | Difference |');
    lines.push('| --- | --- | ---: | ---: | ---: |');
    report.assumptions.mismatched.forEach((item) => {
      lines.push(
        `| ${item.key ?? item.label} | ${item.sheet}!${item.cell} | ${item.referenceValue} | ${item.appValue ?? 'n/a'} | ${item.difference ?? 'n/a'} |`,
      );
    });
    lines.push('');
  }

  return lines.join('\n');
}

function buildOutputSectionMarkdown(report: ValidationReport) {
  const lines = [
    '## Baseline Output Reconciliation',
    '',
    `- Passed targets: ${report.outputs.passedTargets}/${report.outputs.totalTargets}`,
    `- Failed targets: ${report.outputs.failedTargets}`,
    `- Unexpected variances: ${report.outputs.unexpectedVariances.length}`,
    `- Known-anomaly variances: ${report.outputs.knownAnomalyVariances.length}`,
    '',
    '| Target | Sheet | Max Absolute Variance | Max Relative Variance | Status |',
    '| --- | --- | ---: | ---: | --- |',
  ];

  report.outputs.sections.forEach((item) => {
    lines.push(
      `| ${item.targetLabel} | ${item.sheet.trim()} | ${item.maxAbsoluteVariance} | ${item.maxRelativeVariance} | ${item.withinTolerance ? 'PASS' : 'FAIL'} |`,
    );
  });
  lines.push('');

  return lines.join('\n');
}

export function buildValidationMarkdownArtifact(report: ValidationReport) {
  const lines = [
    '# A2 Charging & Platform Workbook Validation Report',
    '',
    `Generated at: ${report.generatedAt}`,
    '',
    `Guide: ${report.guideTitle}`,
    '',
    `Gate status: ${report.gateStatus.toUpperCase()}`,
    '',
    report.verdict,
    '',
    '## Reference Sources',
    '',
    ...report.referenceSources.map(
      (item) =>
        `- ${item.label}: ${item.path} (${item.availability})${item.note ? ` - ${item.note}` : ''}`,
    ),
    '',
    buildAssumptionSectionMarkdown(report),
    buildOutputSectionMarkdown(report),
    '## Known Workbook Quirks',
    '',
    ...report.knownWorkbookQuirks.map((item) => `- ${item}`),
  ];

  if (report.notes.length > 0) {
    lines.push('', '## Notes', '', ...report.notes.map((item) => `- ${item}`));
  }

  return lines.join('\n');
}
