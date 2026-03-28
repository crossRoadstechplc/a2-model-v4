import { getBaseAssumptionBundle } from '../../../model/assumptions';
import { runIntegratedModel } from '..';

function getRowValues(
  rows: Array<{ key: string; values: number[] }>,
  key: string,
) {
  return rows.find((row) => row.key === key)?.values ?? [];
}

describe('integrated consolidated scaffold', () => {
  it('builds elimination objects and statement scaffolding with consistent totals', () => {
    const output = runIntegratedModel(getBaseAssumptionBundle().baseValues);
    const periodsLength = output.consolidated.periods.length;
    const totalInternalFlows = getRowValues(
      output.intercompany.statement.rows,
      'total_internal_flows',
    );
    const revenueElimination = getRowValues(
      output.consolidated.incomeStatement.rows,
      'internal_revenue_elimination',
    );
    const expenseElimination = getRowValues(
      output.consolidated.incomeStatement.rows,
      'internal_expense_elimination',
    );
    const revenueBeforeElimination = getRowValues(
      output.consolidated.incomeStatement.rows,
      'total_revenue_pre_elimination',
    );
    const consolidatedRevenue = getRowValues(
      output.consolidated.incomeStatement.rows,
      'consolidated_revenue',
    );

    expect(output.consolidated.eliminations).toHaveLength(3);
    expect(output.consolidated.eliminations.map((item) => item.id)).toEqual([
      'fleet_platform_fee',
      'platform_energy_lease',
      'platform_energy_revenue_share',
    ]);
    expect(
      output.consolidated.eliminations.every(
        (item) => item.amounts.length === periodsLength && item.periods.length === periodsLength,
      ),
    ).toBe(true);
    expect(revenueElimination).toEqual(totalInternalFlows.map((value) => -value));
    expect(expenseElimination).toEqual(totalInternalFlows.map((value) => -value));

    const lastIndex = periodsLength - 1;
    expect(consolidatedRevenue[lastIndex]).toBeCloseTo(
      revenueBeforeElimination[lastIndex] + revenueElimination[lastIndex],
      6,
    );
    expect(
      getRowValues(output.consolidated.balanceSheet.rows, 'total_assets').length,
    ).toBe(periodsLength);
    expect(
      getRowValues(output.consolidated.balanceSheet.rows, 'total_equity').length,
    ).toBe(periodsLength);
    expect(output.consolidated.returnsSummary.returnsMetrics.projectIrr.status).toBe('ready');
    expect(output.consolidated.returnsSummary.returnsMetrics.equityIrr.status).toBe(
      'pending',
    );
    expect(output.consolidated.returnsSummary.terminalValuePolicy?.method).toBe('bookValue');
  });
});
