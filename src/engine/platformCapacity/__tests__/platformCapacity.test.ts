import { getBaseAssumptionBundle } from '../../../model/assumptions';
import { runA2FleetWorkbook } from '../../a2Fleet';
import { runIntegratedModel } from '../../integrated';
import {
  buildPlatformCapacityFromFleet,
  buildPlatformCapacityOutput,
  generatePlatformCapacityBands,
  getPlatformCapacityDiagnostics,
} from '..';

function expectBand(
  truckCount: number,
  expected: {
    truckMin: number;
    truckMax: number;
    socketsPerStation: number;
    baysPerStation: number;
  },
) {
  const diagnostics = getPlatformCapacityDiagnostics(truckCount);

  expect(diagnostics.status).toBe('ok');
  expect(diagnostics.band).toMatchObject(expected);
}

describe('platform capacity policy', () => {
  it('generates the expected boundary bands from policy rules', () => {
    const bands = generatePlatformCapacityBands();

    expect(bands[0]).toMatchObject({
      truckMin: 1,
      truckMax: 70,
      socketsPerStation: 1,
      baysPerStation: 1,
      totalSockets: 7,
      totalBays: 7,
      maxNightlyCharges: 70,
      maxDailySwaps: 1435,
    });

    expectBand(1, {
      truckMin: 1,
      truckMax: 70,
      socketsPerStation: 1,
      baysPerStation: 1,
    });
    expectBand(1435, {
      truckMin: 1401,
      truckMax: 1435,
      socketsPerStation: 21,
      baysPerStation: 1,
    });
    expectBand(1436, {
      truckMin: 1436,
      truckMax: 1470,
      socketsPerStation: 21,
      baysPerStation: 2,
    });
    expectBand(2871, {
      truckMin: 2871,
      truckMax: 2940,
      socketsPerStation: 42,
      baysPerStation: 3,
    });
    expectBand(4306, {
      truckMin: 4306,
      truckMax: 4340,
      socketsPerStation: 62,
      baysPerStation: 4,
    });
    expectBand(5741, {
      truckMin: 5741,
      truckMax: 5810,
      socketsPerStation: 83,
      baysPerStation: 5,
    });
    expectBand(7176, {
      truckMin: 7176,
      truckMax: 7210,
      socketsPerStation: 103,
      baysPerStation: 6,
    });
    expectBand(8611, {
      truckMin: 8611,
      truckMax: 8680,
      socketsPerStation: 124,
      baysPerStation: 7,
    });
  });

  it('returns structured below-range, above-range, and invalid diagnostics', () => {
    expect(getPlatformCapacityDiagnostics(0).status).toBe('below-range');
    expect(getPlatformCapacityDiagnostics(10001).status).toBe('above-range');
    expect(getPlatformCapacityDiagnostics(Number.NaN).status).toBe('invalid');
  });

  it('builds periodized capacity outputs and utilization metrics', () => {
    const output = buildPlatformCapacityOutput({
      periods: ['CY-2026', 'CY-2027', 'CY-2028'],
      operationalTruckCounts: [1435, 2871],
      swapsPerTruckPerDay: 1,
      serviceFactor: 1,
      uptime: 1,
    });

    expect(output.byPeriod[0]).toMatchObject({
      period: 'CY-2026',
      truckCount: 0,
      selectedBand: null,
      diagnostics: expect.objectContaining({ status: 'below-range' }),
    });
    expect(output.byPeriod[1]).toMatchObject({
      period: 'CY-2027',
      truckCount: 1435,
      stations: 7,
      socketsPerStation: 21,
      baysPerStation: 1,
      totalSockets: 147,
      totalBays: 7,
      maxNightlyCharges: 1470,
      maxDailySwaps: 1435,
    });
    expect(output.byPeriod[1].requiredDailySwaps).toBeCloseTo(1435, 6);
    expect(output.byPeriod[1].swapCapacityUtilization).toBeCloseTo(1, 6);
    expect(output.byPeriod[2].selectedBand?.socketsPerStation).toBe(42);
    expect(output.byPeriod[2].selectedBand?.baysPerStation).toBe(3);
  });

  it('flags insufficient capacity when required throughput exceeds the selected band', () => {
    const output = buildPlatformCapacityOutput({
      periods: ['CY-2026', 'CY-2027'],
      operationalTruckCounts: [10000],
      swapsPerTruckPerDay: 2,
      serviceFactor: 1.05,
      uptime: 1,
    });
    const latest = output.latestPeriod;

    expect(latest?.requiredDailySwaps).toBeCloseTo(21000, 6);
    expect(latest?.maxDailySwaps).toBe(10045);
    expect(latest?.insufficientSwapCapacity).toBe(true);
    expect(latest?.insufficientChargeCapacity).toBe(true);
    expect(latest?.swapCapacitySurplus).toBeLessThan(0);
    expect(latest?.chargeCapacitySurplus).toBeLessThan(0);
  });

  it('integrates with fleet outputs without changing the fleet workbook result', () => {
    const assumptions = getBaseAssumptionBundle().baseValues;
    const workbook = runA2FleetWorkbook(assumptions);
    const integrated = runIntegratedModel(assumptions, workbook);
    const platformServiceFactor =
      integrated.platform.derived.serviceFactorSeries[
        integrated.platform.derived.serviceFactorSeries.length - 1
      ] ?? 1;
    const capacity = buildPlatformCapacityFromFleet({
      fleet: workbook,
      periods: integrated.platform.periods,
      assumptions,
      serviceFactor: platformServiceFactor,
      uptime: assumptions['integrated.energy.network_uptime_pct'] / 100,
    });

    expect(integrated.fleet).toEqual(workbook);
    expect(integrated.platform.capacity.latestPeriod).toEqual(capacity.latestPeriod);
    expect(integrated.platform.capacity.byPeriod.map((item) => item.selectedBandLabel)).toEqual(
      capacity.byPeriod.map((item) => item.selectedBandLabel),
    );
  });
});
