import { getBaseAssumptionBundle } from '../../../model/assumptions';
import { runIntegratedModel } from '..';

describe('integrated convergence layer', () => {
  it('remains stable and deterministic for a representative base case', () => {
    const assumptions = Object.freeze({ ...getBaseAssumptionBundle().baseValues });

    const first = runIntegratedModel(assumptions);
    const second = runIntegratedModel(assumptions);

    expect(first).toEqual(second);
    expect(first.convergence.history.length).toBeGreaterThan(0);
    expect(first.convergence.iterations).toBe(first.convergence.history.length);
    expect(Number.isFinite(first.convergence.maxDelta)).toBe(true);
    expect(['converged', 'max_iterations']).toContain(first.convergence.status);
  });

  it('surfaces override diagnostics when manual convergence hooks are used', () => {
    const output = runIntegratedModel(getBaseAssumptionBundle().baseValues, undefined, {
      manualOverrides: {
        serviceFactor: 0.91,
        replacementRate: 0.08,
      },
    });

    expect(output.convergence.status).toBe('manual_override');
    expect(output.convergence.history).toHaveLength(1);
    expect(output.convergence.history[0]?.serviceFactor).toBeCloseTo(0.91, 6);
    expect(output.convergence.usedOverrides).toEqual(
      expect.arrayContaining(['serviceFactor', 'replacementRate']),
    );
  });
});
