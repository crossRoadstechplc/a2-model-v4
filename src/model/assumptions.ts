import referenceJson from '../../Docs/A2_Fleet_Model_Replication_Reference.json';
import {
  convertValueForDisplay,
  getDisplayLabel,
  getDisplayUnit,
  type DisplayCurrency,
} from './displayCurrency';

export type AssumptionGroupId =
  | 'global'
  | 'fleet'
  | 'platform'
  | 'energy'
  | 'financing'
  | 'tax_fx'
  | 'timing'
  | 'overrides';

export type AssumptionSidebarMode =
  | 'context'
  | 'all'
  | 'changed';

export type AssumptionValueMap = Record<string, number>;

export type AssumptionGroup = {
  id: AssumptionGroupId;
  title: string;
  description: string;
  contexts: string[];
  source: 'reference' | 'extension';
};

export type AssumptionMetadata = {
  key: string;
  label: string;
  shortLabel: string;
  groupId: AssumptionGroupId;
  moduleId: 'a2_fleet' | 'integrated';
  unit: string;
  helperText?: string;
  dependencyTag?: string;
  decimals: number;
  baseValue: number;
  defaultFavorite?: boolean;
  contexts: string[];
  source: 'reference' | 'extension';
  workbook?: {
    sheet: string;
    row: number;
    cell: string;
    rowLabel: string;
    columnLabel: string;
  };
};

type ReferenceBaseInputCell = {
  cell: string;
  row: number;
  row_label: string;
  unit: string;
  column_label: string;
  base_value: number;
};

type ReferenceJson = {
  source_workbook: string;
  assumptions: {
    sheet: string;
    base_input_cells: ReferenceBaseInputCell[];
  };
};

const referenceData = referenceJson as ReferenceJson;

export const assumptionGroups: AssumptionGroup[] = [
  {
    id: 'global',
    title: 'Global / Macro',
    description:
      'Macro, pricing, and portfolio-wide commercial drivers used across modules.',
    contexts: ['/', '/assumptions', '/corridor-view', '/scenarios', '/sensitivities'],
    source: 'extension',
  },
  {
    id: 'fleet',
    title: 'Fleet',
    description:
      'Fleet build, utilization, and freight throughput assumptions used across the operating model.',
    contexts: ['/', '/assumptions', '/a2-fleet', '/corridor-view'],
    source: 'reference',
  },
  {
    id: 'platform',
    title: 'Platform',
    description:
      'Platform, software, and infrastructure assumptions used in capacity sizing and integrated planning.',
    contexts: ['/', '/assumptions', '/a2-platform', '/corridor-view'],
    source: 'reference',
  },
  {
    id: 'energy',
    title: 'Energy',
    description:
      'Energy intensity, charging capacity, and power-cost assumptions used in the corridor energy model.',
    contexts: ['/', '/assumptions', '/a2-energy', '/corridor-view'],
    source: 'reference',
  },
  {
    id: 'financing',
    title: 'Financing',
    description:
      'Funding, reserves, and financing-structure assumptions for the integrated model.',
    contexts: ['/', '/assumptions', '/corridor-view', '/save-export'],
    source: 'reference',
  },
  {
    id: 'tax_fx',
    title: 'Tax / FX',
    description:
      'Tax and foreign-exchange assumptions reserved for the integrated planning model.',
    contexts: ['/', '/assumptions', '/corridor-view', '/documentation'],
    source: 'extension',
  },
  {
    id: 'timing',
    title: 'Timing / Horizon',
    description:
      'Trip timing, horizon, and deployment pacing assumptions used in planning views.',
    contexts: ['/', '/assumptions', '/a2-fleet', '/corridor-view', '/scenarios'],
    source: 'reference',
  },
  {
    id: 'overrides',
    title: 'Overrides / Manual Controls',
    description:
      'Manual overrides and testing controls used to exercise the workflow before the engine is connected.',
    contexts: ['/', '/assumptions', '/scenarios', '/sensitivities'],
    source: 'extension',
  },
];

