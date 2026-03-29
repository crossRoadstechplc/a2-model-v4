import referenceJson from '../../../Docs/A2_Charging_Platform_Model_Replication_Reference.json';

export type WorkbookSheetName =
  | 'ASSUMPTIONS_DATA'
  | 'POWER CALCULATIONS'
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
  'POWER CALCULATIONS',
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
  'ASSUMPTIONS_DATA!C3': 220,
  'ASSUMPTIONS_DATA!C4': 7,
  'ASSUMPTIONS_DATA!D4': 7,
  'ASSUMPTIONS_DATA!E4': 7,
  'ASSUMPTIONS_DATA!F4': 7,
  'ASSUMPTIONS_DATA!G4': 7,
  'ASSUMPTIONS_DATA!H4': 7,
  'ASSUMPTIONS_DATA!I4': 7,
  'ASSUMPTIONS_DATA!J4': 7,
  'ASSUMPTIONS_DATA!K4': 7,
  'ASSUMPTIONS_DATA!L4': 7,
  'ASSUMPTIONS_DATA!M4': 7,
  'ASSUMPTIONS_DATA!N4': 7,
  'ASSUMPTIONS_DATA!D5': 714,
  'ASSUMPTIONS_DATA!E5': 714,
  'ASSUMPTIONS_DATA!F5': 714,
  'ASSUMPTIONS_DATA!G5': 714,
  'ASSUMPTIONS_DATA!H5': 714,
  'ASSUMPTIONS_DATA!I5': 714,
  'ASSUMPTIONS_DATA!J5': 716,
  'ASSUMPTIONS_DATA!C7': 1,
  'ASSUMPTIONS_DATA!D7': 1,
  'ASSUMPTIONS_DATA!E7': 1,
  'ASSUMPTIONS_DATA!F7': 1,
  'ASSUMPTIONS_DATA!G7': 1,
  'ASSUMPTIONS_DATA!H7': 1,
  'ASSUMPTIONS_DATA!I7': 1,
  'ASSUMPTIONS_DATA!J7': 1,
  'ASSUMPTIONS_DATA!K7': 1,
  'ASSUMPTIONS_DATA!L7': 1,
  'ASSUMPTIONS_DATA!M7': 1,
  'ASSUMPTIONS_DATA!N7': 1,
  'ASSUMPTIONS_DATA!C9': 7,
  'ASSUMPTIONS_DATA!C11': 18,
  'ASSUMPTIONS_DATA!C14': 7,
  'ASSUMPTIONS_DATA!C15': 7,
  'ASSUMPTIONS_DATA!J16': 103,
  'ASSUMPTIONS_DATA!D18': 7,
  'ASSUMPTIONS_DATA!E18': 14,
  'ASSUMPTIONS_DATA!F18': 14,
  'ASSUMPTIONS_DATA!G18': 21,
  'ASSUMPTIONS_DATA!H18': 28,
  'ASSUMPTIONS_DATA!I18': 28,
  'ASSUMPTIONS_DATA!J18': 28,
  'ASSUMPTIONS_DATA!K18': 35,
  'ASSUMPTIONS_DATA!L18': 35,
  'ASSUMPTIONS_DATA!M18': 35,
  'ASSUMPTIONS_DATA!N18': 35,
  'ASSUMPTIONS_DATA!C19': 1.5,
  'ASSUMPTIONS_DATA!C24': 1_000_000,
  'ASSUMPTIONS_DATA!C25': 100_000,
  'ASSUMPTIONS_DATA!C26': 400_000,
  'ASSUMPTIONS_DATA!C27': 65_000,
  'ASSUMPTIONS_DATA!C28': 70_000,
  'ASSUMPTIONS_DATA!D34': 1_000_000,
  'ASSUMPTIONS_DATA!E34': 500_000,
  'ASSUMPTIONS_DATA!F34': 500_000,
  'ASSUMPTIONS_DATA!G34': 500_000,
  'ASSUMPTIONS_DATA!H34': 500_000,
  'ASSUMPTIONS_DATA!C35': 2_000_000,
  'ASSUMPTIONS_DATA!C36': 10_000_000,
  'ASSUMPTIONS_DATA!C37': 5_000_000,
  'POWER CALCULATIONS!C3': 5_000,
  'POWER CALCULATIONS!C4': 60_000,
  'POWER CALCULATIONS!C5': 60_000,
  'POWER CALCULATIONS!C6': 588,
  'POWER CALCULATIONS!C7': 350,
  'POWER CALCULATIONS!C8': 220,
  'POWER CALCULATIONS!C13': 1,
  'POWER CALCULATIONS!C14': 588,
  'POWER CALCULATIONS!C16': 0.1,
  'POWER CALCULATIONS!C17': 0.2,
  'POWER CALCULATIONS!C21': 7,
  'POWER CALCULATIONS!C28': 7,
  'CAPEX & DEPRECIATION!C3': 12,
  'CAPEX & DEPRECIATION!C4': 12,
  'CAPEX & DEPRECIATION!C5': 10,
  'CAPEX & DEPRECIATION!C6': 8,
  'CAPEX & DEPRECIATION!C7': 10,
  'CAPEX & DEPRECIATION!C38': 8,
  'INCOME STATEMENT !C9': 1_000_000,
  'INCOME STATEMENT !D9': 3_000_000,
  'VALUATION SUMMARY!C4': 10,
  'VALUATION SUMMARY!D4': 12,
  'VALUATION SUMMARY!E4': 12,
  'VALUATION SUMMARY!F4': 12,
  'VALUATION SUMMARY!G4': 12,
  'VALUATION SUMMARY!H4': 12,
};

