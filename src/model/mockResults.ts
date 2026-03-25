import type { AssumptionValueMap } from './assumptions';

export type MockOutputCard = {
  id: string;
  label: string;
  value: number;
  format: 'currencyM' | 'percent' | 'years' | 'score';
  description: string;
};

function round(value: number, decimals: number) {
  return Number(value.toFixed(decimals));
}

export function buildMockResults(values: AssumptionValueMap): MockOutputCard[] {
  const demandGrowth = values['integrated.global.demand_growth_pct'] / 100;
  const inflation = values['integrated.global.inflation_rate_pct'] / 100;
  const discountRate = values['integrated.global.discount_rate_pct'] / 100;
  const fleetAdds = [
    values['a2_fleet.number_of_trucks.cy_2027'],
    values['a2_fleet.number_of_trucks.cy_2028'],
    values['a2_fleet.number_of_trucks.cy_2029'],
    values['a2_fleet.number_of_trucks.cy_2030'],
    values['a2_fleet.number_of_trucks.cy_2031'],
    values['a2_fleet.number_of_trucks.cy_2032'],
    values['a2_fleet.number_of_trucks.cy_2033'],
  ];
  const fleetSize = fleetAdds.reduce((sum, item) => sum + item, 0);
  const utilizationBase =
    values['a2_fleet.number_of_swaps_per_truck_per_day.quantity'] /
    values['a2_fleet.number_of_days_per_trip.quantity'];
  const utilization = Math.min(0.98, Math.max(0.35, utilizationBase));
  const averageTonnes =
    values['a2_fleet.average_chargeable_tonnes_per_trip.quantity'];
  const freightRateEtb = values['a2_fleet.freight_rate_per_tonne.quantity'];
  const fxRate = values['integrated.tax_fx.reference_fx_rate'];
  const revenuePerVehicle = (averageTonnes * freightRateEtb * 52 * utilization) / fxRate / 1_000_000;
  const platformTakeRate = values['integrated.platform.take_rate_pct'] / 100;
  const platformOperatingCost =
    values['integrated.platform.operating_cost_usd_m'];
  const energyCost =
    values['a2_fleet.cost_per_kw_of_energy.cy_2027'] ??
    values['a2_fleet.cost_per_kw_of_energy.cy_2033'];
  const energyUptime = values['integrated.energy.network_uptime_pct'] / 100;
  const debtRatio = values['integrated.financing.debt_ratio_pct'] / 100;
  const interestRate = values['integrated.financing.interest_rate_pct'] / 100;
  const taxRate = values['integrated.tax_fx.effective_tax_rate_pct'] / 100;
  const horizonYears = values['integrated.timing.model_horizon_years'];
  const deploymentMonths = values['integrated.timing.deployment_months'];
  const marginOverride = values['integrated.overrides.margin_override_pct'] / 100;

  const annualRevenue =
    fleetSize *
    revenuePerVehicle *
    utilization *
    energyUptime *
    (1 + demandGrowth * 0.6);

  const computedMargin =
    marginOverride > 0
      ? marginOverride
      : Math.max(
          0.18,
          Math.min(
            0.58,
            0.33 +
              platformTakeRate * 0.16 -
              energyCost * 0.72 -
              interestRate * 0.14 -
              inflation * 0.05,
          ),
        );

  const annualEbitda = annualRevenue * computedMargin - platformOperatingCost * 0.35;
  const projectNpv =
    annualEbitda * (horizonYears * 0.92) / (1 + discountRate * 3.2) +
    debtRatio * 12 -
    deploymentMonths * 0.35;
  const equityIrr =
    100 *
    (0.11 +
      demandGrowth * 0.25 +
      utilization * 0.09 +
      debtRatio * 0.04 -
      interestRate * 0.18 -
      taxRate * 0.06);
  const paybackYears = Math.max(
    2.8,
    7.6 -
      demandGrowth * 6 -
      utilization * 1.8 -
      debtRatio * 1.4 +
      deploymentMonths * 0.06 +
      energyCost * 4,
  );
  const corridorReadiness = Math.min(
    100,
    58 + demandGrowth * 95 + energyUptime * 18 - deploymentMonths * 0.45,
  );
  const marginPercent = computedMargin * 100;

  return [
    {
      id: 'project_npv',
      label: 'Project NPV',
      value: round(projectNpv, 1),
      format: 'currencyM',
      description: 'Mocked valuation based on current demand, financing, and deployment assumptions.',
    },
    {
      id: 'equity_irr',
      label: 'Equity IRR',
      value: round(equityIrr, 1),
      format: 'percent',
      description: 'Investor return indicator from the mocked blended financing stack.',
    },
    {
      id: 'annual_revenue',
      label: 'Annual Revenue',
      value: round(annualRevenue, 1),
      format: 'currencyM',
      description: 'Annualized corridor revenue from the current fleet and utilization settings.',
    },
    {
      id: 'ebitda_margin',
      label: 'EBITDA Margin',
      value: round(marginPercent, 1),
      format: 'percent',
      description: 'Mock operating margin after platform and energy assumptions.',
    },
    {
      id: 'payback_period',
      label: 'Payback Period',
      value: round(paybackYears, 1),
      format: 'years',
      description: 'Years to pay back under the current mocked operating profile.',
    },
    {
      id: 'corridor_readiness',
      label: 'Corridor Readiness',
      value: round(corridorReadiness, 0),
      format: 'score',
      description: 'Composite readiness score summarizing demand, uptime, and deployment timing.',
    },
  ];
}