const groupByRowLabel: Array<{
  pattern: RegExp;
  groupId: AssumptionGroupId;
  helperText: string;
  dependencyTag?: string;
  contexts?: string[];
  defaultFavorite?: boolean;
  decimals?: number;
}> = [
  {
    pattern: /NUMBER OF TRUCKS/,
    groupId: 'fleet',
    helperText:
      'Annual fleet deployment assumption used in capacity and operations planning.',
    dependencyTag: 'Capacity',
    contexts: ['/', '/assumptions', '/a2-fleet', '/corridor-view'],
    decimals: 0,
  },
  {
    pattern: /SWAPS PER TRUCK PER DAY/,
    groupId: 'fleet',
    helperText:
      'Operational turnover assumption used in the fleet utilization cascade.',
    dependencyTag: 'Operations',
    contexts: ['/', '/assumptions', '/a2-fleet'],
    decimals: 0,
  },
  {
    pattern: /BATTERY PACKS CHARGED PER CHARGER PER DAY/,
    groupId: 'energy',
    helperText:
      'Charging-throughput assumption used in infrastructure sizing and energy utilization.',
    dependencyTag: 'Infrastructure',
    contexts: ['/', '/assumptions', '/a2-energy', '/a2-fleet'],
    decimals: 0,
  },
  {
    pattern: /COST PER TRUCK/,
    groupId: 'fleet',
    helperText: 'Truck unit capex assumption used in fleet investment planning.',
    dependencyTag: 'CAPEX',
    contexts: ['/', '/assumptions', '/a2-fleet'],
    decimals: 0,
  },
  {
    pattern: /FLEET MANAGEMENT SOFTWARE/,
    groupId: 'platform',
    helperText:
      'Software investment input used in platform capex planning.',
    dependencyTag: 'Platform',
    contexts: ['/', '/assumptions', '/a2-platform'],
    decimals: 0,
  },
  {
    pattern: /HARDWARE AND OFFICE EQUIPMENT/,
    groupId: 'platform',
    helperText:
      'Hardware and office equipment capex assumption used in platform buildout planning.',
    dependencyTag: 'Platform',
    contexts: ['/', '/assumptions', '/a2-platform'],
    decimals: 0,
  },
  {
    pattern: /OPERATING  RESERVE/,
    groupId: 'financing',
    helperText:
      'Operating reserve allocation used in liquidity planning.',
    dependencyTag: 'Liquidity',
    contexts: ['/', '/assumptions', '/save-export'],
    decimals: 0,
  },
  {
    pattern: /CONTINGENCY RESERVE/,
    groupId: 'financing',
    helperText:
      'Contingency reserve allocation used in funding and downside planning.',
    dependencyTag: 'Liquidity',
    contexts: ['/', '/assumptions', '/save-export'],
    decimals: 0,
  },
  {
    pattern: /AVERAGE KILOMETRES PER TRUCK PER YEAR/,
    groupId: 'fleet',
    helperText:
      'Average annual operating distance per truck used in demand and utilization planning.',
    dependencyTag: 'Operations',
    contexts: ['/', '/assumptions', '/a2-fleet'],
    decimals: 0,
  },
  {
    pattern: /ENERGY USED PER KM/,
    groupId: 'energy',
    helperText:
      'Energy intensity assumption that feeds the energy-cost cascade.',
    dependencyTag: 'Energy',
    contexts: ['/', '/assumptions', '/a2-energy'],
    decimals: 1,
  },
  {
    pattern: /COST PER KW OF ENERGY/,
    groupId: 'energy',
    helperText:
      'Energy price trajectory used in operating-cost planning.',
    dependencyTag: 'Energy',
    contexts: ['/', '/assumptions', '/a2-energy', '/corridor-view'],
    decimals: 3,
  },
  {
    pattern: /NUMBER OF DAYS PER TRIP/,
    groupId: 'timing',
    helperText:
      'Trip duration assumption used in the freight and utilization cascade.',
    dependencyTag: 'Timing',
    contexts: ['/', '/assumptions', '/a2-fleet'],
    decimals: 0,
  },
  {
    pattern: /AVERAGE CHARGEABLE TONNES PER TRIP/,
    groupId: 'fleet',
    helperText:
      'Chargeable payload assumption used in the freight revenue cascade.',
    dependencyTag: 'Revenue',
    contexts: ['/', '/assumptions', '/a2-fleet'],
    decimals: 0,
  },
  {
    pattern: /FREIGHT RATE PER TONNE/,
    groupId: 'global',
    helperText:
      'Base freight pricing assumption used across commercial planning views.',
    dependencyTag: 'Revenue',
    contexts: ['/', '/assumptions', '/corridor-view'],
    defaultFavorite: true,
    decimals: 0,
  },
];

