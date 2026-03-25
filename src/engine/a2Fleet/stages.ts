import type { AssumptionValueMap } from '../../model/assumptions';
import {
  buildComputedReturnsSummary,
  calculateIrr,
  calculateMoic,
  calculatePaybackPeriod,
  type EntityReturnsSummary,
} from '../returns';
import {
  createWorkbookCellGetter,
  type WorkbookSheetValues,
} from './formula';
import { normalizeA2FleetAssumptions, type NormalizedAssumptions } from './normalizeAssumptions';
import {
  a2FleetReference,
  A2_FLEET_BASELINE_TOLERANCE,
  statementDefinitions,
  type WorkbookSheetName,
} from './reference';

export type PeriodizedRow = {
  key: string;
  label: string;
  unit: string;
  cells: string[];
  values: number[];
};

export type PeriodizedStatement = {
  sheet: WorkbookSheetName;
  periods: string[];
  rows: PeriodizedRow[];
};

export type BaselineComparison = {
  targetKey: string;
  sheet: WorkbookSheetName;
  row: number;
  periods: string[];
  actual: number[];
  expected: number[];
  withinTolerance: boolean;
  maxAbsoluteVariance: number;
};

export type A2FleetWorkbookOutput = {
  sourceWorkbook: string;
  sourceReferenceMarkdown: string;
  normalizedAssumptions: NormalizedAssumptions;
  knownWorkbookQuirks: string[];
  workbookValuesBySheet: WorkbookSheetValues;
  derivedAssumptions: PeriodizedStatement;
  revenueProjection: PeriodizedStatement;
  capexDepreciation: PeriodizedStatement;
  sourceUseOfFunds: PeriodizedStatement;
  incomeStatement: PeriodizedStatement;
  cashFlow: PeriodizedStatement;
  balanceSheet: PeriodizedStatement;
  valuationSummary: PeriodizedStatement;
  keyMetrics: PeriodizedStatement;
  returnsSummary: EntityReturnsSummary;
  baselineComparison: BaselineComparison[];
};

type WorkbookComputationContext = {
  normalizedAssumptions: NormalizedAssumptions;
  workbookValuesBySheet: WorkbookSheetValues;
};

function evaluateSheet(
  sheet: WorkbookSheetName,
  context: WorkbookComputationContext,
) {
  const evaluator = createWorkbookCellGetter(
    a2FleetReference.full_formula_map,
    context.workbookValuesBySheet,
  );

  Object.keys(a2FleetReference.full_formula_map[sheet] ?? {}).forEach((cell) => {
    evaluator.getCellValue(sheet, cell);
  });

  return {
    ...context,
    workbookValuesBySheet: evaluator.getWorkbookSnapshot(),
  };
}

function extractStatement(statementKey: keyof typeof statementDefinitions, values: WorkbookSheetValues) {
  const definition = statementDefinitions[statementKey];
  const sheetValues = values[definition.sheet] ?? {};

  return {
    sheet: definition.sheet,
    periods: [...definition.periods],
    rows: definition.rows.map((row) => ({
      key: row.key,
      label: row.label,
      unit: row.unit,
      cells: [...row.cells],
      values: row.cells.map((cell) => sheetValues[cell] ?? 0),
    })),
  } satisfies PeriodizedStatement;
}

function isWithinTolerance(actual: number, expected: number) {
  const absoluteDelta = Math.abs(actual - expected);
  const relativeDenominator = Math.max(Math.abs(expected), 1);
  const relativeDelta = absoluteDelta / relativeDenominator;

  return (
    absoluteDelta <= A2_FLEET_BASELINE_TOLERANCE.absolute ||
    relativeDelta <= A2_FLEET_BASELINE_TOLERANCE.relative
  );
}

function buildBaselineComparison(output: Omit<A2FleetWorkbookOutput, 'baselineComparison'>) {
  return Object.entries(a2FleetReference.baseline_output_targets).map(
    ([targetKey, target]) => {
      const statement =
        target.sheet === 'REVENUE PROJECTION'
          ? output.revenueProjection
          : target.sheet === 'INCOME STATEMENT '
            ? output.incomeStatement
            : target.sheet === 'CASH FLOW'
              ? output.cashFlow
              : target.sheet === 'BALANCE SHEET'
                ? output.balanceSheet
                : target.sheet === 'VALUATION SUMMARY'
                  ? output.valuationSummary
                  : output.keyMetrics;
      const row = statement.rows.find((item) =>
        item.cells.some((cell) => Number(cell.slice(1)) === target.row),
      );
      const periods = Object.keys(target.series);
      const expected = periods.map((period) => target.series[period]);
      const actual = periods.map((period) => {
        const index = statement.periods.indexOf(period);
        return index === -1 || !row ? 0 : row.values[index];
      });
      const deltas = actual.map((value, index) => Math.abs(value - expected[index]));

      return {
        targetKey,
        sheet: target.sheet,
        row: target.row,
        periods,
        actual,
        expected,
        withinTolerance: actual.every((value, index) =>
          isWithinTolerance(value, expected[index]),
        ),
        maxAbsoluteVariance: Math.max(...deltas, 0),
      } satisfies BaselineComparison;
    },
  );
}

