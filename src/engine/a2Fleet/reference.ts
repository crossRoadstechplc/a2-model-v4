import referenceJson from '../../../Docs/A2_Fleet_Model_Replication_Reference.json';

export type WorkbookSheetName =
  | 'ASSUMPTIONS_DATA'
  | 'REVENUE PROJECTION'
  | 'CAPEX & DEPRECIATION'
  | 'SOURCE_USE OF FUNDS'
  | 'INCOME STATEMENT '
  | 'CASH FLOW'
  | 'BALANCE SHEET'
  | 'VALUATION SUMMARY'
  | 'KEY METRICS';

export type WorkbookCellFormulaSpec = {
  formula: string;
  value: number | string | null;
  precedents: Array<{
    sheet: string;
    cell: string;
  }>;
};

export type WorkbookFormulaMap = Partial<
  Record<WorkbookSheetName, Record<string, WorkbookCellFormulaSpec>>
>;

type BaselineTargetSpec = {
  sheet: WorkbookSheetName;
  row: number;
  series: Record<string, number>;
};

type ReferenceJsonShape = {
  source_workbook: string;
  source_reference_markdown: string;
  known_quirks_and_audit_flags: string[];
  baseline_output_targets: Record<string, BaselineTargetSpec>;
  full_formula_map: WorkbookFormulaMap;
};

type StatementRowDefinition = {
  key: string;
  label: string;
  unit: string;
  cells: string[];
};

type StatementDefinition = {
  sheet: WorkbookSheetName;
  periods: string[];
  rows: StatementRowDefinition[];
};

const referenceData = referenceJson as unknown as ReferenceJsonShape;

export const a2FleetReference = referenceData;

export const WORKBOOK_STAGE_ORDER: WorkbookSheetName[] = [
  'ASSUMPTIONS_DATA',
  'REVENUE PROJECTION',
  'CAPEX & DEPRECIATION',
  'SOURCE_USE OF FUNDS',
  'INCOME STATEMENT ',
  'CASH FLOW',
  'BALANCE SHEET',
  'VALUATION SUMMARY',
  'KEY METRICS',
];

export const ASSUMPTION_PERIODS = [
  'CY-2027',
  'CY-2028',
  'CY-2029',
  'CY-2030',
  'CY-2031',
  'CY-2032',
  'CY-2033',
  'CY-2034',
  'CY-2035',
  'CY-2036',
  'CY-2037',
] as const;

export const STATEMENT_PERIODS = [
  'CY-2026',
  'CY-2027',
  'CY-2028',
  'CY-2029',
  'CY-2030',
  'CY-2031',
  'CY-2032',
  'CY-2033',
  'CY-2034',
  'CY-2035',
  'CY-2036',
  'CY-2037',
] as const;

export const VALUATION_PERIODS = [
  'CY-2028',
  'CY-2030',
  'CY-2033',
  'CY-2035',
  'CY-2036',
  'CY-2037',
] as const;

export const A2_FLEET_BASELINE_TOLERANCE = {
  absolute: 0.01,
  relative: 0.000001,
} as const;

export const workbookConstantCells: Record<string, number> = {
  'CAPEX & DEPRECIATION!C3': 15,
  'CAPEX & DEPRECIATION!C4': 8,
  'CAPEX & DEPRECIATION!C5': 10,
  'INCOME STATEMENT !D7': 5_000_000,
  'CASH FLOW!I14': 0.25,
  'CASH FLOW!J14': 0.25,
  'CASH FLOW!K14': 0.25,
  'CASH FLOW!L14': 0.25,
  'CASH FLOW!M14': 0.25,
  'CASH FLOW!N14': 0.25,
  'VALUATION SUMMARY!C4': 2,
  'VALUATION SUMMARY!D4': 4,
  'VALUATION SUMMARY!E4': 5,
  'VALUATION SUMMARY!F4': 5,
  'VALUATION SUMMARY!G4': 8,
  'VALUATION SUMMARY!H4': 8,
};

