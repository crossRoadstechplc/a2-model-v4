import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';
import type { EntityReturnsSummary, ReturnMetricCard } from '../../engine/returns';
import { cn } from '../../lib/cn';
import { StatusBadge } from '../ui/StatusBadge';
import { formatDisplayValue } from './formatters';

type ReturnsMetricGridProps = {
  summary: EntityReturnsSummary;
  previousSummary?: EntityReturnsSummary | null;
  dataTestId: string;
};

function buildPreviousMap(summary?: EntityReturnsSummary | null) {
  return Object.fromEntries((summary?.metrics ?? []).map((item) => [item.id, item]));
}

function metricTone(metric: ReturnMetricCard) {
  return metric.status === 'ready' ? 'accent' : 'neutral';
}

export function ReturnsMetricGrid({
  summary,
  previousSummary,
  dataTestId,
}: ReturnsMetricGridProps) {
  const previousMap = buildPreviousMap(previousSummary);
  const { displayCurrency, fxRate } = useDisplayCurrency();

  return (
    <div className="space-y-4" data-testid={dataTestId}>
      <div className="rounded-2xl border border-app-border bg-app-bg/75 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">
          Basis
        </p>
        <p className="mt-2 text-sm leading-6 text-app-text">{summary.basisLabel}</p>
        {summary.terminalValuePolicy ? (
          <div className="mt-4 rounded-2xl border border-app-border bg-app-panel/80 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-app-subtle">
              Terminal Value Method
            </p>
            <p className="mt-2 text-sm font-semibold text-app-text">
              {summary.terminalValuePolicy.method}
            </p>
            <p className="mt-2 text-sm leading-6 text-app-subtle">
              {summary.terminalValuePolicy.note}
            </p>
          </div>
        ) : null}
        {summary.notes?.length ? (
          <div className="mt-4 space-y-2">
            {summary.notes.map((note) => (
              <p key={note} className="text-sm leading-6 text-app-subtle">
                {note}
              </p>
            ))}
          </div>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summary.metrics.map((metric) => {
          const previous = previousMap[metric.id];
          const changed =
            metric.value !== null &&
            previous?.value !== null &&
            previous?.value !== undefined &&
            Math.abs(metric.value - previous.value) > 0.000001;

          return (
            <article
              key={metric.id}
              className={cn(
                'rounded-2xl border border-app-border bg-app-bg/80 p-4 transition',
                changed && 'border-app-accent/40 bg-app-accentSoft/30 shadow-sm',
              )}
              data-testid={`returns-card-${metric.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-subtle">
                    {metric.label}
                  </p>
                  <p
                    className="mt-3 text-3xl font-semibold text-app-text"
                    data-testid={`returns-card-${metric.id}-value`}
                  >
                    {metric.value === null
                      ? 'Pending'
                      : formatDisplayValue(metric.value, metric.format, {
                          displayCurrency,
                          fxRate,
                        })}
                  </p>
                </div>
                <StatusBadge tone={metricTone(metric)}>
                  {metric.status === 'ready' ? 'Ready' : 'Pending'}
                </StatusBadge>
              </div>
              <p className="mt-3 text-sm leading-6 text-app-subtle">{metric.description}</p>
              {metric.notes?.length ? (
                <div className="mt-3 space-y-2">
                  {metric.notes.map((note) => (
                    <p
                      key={note}
                      className="text-xs leading-5 text-app-subtle"
                      data-testid={`returns-card-${metric.id}-note`}
                    >
                      {note}
                    </p>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
