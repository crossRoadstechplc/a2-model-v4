import type { AssumptionValueMap } from '../../model/assumptions';
import {
  buildComputedReturnsSummary,
  calculateIrr,
  calculateMoic,
  calculatePaybackPeriod,
  type ReturnMetricCard,
  type EntityReturnsSummary,
} from '../returns';
import {
  createWorkbookCellGetter,
  type WorkbookSheetValues,
} from './formula';
import {
  buildFleetProjectCashFlowSeries,
  buildFleetWorkbookEquityIrrSeries,
  getFleetWorkbookEquityIrrValue,
} from './returns';
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

function buildFleetReturnsSummary(output: {
  assumptions: AssumptionValueMap;
  workbookValuesBySheet: WorkbookSheetValues;
  sourceUseOfFunds: PeriodizedStatement;
  incomeStatement: PeriodizedStatement;
  cashFlow: PeriodizedStatement;
  valuationSummary: PeriodizedStatement;
}) {
  const terminalStakeValues = output.valuationSummary.rows.find(
    (row) => row.key === 'investor_25_stake_value',
  )?.values ?? [];
  const workbookEquityIrrSeries = buildFleetWorkbookEquityIrrSeries(
    output.workbookValuesBySheet,
  );
  const workbookEquityIrr = getFleetWorkbookEquityIrrValue(output.workbookValuesBySheet);
  const projectCashFlow = buildFleetProjectCashFlowSeries({
    incomeStatement: output.incomeStatement,
    cashFlow: output.cashFlow,
    valuationSummary: output.valuationSummary,
  });
  const projectIrr = calculateIrr(projectCashFlow.series);
  const paybackPeriod = calculatePaybackPeriod(workbookEquityIrrSeries);
  const moic = calculateMoic(workbookEquityIrrSeries);
  const discountRatePct = output.assumptions['integrated.global.discount_rate_pct'] ?? null;
  const baseSummary = buildComputedReturnsSummary({
    title: 'Returns / Valuation',
    basisLabel:
      'Fleet Equity IRR is workbook-faithful and comes from the literal replication row `INCOME STATEMENT!C19:O19`. Fleet Project IRR uses a separate FCFF-style project cash flow series for investment appraisal.',
    projectCashFlowSeries: projectCashFlow.series,
    equityCashFlowSeries: workbookEquityIrrSeries,
    discountRatePct,
    projectIrrNotes: projectCashFlow.notes,
    equityIrrNotes: [
      'Workbook-faithful investor IRR series from the literal replicated row `INCOME STATEMENT!C19:O19`.',
      'This is replication-mode logic and should match the workbook IRR behavior within tolerance.',
    ],
    npvDescription:
      'NPV uses the currently configured discount rate against the workbook-faithful Fleet equity cash flow stream.',
    terminalValuePolicy: {
      method: 'equityStake',
      value: terminalStakeValues[terminalStakeValues.length - 1] ?? null,
      note: 'Final-period 25% investor stake value from the workbook valuation summary is carried into the workbook-equity IRR stream.',
    },
    seriesDefinitions: [
      {
        type: 'project',
        label: 'Fleet project FCFF series',
        values: projectCashFlow.series,
        note: 'Explicit project cash flow basis used for Fleet Project IRR.',
      },
      {
        type: 'equity',
        label: 'Fleet workbook equity IRR series',
        values: workbookEquityIrrSeries,
        note: 'Literal workbook replication row `INCOME STATEMENT!C19:O19` used for Equity IRR.',
      },
      {
        type: 'workbookParity',
        label: 'Fleet workbook parity series',
        values: workbookEquityIrrSeries,
        note: 'This series is the source-of-truth replication input for the workbook IRR calculation.',
      },
    ],
    notes: [
      'Project IRR and Equity IRR are intentionally separated: the first is explicit project FCFF, the second is workbook-faithful investor IRR.',
    ],
  });
  const terminalStakeValue = terminalStakeValues[terminalStakeValues.length - 1] ?? null;
  const additionalMetrics: ReturnMetricCard[] = [
    {
      id: 'terminal_equity_value',
      label: 'Terminal 25% Stake Value',
      value: terminalStakeValue !== null ? terminalStakeValue / 1_000_000 : null,
      format: 'currencyM',
      description:
        'Investor terminal value carried into the final-period workbook-equity cash flow stream.',
      status: terminalStakeValue !== null ? 'ready' : 'pending',
    },
  ];

  return {
    ...baseSummary,
    cashFlowSeries: workbookEquityIrrSeries,
    returnsMetrics: {
      ...baseSummary.returnsMetrics,
      projectIrr: {
        ...baseSummary.returnsMetrics.projectIrr,
        value: projectIrr !== null ? projectIrr * 100 : null,
        description:
          'Explicit FCFF-based project return built separately from the workbook-equity IRR stream.',
        status: projectIrr !== null ? 'ready' : 'pending',
      },
      equityIrr: {
        ...baseSummary.returnsMetrics.equityIrr,
        value: workbookEquityIrr !== null ? workbookEquityIrr * 100 : null,
        description:
          'Workbook-faithful investor IRR from the literal replicated row `INCOME STATEMENT!C19:O19`.',
        status: workbookEquityIrr !== null ? 'ready' : 'pending',
      },
      paybackPeriod: {
        ...baseSummary.returnsMetrics.paybackPeriod,
        value: paybackPeriod,
        description:
          'Years required for cumulative workbook-equity cash flows to recover the investor outflow.',
        status: paybackPeriod !== null ? 'ready' : 'pending',
      },
      moic: {
        ...baseSummary.returnsMetrics.moic,
        value: moic,
        description:
          'Multiple of invested capital across the same workbook-faithful equity cash flow stream.',
        status: moic !== null ? 'ready' : 'pending',
      },
    },
    additionalMetrics,
    metrics: [
      {
        ...baseSummary.returnsMetrics.projectIrr,
        value: projectIrr !== null ? projectIrr * 100 : null,
        description:
          'Explicit FCFF-based project return built separately from the workbook-equity IRR stream.',
        status: projectIrr !== null ? 'ready' : 'pending',
      },
      {
        ...baseSummary.returnsMetrics.equityIrr,
        value: workbookEquityIrr !== null ? workbookEquityIrr * 100 : null,
        description:
          'Workbook-faithful investor IRR from the literal replicated row `INCOME STATEMENT!C19:O19`.',
        status: workbookEquityIrr !== null ? 'ready' : 'pending',
      },
      baseSummary.returnsMetrics.npv,
      {
        ...baseSummary.returnsMetrics.paybackPeriod,
        value: paybackPeriod,
        description:
          'Years required for cumulative workbook-equity cash flows to recover the investor outflow.',
        status: paybackPeriod !== null ? 'ready' : 'pending',
      },
      {
        ...baseSummary.returnsMetrics.moic,
        value: moic,
        description:
          'Multiple of invested capital across the same workbook-faithful equity cash flow stream.',
        status: moic !== null ? 'ready' : 'pending',
      },
      ...additionalMetrics,
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
      workbookValuesBySheet: keyMetricsResult.context.workbookValuesBySheet,
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
