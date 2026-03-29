import { describe, expect, it } from 'vitest';
import {
  A2_FLEET_BASELINE_TOLERANCE,
} from '../../engine/a2Fleet/reference';
import { referenceWorkbookInputCells } from '../referenceWorkbookInputs';
import {
  buildValidationJsonArtifact,
  buildValidationMarkdownArtifact,
  buildValidationReport,
  isVarianceWithinTolerance,
  reconcileBaseAssumptions,
  reconcileBaselineOutputs,
} from '../validation';

describe('validation reconciliation', () => {
  it('reconciles workbook-backed base assumptions against the reference contract', () => {
    const reconciliation = reconcileBaseAssumptions();
    const trucks2027 = reconciliation.matched.find(
      (item) => item.key === 'a2_fleet.number_of_trucks.cy_2027',
    );

    expect(reconciliation.totalReferenceInputs).toBe(referenceWorkbookInputCells.length);
    expect(reconciliation.totalWorkbookMappedInputs).toBe(referenceWorkbookInputCells.length);
    expect(reconciliation.matched).toHaveLength(referenceWorkbookInputCells.length);
    expect(reconciliation.missingInApp).toHaveLength(0);
    expect(reconciliation.missingInReference).toHaveLength(0);
    expect(reconciliation.mismatched).toHaveLength(0);
    expect(reconciliation.transformed).toHaveLength(referenceWorkbookInputCells.length);
    expect(trucks2027).toMatchObject({
      key: 'a2_fleet.number_of_trucks.cy_2027',
      cell: 'D5',
      referenceValue: 714,
      appValue: 714,
      status: 'matched',
    });
  });

  it('reconciles baseline outputs against reference targets within tolerance', () => {
    const reconciliation = reconcileBaselineOutputs();
    const revenue = reconciliation.sections.find(
      (item) => item.targetKey === 'revenue_projection.revenue_from_power_sales',
    );

    expect(reconciliation.totalTargets).toBe(8);
    expect(reconciliation.passedTargets).toBe(8);
    expect(reconciliation.failedTargets).toBe(0);
    expect(reconciliation.unexpectedVariances).toHaveLength(0);
    expect(revenue).toBeDefined();
    expect(revenue?.periods[0].period).toBe('CY-2027');
    expect(revenue?.periods[0].expected).toBeCloseTo(15_512_853.9589442, 6);
    expect(revenue?.periods[0].actual).toBeCloseTo(15_512_853.9589442, 6);
    expect(revenue?.periods[0].withinTolerance).toBe(true);
  });

  it('handles explicit variance thresholds', () => {
    expect(
      isVarianceWithinTolerance(100.005, 100, A2_FLEET_BASELINE_TOLERANCE),
    ).toBe(true);
    expect(
      isVarianceWithinTolerance(100.02, 100, {
        absolute: 0.01,
        relative: 0.000001,
      }),
    ).toBe(false);
  });

  it('generates deterministic JSON and markdown reconciliation artifacts', () => {
    const report = buildValidationReport({
      generatedAt: '2026-03-25T00:00:00.000Z',
    });
    const jsonArtifact = buildValidationJsonArtifact(report);
    const markdownArtifact = buildValidationMarkdownArtifact(report);
    const parsed = JSON.parse(jsonArtifact) as ReturnType<typeof buildValidationReport>;

    expect(report.fitToProceed).toBe(true);
    expect(report.gateStatus).toBe('pass');
    expect(report.referenceSources.find((item) => item.id === 'workbook')?.path).toBe(
      'A2 E FLEET OPERATIONS  FINANCIALS-VER 2.xlsx',
    );
    expect(parsed.generatedAt).toBe('2026-03-25T00:00:00.000Z');
    expect(parsed.outputs.passedTargets).toBe(8);
    expect(markdownArtifact).toContain('# A2 Charging & Platform Workbook Validation Report');
    expect(markdownArtifact).toContain('Gate status: PASS');
    expect(markdownArtifact).toContain(
      `Matched assumptions: ${referenceWorkbookInputCells.length}`,
    );
    expect(markdownArtifact).toContain('Passed targets: 8/8');
  });
});