export const statementDefinitions: Record<string, StatementDefinition> = {
  derivedAssumptions: {
    sheet: 'ASSUMPTIONS_DATA',
    periods: [...ASSUMPTION_PERIODS],
    rows: [
      {
        key: 'trucks_in_operation',
        label: 'Number of Trucks in Operation',
        unit: 'count',
        cells: ['D16', 'E16', 'F16', 'G16', 'H16', 'I16', 'J16', 'K16', 'L16', 'M16', 'N16'],
      },
      {
        key: 'fleet_km',
        label: 'Total Kilometres of Fleet',
        unit: 'km',
        cells: ['D18', 'E18', 'F18', 'G18', 'H18', 'I18', 'J18', 'K18', 'L18', 'M18', 'N18'],
      },
      {
        key: 'energy_purchased',
        label: 'Total Energy Purchased',
        unit: 'kWh',
        cells: ['D20', 'E20', 'F20', 'G20', 'H20', 'I20', 'J20', 'K20', 'L20', 'M20', 'N20'],
      },
      {
        key: 'energy_cost',
        label: 'Total Cost of Energy',
        unit: '$',
        cells: ['D22', 'E22', 'F22', 'G22', 'H22', 'I22', 'J22', 'K22', 'L22', 'M22', 'N22'],
      },
      {
        key: 'fleet_trips',
        label: 'Number of Trips of Fleet per Year',
        unit: 'count',
        cells: ['D27', 'E27', 'F27', 'G27', 'H27', 'I27', 'J27', 'K27', 'L27', 'M27', 'N27'],
      },
      {
        key: 'chargeable_tonnes',
        label: 'Chargeable Tonnes of Fleet per Year',
        unit: 'tonnes',
        cells: ['D30', 'E30', 'F30', 'G30', 'H30', 'I30', 'J30', 'K30', 'L30', 'M30', 'N30'],
      },
      {
        key: 'freight_rate_usd',
        label: 'Freight Rate per Tonne (USD)',
        unit: '$',
        cells: ['D32', 'E32', 'F32', 'G32', 'H32', 'I32', 'J32', 'K32', 'L32', 'M32', 'N32'],
      },
      {
        key: 'freight_revenue',
        label: 'Total Freight Revenue',
        unit: '$',
        cells: ['D33', 'E33', 'F33', 'G33', 'H33', 'I33', 'J33', 'K33', 'L33', 'M33', 'N33'],
      },
    ],
  },
  revenueProjection: {
    sheet: 'REVENUE PROJECTION',
    periods: [...ASSUMPTION_PERIODS],
    rows: [
      {
        key: 'chargeable_tonnes',
        label: 'Chargeable Tonnes of Freight',
        unit: 'tonnes',
        cells: ['C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3', 'M3'],
      },
      {
        key: 'rate_per_tonne',
        label: 'Rate per Tonne',
        unit: '$',
        cells: ['C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4', 'M4'],
      },
      {
        key: 'revenue_from_freight_charges',
        label: 'Revenue from Freight Charges',
        unit: '$',
        cells: ['C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5'],
      },
    ],
  },
  capexDepreciation: {
    sheet: 'CAPEX & DEPRECIATION',
    periods: [...STATEMENT_PERIODS],
    rows: [
      {
        key: 'electric_trucks',
        label: 'Electric Trucks',
        unit: '$',
        cells: ['E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3', 'M3', 'N3', 'O3', 'P3'],
      },
      {
        key: 'fleet_management_software',
        label: 'Fleet Management Software',
        unit: '$',
        cells: ['E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4', 'M4', 'N4', 'O4', 'P4'],
      },
      {
        key: 'hardware_and_office_equipment',
        label: 'Hardware and Office Equipment',
        unit: '$',
        cells: ['E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5', 'N5', 'O5', 'P5'],
      },
      {
        key: 'total_capex',
        label: 'Total CAPEX',
        unit: '$',
        cells: ['E6', 'F6', 'G6', 'H6', 'I6', 'J6', 'K6', 'L6', 'M6', 'N6', 'O6', 'P6'],
      },
      {
        key: 'total_depreciation',
        label: 'Total Depreciation',
        unit: '$',
        cells: ['E24', 'F24', 'G24', 'H24', 'I24', 'J24', 'K24', 'L24', 'M24', 'N24', 'O24', 'P24'],
      },
      {
        key: 'truck_asset_value',
        label: 'Truck Asset Value',
        unit: '$',
        cells: ['E28', 'F28', 'G28', 'H28', 'I28', 'J28', 'K28', 'L28', 'M28', 'N28', 'O28', 'P28'],
      },
      {
        key: 'software_asset_value',
        label: 'Software Asset Value',
        unit: '$',
        cells: ['E29', 'F29', 'G29', 'H29', 'I29', 'J29', 'K29', 'L29', 'M29', 'N29', 'O29', 'P29'],
      },
      {
        key: 'hardware_asset_value',
        label: 'Hardware Asset Value',
        unit: '$',
        cells: ['E30', 'F30', 'G30', 'H30', 'I30', 'J30', 'K30', 'L30', 'M30', 'N30', 'O30', 'P30'],
      },
    ],
  },
  sourceUseOfFunds: {
    sheet: 'SOURCE_USE OF FUNDS',
    periods: [...STATEMENT_PERIODS],
    rows: [
      {
        key: 'investor_subscription',
        label: 'Investor Subscription (25%)',
        unit: '$',
        cells: ['C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5', 'N5'],
      },
      {
        key: 'change_in_equity',
        label: 'Change in Equity',
        unit: '$',
        cells: ['C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'I6', 'J6', 'K6', 'L6', 'M6', 'N6'],
      },
      {
        key: 'total_use_of_funds',
        label: 'Total Use of Funds',
        unit: '$',
        cells: ['C14', 'D14', 'E14', 'F14', 'G14', 'H14', 'I14', 'J14', 'K14', 'L14', 'M14', 'N14'],
      },
    ],
  },
  incomeStatement: {
    sheet: 'INCOME STATEMENT ',
    periods: [...STATEMENT_PERIODS],
    rows: [
      { key: 'revenue', label: 'Revenue', unit: '$', cells: ['C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3', 'M3', 'N3'] },
      { key: 'battery_charge', label: 'Battery Charge', unit: '$', cells: ['C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4', 'M4', 'N4'] },
      { key: 'gross_margin', label: 'Gross Margin', unit: '$', cells: ['C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5', 'N5'] },
      { key: 'operating_expenses', label: 'Operating Expenses', unit: '$', cells: ['C7', 'D7', 'E7', 'F7', 'G7', 'H7', 'I7', 'J7', 'K7', 'L7', 'M7', 'N7'] },
      { key: 'variable_opex', label: 'Variable OPEX', unit: '$', cells: ['C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8', 'K8', 'L8', 'M8', 'N8'] },
      { key: 'ebitda', label: 'EBITDA', unit: '$', cells: ['C9', 'D9', 'E9', 'F9', 'G9', 'H9', 'I9', 'J9', 'K9', 'L9', 'M9', 'N9'] },
      { key: 'depreciation', label: 'Depreciation', unit: '$', cells: ['C10', 'D10', 'E10', 'F10', 'G10', 'H10', 'I10', 'J10', 'K10', 'L10', 'M10', 'N10'] },
      { key: 'ebt', label: 'EBT', unit: '$', cells: ['C11', 'D11', 'E11', 'F11', 'G11', 'H11', 'I11', 'J11', 'K11', 'L11', 'M11', 'N11'] },
      { key: 'tax', label: 'Tax', unit: '$', cells: ['C12', 'D12', 'E12', 'F12', 'G12', 'H12', 'I12', 'J12', 'K12', 'L12', 'M12', 'N12'] },
      { key: 'net_income', label: 'Net Income', unit: '$', cells: ['C14', 'D14', 'E14', 'F14', 'G14', 'H14', 'I14', 'J14', 'K14', 'L14', 'M14', 'N14'] },
      { key: 'investor_net_income_25pct', label: 'Investor Net Income 25%', unit: '$', cells: ['C19', 'D19', 'E19', 'F19', 'G19', 'H19', 'I19', 'J19', 'K19', 'L19', 'M19', 'N19'] },
    ],
  },
  cashFlow: {
    sheet: 'CASH FLOW',
    periods: [...STATEMENT_PERIODS],
    rows: [
      { key: 'net_income', label: 'Net Income', unit: '$', cells: ['C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4', 'M4', 'N4'] },
      { key: 'depreciation', label: 'Depreciation', unit: '$', cells: ['C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5', 'N5'] },
      { key: 'net_cash_from_operations', label: 'Net Cash from Operations', unit: '$', cells: ['C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'I6', 'J6', 'K6', 'L6', 'M6', 'N6'] },
      { key: 'capex', label: 'CAPEX', unit: '$', cells: ['C9', 'D9', 'E9', 'F9', 'G9', 'H9', 'I9', 'J9', 'K9', 'L9', 'M9', 'N9'] },
      { key: 'net_cash_from_investing', label: 'Net Cash from Investing', unit: '$', cells: ['C10', 'D10', 'E10', 'F10', 'G10', 'H10', 'I10', 'J10', 'K10', 'L10', 'M10', 'N10'] },
      { key: 'equity_injection', label: 'Equity Injection', unit: '$', cells: ['C13', 'D13', 'E13', 'F13', 'G13', 'H13', 'I13', 'J13', 'K13', 'L13', 'M13', 'N13'] },
      { key: 'dividend', label: 'Dividend', unit: '$', cells: ['C15', 'D15', 'E15', 'F15', 'G15', 'H15', 'I15', 'J15', 'K15', 'L15', 'M15', 'N15'] },
      { key: 'dividend_tax', label: 'Dividend Tax', unit: '$', cells: ['C16', 'D16', 'E16', 'F16', 'G16', 'H16', 'I16', 'J16', 'K16', 'L16', 'M16', 'N16'] },
      { key: 'net_cash_from_financing', label: 'Net Cash from Financing', unit: '$', cells: ['C17', 'D17', 'E17', 'F17', 'G17', 'H17', 'I17', 'J17', 'K17', 'L17', 'M17', 'N17'] },
      { key: 'net_change_in_cash', label: 'Net Change in Cash', unit: '$', cells: ['C19', 'D19', 'E19', 'F19', 'G19', 'H19', 'I19', 'J19', 'K19', 'L19', 'M19', 'N19'] },
      { key: 'opening_cash', label: 'Opening Cash', unit: '$', cells: ['C21', 'D21', 'E21', 'F21', 'G21', 'H21', 'I21', 'J21', 'K21', 'L21', 'M21', 'N21'] },
      { key: 'closing_cash', label: 'Closing Cash', unit: '$', cells: ['C22', 'D22', 'E22', 'F22', 'G22', 'H22', 'I22', 'J22', 'K22', 'L22', 'M22', 'N22'] },
    ],
  },
  balanceSheet: {
    sheet: 'BALANCE SHEET',
    periods: [...STATEMENT_PERIODS],
    rows: [
      { key: 'cash', label: 'Cash', unit: '$', cells: ['C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5', 'N5'] },
      { key: 'total_current_assets', label: 'Total Current Assets', unit: '$', cells: ['C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'I6', 'J6', 'K6', 'L6', 'M6', 'N6'] },
      { key: 'trucks', label: 'Trucks', unit: '$', cells: ['C9', 'D9', 'E9', 'F9', 'G9', 'H9', 'I9', 'J9', 'K9', 'L9', 'M9', 'N9'] },
      { key: 'software', label: 'Software', unit: '$', cells: ['C10', 'D10', 'E10', 'F10', 'G10', 'H10', 'I10', 'J10', 'K10', 'L10', 'M10', 'N10'] },
      { key: 'hardware', label: 'Hardware', unit: '$', cells: ['C11', 'D11', 'E11', 'F11', 'G11', 'H11', 'I11', 'J11', 'K11', 'L11', 'M11', 'N11'] },
      { key: 'total_non_current_assets', label: 'Total Non-Current Assets', unit: '$', cells: ['C12', 'D12', 'E12', 'F12', 'G12', 'H12', 'I12', 'J12', 'K12', 'L12', 'M12', 'N12'] },
      { key: 'total_assets', label: 'Total Assets', unit: '$', cells: ['C13', 'D13', 'E13', 'F13', 'G13', 'H13', 'I13', 'J13', 'K13', 'L13', 'M13', 'N13'] },
      { key: 'equity', label: 'Equity', unit: '$', cells: ['C16', 'D16', 'E16', 'F16', 'G16', 'H16', 'I16', 'J16', 'K16', 'L16', 'M16', 'N16'] },
      { key: 'retained_earnings', label: 'Retained Earnings', unit: '$', cells: ['C17', 'D17', 'E17', 'F17', 'G17', 'H17', 'I17', 'J17', 'K17', 'L17', 'M17', 'N17'] },
      { key: 'total_equity', label: 'Total Equity', unit: '$', cells: ['C18', 'D18', 'E18', 'F18', 'G18', 'H18', 'I18', 'J18', 'K18', 'L18', 'M18', 'N18'] },
    ],
  },
  valuationSummary: {
    sheet: 'VALUATION SUMMARY',
    periods: [...VALUATION_PERIODS],
    rows: [
      { key: 'ebitda', label: 'EBITDA', unit: '$', cells: ['C3', 'D3', 'E3', 'F3', 'G3', 'H3'] },
      { key: 'valuation_multiple', label: 'Valuation Multiple', unit: 'x', cells: ['C4', 'D4', 'E4', 'F4', 'G4', 'H4'] },
      { key: 'enterprise_value', label: 'Enterprise Value', unit: '$', cells: ['C5', 'D5', 'E5', 'F5', 'G5', 'H5'] },
      { key: 'net_debt', label: 'Net Debt', unit: '$', cells: ['C6', 'D6', 'E6', 'F6', 'G6', 'H6'] },
      { key: 'equity_value', label: 'Equity Value', unit: '$', cells: ['C7', 'D7', 'E7', 'F7', 'G7', 'H7'] },
      { key: 'investor_25_stake_value', label: 'Investor 25% Stake Value', unit: '$', cells: ['C8', 'D8', 'E8', 'F8', 'G8', 'H8'] },
      { key: 'moic', label: 'MOIC', unit: 'x', cells: ['C9', 'D9', 'E9', 'F9', 'G9', 'H9'] },
    ],
  },
  keyMetrics: {
    sheet: 'KEY METRICS',
    periods: [...ASSUMPTION_PERIODS],
    rows: [
      { key: 'ebitda_margin', label: 'EBITDA Margin', unit: '%', cells: ['C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3', 'M3'] },
      { key: 'net_margin', label: 'Net Margin', unit: '%', cells: ['C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4', 'M4'] },
      { key: 'roe', label: 'ROE', unit: '%', cells: ['C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5'] },
    ],
  },
};
