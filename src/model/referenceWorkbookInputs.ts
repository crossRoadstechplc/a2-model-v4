import {
  type WorkbookSheetName,
  STATEMENT_PERIODS,
  VALUATION_PERIODS,
  workbookConstantCells,
} from '../engine/a2Fleet/reference';

export type ReferenceWorkbookInputCell = {
  key: string;
  aliases: string[];
  sheet: WorkbookSheetName;
  cell: string;
  row: number;
  row_label: string;
  unit: string;
  column_label: string;
  base_value: number;
};

type WorkbookInputSpec = {
  sheet: WorkbookSheetName;
  row: number;
  rowLabel: string;
  unit: string;
  cells: string[];
  columnLabels: string[];
};

const ASSUMPTION_PERIOD_LABELS = [...STATEMENT_PERIODS];
const OPERATING_PERIOD_LABELS = [...STATEMENT_PERIODS.slice(1)];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[%/]/g, ' ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildDefaultAssumptionKey(spec: WorkbookInputSpec, columnLabel: string) {
  const sheetSlug = slugify(spec.sheet);
  const rowSlug = slugify(spec.rowLabel);
  const columnSlug =
    columnLabel === 'QUANTITY' ? 'quantity' : slugify(columnLabel);

  return `a2_fleet.${sheetSlug}.${rowSlug}.${columnSlug}`;
}

function mapKeys(entries: Array<[string, string]>) {
  return Object.fromEntries(entries) as Record<string, string>;
}

function buildLegacyMigrationMap() {
  return mapKeys([
    [
      'a2_fleet.average_kilometres_per_truck_per_year.quantity',
      'a2_fleet.power_calculations.average_kilometres_per_truck_per_year.quantity',
    ],
    [
      'a2_fleet.cost_per_kw_of_energy.cy_2027',
      'a2_fleet.power_calculations.purchase_rate_per_kw.quantity',
    ],
    [
      'a2_fleet.cost_per_kw_of_energy.cy_2033',
      'a2_fleet.power_calculations.purchase_rate_per_kw.quantity',
    ],
    [
      'a2_fleet.fleet_management_software.cy_2027',
      'a2_fleet.assumptions_data.software_platform_development.cy_2027',
    ],
    [
      'a2_fleet.fleet_management_software.cy_2028',
      'a2_fleet.assumptions_data.software_platform_development.cy_2028',
    ],
    [
      'a2_fleet.fleet_management_software.cy_2029',
      'a2_fleet.assumptions_data.software_platform_development.cy_2029',
    ],
    [
      'a2_fleet.fleet_management_software.cy_2030',
      'a2_fleet.assumptions_data.software_platform_development.cy_2030',
    ],
    [
      'a2_fleet.fleet_management_software.cy_2031',
      'a2_fleet.assumptions_data.software_platform_development.cy_2031',
    ],
    [
      'a2_fleet.hardware_and_office_equipment.cy_2027',
      'a2_fleet.assumptions_data.hardware_office_equipment.quantity',
    ],
  ]);
}

const canonicalKeyByCellId = mapKeys([
  ['ASSUMPTIONS_DATA!D5', 'a2_fleet.number_of_trucks.cy_2027'],
  ['ASSUMPTIONS_DATA!E5', 'a2_fleet.number_of_trucks.cy_2028'],
  ['ASSUMPTIONS_DATA!F5', 'a2_fleet.number_of_trucks.cy_2029'],
  ['ASSUMPTIONS_DATA!G5', 'a2_fleet.number_of_trucks.cy_2030'],
  ['ASSUMPTIONS_DATA!H5', 'a2_fleet.number_of_trucks.cy_2031'],
  ['ASSUMPTIONS_DATA!I5', 'a2_fleet.number_of_trucks.cy_2032'],
  ['ASSUMPTIONS_DATA!J5', 'a2_fleet.number_of_trucks.cy_2033'],
  [
    'ASSUMPTIONS_DATA!C7',
    'a2_fleet.number_of_swaps_per_truck_per_day.quantity',
  ],
  [
    'ASSUMPTIONS_DATA!C15',
    'a2_fleet.number_of_battery_packs_charged_per_charger_per_day.quantity',
  ],
  ['ASSUMPTIONS_DATA!C28', 'a2_fleet.cost_per_truck.quantity'],
]);

const legacyMigrationMap = buildLegacyMigrationMap();

