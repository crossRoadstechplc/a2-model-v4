import type { A2FleetWorkbookOutput } from '../a2Fleet';
import { buildComputedReturnsSummary } from '../returns';
import {
  addSeries,
  alignSeriesToPeriods,
  buildNetAssetSeries,
  buildStatement,
  buildUnleveredFreeCashFlowSeries,
  calculateLinearDepreciation,
  clamp,
  getAssumption,
  getRowValues,
  mapSeries,
} from './helpers';
import type { EnergyOutput } from './types';

type EnergyComputationInput = {
  assumptions: Record<string, number>;
  fleet: A2FleetWorkbookOutput;
  platform: {
    periods: string[];
    swapDemand: number[];
    requiredSites: number[];
    chargersRequired: number[];
    externalRevenue: number[];
  };
  serviceFactor: number;
  replacementRateOverride?: number;
};

export type EnergyComputation = EnergyOutput & {
  derived: {
    batteryPacksRequired: number[];
    batteryPacksProvisioned: number[];
    batteryReplacements: number[];
    replacementRate: number[];
    provisionExpense: number[];
    leaseIncome: number[];
    revenueShareIncome: number[];
    totalRevenue: number[];
    opex: number[];
    capex: number[];
    depreciation: number[];
    ebitda: number[];
    ebit: number[];
    serviceFactorSeries: number[];
  };
};

