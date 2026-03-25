import { useMemo, useState } from 'react';
import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';
import { useAppStore } from '../../store/appStore';
import { SectionAccordion } from '../ui/SectionAccordion';
import { StatusBadge } from '../ui/StatusBadge';
import { NumericInput } from '../ui/NumericInput';
import { EmptyState } from '../ui/EmptyState';
import { buildScenarioComparison } from '../../model/scenarioStudio';
import { formatDisplayValue } from '../model/formatters';
import { kpiTargetDefinitions } from '../../model/analysisTargets';

const compareTargets = [
  'investor_25_stake_value',
  'platform_revenue',
  'energy_revenue',
  'consolidated_revenue',
];

export function ScenarioStudio() {
  const currentScenarioId = useAppStore((state) => state.app.currentScenarioId);
  const hasSuccessfulCalculation = useAppStore(
    (state) => state.app.hasSuccessfulCalculation,
  );
  const scenarios = useAppStore((state) => state.scenarios);
  const createScenario = useAppStore((state) => state.createScenario);
  const saveScenario = useAppStore((state) => state.saveScenario);
  const duplicateScenario = useAppStore((state) => state.duplicateScenario);
  const renameScenario = useAppStore((state) => state.renameScenario);
  const deleteScenario = useAppStore((state) => state.deleteScenario);
  const loadScenario = useAppStore((state) => state.loadScenario);
  const toggleScenarioCompare = useAppStore((state) => state.toggleScenarioCompare);
  const clearScenarioCompare = useAppStore((state) => state.clearScenarioCompare);
  const setScenarioProbability = useAppStore((state) => state.setScenarioProbability);
  const { displayCurrency, fxRate } = useDisplayCurrency();
  const [newScenarioName, setNewScenarioName] = useState('');
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});

  const orderedScenarios = scenarios.allIds
    .map((id) => scenarios.byId[id])
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const comparedScenarios = scenarios.compareIds
    .map((id) => scenarios.byId[id])
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const comparison = useMemo(() => {
    if (comparedScenarios.length < 2) {
      return null;
    }

    return buildScenarioComparison({
      scenarios: comparedScenarios,
      targets: kpiTargetDefinitions.filter((target) => compareTargets.includes(target.id)),
    });
  }, [comparedScenarios]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-app-border bg-app-panel p-6 shadow-panel">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-app-subtle">
              Scenario Studio
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-app-text">Scenarios</h1>
            <p className="mt-3 text-sm leading-6 text-app-subtle">
              Save, branch, weight, and compare scenario states without leaving the analytical shell.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="accent">{orderedScenarios.length} scenarios</StatusBadge>
            <StatusBadge tone={comparison ? 'warning' : 'neutral'}>
              {scenarios.compareIds.length} in compare
            </StatusBadge>
          </div>
        </div>
      </section>

      <SectionAccordion
        title="Scenario Actions"
        description="Create new scenarios from the current working assumptions or save updates back to the active scenario."
        defaultOpen
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <input
            value={newScenarioName}
            onChange={(event) => setNewScenarioName(event.target.value)}
            placeholder="New scenario name"
            className="rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none transition focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
            data-testid="scenario-create-name"
          />
          <button
            type="button"
            onClick={() => {
              createScenario(newScenarioName);
              setNewScenarioName('');
            }}
            className="rounded-xl border border-app-accent bg-app-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            data-testid="scenario-create-button"
          >
            Create scenario
          </button>
          <button
            type="button"
            onClick={() => saveScenario()}
            className="rounded-xl border border-app-border bg-app-panel px-4 py-2 text-sm font-semibold text-app-text transition hover:border-app-accent/40"
            data-testid="scenario-save-current"
          >
            Save current
          </button>
        </div>
      </SectionAccordion>

      <SectionAccordion
        title="Scenario Library"
        description="Manage names, probabilities, compare selection, and scenario lifecycle."
        defaultOpen
      >
        <div className="grid gap-4">
          {orderedScenarios.map((scenario) => {
            const isCurrent = scenario.id === currentScenarioId;
            const isCompared = scenarios.compareIds.includes(scenario.id);
            return (
              <article
                key={scenario.id}
                className="rounded-2xl border border-app-border bg-app-bg/75 p-4"
                data-testid={`scenario-card-${scenario.id}`}
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_10rem_auto] xl:items-end">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={isCurrent ? 'accent' : 'neutral'}>
                        {isCurrent ? 'Active' : scenario.kind}
                      </StatusBadge>
                      {isCompared ? <StatusBadge tone="warning">Compare</StatusBadge> : null}
                      {scenario.isDirty ? <StatusBadge tone="warning">Unsaved</StatusBadge> : null}
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor={`scenario-name-${scenario.id}`}
                        className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle"
                      >
                        Scenario name
                      </label>
                      <input
                        id={`scenario-name-${scenario.id}`}
                        value={draftNames[scenario.id] ?? scenario.name}
                        onChange={(event) =>
                          setDraftNames((current) => ({
                            ...current,
                            [scenario.id]: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-app-border bg-app-panel px-3 py-2 text-sm text-app-text outline-none transition focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
                        data-testid={`scenario-name-input-${scenario.id}`}
                      />
                    </div>
                  </div>
                  <NumericInput
                    label="Probability"
                    value={scenario.probability}
                    decimals={1}
                    unit="%"
                    onCommit={(value) => setScenarioProbability(scenario.id, value)}
                    testId={`scenario-probability-${scenario.id}`}
                  />
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        renameScenario(
                          scenario.id,
                          draftNames[scenario.id] ?? scenario.name,
                        )
                      }
                      className="rounded-xl border border-app-border bg-app-panel px-3 py-2 text-sm font-medium text-app-text transition hover:border-app-accent/40"
                      data-testid={`scenario-rename-${scenario.id}`}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => loadScenario(scenario.id)}
                      className="rounded-xl border border-app-border bg-app-panel px-3 py-2 text-sm font-medium text-app-text transition hover:border-app-accent/40"
                      data-testid={`scenario-load-${scenario.id}`}
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateScenario(scenario.id)}
                      className="rounded-xl border border-app-border bg-app-panel px-3 py-2 text-sm font-medium text-app-text transition hover:border-app-accent/40"
                      data-testid={`scenario-duplicate-${scenario.id}`}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleScenarioCompare(scenario.id)}
                      className="rounded-xl border border-app-border bg-app-panel px-3 py-2 text-sm font-medium text-app-text transition hover:border-app-accent/40"
                      data-testid={`scenario-compare-${scenario.id}`}
                    >
                      {isCompared ? 'Remove compare' : 'Compare'}
                    </button>
                    {scenario.kind !== 'base' ? (
                      <button
                        type="button"
                        onClick={() => deleteScenario(scenario.id)}
                        className="rounded-xl border border-app-border bg-app-panel px-3 py-2 text-sm font-medium text-app-warning transition hover:border-app-warning/40"
                        data-testid={`scenario-delete-${scenario.id}`}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </SectionAccordion>

      <SectionAccordion
        title="Compare Studio"
        description="Selected scenarios render side by side with weighted KPI rollups."
        defaultOpen
      >
        {comparison ? (
          <div className="space-y-4" data-testid="scenario-compare-panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-app-subtle">
                Total probability {comparison.totalProbability.toFixed(1)}%
              </p>
              <button
                type="button"
                onClick={clearScenarioCompare}
                className="rounded-xl border border-app-border bg-app-panel px-3 py-2 text-sm font-medium text-app-text transition hover:border-app-accent/40"
              >
                Clear compare
              </button>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {comparison.scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="rounded-2xl border border-app-border bg-app-bg/75 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-app-text">{scenario.name}</h3>
                    <StatusBadge tone="neutral">{scenario.probability.toFixed(1)}%</StatusBadge>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {comparison.metrics.map((metric) => (
                      <div
                        key={`${scenario.id}-${metric.id}`}
                        className="rounded-xl border border-app-border bg-app-panel p-3"
                      >
                        <p className="text-xs uppercase tracking-[0.16em] text-app-subtle">
                          {metric.label}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-app-text">
                          {formatDisplayValue(
                            metric.valuesByScenarioId[scenario.id] ?? 0,
                            metric.format,
                            {
                              displayCurrency,
                              fxRate,
                            },
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-app-border bg-app-panel/80 p-4">
              <h3 className="text-sm font-semibold text-app-text">Weighted KPI Summary</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {comparison.metrics.map((metric) => (
                  <div
                    key={`weighted-${metric.id}`}
                    className="rounded-xl border border-app-border bg-app-bg/75 p-3"
                  >
                    <p className="text-xs uppercase tracking-[0.16em] text-app-subtle">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-app-text">
                      {formatDisplayValue(metric.weightedValue, metric.format, {
                        displayCurrency,
                        fxRate,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Select at least two scenarios to compare"
            description={
              hasSuccessfulCalculation
                ? 'Use the compare buttons in the scenario library to build a side-by-side comparison.'
                : 'Create scenarios now, then run the model and compare their KPI outcomes side by side.'
            }
          />
        )}
      </SectionAccordion>
    </div>
  );
}
