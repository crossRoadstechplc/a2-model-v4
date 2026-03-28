import {
  buildComputedReturnsSummary,
  buildPendingReturnsSummary,
  calculateIrr,
  calculateNpv,
  calculateMoic,
  calculatePaybackPeriod,
  solveIrr,
} from '../returns';

describe('returns helpers', () => {
  it('calculates IRR from the full cumulative cash flow stream', () => {
    const series = [-100, 20, 30, 40, 80];

    expect(calculateIrr(series)).toBeCloseTo(0.1967, 3);
  });

  it('returns null for streams without a sign change', () => {
    expect(calculateIrr([10, 20, 30])).toBeNull();
    expect(calculateIrr([-10, -20, -30])).toBeNull();
  });

  it('falls back to bisection when the Newton path is unstable', () => {
    const result = solveIrr([-100, 120], -0.9999999);

    expect(result.method).toBe('bisection');
    expect(result.value).toBeCloseTo(0.2, 6);
  });

  it('handles near-boundary cases safely when IRR is close to -100%', () => {
    const result = solveIrr([-100, 0.01]);

    expect(result.value).not.toBeNull();
    expect(result.value!).toBeGreaterThan(-1);
    expect(result.value!).toBeCloseTo(-0.9999, 4);
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
