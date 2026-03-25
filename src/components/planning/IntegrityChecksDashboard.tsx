import { useMemo } from 'react';
import { useModelStore } from '../../store/modelStore';
import { SectionAccordion } from '../ui/SectionAccordion';
import { StatusBadge } from '../ui/StatusBadge';
import { EmptyState } from '../ui/EmptyState';
import { AlertBanner } from '../ui/AlertBanner';
import { buildIntegrityChecks, groupIntegrityChecks } from '../../model/integrity';

export function IntegrityChecksDashboard() {
  const runState = useModelStore((state) => state.runState);
  const workbook = useModelStore((state) => state.workbook);
  const integrated = useModelStore((state) => state.integrated);
  const hasSuccessfulCalculation = useModelStore(
    (state) => state.hasSuccessfulCalculation,
  );

  const checks = useMemo(
    () =>
      buildIntegrityChecks({
        runState,
        hasSuccessfulCalculation,
        workbook,
        integrated,
      }),
    [hasSuccessfulCalculation, integrated, runState, workbook],
  );
  const grouped = useMemo(() => groupIntegrityChecks(checks), [checks]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-app-border bg-app-panel p-6 shadow-panel">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-app-subtle">
              Integrity Checks
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-app-text">
              Integrity Checks
            </h1>
            <p className="mt-3 text-sm leading-6 text-app-subtle">
              Freshness, reconciliation, convergence, provision adequacy, and elimination checks grouped by severity.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={grouped.critical.length > 0 ? 'warning' : 'accent'}>
              {grouped.critical.length} critical
            </StatusBadge>
            <StatusBadge tone={grouped.warning.length > 0 ? 'warning' : 'neutral'}>
              {grouped.warning.length} warnings
            </StatusBadge>
          </div>
        </div>
      </section>

      {!hasSuccessfulCalculation ? (
        <EmptyState
          title="Run the model to populate integrity checks"
          description="The integrity page uses the current visible workbook and integrated outputs. Calculate once to unlock grouped warning surfaces."
        />
      ) : (
        <>
          {grouped.critical.length > 0 ? (
            <AlertBanner
              title="Critical integrity items detected"
              message={`${grouped.critical.length} critical issue(s) require attention before treating the model as current.`}
              tone="warning"
            />
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Critical', grouped.critical.length],
              ['Warnings', grouped.warning.length],
              ['Info', grouped.info.length],
            ].map(([label, count]) => (
              <div
                key={String(label)}
                className="rounded-2xl border border-app-border bg-app-bg/75 p-4"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-app-subtle">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-app-text">{count}</p>
              </div>
            ))}
          </div>

          {(
            [
              ['Critical', grouped.critical, 'warning'],
              ['Warnings', grouped.warning, 'warning'],
              ['Info', grouped.info, 'neutral'],
            ] as const
          ).map(([label, items, tone]) => (
            <SectionAccordion
              key={label}
              title={label}
              description={`Checks currently grouped under ${label.toLowerCase()}.`}
              defaultOpen={label !== 'Info'}
              meta={<StatusBadge tone={tone}>{items.length}</StatusBadge>}
            >
              <div className="grid gap-3" data-testid={`integrity-group-${label.toLowerCase()}`}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-app-border bg-app-bg/75 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-app-text">{item.title}</h3>
                      <StatusBadge tone={tone}>{item.category}</StatusBadge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-app-subtle">{item.message}</p>
                  </div>
                ))}
              </div>
            </SectionAccordion>
          ))}
        </>
      )}
    </div>
  );
}
