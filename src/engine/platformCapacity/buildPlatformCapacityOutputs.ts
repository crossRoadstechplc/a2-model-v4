import type { A2FleetWorkbookOutput, PeriodizedStatement } from '../a2Fleet';
import { buildStatement } from '../integrated/helpers';
import {
  generatePlatformCapacityBands,
  getPlatformCapacityDiagnostics,
  type PlatformCapacityBand,
  type PlatformCapacityLookupDiagnostics,
  type PlatformCapacityLookupStatus,
} from './generatePlatformCapacityBands';

export type PlatformCapacityPeriodOutput = {
  period: string;
  truckCount: number;
  selectedBand: PlatformCapacityBand | null;
  selectedBandLabel: string;
  diagnostics: PlatformCapacityLookupDiagnostics;
  stations: number;
  socketsPerStation: number;
  baysPerStation: number;
  totalSockets: number;
  totalBays: number;
  maxNightlyCharges: number;
  maxDailySwaps: number;
  requiredNightlyCharges: number;
  requiredDailySwaps: number;
  chargeCapacityUtilization: number | null;
  swapCapacityUtilization: number | null;
  chargeCapacitySurplus: number | null;
  swapCapacitySurplus: number | null;
  insufficientChargeCapacity: boolean;
  insufficientSwapCapacity: boolean;
};

export type PlatformCapacityOutput = {
  periods: string[];
  bands: PlatformCapacityBand[];
  byPeriod: PlatformCapacityPeriodOutput[];
  statement: PeriodizedStatement;
  latestPeriod: PlatformCapacityPeriodOutput | null;
  statusCounts: Record<PlatformCapacityLookupStatus, number>;
};

type BuildPlatformCapacityOutputParams = {
  periods: string[];
  operationalTruckCounts: number[];
  swapsPerTruckPerDay: number;
  serviceFactor: number;
  uptime: number;
  bands?: PlatformCapacityBand[];
};

function alignTruckCountsToPeriods(periods: string[], truckCounts: number[]) {
  if (truckCounts.length === periods.length) {
    return truckCounts;
  }

  if (truckCounts.length === periods.length - 1) {
    return [0, ...truckCounts];
  }

  return periods.map((_period, index) => truckCounts[index] ?? 0);
}

function toBandLabel(band: PlatformCapacityBand | null) {
  if (!band) {
    return 'Out of range';
  }

  return `${band.truckMin}-${band.truckMax}`;
}

function getStatusCounts(byPeriod: PlatformCapacityPeriodOutput[]) {
  return byPeriod.reduce<Record<PlatformCapacityLookupStatus, number>>(
    (counts, item) => {
      counts[item.diagnostics.status] += 1;
      return counts;
    },
    {
      ok: 0,
      'below-range': 0,
      'above-range': 0,
      invalid: 0,
    },
  );
}

