import {
  buildPendingReturnsSummary,
  calculateIrr,
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
  });

  it('builds pending return summaries without fake values', () => {
    const summary = buildPendingReturnsSummary('Returns / Valuation', 'Pending basis.');

    expect(summary.metrics.every((metric) => metric.value === null)).toBe(true);
    expect(summary.metrics.every((metric) => metric.status === 'pending')).toBe(true);
  });
});
