import type { AssumptionValueMap } from '../../model/assumptions';
import type { A2FleetWorkbookOutput } from '../a2Fleet';
import { buildComputedReturnsSummary } from '../returns';
import { runA2FleetWorkbook } from '../a2Fleet';
import { calculateEnergyModule } from './energy';
import { addSeries, buildStatement, clamp, getAssumption, subtractSeries } from './helpers';
import { calculatePlatformModule } from './platform';
import type {
  ConsolidatedElimination,
  ConsolidatedOutput,
  ConvergenceDiagnostics,
  IntegratedModelOptions,
  IntegratedModelOutput,
  IntercompanyFlowOutput,
} from './types';

function buildIntercompanyFlowStatement(
  periods: string[],
  fleetToPlatformFees: number[],
  platformToEnergyLease: number[],
  platformToEnergyRevenueShare: number[],
): IntercompanyFlowOutput {
  return {
    periods,
    fleetToPlatformFees,
    platformToEnergyLease,
    platformToEnergyRevenueShare,
    statement: buildStatement('INTERCOMPANY FLOWS', periods, [
      {
        key: 'fleet_to_platform_fees',
        label: 'Fleet to Platform Fees',
        unit: '$',
        values: fleetToPlatformFees,
      },
      {
        key: 'platform_to_energy_lease',
        label: 'Platform to Energy Lease',
        unit: '$',
        values: platformToEnergyLease,
      },
      {
        key: 'platform_to_energy_revenue_share',
        label: 'Platform to Energy Revenue Share',
        unit: '$',
        values: platformToEnergyRevenueShare,
      },
      {
        key: 'total_internal_flows',
        label: 'Total Internal Flows',
        unit: '$',
        values: addSeries(
          fleetToPlatformFees,
          platformToEnergyLease,
          platformToEnergyRevenueShare,
        ),
      },
    ]),
  };
}

function buildEliminations(
  periods: string[],
  intercompany: IntercompanyFlowOutput,
): ConsolidatedElimination[] {
  return [
    {
      id: 'fleet_platform_fee',
      source: 'fleet',
      target: 'platform',
      label: 'Fleet to Platform Fees',
      periods,
      amounts: intercompany.fleetToPlatformFees,
      revenueLine: 'fleet_internal_revenue',
      expenseLine: 'fleet_platform_fee_adjustment',
    },
    {
      id: 'platform_energy_lease',
      source: 'platform',
      target: 'energy',
      label: 'Platform to Energy Lease',
      periods,
      amounts: intercompany.platformToEnergyLease,
      revenueLine: 'lease_income',
      expenseLine: 'energy_lease_expense',
    },
    {
      id: 'platform_energy_revenue_share',
      source: 'platform',
      target: 'energy',
      label: 'Platform to Energy Revenue Share',
      periods,
      amounts: intercompany.platformToEnergyRevenueShare,
      revenueLine: 'revenue_share_income',
      expenseLine: 'energy_revenue_share_expense',
    },
  ];
}

