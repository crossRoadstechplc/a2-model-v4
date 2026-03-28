import type { A2FleetWorkbookOutput } from '../a2Fleet';
import { buildPlatformCapacityFromFleet } from '../platformCapacity';
import { buildComputedReturnsSummary } from '../returns';
import {
  addSeries,
  buildNetAssetSeries,
  buildStatement,
  buildUnleveredFreeCashFlowSeries,
  calculateLinearDepreciation,
  clamp,
  getAssumption,
  mapSeries,
  shiftWithLeadingZero,
} from './helpers';
import type { PlatformOutput } from './types';

type PlatformComputationInput = {
  assumptions: Record<string, number>;
  fleet: A2FleetWorkbookOutput;
  serviceFactor: number;
};

export type PlatformComputation = PlatformOutput & {
  derived: {
    swapDemand: number[];
    requiredSites: number[];
    chargersRequired: number[];
    fleetInternalRevenue: number[];
    externalRevenue: number[];
    totalRevenue: number[];
    opex: number[];
    capex: number[];
    depreciation: number[];
    ebitda: number[];
    ebit: number[];
    serviceFactorSeries: number[];
  };
};

export function calculatePlatformModule({
  assumptions,
  fleet,
  serviceFactor,
}: PlatformComputationInput): PlatformComputation {
  const periods = fleet.incomeStatement.periods;
  const fleetTrucks = shiftWithLeadingZero(
    fleet.derivedAssumptions.rows.find((row) => row.key === 'trucks_in_operation')?.values ??
      [],
  );
  const fleetSwapsPerTruck =
    assumptions['a2_fleet.number_of_swaps_per_truck_per_day.quantity'] ?? 1;
  const uptime = getAssumption(assumptions, 'integrated.energy.network_uptime_pct') / 100;
  const annualSwapsCapacityPerSite = getAssumption(
    assumptions,
    'integrated.platform.annual_swaps_capacity_per_site',
  );
  const targetUtilization =
    getAssumption(assumptions, 'integrated.platform.target_site_utilization_pct') / 100;
  const feePerSwap = getAssumption(assumptions, 'integrated.platform.fee_per_swap_usd');
  const subscriptionPerTruckPerMonth = getAssumption(
    assumptions,
    'integrated.platform.subscription_per_truck_per_month_usd',
  );
  const externalRevenueShare =
    getAssumption(assumptions, 'integrated.platform.external_revenue_share_pct') / 100;
  const siteOpex = getAssumption(assumptions, 'integrated.platform.site_opex_usd');
  const supportHeadcount = getAssumption(assumptions, 'integrated.platform.support_headcount');
  const costPerHead = getAssumption(assumptions, 'integrated.platform.cost_per_head_usd');
  const cloudCostPct =
    getAssumption(assumptions, 'integrated.platform.cloud_cost_pct_revenue') / 100;
  const capexPerSite = getAssumption(assumptions, 'integrated.platform.capex_per_site_usd');
  const softwareCapexUsd =
    getAssumption(assumptions, 'integrated.platform.core_software_capex_usd_m') * 1_000_000;
  const assetLifeYears = getAssumption(assumptions, 'integrated.platform.asset_life_years');
  const inflation = getAssumption(assumptions, 'integrated.global.inflation_rate_pct') / 100;
  const breakevenBuffer =
    getAssumption(assumptions, 'integrated.platform.breakeven_buffer_pct') / 100;
  const chargersPerDay =
    assumptions['a2_fleet.number_of_battery_packs_charged_per_charger_per_day.quantity'] ?? 7;
  const capacity = buildPlatformCapacityFromFleet({
    fleet,
    periods,
    assumptions,
    serviceFactor,
    uptime,
  });

  const swapDemand = mapSeries(fleetTrucks, (trucks, index) => {
    if (index === 0) {
      return 0;
    }
    return trucks * fleetSwapsPerTruck * 303 * clamp(serviceFactor * uptime, 0.6, 1.05);
  });

  const requiredSites = mapSeries(swapDemand, (value) =>
    value <= 0
      ? 0
      : Math.ceil(
          value /
            Math.max(annualSwapsCapacityPerSite * Math.max(targetUtilization, 0.25), 1),
        ),
  );

  const chargersRequired = mapSeries(swapDemand, (value) =>
    value <= 0
      ? 0
      : Math.ceil(value / Math.max(chargersPerDay * 365 * Math.max(uptime, 0.5), 1)),
  );

  const serviceFactorSeries = periods.map((_period, index) =>
    index === 0 ? 1 : serviceFactor,
  );

  const fleetInternalRevenue = periods.map((_period, index) => {
    const swapFees = swapDemand[index] * feePerSwap;
    const subscriptionFees = fleetTrucks[index] * subscriptionPerTruckPerMonth * 12;
    return swapFees + subscriptionFees;
  });

  const externalRevenue = fleetInternalRevenue.map((value) => value * externalRevenueShare);
  const totalRevenue = addSeries(fleetInternalRevenue, externalRevenue);

  const opex = periods.map((_period, index) => {
    if (index === 0) {
      return 0;
    }

    const fixedStaff = supportHeadcount * costPerHead * (1 + inflation) ** (index - 1);
    const siteCost = requiredSites[index] * siteOpex * (1 + inflation) ** (index - 1);
    const cloudCost = totalRevenue[index] * cloudCostPct;

    return fixedStaff + siteCost + cloudCost;
  });

  const sitesAdded = requiredSites.map((value, index) =>
    index === 0 ? value : Math.max(0, value - requiredSites[index - 1]),
  );
  const capex = periods.map((_period, index) => {
    const siteCapex = sitesAdded[index] * capexPerSite;
    const anchorCapex =
      index === 1
        ? ((assumptions['a2_fleet.fleet_management_software.cy_2027'] ?? 0) +
            (assumptions['a2_fleet.hardware_and_office_equipment.cy_2027'] ?? 0))
        : 0;
    return siteCapex + anchorCapex + (index === 1 ? softwareCapexUsd : 0);
  });

  const depreciation = calculateLinearDepreciation(capex, assetLifeYears);
  const ebitda = totalRevenue.map((value, index) => value - opex[index]);
  const ebit = ebitda.map((value, index) => value - depreciation[index]);
  const netAssets = buildNetAssetSeries(capex, depreciation);
  const discountRatePct = getAssumption(assumptions, 'integrated.global.discount_rate_pct');
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
  const breakevenRevenue = opex.map(
    (value, index) => (value + depreciation[index]) * (1 + breakevenBuffer),
  );
  const breakevenCoverage = totalRevenue.map((value, index) =>
    breakevenRevenue[index] <= 0 ? 0 : value / breakevenRevenue[index],
  );

  return {
    periods,
    capacity,
    operations: buildStatement('PLATFORM OPERATIONS', periods, [
      {
        key: 'swap_demand',
        label: 'Throughput Demand',
        unit: 'count',
        values: swapDemand,
      },
      {
        key: 'required_sites',
        label: 'Required Sites',
        unit: 'count',
        values: requiredSites,
      },
      {
        key: 'chargers_required',
        label: 'Chargers Required',
        unit: 'count',
        values: chargersRequired,
      },
      {
        key: 'service_factor',
        label: 'Service Factor',
        unit: '%',
        values: serviceFactorSeries,
      },
    ]),
    incomeStatement: buildStatement('PLATFORM INCOME', periods, [
      {
        key: 'fleet_internal_revenue',
        label: 'Fleet Internal Revenue',
        unit: '$',
        values: fleetInternalRevenue,
      },
      {
        key: 'external_revenue',
        label: 'External Revenue',
        unit: '$',
        values: externalRevenue,
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
        key: 'breakeven_coverage',
        label: 'Breakeven Coverage',
        unit: 'x',
        values: breakevenCoverage,
      },
    ]),
    capexDepreciation: buildStatement('PLATFORM CAPEX', periods, [
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
    returnsSummary: buildComputedReturnsSummary(
      {
        title: 'Returns / Valuation',
        basisLabel:
          'Platform Project IRR uses an explicit unlevered free cash flow series: EBIT after tax plus depreciation, less capex, with terminal net asset value in the final period. Equity IRR remains pending until explicit equity injections, distributions, and exit proceeds are modeled.',
        projectCashFlowSeries,
        discountRatePct,
        projectIrrNotes: [
          'Project IRR excludes financing flows and is based on explicit unlevered free cash flow.',
          'Working capital is not yet modeled explicitly in the Platform module and is currently treated as zero.',
        ],
        equityIrrNotes: [
          'Equity IRR is intentionally pending until Platform financing, equity injections, and investor distributions are modeled.',
        ],
        npvDescription:
          'NPV uses the current integrated discount-rate assumption against the Platform project FCFF stream.',
        terminalValuePolicy: {
          method: 'netAssets',
          value: terminalNetAssets,
          note: 'Final-period Platform net asset value is used as the provisional terminal value basis.',
        },
        seriesDefinitions: [
          {
            type: 'project',
            label: 'Platform project FCFF series',
            values: projectCashFlowSeries,
            note: 'EBIT after tax plus depreciation, less capex, with final net assets carried as terminal value.',
          },
          {
            type: 'equity',
            label: 'Platform equity cash flow series',
            values: null,
            note: 'Pending until explicit Platform financing and investor distribution schedules are modeled.',
          },
        ],
        notes: [
          'Platform returns now separate project cash flow logic from equity investor logic.',
        ],
      },
    ),
    kpis: [
      {
        id: 'platform_revenue',
        label: 'Platform Revenue',
        value: totalRevenue[totalRevenue.length - 1] / 1_000_000,
        format: 'currencyM',
        description: `Platform total revenue in ${periods[periods.length - 1]}.`,
      },
      {
        id: 'platform_ebitda_margin',
        label: 'Platform EBITDA Margin',
        value:
          totalRevenue[totalRevenue.length - 1] === 0
            ? 0
            : (ebitda[ebitda.length - 1] / totalRevenue[totalRevenue.length - 1]) * 100,
        format: 'percent',
        description: `Platform EBITDA margin in ${periods[periods.length - 1]}.`,
      },
      {
        id: 'platform_sites',
        label: 'Required Sites',
        value: requiredSites[requiredSites.length - 1],
        format: 'number',
        description: `Platform site count in ${periods[periods.length - 1]}.`,
      },
      {
        id: 'platform_breakeven',
        label: 'Breakeven Coverage',
        value: breakevenCoverage[breakevenCoverage.length - 1],
        format: 'multiple',
        description: `Revenue coverage of buffered breakeven in ${periods[periods.length - 1]}.`,
      },
    ],
    derived: {
      swapDemand,
      requiredSites,
      chargersRequired,
      fleetInternalRevenue,
      externalRevenue,
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