export function buildPlatformCapacityOutput(
  params: BuildPlatformCapacityOutputParams,
): PlatformCapacityOutput {
  const bands = params.bands ?? generatePlatformCapacityBands();
  const truckCounts = alignTruckCountsToPeriods(
    params.periods,
    params.operationalTruckCounts,
  );

  const demandFactor = Math.min(1.05, Math.max(0.6, params.serviceFactor * params.uptime));

  const byPeriod = params.periods.map<PlatformCapacityPeriodOutput>((period, index) => {
    const truckCount = truckCounts[index] ?? 0;
    const diagnostics = getPlatformCapacityDiagnostics(truckCount, bands);
    const band = diagnostics.band;
    const requiredDailySwaps =
      truckCount <= 0 ? 0 : truckCount * params.swapsPerTruckPerDay * demandFactor;
    // Each completed swap is treated as one depleted battery pack returning to charge,
    // so nightly charge demand is approximated as daily swap demand until the
    // dedicated charging/rotation model is implemented.
    const requiredNightlyCharges = requiredDailySwaps;
    const maxDailySwaps = band?.maxDailySwaps ?? 0;
    const maxNightlyCharges = band?.maxNightlyCharges ?? 0;
    const swapCapacityUtilization =
      maxDailySwaps > 0 ? requiredDailySwaps / maxDailySwaps : null;
    const chargeCapacityUtilization =
      maxNightlyCharges > 0 ? requiredNightlyCharges / maxNightlyCharges : null;
    const swapCapacitySurplus =
      band ? maxDailySwaps - requiredDailySwaps : null;
    const chargeCapacitySurplus =
      band ? maxNightlyCharges - requiredNightlyCharges : null;

    return {
      period,
      truckCount,
      selectedBand: band,
      selectedBandLabel: toBandLabel(band),
      diagnostics,
      stations: band?.stations ?? 0,
      socketsPerStation: band?.socketsPerStation ?? 0,
      baysPerStation: band?.baysPerStation ?? 0,
      totalSockets: band?.totalSockets ?? 0,
      totalBays: band?.totalBays ?? 0,
      maxNightlyCharges,
      maxDailySwaps,
      requiredNightlyCharges,
      requiredDailySwaps,
      chargeCapacityUtilization,
      swapCapacityUtilization,
      chargeCapacitySurplus,
      swapCapacitySurplus,
      insufficientChargeCapacity:
        diagnostics.status !== 'ok' || (chargeCapacitySurplus ?? 0) < 0,
      insufficientSwapCapacity:
        diagnostics.status !== 'ok' || (swapCapacitySurplus ?? 0) < 0,
    };
  });

  return {
    periods: params.periods,
    bands,
    byPeriod,
    latestPeriod: byPeriod[byPeriod.length - 1] ?? null,
    statusCounts: getStatusCounts(byPeriod),
    statement: buildStatement('PLATFORM CAPACITY', params.periods, [
      {
        key: 'truck_count',
        label: 'Operational Trucks in Service',
        unit: 'count',
        values: byPeriod.map((item) => item.truckCount),
      },
      {
        key: 'stations',
        label: 'Stations',
        unit: 'count',
        values: byPeriod.map((item) => item.stations),
      },
      {
        key: 'sockets_per_station',
        label: 'Sockets per Station',
        unit: 'count',
        values: byPeriod.map((item) => item.socketsPerStation),
      },
      {
        key: 'bays_per_station',
        label: 'Bays per Station',
        unit: 'count',
        values: byPeriod.map((item) => item.baysPerStation),
      },
      {
        key: 'total_sockets',
        label: 'Total Sockets',
        unit: 'count',
        values: byPeriod.map((item) => item.totalSockets),
      },
      {
        key: 'total_bays',
        label: 'Total Bays',
        unit: 'count',
        values: byPeriod.map((item) => item.totalBays),
      },
      {
        key: 'max_nightly_charges',
        label: 'Max Nightly Charges',
        unit: 'count',
        values: byPeriod.map((item) => item.maxNightlyCharges),
      },
      {
        key: 'max_daily_swaps',
        label: 'Max Daily Swaps',
        unit: 'count',
        values: byPeriod.map((item) => item.maxDailySwaps),
      },
      {
        key: 'required_nightly_charges',
        label: 'Required Nightly Charges',
        unit: 'count',
        values: byPeriod.map((item) => item.requiredNightlyCharges),
      },
      {
        key: 'required_daily_swaps',
        label: 'Required Daily Swaps',
        unit: 'count',
        values: byPeriod.map((item) => item.requiredDailySwaps),
      },
      {
        key: 'charge_capacity_utilization',
        label: 'Charge Capacity Utilization',
        unit: '%',
        values: byPeriod.map((item) => item.chargeCapacityUtilization ?? 0),
      },
      {
        key: 'swap_capacity_utilization',
        label: 'Swap Capacity Utilization',
        unit: '%',
        values: byPeriod.map((item) => item.swapCapacityUtilization ?? 0),
      },
      {
        key: 'charge_capacity_surplus',
        label: 'Charge Capacity Surplus / Deficit',
        unit: 'count',
        values: byPeriod.map((item) => item.chargeCapacitySurplus ?? 0),
      },
      {
        key: 'swap_capacity_surplus',
        label: 'Swap Capacity Surplus / Deficit',
        unit: 'count',
        values: byPeriod.map((item) => item.swapCapacitySurplus ?? 0),
      },
    ]),
  };
}

export function buildPlatformCapacityFromFleet(params: {
  fleet: A2FleetWorkbookOutput;
  periods: string[];
  assumptions: Record<string, number>;
  serviceFactor: number;
  uptime: number;
  bands?: PlatformCapacityBand[];
}) {
  const operationalTruckCounts =
    params.fleet.derivedAssumptions.rows.find(
      (row) => row.key === 'number_of_trucks_cumalative',
    )
      ?.values ?? [];

  return buildPlatformCapacityOutput({
    periods: params.periods,
    operationalTruckCounts,
    swapsPerTruckPerDay:
      params.assumptions['a2_fleet.number_of_swaps_per_truck_per_day.quantity'] ?? 1,
    serviceFactor: params.serviceFactor,
    uptime: params.uptime,
    bands: params.bands,
  });
}