function getRowValues(statement: PeriodizedStatement, key: string) {
  return statement.rows.find((row) => row.key === key)?.values ?? [];
}

function buildFleetReturnsSummary(output: {
  assumptions: AssumptionValueMap;
  sourceUseOfFunds: PeriodizedStatement;
  incomeStatement: PeriodizedStatement;
  cashFlow: PeriodizedStatement;
  valuationSummary: PeriodizedStatement;
}) {
  const investorSubscription = getRowValues(
    output.sourceUseOfFunds,
    'investor_subscription',
  );
  const investorNetIncome = getRowValues(
    output.incomeStatement,
    'investor_net_income_25pct',
  );
  const terminalStakeValues = getRowValues(
    output.valuationSummary,
    'investor_25_stake_value',
  );
  const enterpriseValues = getRowValues(output.valuationSummary, 'enterprise_value');
  const netCashFromOperations = getRowValues(
    output.cashFlow,
    'net_cash_from_operations',
  );
  const netCashFromInvesting = getRowValues(
    output.cashFlow,
    'net_cash_from_investing',
  );
  const terminalStakeValue =
    terminalStakeValues[terminalStakeValues.length - 1] ?? null;
  const terminalEnterpriseValue =
    enterpriseValues[enterpriseValues.length - 1] ?? null;
  const projectCashFlowSeries = netCashFromOperations.map((value, index) => {
    const baseValue = value + (netCashFromInvesting[index] ?? 0);
    return index === netCashFromOperations.length - 1 && terminalEnterpriseValue
      ? baseValue + terminalEnterpriseValue
      : baseValue;
  });
  const investorCashFlowSeries = investorNetIncome.map((value, index) => {
    const baseValue = index === 0 ? -Math.abs(investorSubscription[index] ?? 0) : value;
    return index === investorNetIncome.length - 1 && terminalStakeValue
      ? baseValue + terminalStakeValue
      : baseValue;
  });
  const projectIrr = calculateIrr(projectCashFlowSeries);
  const equityIrr = calculateIrr(investorCashFlowSeries);
  const paybackPeriod = calculatePaybackPeriod(investorCashFlowSeries);
  const moic = calculateMoic(investorCashFlowSeries);
  const discountRatePct = output.assumptions['integrated.global.discount_rate_pct'] ?? null;
  const baseSummary = buildComputedReturnsSummary({
    title: 'Returns / Valuation',
    basisLabel:
      'Project IRR uses net cash from operations plus investing cash flow and terminal enterprise value. Equity IRR uses the investor subscription outflow, annual investor cash participation, and final-period stake value.',
    projectCashFlowSeries,
    equityCashFlowSeries: investorCashFlowSeries,
    discountRatePct,
    npvDescription:
      'NPV uses the currently configured discount rate against the modeled investor equity cash flow stream.',
  });

  return {
    ...baseSummary,
    cashFlowSeries: investorCashFlowSeries,
    metrics: [
      {
        id: 'project_irr',
        label: 'Project IRR',
        value: projectIrr !== null ? projectIrr * 100 : null,
        format: 'percent',
        description:
          'Cumulative project return from operating and investing cash flows plus terminal enterprise value.',
        status: projectIrr !== null ? ('ready' as const) : ('pending' as const),
      },
      {
        id: 'equity_irr',
        label: 'Equity IRR',
        value: equityIrr !== null ? equityIrr * 100 : null,
        format: 'percent',
        description: 'Cumulative investor return across the full modeled equity cash flow stream.',
        status: equityIrr !== null ? ('ready' as const) : ('pending' as const),
      },
      {
        ...baseSummary.metrics.find((metric) => metric.id === 'npv')!,
      },
      {
        id: 'payback_period',
        label: 'Payback Period',
        value: paybackPeriod,
        format: 'number',
        description:
          'Years required for cumulative investor cash flows to recover the initial subscription.',
        status: paybackPeriod !== null ? ('ready' as const) : ('pending' as const),
      },
      {
        id: 'moic',
        label: 'MOIC',
        value: moic,
        format: 'multiple',
        description: 'Multiple of invested capital across the same full investor cash flow stream.',
        status: moic !== null ? ('ready' as const) : ('pending' as const),
      },
      {
        id: 'terminal_equity_value',
        label: 'Terminal 25% Stake Value',
        value: terminalStakeValue !== null ? terminalStakeValue / 1_000_000 : null,
        format: 'currencyM',
        description:
          'Investor terminal value carried into the final-period equity cash flow stream.',
        status: terminalStakeValue !== null ? ('ready' as const) : ('pending' as const),
      },
    ],
  } satisfies EntityReturnsSummary;
}

export function normalizeAssumptions(assumptions: AssumptionValueMap) {
  return normalizeA2FleetAssumptions(assumptions);
}

