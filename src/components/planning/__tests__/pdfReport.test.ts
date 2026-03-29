import { describe, expect, it } from 'vitest';
import { getBaseAssumptionBundle } from '../../../model/assumptions';
import { runA2FleetWorkbook } from '../../../engine/a2Fleet';
import { runIntegratedModel } from '../../../engine/integrated';
import { buildRunSummaryPdf } from '../pdfReport';

describe('pdfReport', () => {
  it('builds a detailed PDF report with assumptions, tables, and charts', () => {
    const assumptions = getBaseAssumptionBundle().baseValues;
    const workbook = runA2FleetWorkbook(assumptions);
    const integrated = runIntegratedModel(assumptions, workbook);

    const pdf = buildRunSummaryPdf({
      generatedAt: '2026-03-29T12:00:00.000Z',
      lastCalculatedAt: 'Mar 29, 2026, 3:00 PM',
      scenarioName: 'Base Reference',
      validationGate: 'pass',
      validationVerdict: 'Workbook replication remains within the configured tolerance gate.',
      displayCurrency: 'USD',
      fxRate: 155,
      assumptions,
      workbook,
      integrated,
      results: [
        {
          label: 'Investor 25% Stake Value',
          value: 162.6,
          format: 'currencyM',
        },
      ],
      platformKpis: integrated.platform.kpis,
      energyKpis: integrated.energy.kpis,
      consolidatedKpis: integrated.consolidated.kpis,
    });

    expect(pdf).toContain('A2 Charging Platform Detailed Report');
    expect(pdf).toContain('Detailed assumptions register');
    expect(pdf).toContain('Workbook income statement');
    expect(pdf).toContain('Consolidated income statement');
    expect(pdf).toContain('Fleet revenue and EBITDA');
    expect(pdf).toContain('Platform revenue and EBITDA');
    expect(pdf).toContain('Number Of Trucks Added');
  });
});
