import type { RunState } from '../store/appStore';
import type { A2FleetWorkbookOutput } from '../engine/a2Fleet';
import type { IntegratedModelOutput } from '../engine/integrated';

export type IntegritySeverity = 'critical' | 'warning' | 'info';

export type IntegrityCheck = {
  id: string;
  category:
    | 'freshness'
    | 'balance'
    | 'reconciliation'
    | 'convergence'
    | 'capacity'
    | 'provision'
    | 'threshold'
    | 'elimination';
  severity: IntegritySeverity;
  title: string;
  message: string;
};

export function groupIntegrityChecks(checks: IntegrityCheck[]) {
  return {
    critical: checks.filter((item) => item.severity === 'critical'),
    warning: checks.filter((item) => item.severity === 'warning'),
    info: checks.filter((item) => item.severity === 'info'),
  };
}

function getRowValues(
  rows: Array<{ key: string; values: number[] }>,
  key: string,
) {
  return rows.find((row) => row.key === key)?.values ?? [];
}

export function buildIntegrityChecks(params: {
  runState: RunState;
  hasSuccessfulCalculation: boolean;
  workbook: A2FleetWorkbookOutput | null;
  integrated: IntegratedModelOutput | null;
}) {
  const checks: IntegrityCheck[] = [];

  if (!params.hasSuccessfulCalculation || !params.workbook || !params.integrated) {
    checks.push({
      id: 'freshness-empty',
      category: 'freshness',
      severity: 'critical',
      title: 'Model not yet calculated',
      message: 'Statements, convergence diagnostics, and integrity checks remain provisional until Calculate is run.',
    });

    return checks;
  }

  checks.push({
    id: 'freshness-state',
    category: 'freshness',
    severity:
      params.runState === 'ready'
        ? 'info'
        : params.runState === 'error'
          ? 'critical'
          : 'warning',
    title: 'Model freshness',
    message:
      params.runState === 'ready'
        ? 'Visible outputs are aligned to the latest successful run.'
        : params.runState === 'error'
          ? 'The latest recalculation failed and the page is holding the last successful outputs.'
          : 'Visible outputs are being held while the next recalculation is pending or running.',
  });

  const failedBaselineTargets = params.workbook.baselineComparison.filter(
    (item) => !item.withinTolerance,
  );
  checks.push({
    id: 'fleet-baseline',
    category: 'reconciliation',
    severity: failedBaselineTargets.length > 0 ? 'warning' : 'info',
    title: 'V2 workbook replication',
    message:
      failedBaselineTargets.length > 0
        ? `${failedBaselineTargets.length} baseline targets are outside the configured V2 workbook tolerance.`
        : 'V2 charging/platform workbook replication remains within the configured baseline tolerance.',
  });

  const closingCash = getRowValues(params.workbook.cashFlow.rows, 'closing_cash');
  checks.push({
    id: 'fleet-liquidity',
    category: 'threshold',
    severity: closingCash.some((value) => value < 0) ? 'warning' : 'info',
    title: 'Liquidity threshold',
    message: closingCash.some((value) => value < 0)
      ? 'Fleet closing cash turns negative in at least one period.'
      : 'Fleet closing cash stays non-negative across the projected horizon.',
  });

  const retainedEarnings = getRowValues(
    params.workbook.balanceSheet.rows,
    'retained_earnings',
  );
  const totalAssets = getRowValues(params.workbook.balanceSheet.rows, 'total_assets');
  const equity = getRowValues(params.workbook.balanceSheet.rows, 'equity');
  const retainedPlugMatches = retainedEarnings.every((value, index) =>
    Math.abs(value - ((totalAssets[index] ?? 0) - (equity[index] ?? 0))) <= 0.01,
  );
  checks.push({
    id: 'fleet-balance-plug',
    category: 'balance',
    severity: retainedPlugMatches ? 'info' : 'warning',
    title: 'Fleet balance plug',
    message: retainedPlugMatches
      ? 'Retained earnings continue to absorb the workbook balance gap as expected.'
      : 'Fleet retained earnings no longer reconcile with the workbook plug behavior.',
  });

  const convergence = params.integrated.convergence;
  checks.push({
    id: 'convergence-status',
    category: 'convergence',
    severity:
      convergence.status === 'max_iterations' ? 'warning' : 'info',
    title: 'Convergence status',
    message: `Integrated model ended in status "${convergence.status}" after ${convergence.iterations} iteration(s) with max delta ${convergence.maxDelta.toFixed(6)}.`,
  });

  const provisioned = getRowValues(
    params.integrated.energy.operations.rows,
    'battery_packs_provisioned',
  );
  const replacements = getRowValues(
    params.integrated.energy.operations.rows,
    'battery_replacements',
  );
  const provisionCoverageAdequate = provisioned.every(
    (value, index) => value + 0.000001 >= (replacements[index] ?? 0),
  );
  checks.push({
    id: 'provision-adequacy',
    category: 'provision',
    severity: provisionCoverageAdequate ? 'info' : 'warning',
    title: 'Provision adequacy',
    message: provisionCoverageAdequate
      ? 'Provisioned battery packs cover modeled replacement demand in every period.'
      : 'Provisioned battery packs fall short of modeled replacement demand in at least one period.',
  });

  const breakevenCoverage = getRowValues(
    params.integrated.platform.incomeStatement.rows,
    'breakeven_coverage',
  );
  checks.push({
    id: 'platform-breakeven',
    category: 'threshold',
    severity: breakevenCoverage.some((value, index) => index > 0 && value < 1) ? 'warning' : 'info',
    title: 'Platform breakeven coverage',
    message: breakevenCoverage.some((value, index) => index > 0 && value < 1)
      ? 'Platform revenue falls below buffered breakeven in at least one operating period.'
      : 'Platform revenue remains above buffered breakeven across operating periods.',
  });

  const capacityPeriods = params.integrated.platform.capacity.byPeriod;
  const outOfRangePeriods = capacityPeriods.filter(
    (item) => item.truckCount > 0 && item.diagnostics.status !== 'ok',
  );
  checks.push({
    id: 'platform-capacity-range',
    category: 'capacity',
    severity: outOfRangePeriods.length > 0 ? 'warning' : 'info',
    title: 'Platform capacity range coverage',
    message:
      outOfRangePeriods.length > 0
        ? `${outOfRangePeriods.length} period(s) fall outside the generated truck-band policy range.`
        : 'All modeled truck counts map to a generated platform capacity band.',
  });

  const insufficientCapacityPeriods = capacityPeriods.filter(
    (item) =>
      item.truckCount > 0 &&
      (item.insufficientChargeCapacity || item.insufficientSwapCapacity),
  );
  checks.push({
    id: 'platform-capacity-sufficiency',
    category: 'capacity',
    severity: insufficientCapacityPeriods.length > 0 ? 'warning' : 'info',
    title: 'Platform capacity sufficiency',
    message:
      insufficientCapacityPeriods.length > 0
        ? `${insufficientCapacityPeriods.length} period(s) show insufficient swap or charging capacity under the generated policy.`
        : 'Generated platform swap and charging capacity remain sufficient across modeled periods.',
  });

  const totalInternalFlows = getRowValues(
    params.integrated.intercompany.statement.rows,
    'total_internal_flows',
  );
  const revenueElimination = getRowValues(
    params.integrated.consolidated.incomeStatement.rows,
    'internal_revenue_elimination',
  );
  const expenseElimination = getRowValues(
    params.integrated.consolidated.incomeStatement.rows,
    'internal_expense_elimination',
  );
  const eliminationsMatch = totalInternalFlows.every(
    (value, index) =>
      Math.abs((revenueElimination[index] ?? 0) + value) <= 0.01 &&
      Math.abs((expenseElimination[index] ?? 0) + value) <= 0.01,
  );
  checks.push({
    id: 'elimination-consistency',
    category: 'elimination',
    severity: eliminationsMatch ? 'info' : 'warning',
    title: 'Inter-company eliminations',
    message: eliminationsMatch
      ? 'Revenue and expense eliminations align with the explicit internal-flow layer.'
      : 'Consolidated eliminations drift from the explicit internal-flow layer.',
  });

  const consolidatedRevenue = getRowValues(
    params.integrated.consolidated.incomeStatement.rows,
    'consolidated_revenue',
  );
  const revenueBeforeElimination = getRowValues(
    params.integrated.consolidated.incomeStatement.rows,
    'total_revenue_pre_elimination',
  );
  const consolidatedRevenueReconciles = consolidatedRevenue.every(
    (value, index) =>
      Math.abs(
        value -
          ((revenueBeforeElimination[index] ?? 0) + (revenueElimination[index] ?? 0)),
      ) <= 0.01,
  );
  checks.push({
    id: 'revenue-reconciliation',
    category: 'reconciliation',
    severity: consolidatedRevenueReconciles ? 'info' : 'warning',
    title: 'Consolidated revenue reconciliation',
    message: consolidatedRevenueReconciles
      ? 'Consolidated revenue reconciles to pre-elimination revenue plus eliminations.'
      : 'Consolidated revenue no longer reconciles to the elimination bridge.',
  });

  checks.push({
    id: 'dscr-placeholder',
    category: 'threshold',
    severity: 'info',
    title: 'DSCR watchlist',
    message: 'Debt service coverage checks remain informational until a fuller financing schedule and debt-service layer are modeled.',
  });

  return checks;
}