export function calculateEnergyModule({
  assumptions,
  fleet,
  platform,
  serviceFactor: _serviceFactor,
  replacementRateOverride,
}: EnergyComputationInput): EnergyComputation {
  const periods = platform.periods;
  const fleetTrucks = alignSeriesToPeriods(
    periods,
    fleet.derivedAssumptions.rows.find(
      (row) => row.key === 'number_of_trucks_cumalative',
    )?.values ?? [],
  );
  const workbookBatteryPacksRequired = alignSeriesToPeriods(
    periods,
    fleet.derivedAssumptions.rows.find(
      (row) => row.key === 'total_number_of_battery_packs',
    )?.values ?? [],
  );
  const powerSalesRevenue = getRowValues(fleet.incomeStatement, 'revenue');
  const powerPurchaseCost = getRowValues(
    fleet.incomeStatement,
    'cost_of_power_purchase_from_eep',
  );
  const workbookEnergyCapex = periods.map((_period, index) => {
    const totalCapex = getRowValues(fleet.capexDepreciation, 'total_capex')[index] ?? 0;
    const platformCapex =
      (getRowValues(fleet.capexDepreciation, 'software_platform_development')[index] ?? 0) +
      (getRowValues(fleet.capexDepreciation, 'hardware_office_equipment')[index] ?? 0);
    return Math.max(0, totalCapex - platformCapex);
  });
  const workbookEnergyNetAssets = addSeries(
    getRowValues(fleet.capexDepreciation, 'asset_value_charging_swapping_stations'),
    getRowValues(fleet.capexDepreciation, 'asset_value_chargers'),
    getRowValues(fleet.capexDepreciation, 'asset_value_battery_packs'),
  );
  const packsPerTruck = getAssumption(assumptions, 'integrated.energy.battery_packs_per_truck');
  const spareBuffer =
    getAssumption(assumptions, 'integrated.energy.spare_battery_buffer_pct') / 100;
  const annualCyclesPerPack = getAssumption(
    assumptions,
    'integrated.energy.annual_cycles_per_pack',
  );
  const packCycleLife = getAssumption(assumptions, 'integrated.energy.pack_cycle_life');
  const replacementTrigger =
    getAssumption(assumptions, 'integrated.energy.replacement_trigger_pct') / 100;
  const packCost = getAssumption(assumptions, 'integrated.energy.pack_cost_usd');
  const provisionRate =
    getAssumption(assumptions, 'integrated.energy.provision_rate_pct') / 100;
  const leaseRate = getAssumption(
    assumptions,
    'integrated.energy.lease_rate_per_pack_per_month_usd',
  );
  const revenueShare =
    getAssumption(assumptions, 'integrated.energy.platform_revenue_share_pct') / 100;
  const fixedOpex = getAssumption(assumptions, 'integrated.energy.fixed_opex_usd_m') * 1_000_000;
  const swapStationCapex = getAssumption(
    assumptions,
    'integrated.energy.swap_station_capex_usd',
  );
  const chargerCapex = getAssumption(assumptions, 'integrated.energy.charger_capex_usd');
  const assetLifeYears = getAssumption(assumptions, 'integrated.energy.asset_life_years');
  const maintenancePct =
    getAssumption(assumptions, 'integrated.energy.maintenance_pct_capex') / 100;
  const uptime = getAssumption(assumptions, 'integrated.energy.network_uptime_pct') / 100;

  const batteryPacksRequired = mapSeries(fleetTrucks, (trucks, index) =>
    workbookBatteryPacksRequired[index] > 0
      ? workbookBatteryPacksRequired[index]
      : trucks * packsPerTruck * (1 + spareBuffer),
  );

  const batteryPacksProvisioned = batteryPacksRequired.map((value) => value * provisionRate);

  const calculatedReplacementRate = periods.map((_period, index) => {
    if (index === 0 || batteryPacksRequired[index] <= 0) {
      return 0;
    }

    const utilizationBurden =
      platform.swapDemand[index] /
      Math.max(batteryPacksRequired[index] * Math.max(annualCyclesPerPack, 1), 1);
    const burdenFactor = utilizationBurden / Math.max(packCycleLife, 1);
    return clamp(
      burdenFactor / Math.max(replacementTrigger, 0.1) * 1.5,
      0.005,
      0.35,
    );
  });

  const replacementRate = calculatedReplacementRate.map((value) =>
    replacementRateOverride && replacementRateOverride > 0
      ? replacementRateOverride
      : value,
  );

  const batteryReplacements = batteryPacksRequired.map(
    (value, index) => value * replacementRate[index],
  );
  const replacementCapex = batteryReplacements.map((value) => value * packCost);
  const provisionExpense = replacementCapex.map((value) => value * provisionRate);
  const leaseIncome = batteryPacksRequired.map((value) => value * leaseRate * 12);
  const revenueShareIncome = platform.externalRevenue.map((value) => value * revenueShare);
  const totalRevenue = addSeries(powerSalesRevenue, leaseIncome, revenueShareIncome);

  const stationsAdded = platform.requiredSites.map((value, index) =>
    index === 0 ? value : Math.max(0, value - platform.requiredSites[index - 1]),
  );
  const chargersAdded = platform.chargersRequired.map((value, index) =>
    index === 0 ? value : Math.max(0, value - platform.chargersRequired[index - 1]),
  );
  const packsAdded = batteryPacksRequired.map((value, index) =>
    index === 0 ? value : Math.max(0, value - batteryPacksRequired[index - 1]),
  );

  const capex = periods.map((_period, index) =>
    Math.max(
      workbookEnergyCapex[index] ?? 0,
      stationsAdded[index] * swapStationCapex +
        chargersAdded[index] * chargerCapex +
        packsAdded[index] * packCost +
        replacementCapex[index],
    ),
  );

  const depreciation = calculateLinearDepreciation(capex, assetLifeYears);
  const modeledNetAssets = buildNetAssetSeries(capex, depreciation);
  const netAssets = periods.map(
    (_period, index) => workbookEnergyNetAssets[index] ?? modeledNetAssets[index] ?? 0,
  );
  const discountRatePct = getAssumption(assumptions, 'integrated.global.discount_rate_pct');

  const opex = periods.map((_period, index) => {
    const maintenance = netAssets[index] * maintenancePct;
    const fixed = index === 0 ? 0 : fixedOpex;
    return fixed + maintenance + provisionExpense[index] + (powerPurchaseCost[index] ?? 0);
  });

  const ebitda = totalRevenue.map((value, index) => value - opex[index]);
  const ebit = ebitda.map((value, index) => value - depreciation[index]);
  const taxRatePct =
    getAssumption(assumptions, 'integrated.tax_fx.effective_tax_rate_pct') / 100;
  const terminalNetAssets = netAssets[netAssets.length - 1] ?? 0;
  const projectCashFlowSeries = buildUnleveredFreeCashFlowSeries({
    ebit,
    depreciation,
    capex,
    taxRatePct,
    terminalValue: terminalNetAssets,
  });
  const serviceFactorSeries = periods.map((_period, index) => {
    if (index === 0) {
      return 1;
    }

    const provisionCoverage =
      batteryReplacements[index] <= 0
        ? 1
        : batteryPacksProvisioned[index] / batteryReplacements[index];
    return clamp(
      uptime * (1 - replacementRate[index] * 0.25) + Math.min(0.05, provisionCoverage * 0.02),
      0.72,
      1.02,
    );
  });

  return {
    periods,
    operations: buildStatement('ENERGY OPERATIONS', periods, [
      {
        key: 'battery_packs_required',
        label: 'Battery Packs Required',
        unit: 'count',
        values: batteryPacksRequired,
      },
      {
        key: 'battery_packs_provisioned',
        label: 'Provisioned Packs',
        unit: 'count',
        values: batteryPacksProvisioned,
      },
      {
        key: 'battery_replacements',
        label: 'Battery Replacements',
        unit: 'count',
        values: batteryReplacements,
      },
      {
        key: 'replacement_rate',
        label: 'Replacement Rate',
        unit: '%',
        values: replacementRate,
      },
      {
        key: 'service_factor',
        label: 'Service Factor',
        unit: '%',
        values: serviceFactorSeries,
      },
    ]),
    incomeStatement: buildStatement('ENERGY INCOME', periods, [
      {
        key: 'power_sales_revenue',
        label: 'Power Sales Revenue',
        unit: '$',
        values: powerSalesRevenue,
      },
      {
        key: 'lease_income',
        label: 'Lease Income',
        unit: '$',
        values: leaseIncome,
      },
      {
        key: 'revenue_share_income',
        label: 'Revenue Share Income',
        unit: '$',
        values: revenueShareIncome,
      },
      {
        key: 'total_revenue',
        label: 'Total Revenue',
        unit: '$',
        values: totalRevenue,
      },
      {
        key: 'opex',
        label: 'Operating Expenses',
        unit: '$',
        values: opex,
      },
      {
        key: 'ebitda',
        label: 'EBITDA',
        unit: '$',
        values: ebitda,
      },
      {
        key: 'depreciation',
        label: 'Depreciation',
        unit: '$',
        values: depreciation,
      },
      {
        key: 'ebit',
        label: 'EBIT',
        unit: '$',
        values: ebit,
      },
      {
        key: 'provision_expense',
        label: 'Provision Expense',
        unit: '$',
        values: provisionExpense,
      },
      {
        key: 'power_purchase_cost',
        label: 'Power Purchase Cost',
        unit: '$',
        values: powerPurchaseCost,
      },
    ]),
    capexDepreciation: buildStatement('ENERGY CAPEX', periods, [
      {
        key: 'capex',
        label: 'Capex',
        unit: '$',
        values: capex,
      },
      {
        key: 'depreciation',
        label: 'Depreciation',
        unit: '$',
        values: depreciation,
      },
      {
        key: 'net_assets',
        label: 'Net Asset Base',
        unit: '$',
        values: netAssets,
      },
    ]),
    returnsSummary: buildComputedReturnsSummary({
      title: 'Returns / Valuation',
      basisLabel:
        'Energy Project IRR uses an explicit unlevered free cash flow series: EBIT after tax plus depreciation, less capex, with terminal net asset value in the final period. Equity IRR remains pending until explicit Energy financing and investor distributions are modeled.',
      projectCashFlowSeries,
      discountRatePct,
      projectIrrNotes: [
        'Project IRR excludes financing flows and is based on explicit unlevered free cash flow.',
        'Working capital is not yet modeled explicitly in the Energy module and is currently treated as zero.',
      ],
      equityIrrNotes: [
        'Equity IRR is intentionally pending until Energy financing, equity injections, and investor distributions are modeled.',
      ],
      npvDescription:
        'NPV uses the current integrated discount-rate assumption against the Energy project FCFF stream.',
      terminalValuePolicy: {
        method: 'netAssets',
        value: terminalNetAssets,
        note: 'Final-period Energy net asset value is used as the provisional terminal value basis.',
      },
      seriesDefinitions: [
        {
          type: 'project',
          label: 'Energy project FCFF series',
          values: projectCashFlowSeries,
          note: 'EBIT after tax plus depreciation, less capex, with final net assets carried as terminal value.',
        },
        {
          type: 'equity',
          label: 'Energy equity cash flow series',
          values: null,
          note: 'Pending until explicit Energy financing and investor distribution schedules are modeled.',
        },
      ],
      notes: [
        'Energy returns now separate project cash flow logic from equity investor logic.',
      ],
    }),
    kpis: [
      {
        id: 'energy_revenue',
        label: 'Energy Revenue',
        value: totalRevenue[totalRevenue.length - 1] / 1_000_000,
        format: 'currencyM',
        description: `Energy total revenue in ${periods[periods.length - 1]}.`,
      },
      {
        id: 'battery_packs',
        label: 'Battery Packs Required',
        value: batteryPacksRequired[batteryPacksRequired.length - 1],
        format: 'number',
        description: `Battery inventory base in ${periods[periods.length - 1]}.`,
      },
      {
        id: 'energy_replacement_rate',
        label: 'Replacement Rate',
        value: replacementRate[replacementRate.length - 1] * 100,
        format: 'percent',
        description: `Annual battery replacement burden in ${periods[periods.length - 1]}.`,
      },
      {
        id: 'energy_service_factor',
        label: 'Service Factor',
        value: serviceFactorSeries[serviceFactorSeries.length - 1] * 100,
        format: 'percent',
        description: `Converged energy service support factor in ${periods[periods.length - 1]}.`,
      },
    ],
    derived: {
      batteryPacksRequired,
      batteryPacksProvisioned,
      batteryReplacements,
      replacementRate,
      provisionExpense,
      leaseIncome,
      revenueShareIncome,
      totalRevenue,
      opex,
      capex,
      depreciation,
      ebitda,
      ebit,
      serviceFactorSeries,
    },
  };
}
