import { EmptyState } from '../ui/EmptyState';
import { LoadingState } from '../ui/LoadingState';
import { StatusBadge } from '../ui/StatusBadge';
import { useModelStore } from '../../store/modelStore';
import { RunStateAlert } from './RunStateAlert';
import type { A2FleetOutputCard } from '../../engine/a2Fleet';

function formatOutputValue(card: A2FleetOutputCard) {
  switch (card.format) {
    case 'currencyM':
      return `$${card.value.toFixed(1)}m`;
    case 'percent':
      return `${card.value.toFixed(1)}%`;
    case 'multiple':
      return `${card.value.toFixed(2)}x`;
    default:
      return String(card.value);
  }
}

type MockOutputCardsProps = {
  title: string;
  description: string;
};

export function MockOutputCards({
  title,
  description,
}: MockOutputCardsProps) {
  const runState = useModelStore((state) => state.runState);
  const results = useModelStore((state) => state.results);
  const hasSuccessfulCalculation = useModelStore(
    (state) => state.hasSuccessfulCalculation,
  );

  if (runState === 'empty') {
    return (
      <EmptyState
        title="Run the model to populate workbook outputs"
        description="Base assumptions are already loaded, but A2 Fleet statements and KPI cards remain empty until Calculate is clicked."
        actionLabel="Awaiting first calculation"
      />
    );
  }

  if (runState === 'running' && !hasSuccessfulCalculation) {
    return (
      <LoadingState
        title="Calculating workbook outputs"
        description="The first calculation is running. Results will appear here once the workbook replication pass completes."
      />
    );
  }

  return (
    <div className="space-y-4">
      <RunStateAlert />
      <section className="rounded-3xl border border-app-border bg-app-panel p-6 shadow-panel">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-app-subtle">
              Workbook outputs
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-app-text">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-app-subtle">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="accent">Workbook engine</StatusBadge>
            <StatusBadge tone={runState === 'ready' ? 'success' : 'warning'}>
              {runState}
            </StatusBadge>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {results?.map((card) => (
            <article
              key={card.id}
              className="rounded-2xl border border-app-border bg-app-bg/80 p-4"
              data-testid={`output-card-${card.id}`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">
                {card.label}
              </p>
              <p
                className="mt-3 text-3xl font-semibold text-app-text"
                data-testid={`output-card-${card.id}-value`}
              >
                {formatOutputValue(card)}
              </p>
              <p className="mt-3 text-sm leading-6 text-app-subtle">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
