export type PlatformCapacityBand = {
  truckMin: number;
  truckMax: number;
  stations: number;
  socketsPerStation: number;
  baysPerStation: number;
  totalSockets: number;
  totalBays: number;
  maxNightlyCharges: number;
  maxDailySwaps: number;
};

export type PlatformCapacityLookupStatus =
  | 'ok'
  | 'below-range'
  | 'above-range'
  | 'invalid';

export type PlatformCapacityLookupDiagnostics = {
  truckCount: number | null;
  status: PlatformCapacityLookupStatus;
  band: PlatformCapacityBand | null;
  supportedTruckMin: number;
  supportedTruckMax: number;
  message: string;
};

const STATIONS = 7;
const NIGHTLY_CHARGES_PER_SOCKET = 10;
const DAILY_SWAPS_PER_BAY = 205;

const TIER_ENDS = [1435, 2870, 4305, 5740, 7175, 8610, 10000];
const TIER_SOCKET_STARTS = [1, 21, 42, 62, 83, 103, 124];

function buildBand(
  truckMin: number,
  truckMax: number,
  socketsPerStation: number,
  baysPerStation: number
): PlatformCapacityBand {
  const totalSockets = STATIONS * socketsPerStation;
  const totalBays = STATIONS * baysPerStation;

  return {
    truckMin,
    truckMax,
    stations: STATIONS,
    socketsPerStation,
    baysPerStation,
    totalSockets,
    totalBays,
    maxNightlyCharges: totalSockets * NIGHTLY_CHARGES_PER_SOCKET,
    maxDailySwaps: totalBays * DAILY_SWAPS_PER_BAY,
  };
}

/**
 * Generates the truck-count-to-platform-capacity lookup bands.
 *
 * Rules encoded from the reference:
 * - Tier 1 starts at 1 socket/station, 1 bay/station
 * - Tier socket starts by bay tier are [1, 21, 42, 62, 83, 103, 124]
 * - Tier end truck counts are [1435, 2870, 4305, 5740, 7175, 8610, 10000]
 * - Within each tier, the first row width is:
 *   - 35 trucks if the new bay count is even
 *   - 70 trucks if the new bay count is odd
 *   except tier 1 which starts at 70-truck steps
 * - Remaining rows in the tier advance in 70-truck steps
 */
export function generatePlatformCapacityBands(): PlatformCapacityBand[] {
  const bands: PlatformCapacityBand[] = [];

  for (let tierIndex = 0; tierIndex < TIER_ENDS.length; tierIndex += 1) {
    const baysPerStation = tierIndex + 1;
    const socketsStart = TIER_SOCKET_STARTS[tierIndex];
    const tierEnd = TIER_ENDS[tierIndex];

    const tierStart = tierIndex === 0 ? 1 : TIER_ENDS[tierIndex - 1] + 1;

    let currentMin = tierStart;
    let socketsPerStation = socketsStart;

    while (currentMin <= tierEnd) {
      let width: number;

      if (tierIndex === 0) {
        width = 70;
      } else if (currentMin === tierStart) {
        width = baysPerStation % 2 === 0 ? 35 : 70;
      } else {
        width = 70;
      }

      const currentMax = Math.min(currentMin + width - 1, tierEnd);

      bands.push(
        buildBand(
          currentMin,
          currentMax,
          socketsPerStation,
          baysPerStation
        )
      );

      currentMin = currentMax + 1;
      socketsPerStation += 1;
    }
  }

  return bands;
}

export function getPlatformCapacityDiagnostics(
  truckCount: number,
  bands: PlatformCapacityBand[] = generatePlatformCapacityBands()
) : PlatformCapacityLookupDiagnostics {
  const first = bands[0];
  const last = bands[bands.length - 1];
  const supportedTruckMin = first?.truckMin ?? 1;
  const supportedTruckMax = last?.truckMax ?? 0;

  if (!Number.isFinite(truckCount)) {
    return {
      truckCount: null,
      band: null,
      status: 'invalid',
      supportedTruckMin,
      supportedTruckMax,
      message: 'Truck count is not a finite number.',
    };
  }

  if (!first || !last) {
    return {
      truckCount,
      band: null,
      status: 'invalid',
      supportedTruckMin,
      supportedTruckMax,
      message: 'Capacity band policy is unavailable.',
    };
  }

  if (truckCount < first.truckMin) {
    return {
      truckCount,
      band: null,
      status: 'below-range',
      supportedTruckMin,
      supportedTruckMax,
      message: `Truck count is below the supported band range starting at ${first.truckMin}.`,
    };
  }

  if (truckCount > last.truckMax) {
    return {
      truckCount,
      band: null,
      status: 'above-range',
      supportedTruckMin,
      supportedTruckMax,
      message: `Truck count is above the supported band range ending at ${last.truckMax}.`,
    };
  }

  const band =
    bands.find(
      (band) => truckCount >= band.truckMin && truckCount <= band.truckMax
    ) ?? null;

  return {
    truckCount,
    band,
    status: band ? 'ok' : 'invalid',
    supportedTruckMin,
    supportedTruckMax,
    message: band
      ? `Truck count maps to the ${band.truckMin}-${band.truckMax} capacity band.`
      : 'No capacity band matched the provided truck count.',
  };
}

export function getPlatformCapacityBand(
  truckCount: number,
  bands: PlatformCapacityBand[] = generatePlatformCapacityBands()
) {
  return getPlatformCapacityDiagnostics(truckCount, bands).band;
}