const extensionAssumptions: AssumptionMetadata[] = [
  {
    key: 'integrated.global.discount_rate_pct',
    label: 'Discount rate',
    shortLabel: 'Discount rate',
    groupId: 'global',
    moduleId: 'integrated',
    unit: '%',
    helperText:
      'Integrated-model valuation discount rate reserved for the future engine.',
    dependencyTag: 'Valuation',
    decimals: 1,
    baseValue: 13,
    defaultFavorite: true,
    contexts: ['/', '/assumptions', '/corridor-view'],
    source: 'extension',
  },
  {
    key: 'integrated.global.inflation_rate_pct',
    label: 'Inflation rate',
    shortLabel: 'Inflation',
    groupId: 'global',
    moduleId: 'integrated',
    unit: '%',
    helperText:
      'Integrated-model operating cost escalation assumption for placeholder outputs.',
    dependencyTag: 'OPEX',
    decimals: 1,
    baseValue: 4.2,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/corridor-view'],
    source: 'extension',
  },
  {
    key: 'integrated.global.demand_growth_pct',
    label: 'Demand growth',
    shortLabel: 'Demand growth',
    groupId: 'global',
    moduleId: 'integrated',
    unit: '%',
    helperText:
      'Integrated-model demand-growth assumption used by the mocked output cards.',
    dependencyTag: 'Revenue',
    decimals: 1,
    baseValue: 8.5,
    defaultFavorite: true,
    contexts: ['/', '/assumptions', '/corridor-view'],
    source: 'extension',
  },
  {
    key: 'integrated.platform.take_rate_pct',
    label: 'Platform take rate',
    shortLabel: 'Take rate',
    groupId: 'platform',
    moduleId: 'integrated',
    unit: '%',
    helperText:
      'Platform monetization placeholder for the integrated model shell.',
    dependencyTag: 'Margin',
    decimals: 1,
    baseValue: 14.5,
    defaultFavorite: true,
    contexts: ['/', '/assumptions', '/a2-platform', '/corridor-view'],
    source: 'extension',
  },
  {
    key: 'integrated.platform.operating_cost_usd_m',
    label: 'Platform operating cost',
    shortLabel: 'Platform opex',
    groupId: 'platform',
    moduleId: 'integrated',
    unit: '$m/yr',
    helperText:
      'Integrated-model platform support cost used in mocked outputs.',
    dependencyTag: 'OPEX',
    decimals: 1,
    baseValue: 6.4,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-platform'],
    source: 'extension',
  },
  {
    key: 'integrated.platform.annual_swaps_capacity_per_site',
    label: 'Annual swaps capacity per site',
    shortLabel: 'Site capacity',
    groupId: 'platform',
    moduleId: 'integrated',
    unit: 'swaps/yr',
    helperText:
      'Nominal annual swap throughput each platform site can process before utilization constraints.',
    dependencyTag: 'Throughput',
    decimals: 0,
    baseValue: 180000,
    defaultFavorite: true,
    contexts: ['/', '/assumptions', '/a2-platform', '/corridor-view'],
    source: 'extension',
  },
  {
    key: 'integrated.platform.target_site_utilization_pct',
    label: 'Target site utilization',
    shortLabel: 'Site utilization',
    groupId: 'platform',
    moduleId: 'integrated',
    unit: '%',
    helperText:
      'Sizing guardrail used to keep platform infrastructure below practical operating saturation.',
    dependencyTag: 'Throughput',
    decimals: 1,
    baseValue: 82,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-platform'],
    source: 'extension',
  },
  {
    key: 'integrated.platform.fee_per_swap_usd',
    label: 'Fleet fee per swap',
    shortLabel: 'Fee per swap',
    groupId: 'platform',
    moduleId: 'integrated',
    unit: '$',
    helperText:
      'Internal commercial fee charged by Platform to Fleet for each processed swap event.',
    dependencyTag: 'Revenue',
    decimals: 2,
    baseValue: 12.5,
    defaultFavorite: true,
    contexts: ['/', '/assumptions', '/a2-platform', '/corridor-view'],
    source: 'extension',
  },
  {
    key: 'integrated.platform.subscription_per_truck_per_month_usd',
    label: 'Subscription per truck per month',
    shortLabel: 'Truck subscription',
    groupId: 'platform',
    moduleId: 'integrated',
    unit: '$',
    helperText:
      'Internal monthly software and orchestration subscription charged to each active fleet vehicle.',
    dependencyTag: 'Revenue',
    decimals: 0,
    baseValue: 180,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-platform'],
    source: 'extension',
  },
  {
    key: 'integrated.platform.external_revenue_share_pct',
    label: 'External revenue share',
    shortLabel: 'External share',
    groupId: 'platform',
    moduleId: 'integrated',
    unit: '%',
    helperText:
      'Share of platform revenue assumed to come from external third-party demand rather than internal Fleet volume.',
    dependencyTag: 'Revenue',
    decimals: 1,
    baseValue: 18,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-platform', '/corridor-view'],
    source: 'extension',
  },
  {
    key: 'integrated.platform.site_opex_usd',
    label: 'Site opex per site',
    shortLabel: 'Site opex',
    groupId: 'platform',
    moduleId: 'integrated',
    unit: '$',
    helperText:
      'Annual site-level operating expense for a fully deployed platform location.',
    dependencyTag: 'OPEX',
    decimals: 0,
    baseValue: 185000,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-platform'],
    source: 'extension',
  },
  {
    key: 'integrated.platform.support_headcount',
    label: 'Support headcount',
    shortLabel: 'Headcount',
    groupId: 'platform',
    moduleId: 'integrated',
    unit: 'count',
    helperText:
      'Central platform support, analytics, and customer operations staffing base.',
    dependencyTag: 'OPEX',
    decimals: 0,
    baseValue: 24,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-platform'],
    source: 'extension',
  },
  {
    key: 'integrated.platform.cost_per_head_usd',
    label: 'Cost per head',
    shortLabel: 'Cost per head',
    groupId: 'platform',
    moduleId: 'integrated',
    unit: '$',
    helperText:
      'Fully loaded annual personnel cost applied to platform support headcount.',
    dependencyTag: 'OPEX',
    decimals: 0,
    baseValue: 22000,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-platform'],
    source: 'extension',
  },
  {
    key: 'integrated.platform.cloud_cost_pct_revenue',
    label: 'Cloud cost as % of revenue',
    shortLabel: 'Cloud cost',
    groupId: 'platform',
    moduleId: 'integrated',
    unit: '%',
    helperText:
      'Variable hosting and transaction-processing burden as a share of platform revenue.',
    dependencyTag: 'OPEX',
    decimals: 1,
    baseValue: 6.5,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-platform'],
    source: 'extension',
  },
  {
    key: 'integrated.platform.capex_per_site_usd',
    label: 'Capex per site',
    shortLabel: 'Site capex',
    groupId: 'platform',
    moduleId: 'integrated',
    unit: '$',
    helperText:
      'Incremental platform infrastructure investment required for each newly deployed site.',
    dependencyTag: 'CAPEX',
    decimals: 0,
    baseValue: 350000,
    defaultFavorite: true,
    contexts: ['/', '/assumptions', '/a2-platform', '/corridor-view'],
    source: 'extension',
  },
  {
    key: 'integrated.platform.core_software_capex_usd_m',
    label: 'Core software capex',
    shortLabel: 'Software capex',
    groupId: 'platform',
    moduleId: 'integrated',
    unit: '$m',
    helperText:
      'Initial central software build and integration capex for the platform layer.',
    dependencyTag: 'CAPEX',
    decimals: 1,
    baseValue: 7.5,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-platform'],
    source: 'extension',
  },
  {
    key: 'integrated.platform.asset_life_years',
    label: 'Platform asset life',
    shortLabel: 'Asset life',
    groupId: 'platform',
    moduleId: 'integrated',
    unit: 'yrs',
    helperText:
      'Straight-line depreciation life applied to platform capex additions.',
    dependencyTag: 'Depreciation',
    decimals: 0,
    baseValue: 7,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-platform'],
    source: 'extension',
  },
  {
    key: 'integrated.platform.breakeven_buffer_pct',
    label: 'Breakeven buffer',
    shortLabel: 'Breakeven buffer',
    groupId: 'platform',
    moduleId: 'integrated',
    unit: '%',
    helperText:
      'Target EBITDA headroom above breakeven before the platform is considered comfortably covered.',
    dependencyTag: 'Breakeven',
    decimals: 1,
    baseValue: 10,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-platform'],
    source: 'extension',
  },
  {
    key: 'integrated.energy.network_uptime_pct',
    label: 'Energy uptime',
    shortLabel: 'Energy uptime',
    groupId: 'energy',
    moduleId: 'integrated',
    unit: '%',
    helperText:
      'Integrated-model infrastructure uptime assumption for mocked refresh behavior.',
    dependencyTag: 'Operations',
    decimals: 1,
    baseValue: 97.4,
    defaultFavorite: true,
    contexts: ['/', '/assumptions', '/a2-energy'],
    source: 'extension',
  },
  {
    key: 'integrated.energy.battery_packs_per_truck',
    label: 'Battery packs per truck',
    shortLabel: 'Packs per truck',
    groupId: 'energy',
    moduleId: 'integrated',
    unit: 'packs',
    helperText:
      'Required operating battery pack count per active fleet vehicle across the corridor.',
    dependencyTag: 'Battery',
    decimals: 1,
    baseValue: 8,
    defaultFavorite: true,
    contexts: ['/', '/assumptions', '/a2-energy', '/corridor-view'],
    source: 'extension',
  },
  {
    key: 'integrated.energy.spare_battery_buffer_pct',
    label: 'Spare battery buffer',
    shortLabel: 'Spare buffer',
    groupId: 'energy',
    moduleId: 'integrated',
    unit: '%',
    helperText:
      'Additional battery inventory kept online to absorb charging lag and operational slack.',
    dependencyTag: 'Battery',
    decimals: 1,
    baseValue: 20,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-energy'],
    source: 'extension',
  },
  {
    key: 'integrated.energy.annual_cycles_per_pack',
    label: 'Annual cycles per pack',
    shortLabel: 'Cycles per pack',
    groupId: 'energy',
    moduleId: 'integrated',
    unit: 'cycles',
    helperText:
      'Representative annual cycling burden used to estimate replacement pressure across the pack base.',
    dependencyTag: 'Replacement',
    decimals: 0,
    baseValue: 320,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-energy'],
    source: 'extension',
  },
  {
    key: 'integrated.energy.pack_cycle_life',
    label: 'Pack cycle life',
    shortLabel: 'Cycle life',
    groupId: 'energy',
    moduleId: 'integrated',
    unit: 'cycles',
    helperText:
      'Nominal battery life in full cycles before replacement economics become relevant.',
    dependencyTag: 'Replacement',
    decimals: 0,
    baseValue: 1800,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-energy'],
    source: 'extension',
  },
  {
    key: 'integrated.energy.replacement_trigger_pct',
    label: 'Replacement trigger',
    shortLabel: 'Replacement trigger',
    groupId: 'energy',
    moduleId: 'integrated',
    unit: '%',
    helperText:
      'Fraction of theoretical pack life consumed before replacement actions are assumed to begin.',
    dependencyTag: 'Replacement',
    decimals: 1,
    baseValue: 85,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-energy'],
    source: 'extension',
  },
  {
    key: 'integrated.energy.pack_cost_usd',
    label: 'Battery pack cost',
    shortLabel: 'Pack cost',
    groupId: 'energy',
    moduleId: 'integrated',
    unit: '$',
    helperText:
      'Replacement and growth capex per incremental battery pack deployed in the energy business.',
    dependencyTag: 'CAPEX',
    decimals: 0,
    baseValue: 9500,
    defaultFavorite: true,
    contexts: ['/', '/assumptions', '/a2-energy', '/corridor-view'],
    source: 'extension',
  },
  {
    key: 'integrated.energy.provision_rate_pct',
    label: 'Provision rate',
    shortLabel: 'Provision rate',
    groupId: 'energy',
    moduleId: 'integrated',
    unit: '%',
    helperText:
      'Share of forecast replacement cost recognized through the energy provision logic.',
    dependencyTag: 'Provision',
    decimals: 1,
    baseValue: 75,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-energy'],
    source: 'extension',
  },
  {
    key: 'integrated.energy.lease_rate_per_pack_per_month_usd',
    label: 'Lease rate per pack per month',
    shortLabel: 'Lease rate',
    groupId: 'energy',
    moduleId: 'integrated',
    unit: '$',
    helperText:
      'Internal lease charge from Energy to Platform for each active battery pack in service.',
    dependencyTag: 'Revenue',
    decimals: 0,
    baseValue: 110,
    defaultFavorite: true,
    contexts: ['/', '/assumptions', '/a2-energy', '/corridor-view'],
    source: 'extension',
  },
  {
    key: 'integrated.energy.platform_revenue_share_pct',
    label: 'Platform revenue share',
    shortLabel: 'Revenue share',
    groupId: 'energy',
    moduleId: 'integrated',
    unit: '%',
    helperText:
      'Revenue-share participation Energy receives from Platform as part of the inter-company charging stack.',
    dependencyTag: 'Revenue',
    decimals: 1,
    baseValue: 18,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-energy', '/corridor-view'],
    source: 'extension',
  },
  {
    key: 'integrated.energy.fixed_opex_usd_m',
    label: 'Energy fixed opex',
    shortLabel: 'Fixed opex',
    groupId: 'energy',
    moduleId: 'integrated',
    unit: '$m',
    helperText:
      'Central overhead and field operations cost base for the energy network.',
    dependencyTag: 'OPEX',
    decimals: 1,
    baseValue: 9.5,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-energy'],
    source: 'extension',
  },
  {
    key: 'integrated.energy.swap_station_capex_usd',
    label: 'Swap station capex',
    shortLabel: 'Station capex',
    groupId: 'energy',
    moduleId: 'integrated',
    unit: '$',
    helperText:
      'Incremental station deployment capex associated with each operational platform site.',
    dependencyTag: 'CAPEX',
    decimals: 0,
    baseValue: 450000,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-energy'],
    source: 'extension',
  },
  {
    key: 'integrated.energy.charger_capex_usd',
    label: 'Charger capex',
    shortLabel: 'Charger capex',
    groupId: 'energy',
    moduleId: 'integrated',
    unit: '$',
    helperText:
      'Incremental charger hardware capex used in the first-pass infrastructure sizing logic.',
    dependencyTag: 'CAPEX',
    decimals: 0,
    baseValue: 8500,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-energy'],
    source: 'extension',
  },
  {
    key: 'integrated.energy.asset_life_years',
    label: 'Energy asset life',
    shortLabel: 'Asset life',
    groupId: 'energy',
    moduleId: 'integrated',
    unit: 'yrs',
    helperText:
      'Straight-line depreciation life applied across energy capex additions.',
    dependencyTag: 'Depreciation',
    decimals: 0,
    baseValue: 8,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-energy'],
    source: 'extension',
  },
  {
    key: 'integrated.energy.maintenance_pct_capex',
    label: 'Maintenance as % of capex',
    shortLabel: 'Maintenance',
    groupId: 'energy',
    moduleId: 'integrated',
    unit: '%',
    helperText:
      'Maintenance burden applied to deployed energy capex when estimating ongoing opex.',
    dependencyTag: 'OPEX',
    decimals: 1,
    baseValue: 3.5,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/a2-energy'],
    source: 'extension',
  },
  {
    key: 'integrated.financing.debt_ratio_pct',
    label: 'Debt ratio',
    shortLabel: 'Debt ratio',
    groupId: 'financing',
    moduleId: 'integrated',
    unit: '%',
    helperText:
      'Integrated-model funding structure placeholder for the upcoming engine.',
    dependencyTag: 'Financing',
    decimals: 1,
    baseValue: 60,
    defaultFavorite: true,
    contexts: ['/', '/assumptions', '/save-export'],
    source: 'extension',
  },
  {
    key: 'integrated.financing.interest_rate_pct',
    label: 'Interest rate',
    shortLabel: 'Interest rate',
    groupId: 'financing',
    moduleId: 'integrated',
    unit: '%',
    helperText: 'Integrated-model debt pricing placeholder.',
    dependencyTag: 'Financing',
    decimals: 1,
    baseValue: 8.6,
    defaultFavorite: true,
    contexts: ['/', '/assumptions', '/save-export'],
    source: 'extension',
  },
  {
    key: 'integrated.tax_fx.effective_tax_rate_pct',
    label: 'Effective tax rate',
    shortLabel: 'Tax rate',
    groupId: 'tax_fx',
    moduleId: 'integrated',
    unit: '%',
    helperText:
      'Effective tax-rate placeholder reserved for the integrated model.',
    dependencyTag: 'Tax',
    decimals: 1,
    baseValue: 28,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/corridor-view'],
    source: 'extension',
  },
  {
    key: 'integrated.tax_fx.reference_fx_rate',
    label: 'Reference FX rate',
    shortLabel: 'FX rate',
    groupId: 'tax_fx',
    moduleId: 'integrated',
    unit: 'ETB/USD',
    helperText:
      'Reference exchange-rate assumption for cross-currency planning views.',
    dependencyTag: 'FX',
    decimals: 1,
    baseValue: 155,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/corridor-view'],
    source: 'extension',
  },
  {
    key: 'integrated.timing.model_horizon_years',
    label: 'Model horizon',
    shortLabel: 'Horizon',
    groupId: 'timing',
    moduleId: 'integrated',
    unit: 'yrs',
    helperText:
      'Integrated-model planning horizon used by mocked valuation outputs.',
    dependencyTag: 'Horizon',
    decimals: 0,
    baseValue: 12,
    defaultFavorite: true,
    contexts: ['/', '/assumptions', '/scenarios', '/corridor-view'],
    source: 'extension',
  },
  {
    key: 'integrated.timing.deployment_months',
    label: 'Deployment period',
    shortLabel: 'Deployment',
    groupId: 'timing',
    moduleId: 'integrated',
    unit: 'mo',
    helperText:
      'Integrated deployment pacing assumption used by the mocked outputs.',
    dependencyTag: 'Timing',
    decimals: 0,
    baseValue: 18,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/scenarios'],
    source: 'extension',
  },
  {
    key: 'integrated.overrides.margin_override_pct',
    label: 'Margin override',
    shortLabel: 'Margin override',
    groupId: 'overrides',
    moduleId: 'integrated',
    unit: '%',
    helperText:
      'Set above zero to override the mocked margin calculation for testing.',
    dependencyTag: 'Manual',
    decimals: 1,
    baseValue: 0,
    defaultFavorite: true,
    contexts: ['/', '/assumptions', '/sensitivities'],
    source: 'extension',
  },
  {
    key: 'integrated.overrides.platform_service_factor_override_pct',
    label: 'Platform service factor override',
    shortLabel: 'Service factor override',
    groupId: 'overrides',
    moduleId: 'integrated',
    unit: '%',
    helperText:
      'Set above zero to override the converged platform service factor used in the integrated engine.',
    dependencyTag: 'Manual',
    decimals: 1,
    baseValue: 0,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/sensitivities', '/corridor-view'],
    source: 'extension',
  },
  {
    key: 'integrated.overrides.energy_replacement_rate_override_pct',
    label: 'Energy replacement rate override',
    shortLabel: 'Replacement override',
    groupId: 'overrides',
    moduleId: 'integrated',
    unit: '%',
    helperText:
      'Set above zero to override the calculated annual battery replacement rate for stress testing.',
    dependencyTag: 'Manual',
    decimals: 1,
    baseValue: 0,
    defaultFavorite: false,
    contexts: ['/', '/assumptions', '/sensitivities', '/a2-energy'],
    source: 'extension',
  },
  {
    key: 'integrated.overrides.error_trigger_flag',
    label: 'Error trigger',
    shortLabel: 'Error trigger',
    groupId: 'overrides',
    moduleId: 'integrated',
    unit: 'flag',
    helperText:
      'Set above zero to force the mocked calculation into an error state.',
    dependencyTag: 'Testing',
    decimals: 0,
    baseValue: 0,
    defaultFavorite: true,
    contexts: ['/', '/assumptions', '/sensitivities'],
    source: 'extension',
  },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[%/]/g, ' ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function titleCaseLabel(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getRowRule(rowLabel: string) {
  return groupByRowLabel.find((rule) => rule.pattern.test(rowLabel));
}