const inputSpecs: WorkbookInputSpec[] = [
  {
    sheet: 'ASSUMPTIONS_DATA',
    row: 3,
    rowLabel: 'MAXIMUM DISTANCE BETWEEN CHARGING STATIONS',
    unit: 'km',
    cells: ['C3'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'ASSUMPTIONS_DATA',
    row: 4,
    rowLabel: 'NUMBER OF STATIONS',
    unit: 'count',
    cells: ['C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4', 'M4', 'N4'],
    columnLabels: ASSUMPTION_PERIOD_LABELS,
  },
  {
    sheet: 'ASSUMPTIONS_DATA',
    row: 5,
    rowLabel: 'NUMBER OF TRUCKS ADDED',
    unit: 'count',
    cells: ['D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'],
    columnLabels: OPERATING_PERIOD_LABELS.slice(0, 7),
  },
  {
    sheet: 'ASSUMPTIONS_DATA',
    row: 7,
    rowLabel: 'NUMBER OF SWAPS PER TRUCK PER DAY',
    unit: 'count',
    cells: ['C7', 'D7', 'E7', 'F7', 'G7', 'H7', 'I7', 'J7', 'K7', 'L7', 'M7', 'N7'],
    columnLabels: ASSUMPTION_PERIOD_LABELS,
  },
  {
    sheet: 'ASSUMPTIONS_DATA',
    row: 9,
    rowLabel: 'NUMBER OF MINUTES PER SWAP',
    unit: 'minutes',
    cells: ['C9'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'ASSUMPTIONS_DATA',
    row: 11,
    rowLabel: 'NUMBER OF HOURS OF SWAPPING PER DAY',
    unit: 'hours',
    cells: ['C11'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'ASSUMPTIONS_DATA',
    row: 14,
    rowLabel: 'NUMBER OF HOURS/DAY OF CHARGING PER CHARGER',
    unit: 'hours',
    cells: ['C14'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'ASSUMPTIONS_DATA',
    row: 15,
    rowLabel: 'NUMBER OF BATTERY PACKS CHARGED PER CHARGER PER DAY',
    unit: 'count',
    cells: ['C15'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'ASSUMPTIONS_DATA',
    row: 16,
    rowLabel: 'NUMBER OF CHARGERS REQUIRED',
    unit: 'count',
    cells: ['J16'],
    columnLabels: ['CY-2033'],
  },
  {
    sheet: 'ASSUMPTIONS_DATA',
    row: 18,
    rowLabel: 'NUMBER OF SWAPPING BAYS PER STATION',
    unit: 'count',
    cells: ['D18', 'E18', 'F18', 'G18', 'H18', 'I18', 'J18', 'K18', 'L18', 'M18', 'N18'],
    columnLabels: OPERATING_PERIOD_LABELS,
  },
  {
    sheet: 'ASSUMPTIONS_DATA',
    row: 19,
    rowLabel: 'NUMBER OF BATTERY PACKS PER TRUCK',
    unit: 'count',
    cells: ['C19'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'ASSUMPTIONS_DATA',
    row: 24,
    rowLabel: 'COST PER CHARGING/SWAPPING STATION',
    unit: '$',
    cells: ['C24'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'ASSUMPTIONS_DATA',
    row: 25,
    rowLabel: 'COST PER CHARGER',
    unit: '$',
    cells: ['C25'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'ASSUMPTIONS_DATA',
    row: 26,
    rowLabel: 'COST OF SWAPPING BAY',
    unit: '$',
    cells: ['C26'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'ASSUMPTIONS_DATA',
    row: 27,
    rowLabel: 'COST PER BATTERY PACK',
    unit: '$',
    cells: ['C27'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'ASSUMPTIONS_DATA',
    row: 28,
    rowLabel: 'COST PER TRUCK',
    unit: '$',
    cells: ['C28'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'ASSUMPTIONS_DATA',
    row: 34,
    rowLabel: 'SOFTWARE & PLATFORM DEVELOPMENT',
    unit: '$',
    cells: ['D34', 'E34', 'F34', 'G34', 'H34'],
    columnLabels: OPERATING_PERIOD_LABELS.slice(0, 5),
  },
  {
    sheet: 'ASSUMPTIONS_DATA',
    row: 35,
    rowLabel: 'HARDWARE & OFFICE EQUIPMENT',
    unit: '$',
    cells: ['C35'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'ASSUMPTIONS_DATA',
    row: 36,
    rowLabel: 'OPERATING  RESERVE ( 10% OF FUNDS)',
    unit: '$',
    cells: ['C36'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'ASSUMPTIONS_DATA',
    row: 37,
    rowLabel: 'CONTINGENCY RESERVE',
    unit: '$',
    cells: ['C37'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'POWER CALCULATIONS',
    row: 3,
    rowLabel: 'NUMBER OF TRUCKS',
    unit: 'count',
    cells: ['C3'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'POWER CALCULATIONS',
    row: 4,
    rowLabel: 'AVERAGE KILOMETRES PER TRUCK PER YEAR',
    unit: 'km',
    cells: ['C4'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'POWER CALCULATIONS',
    row: 5,
    rowLabel: 'TOTAL KILOMETRES OF FLEET',
    unit: 'km',
    cells: ['C5'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'POWER CALCULATIONS',
    row: 6,
    rowLabel: 'BATTERY CAPACITY PER TRUCK',
    unit: 'kWh',
    cells: ['C6'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'POWER CALCULATIONS',
    row: 7,
    rowLabel: 'RATED RANGE PER CHARGE',
    unit: 'km',
    cells: ['C7'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'POWER CALCULATIONS',
    row: 8,
    rowLabel: 'REAL USE RANGE PER CHARGE',
    unit: 'km',
    cells: ['C8'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'POWER CALCULATIONS',
    row: 13,
    rowLabel: 'CHARGING TIME PER BATTERY PACK',
    unit: 'hours',
    cells: ['C13'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'POWER CALCULATIONS',
    row: 14,
    rowLabel: 'POWER LOAD PER CHARGE',
    unit: 'kWh',
    cells: ['C14'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'POWER CALCULATIONS',
    row: 16,
    rowLabel: 'COMPENSATION FOR THERMAL AND CHEMICAL CONVERSION LOSS',
    unit: '%',
    cells: ['C16'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'POWER CALCULATIONS',
    row: 17,
    rowLabel: 'AVERAGE RESIDUAL CHARGE',
    unit: '%',
    cells: ['C17'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'POWER CALCULATIONS',
    row: 21,
    rowLabel: 'NUMBER OF HOURS OF CHARGING PER DAY',
    unit: 'hours',
    cells: ['C21'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'POWER CALCULATIONS',
    row: 28,
    rowLabel: 'PURCHASE RATE PER KW',
    unit: 'ETB',
    cells: ['C28'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'CAPEX & DEPRECIATION',
    row: 3,
    rowLabel: 'CHARGING/SWAPPING STATIONS USEFUL LIFE',
    unit: 'yrs',
    cells: ['C3'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'CAPEX & DEPRECIATION',
    row: 4,
    rowLabel: 'CHARGERS USEFUL LIFE',
    unit: 'yrs',
    cells: ['C4'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'CAPEX & DEPRECIATION',
    row: 5,
    rowLabel: 'SWAPPING BAYS USEFUL LIFE',
    unit: 'yrs',
    cells: ['C5'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'CAPEX & DEPRECIATION',
    row: 6,
    rowLabel: 'SOFTWARE & PLATFORM DEVELOPMENT USEFUL LIFE',
    unit: 'yrs',
    cells: ['C6'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'CAPEX & DEPRECIATION',
    row: 7,
    rowLabel: 'HARDWARE & OFFICE EQUIPMENT USEFUL LIFE',
    unit: 'yrs',
    cells: ['C7'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'CAPEX & DEPRECIATION',
    row: 38,
    rowLabel: 'SOFTWARE & PLATFORM DEVELOPMENT USEFUL LIFE (ASSET VALUE)',
    unit: 'yrs',
    cells: ['C38'],
    columnLabels: ['QUANTITY'],
  },
  {
    sheet: 'INCOME STATEMENT ',
    row: 9,
    rowLabel: 'OPERATING EXPENSES SEED',
    unit: '$',
    cells: ['C9', 'D9'],
    columnLabels: ['CY-2026', 'CY-2027'],
  },
  {
    sheet: 'VALUATION SUMMARY',
    row: 4,
    rowLabel: 'VALUATION MULTIPLE',
    unit: 'x',
    cells: ['C4', 'D4', 'E4', 'F4', 'G4', 'H4'],
    columnLabels: [...VALUATION_PERIODS],
  },
];

export const referenceWorkbookInputCells: ReferenceWorkbookInputCell[] = inputSpecs.flatMap(
  (spec) =>
    spec.cells.map((cell, index) => {
      const columnLabel = spec.columnLabels[index] ?? 'QUANTITY';
      const cellId = `${spec.sheet}!${cell}`;
      const key =
        canonicalKeyByCellId[cellId] ?? buildDefaultAssumptionKey(spec, columnLabel);
      const aliases = Object.entries(legacyMigrationMap)
        .filter(([, canonicalKey]) => canonicalKey === key)
        .map(([legacyKey]) => legacyKey);

      return {
        key,
        aliases,
        sheet: spec.sheet,
        cell,
        row: spec.row,
        row_label: spec.rowLabel,
        unit: spec.unit,
        column_label: columnLabel,
        base_value: workbookConstantCells[cellId],
      };
    }),
);

export const referenceWorkbookInputByCellId = referenceWorkbookInputCells.reduce<
  Record<string, ReferenceWorkbookInputCell>
>((map, item) => {
  map[`${item.sheet}!${item.cell}`] = item;
  return map;
}, {});

export const referenceWorkbookInputByKey = referenceWorkbookInputCells.reduce<
  Record<string, ReferenceWorkbookInputCell>
>((map, item) => {
  map[item.key] = item;
  return map;
}, {});

export const legacyAssumptionKeyMap = legacyMigrationMap;

export function migrateLegacyAssumptionValues(
  values: Record<string, number>,
): Record<string, number> {
  const migrated = { ...values };

  Object.entries(legacyAssumptionKeyMap).forEach(([legacyKey, canonicalKey]) => {
    if (!(legacyKey in migrated)) {
      return;
    }

    if (!(canonicalKey in migrated)) {
      migrated[canonicalKey] = migrated[legacyKey] as number;
    }

    delete migrated[legacyKey];
  });

  return migrated;
}
