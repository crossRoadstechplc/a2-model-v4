import { Link, useLocation } from 'react-router-dom';
import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';
import {
  getBaseAssumptionBundle,
  getVisibleAssumptionMetadata,
} from '../../model/assumptions';
import { useAppStore } from '../../store/appStore';
import { ArrowTopRightIcon, SlidersIcon } from '../ui/icons';
import { SectionAccordion } from '../ui/SectionAccordion';
import { StatusBadge } from '../ui/StatusBadge';
import { AssumptionField } from './AssumptionField';
import { CurrencySelector } from './CurrencySelector';
import { TruckCountYearEditor } from './TruckCountYearEditor';

type AssumptionsEditorProps = {
  context: 'sidebar' | 'page';
};

const DISPLAY_CURRENCY_FX_KEY = 'integrated.tax_fx.reference_fx_rate';

export function AssumptionsEditor({ context }: AssumptionsEditorProps) {
  const location = useLocation();
  const currentValues = useAppStore((state) => state.assumptions.currentValues);
  const baseValues = useAppStore((state) => state.assumptions.baseValues);
  const changedAssumptionIds = useAppStore((state) => state.assumptions.changedKeys);
  const mode = useAppStore((state) => state.ui.assumptionSidebarMode);
  const setAssumptionSidebarMode = useAppStore(
    (state) => state.setAssumptionSidebarMode,
  );
  const resetToBase = useAppStore((state) => state.resetToBase);
  const resetGroupToBase = useAppStore((state) => state.resetGroupToBase);
  const setDisplayCurrency = useAppStore((state) => state.setDisplayCurrency);
  const setAssumption = useAppStore((state) => state.setAssumption);
  const { displayCurrency, fxRate } = useDisplayCurrency();
  const baseFxRate =
    baseValues[DISPLAY_CURRENCY_FX_KEY] ??
    getBaseAssumptionBundle().baseValues[DISPLAY_CURRENCY_FX_KEY] ??
    155;
  const compact = context === 'sidebar';
  const visibleGroups = getVisibleAssumptionMetadata({
    pathname: compact ? location.pathname : '/assumptions',
    mode: compact ? mode : 'all',
    currentValues,
    baseValues,
  });

  return (
    <div className="space-y-4">
      {context === 'sidebar' ? (
        <div className="rounded-2xl border border-app-border bg-app-bg/70 p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusBadge tone="neutral">Quick edit</StatusBadge>
              <Link
                to="/assumptions"
                className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-panel px-3 py-2 text-sm font-semibold text-app-text transition hover:border-app-accent/35"
                data-testid="open-full-assumptions-link"
              >
                <ArrowTopRightIcon className="h-4 w-4" />
                <span>Open full assumptions view</span>
              </Link>
            </div>
            <p className="text-sm leading-6 text-app-subtle">
              Base assumptions are loaded internally, but outputs stay empty until
              the first Calculate action is triggered.
            </p>
            <CurrencySelector
              value={displayCurrency}
              onChange={setDisplayCurrency}
              fxRate={fxRate}
              onFxRateChange={(nextValue) => setAssumption(DISPLAY_CURRENCY_FX_KEY, nextValue)}
              compact
            />
            <div className="grid gap-2 sm:grid-cols-3">
              {(['context', 'all', 'changed'] as const).map((sidebarMode) => (
                <button
                  key={sidebarMode}
                  type="button"
                  onClick={() => setAssumptionSidebarMode(sidebarMode)}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                    mode === sidebarMode
                      ? 'border-app-accent bg-app-accentSoft text-app-accent'
                      : 'border-app-border bg-app-panel text-app-subtle hover:text-app-text'
                  }`}
                >
                  <SlidersIcon className="h-3.5 w-3.5" />
                  {sidebarMode}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <section className="rounded-3xl border border-app-border bg-app-panel p-6 shadow-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-app-subtle">
                Assumptions Workspace
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-app-text">
                Assumptions
              </h1>
              <p className="mt-3 text-sm leading-6 text-app-subtle">
                All grouped assumptions are editable here. Changes immediately update
                the shared assumption state used by the sidebar and the mocked
                analytical outputs.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CurrencySelector
                value={displayCurrency}
                onChange={setDisplayCurrency}
                fxRate={fxRate}
                onFxRateChange={(nextValue) => setAssumption(DISPLAY_CURRENCY_FX_KEY, nextValue)}
              />
              <StatusBadge tone="accent">Full editor</StatusBadge>
              <StatusBadge tone={changedAssumptionIds.length > 0 ? 'warning' : 'neutral'}>
                {changedAssumptionIds.length} changed
              </StatusBadge>
              <button
                type="button"
                onClick={resetToBase}
                className="rounded-xl border border-app-border bg-app-panel px-3 py-2 text-sm font-medium text-app-text transition hover:border-app-accent/40"
              >
                Reset all to base
              </button>
              <button
                type="button"
                onClick={() => setAssumption(DISPLAY_CURRENCY_FX_KEY, baseFxRate)}
                className="rounded-xl border border-app-border bg-app-panel px-3 py-2 text-sm font-medium text-app-text transition hover:border-app-accent/40"
              >
                Reset FX to base
              </button>
            </div>
          </div>
        </section>
      )}

      {visibleGroups.map((group, index) => {
        const truckCountItems = group.items.filter((definition) =>
          definition.key.startsWith('a2_fleet.number_of_trucks.cy_'),
        );
        const standardItems = group.items.filter(
          (definition) => !definition.key.startsWith('a2_fleet.number_of_trucks.cy_'),
        );

        return (
          <SectionAccordion
            key={group.id}
            title={group.title}
            description={group.description}
            defaultOpen={compact ? index < 2 : true}
            meta={
              <StatusBadge
                tone={
                  group.items.filter((definition) =>
                    changedAssumptionIds.includes(definition.key),
                  ).length > 0
                    ? 'warning'
                    : 'neutral'
                }
              >
                {
                  group.items.filter((definition) =>
                    changedAssumptionIds.includes(definition.key),
                  ).length
                }{' '}
                changed
              </StatusBadge>
            }
          >
            <div className="grid gap-3">
              {!compact ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => resetGroupToBase(group.id)}
                    className="rounded-xl border border-app-border bg-app-panel px-3 py-2 text-sm font-medium text-app-text transition hover:border-app-accent/40"
                  >
                    Reset group to base
                  </button>
                </div>
              ) : null}
              {truckCountItems.length > 0 ? (
                <TruckCountYearEditor definitions={truckCountItems} context={context} />
              ) : null}
              {standardItems.map((definition) => (
                <AssumptionField
                  key={definition.key}
                  definition={definition}
                  context={context}
                />
              ))}
            </div>
          </SectionAccordion>
        );
      })}
    </div>
  );
}