function inferDecimals(unit: string, value: number) {
  if (!Number.isInteger(value)) {
    const decimalText = String(value).split('.')[1] ?? '';
    return Math.min(Math.max(decimalText.length, 1), 3);
  }

  if (unit === 'USD' || unit === 'ETB') {
    return 0;
  }

  return 0;
}

function normalizeUnit(unit: string) {
  switch (unit) {
    case 'USD':
      return '$';
    case 'ETB':
      return 'ETB';
    case 'KW':
      return 'kWh';
    case 'KM':
      return 'km';
    case 'NUMBER':
      return 'count';
    case 'TONNES':
      return 'tonnes';
    default:
      return unit.toLowerCase();
  }
}

function buildReferenceAssumptions() {
  return referenceData.assumptions.base_input_cells.map<AssumptionMetadata>((cell) => {
    const rule = getRowRule(cell.row_label);
    const rowSlug = slugify(cell.row_label);
    const columnSlug =
      cell.column_label === 'QUANTITY' ? 'quantity' : slugify(cell.column_label);
    const baseKey = `a2_fleet.${rowSlug}.${columnSlug}`;
    const label =
      cell.column_label === 'QUANTITY'
        ? titleCaseLabel(cell.row_label)
        : `${titleCaseLabel(cell.row_label)} (${cell.column_label})`;

    return {
      key: baseKey,
      label,
      shortLabel:
        cell.column_label === 'QUANTITY'
          ? titleCaseLabel(cell.row_label)
          : cell.column_label,
      groupId: rule?.groupId ?? 'fleet',
      moduleId: 'a2_fleet',
      unit: normalizeUnit(cell.unit),
      helperText:
        rule?.helperText ??
        'Core planning assumption loaded from the model configuration layer.',
      dependencyTag: rule?.dependencyTag,
      decimals: rule?.decimals ?? inferDecimals(cell.unit, cell.base_value),
      baseValue: cell.base_value,
      defaultFavorite: rule?.defaultFavorite ?? false,
      contexts: rule?.contexts ?? ['/', '/assumptions', '/corridor-view'],
      source: 'reference',
      workbook: {
        sheet: referenceData.assumptions.sheet,
        row: cell.row,
        cell: cell.cell,
        rowLabel: cell.row_label,
        columnLabel: cell.column_label,
      },
    };
  });
}

