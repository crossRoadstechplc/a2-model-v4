import type {
  PlatformCapacityOutput,
  PlatformCapacityPeriodOutput,
} from '../../engine/platformCapacity';
import type { DashboardKpi } from './a2FleetViewModel';

export function buildPlatformCapacityKpis(
  capacity: PlatformCapacityOutput,
): DashboardKpi[] {
  const latest = capacity.latestPeriod;

  if (!latest) {
    return [];
  }

  return [
    {
      id: 'platform_capacity_stations',
      label: 'Stations',
      value: latest.stations,
      description: `Station footprint selected for ${latest.period}.`,
      format: 'integer',
    },
    {
      id: 'platform_capacity_total_sockets',
      label: 'Total Sockets',
      value: latest.totalSockets,
      description: `Installed charging sockets for ${latest.period}.`,
      format: 'integer',
    },
    {
      id: 'platform_capacity_total_bays',
      label: 'Total Bays',
      value: latest.totalBays,
      description: `Installed swap bays for ${latest.period}.`,
      format: 'integer',
    },
    {
      id: 'platform_capacity_max_nightly_charges',
      label: 'Max Nightly Charges',
      value: latest.maxNightlyCharges,
      description: `Nightly charging throughput implied by the selected band in ${latest.period}.`,
      format: 'integer',
    },
    {
      id: 'platform_capacity_max_daily_swaps',
      label: 'Max Daily Swaps',
      value: latest.maxDailySwaps,
      description: `Daily swap throughput implied by the selected band in ${latest.period}.`,
      format: 'integer',
    },
  ];
}

export function buildPlatformCapacitySummary(capacity: PlatformCapacityOutput) {
  const latest = capacity.latestPeriod;

  if (!latest) {
    return null;
  }

  return {
    period: latest.period,
    bandLabel: latest.selectedBandLabel,
    status: latest.diagnostics.status,
    message: latest.diagnostics.message,
    insufficientCapacity:
      latest.insufficientChargeCapacity || latest.insufficientSwapCapacity,
    chargeUtilization: latest.chargeCapacityUtilization,
    swapUtilization: latest.swapCapacityUtilization,
  };
}

export function hasPlatformCapacityWarnings(capacity: PlatformCapacityOutput) {
  return capacity.byPeriod.some(
    (item) =>
      item.truckCount > 0 &&
      (
      item.diagnostics.status !== 'ok' ||
      item.insufficientChargeCapacity ||
      item.insufficientSwapCapacity
      ),
  );
}

export function getPlatformCapacityWarningCount(capacity: PlatformCapacityOutput) {
  return capacity.byPeriod.filter(
    (item) =>
      item.truckCount > 0 &&
      (
      item.diagnostics.status !== 'ok' ||
      item.insufficientChargeCapacity ||
      item.insufficientSwapCapacity
      ),
  ).length;
}

export function getLatestCapacityPeriod(
  capacity: PlatformCapacityOutput,
): PlatformCapacityPeriodOutput | null {
  return capacity.latestPeriod;
}