export const statementDefinitions: Record<string, StatementDefinition> = {
  derivedAssumptions: {
    sheet: 'ASSUMPTIONS_DATA',
    periods: [...ASSUMPTION_PERIODS],
    rows: [
      {
        key: 'number_of_stations',
        label: 'Number of Stations',
        unit: 'count',
        cells: ['D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4', 'M4', 'N4'],
      },
      {
        key: 'number_of_trucks_added',
        label: 'Number of Trucks Added',
        unit: 'count',
        cells: ['D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5', 'N5'],
      },
      {
        key: 'number_of_trucks_cumalative',
        label: 'Number of Trucks Cumalative',
        unit: 'count',
        cells: ['D6', 'E6', 'F6', 'G6', 'H6', 'I6', 'J6', 'K6', 'L6', 'M6', 'N6'],
      },
      {
        key: 'number_of_total_swaps_per_day',
        label: 'Number of Total Swaps Per Day',
        unit: 'count',
        cells: ['D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8', 'K8', 'L8', 'M8', 'N8'],
      },
      {
        key: 'number_of_chargers_required',
        label: 'Number of Chargers Required',
        unit: 'count',
        cells: ['D16', 'E16', 'F16', 'G16', 'H16', 'I16', 'J16', 'K16', 'L16', 'M16', 'N16'],
      },
      {
        key: 'number_of_swapping_bays_per_station',
        label: 'Number of Swapping Bays Per Station',
        unit: 'count',
        cells: ['D18', 'E18', 'F18', 'G18', 'H18', 'I18', 'J18', 'K18', 'L18', 'M18', 'N18'],
      },
      {
        key: 'total_number_of_battery_packs',
        label: 'Total Number of Battery Packs',
        unit: 'count',
        cells: ['D22', 'E22', 'F22', 'G22', 'H22', 'I22', 'J22', 'K22', 'L22', 'M22', 'N22'],
      },
      {
        key: 'total_investment',
        label: 'Total Investment',
        unit: '$',
        cells: ['D38', 'E38', 'F38', 'G38', 'H38', 'I38', 'J38', 'K38', 'L38', 'M38', 'N38'],
      },
    ],
  },
  powerCalculations: {
    sheet: 'POWER CALCULATIONS',
    periods: [...ASSUMPTION_PERIODS],
    rows: [
      {
        key: 'number_of_trucks',
        label: 'Number of Trucks',
        unit: 'count',
        cells: ['D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3', 'M3', 'N3'],
      },
      {
        key: 'total_kilometres_of_fleet',
        label: 'Total Kilometres of Fleet',
        unit: 'km',
        cells: ['D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5', 'N5'],
      },
      {
        key: 'total_energy_use_for_fleet',
        label: 'Total Energy Use for Fleet',
        unit: 'MWh',
        cells: ['D12', 'E12', 'F12', 'G12', 'H12', 'I12', 'J12', 'K12', 'L12', 'M12', 'N12'],
      },
      {
        key: 'number_of_chargers',
        label: 'Number of Chargers',
        unit: 'count',
        cells: ['D24', 'E24', 'F24', 'G24', 'H24', 'I24', 'J24', 'K24', 'L24', 'M24', 'N24'],
      },
      {
        key: 'total_power_units_consumed_per_year',
        label: 'Total Power Units Consumed Per Year',
        unit: 'kWh',
        cells: ['D27', 'E27', 'F27', 'G27', 'H27', 'I27', 'J27', 'K27', 'L27', 'M27', 'N27'],
      },
      {
        key: 'purchase_rate_per_kw_usd',
        label: 'Purchase Rate Per KW (USD)',
        unit: '$',
        cells: ['D29', 'E29', 'F29', 'G29', 'H29', 'I29', 'J29', 'K29', 'L29', 'M29', 'N29'],
      },
      {
        key: 'cost_of_power',
        label: 'Cost of Power',
        unit: '$',
        cells: ['D30', 'E30', 'F30', 'G30', 'H30', 'I30', 'J30', 'K30', 'L30', 'M30', 'N30'],
      },
    ],
  },
  revenueProjection: {
    sheet: 'REVENUE PROJECTION',
    periods: [...ASSUMPTION_PERIODS],
    rows: [
      {
        key: 'no_of_power_units_sold',
        label: 'No of Power Units Sold',
        unit: 'kWh',
        cells: ['C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3', 'M3'],
      },
      {
        key: 'number_of_users_software_subscription',
        label: 'Number of Users - Software Subscription',
        unit: 'count',
        cells: ['C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4', 'M4'],
      },
      {
        key: 'sale_price_per_unit',
        label: 'Sale Price Per Unit',
        unit: '$',
        cells: ['C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5'],
      },
      {
        key: 'revenue_from_power_sales',
        label: 'Revenue from Power Sales',
        unit: '$',
        cells: ['C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'I6', 'J6', 'K6', 'L6', 'M6'],
      },
      {
        key: 'revenue_from_subscriptions',
        label: 'Revenue from Subscriptions',
        unit: '$',
        cells: ['C7', 'D7', 'E7', 'F7', 'G7', 'H7', 'I7', 'J7', 'K7', 'L7', 'M7'],
      },
    ],
  },
  capexDepreciation: {
    sheet: 'CAPEX & DEPRECIATION',
    periods: [...STATEMENT_PERIODS],
    rows: [
      {
        key: 'charging_swapping_stations',
        label: 'Charging/Swapping Stations',
        unit: '$',
        cells: ['E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3', 'M3', 'N3', 'O3', 'P3'],
      },
      {
        key: 'chargers',
        label: 'Chargers',
        unit: '$',
        cells: ['E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4', 'M4', 'N4', 'O4', 'P4'],
      },
      {
        key: 'swapping_bays',
        label: 'Swapping Bays',
        unit: '$',
        cells: ['E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5', 'N5', 'O5', 'P5'],
      },
      {
        key: 'software_platform_development',
        label: 'Software & Platform Development',
        unit: '$',
        cells: ['E6', 'F6', 'G6', 'H6', 'I6', 'J6', 'K6', 'L6', 'M6', 'N6', 'O6', 'P6'],
      },
      {
        key: 'hardware_office_equipment',
        label: 'Hardware & Office Equipment',
        unit: '$',
        cells: ['E7', 'F7', 'G7', 'H7', 'I7', 'J7', 'K7', 'L7', 'M7', 'N7', 'O7', 'P7'],
      },
      {
        key: 'total_capex',
        label: 'Total Capex',
        unit: '$',
        cells: ['E8', 'F8', 'G8', 'H8', 'I8', 'J8', 'K8', 'L8', 'M8', 'N8', 'O8', 'P8'],
      },
      {
        key: 'total_depreciation',
        label: 'Total Depreciation',
        unit: '$',
        cells: ['E10', 'F10', 'G10', 'H10', 'I10', 'J10', 'K10', 'L10', 'M10', 'N10', 'O10', 'P10'],
      },
      {
        key: 'capex_closing_balance',
        label: 'Capex - Closing Balance',
        unit: '$',
        cells: ['E11', 'F11', 'G11', 'H11', 'I11', 'J11', 'K11', 'L11', 'M11', 'N11', 'O11', 'P11'],
      },
      {
        key: 'asset_value_charging_swapping_stations',
        label: 'Charging/Swapping Stations Asset Value',
        unit: '$',
        cells: ['E49', 'F49', 'G49', 'H49', 'I49', 'J49', 'K49', 'L49', 'M49', 'N49', 'O49', 'P49'],
      },
      {
        key: 'asset_value_chargers',
        label: 'Chargers Asset Value',
        unit: '$',
        cells: ['E50', 'F50', 'G50', 'H50', 'I50', 'J50', 'K50', 'L50', 'M50', 'N50', 'O50', 'P50'],
      },
      {
        key: 'asset_value_battery_packs',
        label: 'Battery Packs Asset Value',
        unit: '$',
        cells: ['E51', 'F51', 'G51', 'H51', 'I51', 'J51', 'K51', 'L51', 'M51', 'N51', 'O51', 'P51'],
      },
      {
        key: 'asset_value_software_platform_development',
        label: 'Software & Platform Development Asset Value',
        unit: '$',
        cells: ['E52', 'F52', 'G52', 'H52', 'I52', 'J52', 'K52', 'L52', 'M52', 'N52', 'O52', 'P52'],
      },
      {
        key: 'asset_value_hardware_office_equipment',
        label: 'Hardware & Office Equipment Asset Value',
        unit: '$',
        cells: ['E53', 'F53', 'G53', 'H53', 'I53', 'J53', 'K53', 'L53', 'M53', 'N53', 'O53', 'P53'],
      },
    ],
  },
  sourceUseOfFunds: {
    sheet: 'SOURCE_USE OF FUNDS',
    periods: [...STATEMENT_PERIODS],
    rows: [
      {
        key: 'equity_investor_subscription_25pct',
        label: 'Equity-Investor Subscription (25%)',
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
        label: 'Total - Use of Funds',
        unit: '$',
        cells: ['C16', 'D16', 'E16', 'F16', 'G16', 'H16', 'I16', 'J16', 'K16', 'L16', 'M16', 'N16'],
      },
    ],
  },
  incomeStatement: {
    sheet: 'INCOME STATEMENT ',
    periods: [...STATEMENT_PERIODS],
    rows: [
      { key: 'revenue', label: 'Revenue', unit: '$', cells: ['C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3', 'M3', 'N3'] },
      { key: 'cost_of_power_purchase_from_eep', label: 'Cost of Power Purchase from EEP', unit: '$', cells: ['C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4', 'M4', 'N4'] },
      { key: 'gross_margin', label: 'Gross Margin', unit: '$', cells: ['C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5', 'N5'] },
      { key: 'platform_revenue_subscriptions', label: 'Platform Revenue (Subscriptions)', unit: '$', cells: ['C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'I6', 'J6', 'K6', 'L6', 'M6', 'N6'] },
      { key: 'gross_profit', label: 'Gross Profit', unit: '$', cells: ['C7', 'D7', 'E7', 'F7', 'G7', 'H7', 'I7', 'J7', 'K7', 'L7', 'M7', 'N7'] },
      { key: 'operating_expenses', label: 'Operating Expenses', unit: '$', cells: ['C9', 'D9', 'E9', 'F9', 'G9', 'H9', 'I9', 'J9', 'K9', 'L9', 'M9', 'N9'] },
      { key: 'variable_opex', label: 'Variable Opex', unit: '$', cells: ['C10', 'D10', 'E10', 'F10', 'G10', 'H10', 'I10', 'J10', 'K10', 'L10', 'M10', 'N10'] },
      { key: 'battery_lease_charges', label: 'Battery Lease Charges', unit: '$', cells: ['C11', 'D11', 'E11', 'F11', 'G11', 'H11', 'I11', 'J11', 'K11', 'L11', 'M11', 'N11'] },
      { key: 'ebitda', label: 'EBITDA', unit: '$', cells: ['C12', 'D12', 'E12', 'F12', 'G12', 'H12', 'I12', 'J12', 'K12', 'L12', 'M12', 'N12'] },
      { key: 'depreciation', label: 'Depreciation', unit: '$', cells: ['C13', 'D13', 'E13', 'F13', 'G13', 'H13', 'I13', 'J13', 'K13', 'L13', 'M13', 'N13'] },
      { key: 'ebt', label: 'EBT', unit: '$', cells: ['C14', 'D14', 'E14', 'F14', 'G14', 'H14', 'I14', 'J14', 'K14', 'L14', 'M14', 'N14'] },
      { key: 'tax', label: 'Tax @ 30%', unit: '$', cells: ['C15', 'D15', 'E15', 'F15', 'G15', 'H15', 'I15', 'J15', 'K15', 'L15', 'M15', 'N15'] },
      { key: 'eat_net_income', label: 'EAT (Net Income)', unit: '$', cells: ['C17', 'D17', 'E17', 'F17', 'G17', 'H17', 'I17', 'J17', 'K17', 'L17', 'M17', 'N17'] },
      { key: 'cumulative_eat', label: 'Cumulative EAT', unit: '$', cells: ['C20', 'D20', 'E20', 'F20', 'G20', 'H20', 'I20', 'J20', 'K20', 'L20', 'M20', 'N20'] },
      { key: 'rate_of_return', label: 'Rate of Return', unit: '%', cells: ['C21', 'D21', 'E21', 'F21', 'G21', 'H21', 'I21', 'J21', 'K21', 'L21', 'M21', 'N21'] },
      { key: 'investor_eat_net_income_25pct', label: 'Investor EAT (Net Income) 25%', unit: '$', cells: ['C22', 'D22', 'E22', 'F22', 'G22', 'H22', 'I22', 'J22', 'K22', 'L22', 'M22', 'N22', 'O22'] },
      { key: 'investor_rate_of_return_25pct', label: 'Investor Rate of Return 25%', unit: '%', cells: ['C23', 'D23', 'E23', 'F23', 'G23', 'H23', 'I23', 'J23', 'K23', 'L23', 'M23', 'N23'] },
    ],
  },
  cashFlow: {
    sheet: 'CASH FLOW',
    periods: [...STATEMENT_PERIODS],
    rows: [
      { key: 'net_income', label: 'Net Income', unit: '$', cells: ['C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4', 'M4', 'N4'] },
      { key: 'depreciation', label: 'Depreciation', unit: '$', cells: ['C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5', 'N5'] },
      { key: 'net_cash_from_operations', label: 'Net Cash from Operations', unit: '$', cells: ['C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'I6', 'J6', 'K6', 'L6', 'M6', 'N6'] },
      { key: 'capex', label: 'Capex', unit: '$', cells: ['C9', 'D9', 'E9', 'F9', 'G9', 'H9', 'I9', 'J9', 'K9', 'L9', 'M9', 'N9'] },
      { key: 'net_cash_from_investing', label: 'Net Cash from Investing', unit: '$', cells: ['C10', 'D10', 'E10', 'F10', 'G10', 'H10', 'I10', 'J10', 'K10', 'L10', 'M10', 'N10'] },
      { key: 'equity_injection', label: 'Equity Injection', unit: '$', cells: ['C13', 'D13', 'E13', 'F13', 'G13', 'H13', 'I13', 'J13', 'K13', 'L13', 'M13', 'N13'] },
      { key: 'dividend', label: 'Dividend', unit: '$', cells: ['C15', 'D15', 'E15', 'F15', 'G15', 'H15', 'I15', 'J15', 'K15', 'L15', 'M15', 'N15'] },
      { key: 'dividend_tax', label: 'Dividend Tax @ 15%', unit: '$', cells: ['C16', 'D16', 'E16', 'F16', 'G16', 'H16', 'I16', 'J16', 'K16', 'L16', 'M16', 'N16'] },
      { key: 'net_cash_from_financing', label: 'Net Cash from Financing', unit: '$', cells: ['C17', 'D17', 'E17', 'F17', 'G17', 'H17', 'I17', 'J17', 'K17', 'L17', 'M17', 'N17'] },
      { key: 'net_change_in_cash', label: 'Net Change in Cash', unit: '$', cells: ['C19', 'D19', 'E19', 'F19', 'G19', 'H19', 'I19', 'J19', 'K19', 'L19', 'M19', 'N19'] },
      { key: 'opening_cash', label: 'Cash-Opening Balance', unit: '$', cells: ['C21', 'D21', 'E21', 'F21', 'G21', 'H21', 'I21', 'J21', 'K21', 'L21', 'M21', 'N21'] },
      { key: 'closing_cash', label: 'Cash-Closing Balance', unit: '$', cells: ['C22', 'D22', 'E22', 'F22', 'G22', 'H22', 'I22', 'J22', 'K22', 'L22', 'M22', 'N22'] },
    ],
  },
  balanceSheet: {
    sheet: 'BALANCE SHEET',
    periods: [...STATEMENT_PERIODS],
    rows: [
      { key: 'cash', label: 'Cash & Cash Equavalents', unit: '$', cells: ['C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5', 'M5', 'N5'] },
      { key: 'total_current_assets', label: 'Total Current Assets', unit: '$', cells: ['C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'I6', 'J6', 'K6', 'L6', 'M6', 'N6'] },
      { key: 'charging_swapping_stations', label: 'Charging/Swapping Stations', unit: '$', cells: ['C9', 'D9', 'E9', 'F9', 'G9', 'H9', 'I9', 'J9', 'K9', 'L9', 'M9', 'N9'] },
      { key: 'chargers', label: 'Chargers', unit: '$', cells: ['C10', 'D10', 'E10', 'F10', 'G10', 'H10', 'I10', 'J10', 'K10', 'L10', 'M10', 'N10'] },
      { key: 'software_platform_development', label: 'Software & Platform Development', unit: '$', cells: ['C11', 'D11', 'E11', 'F11', 'G11', 'H11', 'I11', 'J11', 'K11', 'L11', 'M11', 'N11'] },
      { key: 'hardware_office_equipment', label: 'Hardware & Office Equipment', unit: '$', cells: ['C12', 'D12', 'E12', 'F12', 'G12', 'H12', 'I12', 'J12', 'K12', 'L12', 'M12', 'N12'] },
      { key: 'total_non_current_assets', label: 'Total Non-Current Assets', unit: '$', cells: ['C13', 'D13', 'E13', 'F13', 'G13', 'H13', 'I13', 'J13', 'K13', 'L13', 'M13', 'N13'] },
      { key: 'total_assets', label: 'Total Assets', unit: '$', cells: ['C14', 'D14', 'E14', 'F14', 'G14', 'H14', 'I14', 'J14', 'K14', 'L14', 'M14', 'N14'] },
      { key: 'equity', label: 'Equity', unit: '$', cells: ['C17', 'D17', 'E17', 'F17', 'G17', 'H17', 'I17', 'J17', 'K17', 'L17', 'M17', 'N17'] },
      { key: 'retained_earnings', label: 'Retained Earnings', unit: '$', cells: ['C18', 'D18', 'E18', 'F18', 'G18', 'H18', 'I18', 'J18', 'K18', 'L18', 'M18', 'N18'] },
      { key: 'total_equity', label: 'Total Equity', unit: '$', cells: ['C19', 'D19', 'E19', 'F19', 'G19', 'H19', 'I19', 'J19', 'K19', 'L19', 'M19', 'N19'] },
      { key: 'total_liabilities', label: 'Total Liabilities', unit: '$', cells: ['C20', 'D20', 'E20', 'F20', 'G20', 'H20', 'I20', 'J20', 'K20', 'L20', 'M20', 'N20'] },
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
      { key: 'irr_reference', label: 'IRR', unit: '%', cells: ['C11', 'D11', 'E11', 'F11', 'G11', 'H11'] },
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
