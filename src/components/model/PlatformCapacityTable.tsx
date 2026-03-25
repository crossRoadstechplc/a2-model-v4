import type { PlatformCapacityOutput } from '../../engine/platformCapacity';
import { cn } from '../../lib/cn';
import { formatStatementValue, hasMeaningfulChange } from './formatters';

type PlatformCapacityTableProps = {
  title: string;
  description: string;
  capacity: PlatformCapacityOutput;
  previousCapacity?: PlatformCapacityOutput | null;
  dataTestId?: string;
};

function formatBandLabel(label: string) {
  return label === 'Out of range' ? label : `${label} trucks`;
}

export function PlatformCapacityTable({
  title,
  description,
  capacity,
  previousCapacity,
  dataTestId = 'platform-capacity-table',
}: PlatformCapacityTableProps) {
  const previousByPeriod = Object.fromEntries(
    (previousCapacity?.byPeriod ?? []).map((item) => [item.period, item]),
  );

  return (
    <section
      className="overflow-hidden rounded-2xl border border-app-border bg-app-panel/80"
      data-testid={dataTestId}
    >
      <div className="border-b border-app-border px-4 py-4">
        <h3 className="text-sm font-semibold text-app-text">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-app-subtle">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1200px] text-sm">
          <thead>
            <tr className="border-b border-app-border bg-app-bg/60">
              {[
                'Period',
                'Truck Count',
                'Band',
                'Status',
                'Stations',
                'Sockets / Station',
                'Bays / Station',
                'Total Sockets',
                'Total Bays',
                'Max Nightly Charges',
                'Max Daily Swaps',
                'Required Nightly Charges',
                'Required Daily Swaps',
                'Charge Utilization',
                'Swap Utilization',
              ].map((label) => (
                <th
                  key={label}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-app-subtle"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {capacity.byPeriod.map((item) => {
              const previous = previousByPeriod[item.period];
              const rowChanged =
                previous &&
                (previous.selectedBandLabel !== item.selectedBandLabel ||
                  previous.diagnostics.status !== item.diagnostics.status ||
                  hasMeaningfulChange(previous.totalSockets, item.totalSockets) ||
                  hasMeaningfulChange(previous.totalBays, item.totalBays) ||
                  hasMeaningfulChange(
                    previous.requiredDailySwaps,
                    item.requiredDailySwaps,
                  ));

              return (
                <tr
                  key={item.period}
                  className={cn(
                    'border-b border-app-border/70 align-top last:border-b-0',
                    rowChanged && 'bg-app-accentSoft/20',
                  )}
                >
                  <td className="px-4 py-3 font-medium text-app-text">{item.period}</td>
                  <td className="px-4 py-3 text-app-text">
                    {formatStatementValue(item.truckCount, 'count')}
                  </td>
                  <td className="px-4 py-3 text-app-text">{formatBandLabel(item.selectedBandLabel)}</td>
                  <td className="px-4 py-3 text-app-subtle">{item.diagnostics.status}</td>
                  <td className="px-4 py-3 text-app-text">
                    {formatStatementValue(item.stations, 'count')}
                  </td>
                  <td className="px-4 py-3 text-app-text">
                    {formatStatementValue(item.socketsPerStation, 'count')}
                  </td>
                  <td className="px-4 py-3 text-app-text">
                    {formatStatementValue(item.baysPerStation, 'count')}
                  </td>
                  <td className="px-4 py-3 text-app-text">
                    {formatStatementValue(item.totalSockets, 'count')}
                  </td>
                  <td className="px-4 py-3 text-app-text">
                    {formatStatementValue(item.totalBays, 'count')}
                  </td>
                  <td className="px-4 py-3 text-app-text">
                    {formatStatementValue(item.maxNightlyCharges, 'count')}
                  </td>
                  <td className="px-4 py-3 text-app-text">
                    {formatStatementValue(item.maxDailySwaps, 'count')}
                  </td>
                  <td className="px-4 py-3 text-app-text">
                    {formatStatementValue(item.requiredNightlyCharges, 'count')}
                  </td>
                  <td className="px-4 py-3 text-app-text">
                    {formatStatementValue(item.requiredDailySwaps, 'count')}
                  </td>
                  <td
                    className={cn(
                      'px-4 py-3',
                      (item.chargeCapacityUtilization ?? 0) > 1
                        ? 'text-app-warning'
                        : 'text-app-text',
                    )}
                  >
                    {item.chargeCapacityUtilization === null
                      ? 'N/A'
                      : formatStatementValue(item.chargeCapacityUtilization, '%')}
                  </td>
                  <td
                    className={cn(
                      'px-4 py-3',
                      (item.swapCapacityUtilization ?? 0) > 1
                        ? 'text-app-warning'
                        : 'text-app-text',
                    )}
                  >
                    {item.swapCapacityUtilization === null
                      ? 'N/A'
                      : formatStatementValue(item.swapCapacityUtilization, '%')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