function buildConsolidatedOutput(params: {
  assumptions: AssumptionValueMap;
  fleet: A2FleetWorkbookOutput;
  platform: ReturnType<typeof calculatePlatformModule>;
  energy: ReturnType<typeof calculateEnergyModule>;
  intercompany: IntercompanyFlowOutput;
}): ConsolidatedOutput {
  const { assumptions, fleet, platform, energy, intercompany } = params;
  const periods = fleet.incomeStatement.periods;
  const eliminations = buildEliminations(periods, intercompany);
  const fleetRevenue =
    fleet.incomeStatement.rows.find((row) => row.key === 'revenue')?.values ?? [];
  const fleetBatteryCharge =
    fleet.incomeStatement.rows.find((row) => row.key === 'battery_charge')?.values ?? [];
  const fleetOpex =
    fleet.incomeStatement.rows.find((row) => row.key === 'operating_expenses')?.values ?? [];
  const fleetVariableOpex =
    fleet.incomeStatement.rows.find((row) => row.key === 'variable_opex')?.values ?? [];
  const fleetDepreciation =
    fleet.incomeStatement.rows.find((row) => row.key === 'depreciation')?.values ?? [];
  const fleetNetIncome =
    fleet.incomeStatement.rows.find((row) => row.key === 'net_income')?.values ?? [];
  const fleetClosingCash =
    fleet.cashFlow.rows.find((row) => row.key === 'closing_cash')?.values ?? [];
  const fleetAssets =
    fleet.balanceSheet.rows.find((row) => row.key === 'total_assets')?.values ?? [];
  const fleetEquity =
    fleet.balanceSheet.rows.find((row) => row.key === 'total_equity')?.values ?? [];

  const totalRevenuePreElimination = addSeries(
    fleetRevenue,
    platform.derived.totalRevenue,
    energy.derived.totalRevenue,
  );
  const internalRevenueElimination = intercompany.statement.rows
    .find((row) => row.key === 'total_internal_flows')
    ?.values.map((value) => -value) ?? [];
  const consolidatedRevenue = addSeries(
    totalRevenuePreElimination,
    internalRevenueElimination,
  );
  const operatingCostsPreElimination = addSeries(
    fleetBatteryCharge,
    fleetOpex,
    fleetVariableOpex,
    intercompany.fleetToPlatformFees,
    platform.derived.opex,
    intercompany.platformToEnergyLease,
    intercompany.platformToEnergyRevenueShare,
    energy.derived.opex,
  );
  const internalExpenseElimination = intercompany.statement.rows
    .find((row) => row.key === 'total_internal_flows')
    ?.values.map((value) => -value) ?? [];
  const consolidatedOperatingCosts = addSeries(
    operatingCostsPreElimination,
    internalExpenseElimination,
  );
  const consolidatedDepreciation = addSeries(
    fleetDepreciation,
    platform.derived.depreciation,
    energy.derived.depreciation,
  );
  const consolidatedEbitda = subtractSeries(
    consolidatedRevenue,
    consolidatedOperatingCosts,
  );
  const consolidatedEbit = subtractSeries(consolidatedEbitda, consolidatedDepreciation);
  const taxRate = getAssumption(assumptions, 'integrated.tax_fx.effective_tax_rate_pct') / 100;
  const consolidatedTax = consolidatedEbit.map((value) =>
    value > 0 ? value * taxRate : 0,
  );
  const consolidatedNetIncome = subtractSeries(consolidatedEbit, consolidatedTax);
  const consolidatedCapex = addSeries(
    platform.derived.capex,
    energy.derived.capex,
  );
  const consolidatedNetCash = subtractSeries(
    addSeries(fleetNetIncome, platform.derived.ebitda, energy.derived.ebitda),
    consolidatedCapex,
  );
  const consolidatedAssets = addSeries(
    fleetAssets,
    platform.capexDepreciation.rows.find((row) => row.key === 'net_assets')?.values ?? [],
    energy.capexDepreciation.rows.find((row) => row.key === 'net_assets')?.values ?? [],
  );
  const consolidatedEquity = addSeries(fleetEquity, consolidatedNetIncome);
  const discountRatePct = getAssumption(assumptions, 'integrated.global.discount_rate_pct');
  const consolidatedReturnCashFlowSeries = consolidatedNetIncome.map((value, index) => {
    const baseValue = value - consolidatedCapex[index];
    return index === consolidatedNetIncome.length - 1
      ? baseValue + (consolidatedEquity[index] ?? 0)
      : baseValue;
  });

  return {
    periods,
    eliminations,
    incomeStatement: buildStatement('CONSOLIDATED INCOME', periods, [
      {
        key: 'total_revenue_pre_elimination',
        label: 'Revenue Before Elimination',
        unit: '$',
        values: totalRevenuePreElimination,
      },
      {
        key: 'internal_revenue_elimination',
        label: 'Internal Revenue Elimination',
        unit: '$',
        values: internalRevenueElimination,
      },
      {
        key: 'consolidated_revenue',
        label: 'Consolidated Revenue',
        unit: '$',
        values: consolidatedRevenue,
      },
      {
        key: 'operating_costs',
        label: 'Operating Costs',
        unit: '$',
        values: consolidatedOperatingCosts,
      },
      {
        key: 'internal_expense_elimination',
        label: 'Internal Expense Elimination',
        unit: '$',
        values: internalExpenseElimination,
      },
      {
        key: 'ebitda',
        label: 'EBITDA',
        unit: '$',
        values: consolidatedEbitda,
      },
      {
        key: 'depreciation',
        label: 'Depreciation',
        unit: '$',
        values: consolidatedDepreciation,
      },
      {
        key: 'ebit',
        label: 'EBIT',
        unit: '$',
        values: consolidatedEbit,
      },
      {
        key: 'tax',
        label: 'Tax',
        unit: '$',
        values: consolidatedTax,
      },
      {
        key: 'net_income',
        label: 'Net Income',
        unit: '$',
        values: consolidatedNetIncome,
      },
    ]),
    cashFlow: buildStatement('CONSOLIDATED CASH FLOW', periods, [
      {
        key: 'fleet_closing_cash_anchor',
        label: 'Fleet Closing Cash Anchor',
        unit: '$',
        values: fleetClosingCash,
      },
      {
        key: 'platform_energy_capex',
        label: 'Platform + Energy Capex',
        unit: '$',
        values: consolidatedCapex,
      },
      {
        key: 'net_cash_after_expansion',
        label: 'Net Cash After Expansion',
        unit: '$',
        values: consolidatedNetCash,
      },
    ]),
    balanceSheet: buildStatement('CONSOLIDATED BALANCE SHEET', periods, [
      {
        key: 'fleet_assets_anchor',
        label: 'Fleet Assets Anchor',
        unit: '$',
        values: fleetAssets,
      },
      {
        key: 'platform_assets',
        label: 'Platform Net Assets',
        unit: '$',
        values:
          platform.capexDepreciation.rows.find((row) => row.key === 'net_assets')?.values ?? [],
      },
      {
        key: 'energy_assets',
        label: 'Energy Net Assets',
        unit: '$',
        values:
          energy.capexDepreciation.rows.find((row) => row.key === 'net_assets')?.values ?? [],
      },
      {
        key: 'total_assets',
        label: 'Consolidated Total Assets',
        unit: '$',
        values: consolidatedAssets,
      },
      {
        key: 'total_equity',
        label: 'Consolidated Equity',
        unit: '$',
        values: consolidatedEquity,
      },
    ]),
    kpis: [
      {
        id: 'consolidated_revenue',
        label: 'Consolidated Revenue',
        value: consolidatedRevenue[consolidatedRevenue.length - 1] / 1_000_000,
        format: 'currencyM',
        description: `Consolidated scaffold revenue in ${periods[periods.length - 1]}.`,
      },
      {
        id: 'consolidated_ebitda_margin',
        label: 'Consolidated EBITDA Margin',
        value:
          consolidatedRevenue[consolidatedRevenue.length - 1] === 0
            ? 0
            : (consolidatedEbitda[consolidatedEbitda.length - 1] /
                consolidatedRevenue[consolidatedRevenue.length - 1]) *
              100,
        format: 'percent',
        description: `Consolidated scaffold EBITDA margin in ${periods[periods.length - 1]}.`,
      },
      {
        id: 'internal_flow_ratio',
        label: 'Internal Flow Ratio',
        value:
          consolidatedRevenue[consolidatedRevenue.length - 1] === 0
            ? 0
            : ((intercompany.fleetToPlatformFees[periods.length - 1] +
                intercompany.platformToEnergyLease[periods.length - 1] +
                intercompany.platformToEnergyRevenueShare[periods.length - 1]) /
                totalRevenuePreElimination[periods.length - 1]) *
              100,
        format: 'percent',
        description: `Share of pre-elimination revenue represented by internal flows.`,
      },
      {
        id: 'consolidated_assets',
        label: 'Consolidated Assets',
        value: consolidatedAssets[consolidatedAssets.length - 1] / 1_000_000,
        format: 'currencyM',
        description: `Consolidated scaffold total assets in ${periods[periods.length - 1]}.`,
      },
    ],
    returnsSummary: buildComputedReturnsSummary({
      title: 'Returns / Valuation',
      basisLabel:
        'Consolidated returns currently use a first-pass cash flow basis: consolidated net income less expansion capex, with terminal consolidated equity carried in the final period. Equity IRR currently mirrors that same basis until a full integrated financing stack is modeled.',
      projectCashFlowSeries: consolidatedReturnCashFlowSeries,
      discountRatePct,
      fallbackInitialInvestment:
        consolidatedCapex.find((value) => value > 0) ??
        consolidatedAssets.find((value) => value > 0) ??
        0,
      useProjectSeriesForEquity: true,
      npvDescription:
        'NPV uses the current integrated discount-rate assumption against the provisional consolidated cash flow stream.',
    }),
  };
}

