import { cn } from '../../lib/cn';
import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';
import { useAppStore } from '../../store/appStore';
import { StatusBadge } from '../ui/StatusBadge';
import type { DashboardKpi } from './a2FleetViewModel';
import {
  formatDelta,
  formatDisplayValue,
  hasMeaningfulChange,
} from './formatters';

type KpiCardGridProps = {
  title?: string;
  items: DashboardKpi[];
  previousItems?: DashboardKpi[];
  dataTestId?: string;
};

function buildPreviousItemMap(items?: DashboardKpi[]) {
  return Object.fromEntries((items ?? []).map((item) => [item.id, item]));
}

export function KpiCardGrid({
  title,
  items,
  previousItems,
  dataTestId = 'kpi-grid',
}: KpiCardGridProps) {
  const previousMap = buildPreviousItemMap(previousItems);
  const selectedKpiId = useAppStore((state) => state.ui.selectedKpiId);
  const selectKpi = useAppStore((state) => state.selectKpi);
  const { displayCurrency, fxRate } = useDisplayCurrency();

  return (
    <div className="space-y-3" data-testid={dataTestId}>
      {title ? <h3 className="text-sm font-semibold text-app-text">{title}</h3> : null}
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {items.map((item) => {
          const previous = previousMap[item.id];
          const isChanged = hasMeaningfulChange(item.value, previous?.value);
          const delta = previous ? item.value - previous.value : 0;

          return (
            <article
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => selectKpi(item.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  selectKpi(item.id);
                }
              }}
              className={cn(
                'rounded-2xl border border-app-border bg-app-bg/80 p-4 transition focus:outline-none focus:ring-2 focus:ring-app-accent/20',
                isChanged && 'border-app-accent/40 bg-app-accentSoft/35 shadow-sm',
                selectedKpiId === item.id && 'border-app-accent shadow-sm',
              )}
              data-state={isChanged ? 'changed' : 'steady'}
              data-testid={`kpi-card-${item.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">
                    {item.label}
                  </p>
                  <p
                    className="mt-3 text-3xl font-semibold text-app-text"
                    data-testid={`kpi-card-${item.id}-value`}
                  >
                    {formatDisplayValue(item.value, item.format, {
                      displayCurrency,
                      fxRate,
                    })}
                  </p>
                </div>
                {isChanged ? <StatusBadge tone="accent">Updated</StatusBadge> : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-app-subtle">{item.description}</p>
              {previous && isChanged ? (
                <p
                  className={cn(
                    'mt-3 text-xs font-semibold uppercase tracking-[0.16em]',
                    delta >= 0 ? 'text-app-success' : 'text-app-warning',
                  )}
                >
                  {formatDelta(delta, item.format, {
                    displayCurrency,
                    fxRate,
                  })}{' '}
                  vs prior run
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