export const referenceAssumptionMetadata = buildReferenceAssumptions();

export const assumptionMetadata: AssumptionMetadata[] = [
  ...referenceAssumptionMetadata,
  ...extensionAssumptions,
];

export const assumptionMetadataByKey = assumptionMetadata.reduce<
  Record<string, AssumptionMetadata>
>((map, item) => {
  map[item.key] = item;
  return map;
}, {});

export const baseAssumptionValues = assumptionMetadata.reduce<AssumptionValueMap>(
  (values, item) => {
    values[item.key] = item.baseValue;
    return values;
  },
  {},
);

export function getAssumptionsForGroup(groupId: AssumptionGroupId) {
  return assumptionMetadata.filter((item) => item.groupId === groupId);
}

export function getAssumptionGroup(groupId: AssumptionGroupId) {
  return assumptionGroups.find((group) => group.id === groupId);
}

export function formatNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatAssumptionValue(
  metadata: AssumptionMetadata,
  value: number,
  options?: {
    displayCurrency?: DisplayCurrency;
    fxRate?: number;
  },
) {
  const displayValue = convertValueForDisplay(value, metadata.unit, options);
  const displayUnit = getDisplayUnit(metadata.unit, options?.displayCurrency);

  return `${formatNumber(displayValue, metadata.decimals)} ${displayUnit}`;
}

