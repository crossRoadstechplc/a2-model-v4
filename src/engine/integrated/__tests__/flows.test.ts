import { getBaseAssumptionBundle } from '../../../model/assumptions';
import { runIntegratedModel } from '..';

function getRowValues(
  rows: Array<{ key: string; values: number[] }>,
  key: string,
) {
  return rows.find((row) => row.key === key)?.values ?? [];
}

describe('integrated intercompany flow layer', () => {
  it('keeps explicit flow statements aligned with module revenue lines', () => {
    const output = runIntegratedModel(getBaseAssumptionBundle().baseValues);

    expect(output.intercompany.fleetToPlatformFees).toEqual(
      getRowValues(output.platform.incomeStatement.rows, 'fleet_internal_revenue'),
    );
    expect(output.intercompany.platformToEnergyLease).toEqual(
      getRowValues(output.energy.incomeStatement.rows, 'lease_income'),
    );
    expect(output.intercompany.platformToEnergyRevenueShare).toEqual(
      getRowValues(output.energy.incomeStatement.rows, 'revenue_share_income'),
    );
  });
});
