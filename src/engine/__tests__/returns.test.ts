import {
  buildComputedReturnsSummary,
  buildPendingReturnsSummary,
  calculateIrr,
  calculateNpv,
  calculateMoic,
  calculatePaybackPeriod,
} from '../returns';

describe('returns helpers', () => {
  it('calculates IRR from the full cumulative cash flow stream', () => {
    const series = [-100, 20, 30, 40, 80];

    expect(calculateIrr(series)).toBeCloseTo(0.1967, 3);
  });

  it('calculates payback and moic from the same full stream', () => {
    const series = [-100, 20, 30, 40, 80];

    expect(calculatePaybackPeriod(series)).toBeCloseTo(3.125, 3);
    expect(calculateMoic(series)).toBeCloseTo(1.7, 6);
    expect(calculateNpv(series, 13)).toBeCloseTo(17.98, 2);
  });

  it('builds computed return summaries when a first-pass cash flow stream exists', () => {
    const summary = buildComputedReturnsSummary({
      title: 'Returns / Valuation',
      basisLabel: 'Test basis.',
      projectCashFlowSeries: [-100, 20, 30, 40, 80],
      discountRatePct: 13,
      useProjectSeriesForEquity: true,
    });

    expect(summary.metrics.find((metric) => metric.id === 'project_irr')?.status).toBe(
      'ready',
    );
    expect(summary.metrics.find((metric) => metric.id === 'equity_irr')?.status).toBe(
      'ready',
    );
    expect(summary.metrics.find((metric) => metric.id === 'npv')?.value).not.toBeNull();
  });

  it('builds pending return summaries without fake values', () => {
    const summary = buildPendingReturnsSummary('Returns / Valuation', 'Pending basis.');

    expect(summary.metrics.every((metric) => metric.value === null)).toBe(true);
    expect(summary.metrics.every((metric) => metric.status === 'pending')).toBe(true);
  });
});
