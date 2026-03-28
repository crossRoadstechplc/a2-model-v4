import type { TerminalValuePolicy } from '../returns';
import type { WorkbookSheetValues } from './formula';

type StatementLike = {
  rows: Array<{
    key: string;
    values: number[];
  }>;
};

const FLEET_WORKBOOK_IRR_SERIES_CELLS = [
  'C19',
  'D19',
  'E19',
  'F19',
  'G19',
  'H19',
  'I19',
  'J19',
  'K19',
  'L19',
  'M19',
  'N19',
  'O19',
] as const;

const FLEET_WORKBOOK_IRR_RESULT_CELL = 'D21';

function getRowValues(statement: StatementLike, key: string) {
  return statement.rows.find((row) => row.key === key)?.values ?? [];
}

/**
 * Workbook-faithful Fleet equity IRR replication.
 * The source of truth is the literal workbook IRR row in `INCOME STATEMENT !C19:O19`
 * that feeds the Excel formula `IRR(C19:O19, 0.1)`.
 */
export function buildFleetWorkbookEquityIrrSeries(workbookValuesBySheet: WorkbookSheetValues) {
  const sheetValues = workbookValuesBySheet['INCOME STATEMENT '] ?? {};
  return FLEET_WORKBOOK_IRR_SERIES_CELLS.map((cell) => sheetValues[cell] ?? 0);
}

export function getFleetWorkbookEquityIrrValue(workbookValuesBySheet: WorkbookSheetValues) {
  const sheetValues = workbookValuesBySheet['INCOME STATEMENT '] ?? {};
  return sheetValues[FLEET_WORKBOOK_IRR_RESULT_CELL] ?? null;
}

/**
 * Fleet Project IRR uses an explicit FCFF-style series rather than a mixed accounting row.
 * Working capital is not modeled explicitly in the current workbook replication, so the
 * present approximation is:
 *   project FCFF = EBIT proxy after tax + depreciation - capex + terminal enterprise value
 *
 * In the workbook replication there is no debt service line, so EBT currently acts as the
 * best available EBIT proxy.
 */
export function buildFleetProjectCashFlowSeries(params: {
  incomeStatement: StatementLike;
  cashFlow: StatementLike;
  valuationSummary: StatementLike;
}) {
  const ebt = getRowValues(params.incomeStatement, 'ebt');
  const tax = getRowValues(params.incomeStatement, 'tax');
  const depreciation = getRowValues(params.incomeStatement, 'depreciation');
  const capex = getRowValues(params.cashFlow, 'capex');
  const enterpriseValue = getRowValues(params.valuationSummary, 'enterprise_value');
  const terminalEnterpriseValue = enterpriseValue[enterpriseValue.length - 1] ?? 0;

  const series = ebt.map((value, index) => {
    const cashTax = Math.max(0, tax[index] ?? 0);
    const capexOutflow = Math.abs(capex[index] ?? 0);
    const fcff =
      value -
      cashTax +
      (depreciation[index] ?? 0) -
      capexOutflow;
    return index === ebt.length - 1 ? fcff + terminalEnterpriseValue : fcff;
  });

  return {
    series,
    notes: [
      'Project IRR uses an explicit FCFF-style build from EBT proxy less tax, plus depreciation, less capex.',
      'Working capital is not modeled explicitly in the current workbook replication and is therefore treated as zero in this project cash flow approximation.',
    ],
    terminalValuePolicy: {
      method: 'enterpriseMultiple',
      value: terminalEnterpriseValue,
      note: 'Final-period enterprise value from the workbook valuation summary is carried into the project cash flow series.',
    } satisfies TerminalValuePolicy,
  };
}
