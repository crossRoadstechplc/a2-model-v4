import type { AssumptionMetadata } from '../../model/assumptions';
import { formatNumber } from '../../model/assumptions';

type ChangedIndicatorProps = {
  definition: AssumptionMetadata;
  value: number;
};

export function ChangedIndicator({
  definition,
  value,
}: ChangedIndicatorProps) {
  const delta = value - definition.baseValue;
  const sign = delta > 0 ? '+' : '';

  return (
    <span className="inline-flex items-center rounded-full border border-app-warning/25 bg-app-warning/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-app-warning">
      Changed {sign}
      {formatNumber(delta, definition.decimals ?? 0)} {definition.unit}
    </span>
  );
}