export function runIntegratedModel(
  assumptions: AssumptionValueMap,
  fleetAnchor?: A2FleetWorkbookOutput,
  options: IntegratedModelOptions = {},
): IntegratedModelOutput {
  const fleet = fleetAnchor ?? runA2FleetWorkbook(assumptions);
  const tolerance = options.tolerance ?? 0.0005;
  const maxIterations =
    options.manualOverrides?.maxIterations ??
    options.maxIterations ??
    8;
  const serviceOverrideRaw =
    options.manualOverrides?.serviceFactor ??
    getAssumption(assumptions, 'integrated.overrides.platform_service_factor_override_pct') /
      100;
  const replacementOverrideRaw =
    options.manualOverrides?.replacementRate ??
    getAssumption(
      assumptions,
      'integrated.overrides.energy_replacement_rate_override_pct',
    ) /
      100;

  let serviceFactor = serviceOverrideRaw > 0 ? serviceOverrideRaw : 1;
  const history: ConvergenceDiagnostics['history'] = [];
  let platform = calculatePlatformModule({
    assumptions,
    fleet,
    serviceFactor,
  });
  let energy = calculateEnergyModule({
    assumptions,
    fleet,
    platform: {
      periods: platform.periods,
      swapDemand: platform.derived.swapDemand,
      requiredSites: platform.derived.requiredSites,
      chargersRequired: platform.derived.chargersRequired,
      externalRevenue: platform.derived.externalRevenue,
    },
    serviceFactor,
    replacementRateOverride: replacementOverrideRaw > 0 ? replacementOverrideRaw : undefined,
  });

  if (serviceOverrideRaw <= 0) {
    for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
      const nextServiceFactor = clamp(
        energy.derived.serviceFactorSeries[energy.derived.serviceFactorSeries.length - 1],
        0.72,
        1.02,
      );
      const maxDelta = Math.abs(nextServiceFactor - serviceFactor);
      serviceFactor = nextServiceFactor;

      history.push({
        iteration,
        serviceFactor,
        platformSites:
          platform.derived.requiredSites[platform.derived.requiredSites.length - 1] ?? 0,
        batteryPacks:
          energy.derived.batteryPacksRequired[energy.derived.batteryPacksRequired.length - 1] ??
          0,
        replacementRate:
          energy.derived.replacementRate[energy.derived.replacementRate.length - 1] ?? 0,
        maxDelta,
      });

      if (maxDelta <= tolerance) {
        break;
      }

      platform = calculatePlatformModule({
        assumptions,
        fleet,
        serviceFactor,
      });
      energy = calculateEnergyModule({
        assumptions,
        fleet,
        platform: {
          periods: platform.periods,
          swapDemand: platform.derived.swapDemand,
          requiredSites: platform.derived.requiredSites,
          chargersRequired: platform.derived.chargersRequired,
          externalRevenue: platform.derived.externalRevenue,
        },
        serviceFactor,
        replacementRateOverride:
          replacementOverrideRaw > 0 ? replacementOverrideRaw : undefined,
      });
    }
  } else {
    history.push({
      iteration: 1,
      serviceFactor,
      platformSites:
        platform.derived.requiredSites[platform.derived.requiredSites.length - 1] ?? 0,
      batteryPacks:
        energy.derived.batteryPacksRequired[energy.derived.batteryPacksRequired.length - 1] ??
        0,
      replacementRate:
        energy.derived.replacementRate[energy.derived.replacementRate.length - 1] ?? 0,
      maxDelta: 0,
    });
  }

  const intercompany = buildIntercompanyFlowStatement(
    platform.periods,
    platform.derived.fleetInternalRevenue,
    energy.derived.leaseIncome,
    energy.derived.revenueShareIncome,
  );
  const convergence: ConvergenceDiagnostics = {
    status:
      serviceOverrideRaw > 0
        ? 'manual_override'
        : history[history.length - 1]?.maxDelta <= tolerance
          ? 'converged'
          : 'max_iterations',
    iterations: history.length,
    tolerance,
    maxDelta: history[history.length - 1]?.maxDelta ?? 0,
    history,
    usedOverrides: [
      ...(serviceOverrideRaw > 0 ? ['serviceFactor'] : []),
      ...(replacementOverrideRaw > 0 ? ['replacementRate'] : []),
    ],
  };
  const consolidated = buildConsolidatedOutput({
    assumptions,
    fleet,
    platform,
    energy,
    intercompany,
  });

  return {
    fleet,
    platform,
    energy,
    intercompany,
    convergence,
    consolidated,
  };
}

export * from './types';