export function buildDerivedAssumptions(normalizedAssumptions: NormalizedAssumptions) {
  const context = evaluateSheet('ASSUMPTIONS_DATA', {
    normalizedAssumptions,
    workbookValuesBySheet: normalizedAssumptions.workbookInputBySheet,
  });

  return {
    context,
    statement: extractStatement('derivedAssumptions', context.workbookValuesBySheet),
  };
}

export function calculateRevenueProjection(context: WorkbookComputationContext) {
  const nextContext = evaluateSheet('REVENUE PROJECTION', context);
  return {
    context: nextContext,
    statement: extractStatement('revenueProjection', nextContext.workbookValuesBySheet),
  };
}

export function calculateCapexDepreciation(context: WorkbookComputationContext) {
  const nextContext = evaluateSheet('CAPEX & DEPRECIATION', context);
  return {
    context: nextContext,
    statement: extractStatement('capexDepreciation', nextContext.workbookValuesBySheet),
  };
}

export function calculateSourceUseOfFunds(context: WorkbookComputationContext) {
  const nextContext = evaluateSheet('SOURCE_USE OF FUNDS', context);
  return {
    context: nextContext,
    statement: extractStatement('sourceUseOfFunds', nextContext.workbookValuesBySheet),
  };
}

export function calculateIncomeStatement(context: WorkbookComputationContext) {
  const nextContext = evaluateSheet('INCOME STATEMENT ', context);
  return {
    context: nextContext,
    statement: extractStatement('incomeStatement', nextContext.workbookValuesBySheet),
  };
}

export function calculateCashFlow(context: WorkbookComputationContext) {
  const nextContext = evaluateSheet('CASH FLOW', context);
  return {
    context: nextContext,
    statement: extractStatement('cashFlow', nextContext.workbookValuesBySheet),
  };
}

export function calculateBalanceSheet(context: WorkbookComputationContext) {
  const nextContext = evaluateSheet('BALANCE SHEET', context);
  return {
    context: nextContext,
    statement: extractStatement('balanceSheet', nextContext.workbookValuesBySheet),
  };
}

export function calculateValuationSummary(context: WorkbookComputationContext) {
  const nextContext = evaluateSheet('VALUATION SUMMARY', context);
  return {
    context: nextContext,
    statement: extractStatement('valuationSummary', nextContext.workbookValuesBySheet),
  };
}

export function calculateKeyMetrics(context: WorkbookComputationContext) {
  const nextContext = evaluateSheet('KEY METRICS', context);
  return {
    context: nextContext,
    statement: extractStatement('keyMetrics', nextContext.workbookValuesBySheet),
  };
}

export function runA2FleetWorkbook(
  assumptions: AssumptionValueMap,
): A2FleetWorkbookOutput {
  const normalizedAssumptions = normalizeAssumptions(assumptions);
  const derivedAssumptionsResult = buildDerivedAssumptions(normalizedAssumptions);
  const revenueProjectionResult = calculateRevenueProjection(
    derivedAssumptionsResult.context,
  );
  const capexDepreciationResult = calculateCapexDepreciation(
    revenueProjectionResult.context,
  );
  const sourceUseOfFundsResult = calculateSourceUseOfFunds(
    capexDepreciationResult.context,
  );
  const incomeStatementResult = calculateIncomeStatement(
    sourceUseOfFundsResult.context,
  );
  const cashFlowResult = calculateCashFlow(incomeStatementResult.context);
  const balanceSheetResult = calculateBalanceSheet(cashFlowResult.context);
  const valuationSummaryResult = calculateValuationSummary(balanceSheetResult.context);
  const keyMetricsResult = calculateKeyMetrics(valuationSummaryResult.context);

  const outputWithoutBaseline = {
    sourceWorkbook: a2FleetReference.source_workbook,
    sourceReferenceMarkdown: a2FleetReference.source_reference_markdown,
    normalizedAssumptions,
    knownWorkbookQuirks: [...a2FleetReference.known_quirks_and_audit_flags],
    workbookValuesBySheet: keyMetricsResult.context.workbookValuesBySheet,
    derivedAssumptions: derivedAssumptionsResult.statement,
    revenueProjection: revenueProjectionResult.statement,
    capexDepreciation: capexDepreciationResult.statement,
    sourceUseOfFunds: sourceUseOfFundsResult.statement,
    incomeStatement: incomeStatementResult.statement,
    cashFlow: cashFlowResult.statement,
    balanceSheet: balanceSheetResult.statement,
    valuationSummary: valuationSummaryResult.statement,
    keyMetrics: keyMetricsResult.statement,
    returnsSummary: buildFleetReturnsSummary({
      assumptions,
      sourceUseOfFunds: sourceUseOfFundsResult.statement,
      incomeStatement: incomeStatementResult.statement,
      cashFlow: cashFlowResult.statement,
      valuationSummary: valuationSummaryResult.statement,
    }),
  };

  return {
    ...outputWithoutBaseline,
    baselineComparison: buildBaselineComparison(outputWithoutBaseline),
  };
}