export function getDisplayAssumptionLabel(
  metadata: AssumptionMetadata,
  displayCurrency?: DisplayCurrency,
) {
  return getDisplayLabel(metadata.label, metadata.unit, displayCurrency);
}

export function getChangedAssumptionKeys(
  currentValues: AssumptionValueMap,
  baseValues: AssumptionValueMap,
) {
  return assumptionMetadata
    .filter(
      (item) =>
        Math.abs((currentValues[item.key] ?? 0) - (baseValues[item.key] ?? 0)) >
        0.00001,
    )
    .map((item) => item.key);
}

export function hasChangedFromBase(
  key: string,
  currentValues: AssumptionValueMap,
  baseValues: AssumptionValueMap,
) {
  return getChangedAssumptionKeys(
    { [key]: currentValues[key] },
    { [key]: baseValues[key] },
  ).length > 0;
}

export function getAssumptionKeysForContext(pathname: string) {
  return assumptionMetadata
    .filter((item) => item.contexts.includes(pathname))
    .map((item) => item.key);
}

export function getVisibleAssumptionMetadata(params: {
  pathname: string;
  mode: AssumptionSidebarMode;
  currentValues: AssumptionValueMap;
  baseValues: AssumptionValueMap;
}) {
  const changedKeys = new Set(
    getChangedAssumptionKeys(params.currentValues, params.baseValues),
  );
  const contextKeys = new Set(getAssumptionKeysForContext(params.pathname));

  return assumptionGroups
    .map((group) => {
      const items = assumptionMetadata.filter((item) => {
        if (item.groupId !== group.id) {
          return false;
        }

        switch (params.mode) {
          case 'context':
            return contextKeys.has(item.key);
          case 'changed':
            return changedKeys.has(item.key);
          case 'all':
          default:
            return true;
        }
      });

      return {
        ...group,
        items,
      };
    })
    .filter((group) => group.items.length > 0);
}

export function getBaseAssumptionBundle() {
  return {
    groups: assumptionGroups,
    metadata: assumptionMetadata,
    metadataByKey: assumptionMetadataByKey,
    baseValues: { ...baseAssumptionValues },
    referenceSource: referenceData.source_workbook,
  };
}
