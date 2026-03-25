import { useLocation } from 'react-router-dom';
import { pathToLabel } from '../../app/navigation';
import { useAppStore } from '../../store/appStore';
import { useModelStore } from '../../store/modelStore';
import { useUIStore } from '../../store/uiStore';
import { IconButton } from '../ui/IconButton';
import {
  CalculatorIcon,
  HelpCircleIcon,
  PanelLeftIcon,
  SlidersIcon,
} from '../ui/icons';
import { StatusBadge } from '../ui/StatusBadge';
import { ThemeToggle } from './ThemeToggle';

const runStateTone = {
  empty: 'neutral',
  running: 'accent',
  ready: 'success',
  stale: 'warning',
  error: 'warning',
} as const;

const runStateLabel = {
  empty: 'Not calculated',
  running: 'Calculating',
  ready: 'Ready',
  stale: 'Stale',
  error: 'Error',
} as const;

export function TopHeader() {
  const location = useLocation();
  const currentLabel = pathToLabel.get(location.pathname) ?? 'Analytical Workspace';
  const isPrimarySidebarOpen = useUIStore((state) => state.isPrimarySidebarOpen);
  const isAssumptionsOpen = useUIStore((state) => state.isAssumptionsOpen);
  const togglePrimarySidebar = useUIStore((state) => state.togglePrimarySidebar);
  const toggleAssumptions = useUIStore((state) => state.toggleAssumptions);
  const openWalkthrough = useUIStore((state) => state.openWalkthrough);
  const runState = useModelStore((state) => state.runState);
  const changedAssumptionIds = useModelStore((state) => state.changedAssumptionIds);
  const lastCalculatedAt = useModelStore((state) => state.lastCalculatedAt);
  const calculateNow = useModelStore((state) => state.calculateNow);
  const currentScenarioId = useAppStore((state) => state.app.currentScenarioId);
  const scenarios = useAppStore((state) => state.scenarios);
  const loadScenario = useAppStore((state) => state.loadScenario);
  const visibleScenarioChips = scenarios.allIds
    .map((id) => scenarios.byId[id])
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 5);

  return (
    <header
      className="sticky top-0 z-20 border-b border-app-border bg-app-bg/95 backdrop-blur"
      data-testid="top-header"
    >
      <div
        className="flex flex-col gap-4 px-4 py-4 sm:px-5 lg:px-6 xl:flex-row xl:items-center xl:justify-between"
        data-testid="top-header-main"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-app-subtle">
            Analytical Workspace
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-app-text">
            {currentLabel}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge tone={runStateTone[runState]}>
              <span data-testid="run-state-badge">{runStateLabel[runState]}</span>
            </StatusBadge>
            <StatusBadge
              tone={changedAssumptionIds.length > 0 ? 'warning' : 'neutral'}
            >
              {changedAssumptionIds.length} changed
            </StatusBadge>
            {lastCalculatedAt ? (
              <span className="text-sm text-app-subtle">
                Last successful run {new Date(lastCalculatedAt).toLocaleTimeString()}
              </span>
            ) : (
              <span className="text-sm text-app-subtle">
                Outputs stay empty until Calculate is clicked
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 xl:justify-end">
          <button
            type="button"
            onClick={calculateNow}
            disabled={runState === 'running'}
            title={
              runState === 'running'
                ? 'Calculation in progress'
                : runState === 'empty'
                  ? 'Run the first model calculation'
                  : 'Run a fresh model calculation'
            }
            className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-app-accent bg-app-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 max-sm:w-full"
            data-testid="calculate-button"
          >
            <CalculatorIcon className="h-4 w-4" />
            {runState === 'empty'
              ? 'Calculate'
              : runState === 'stale' || runState === 'error'
                ? 'Recalculate now'
                : runState === 'running'
                  ? 'Calculating...'
                  : 'Calculate'}
          </button>
          <IconButton
            icon={<PanelLeftIcon className="h-5 w-5" />}
            label={
              isPrimarySidebarOpen
                ? 'Collapse primary navigation'
                : 'Expand primary navigation'
            }
            onClick={togglePrimarySidebar}
            active={isPrimarySidebarOpen}
            testId="primary-sidebar-header-toggle"
            aria-expanded={isPrimarySidebarOpen}
          />
          <IconButton
            icon={<SlidersIcon className="h-5 w-5" />}
            label={
              isAssumptionsOpen
                ? 'Collapse assumptions sidebar'
                : 'Expand assumptions sidebar'
            }
            onClick={toggleAssumptions}
            active={isAssumptionsOpen}
            testId="assumptions-header-toggle"
            aria-expanded={isAssumptionsOpen}
          />
          <IconButton
            icon={<HelpCircleIcon className="h-5 w-5" />}
            label="Open guided walkthrough"
            onClick={openWalkthrough}
            testId="walkthrough-toggle"
          />
          <ThemeToggle />
        </div>
      </div>
      <div className="border-t border-app-border/70 px-4 py-3 sm:px-5 lg:px-6">
        <div
          className="flex flex-wrap items-center gap-2"
          data-testid="scenario-chip-row"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">
            Scenario chips
          </span>
          {visibleScenarioChips.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => loadScenario(scenario.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                scenario.id === currentScenarioId
                  ? 'border-app-accent bg-app-accentSoft text-app-accent'
                  : 'border-app-border bg-app-panel text-app-subtle hover:text-app-text'
              }`}
              title={`Load scenario ${scenario.name}`}
              data-testid={`scenario-chip-${scenario.id}`}
            >
              {scenario.name}
              {scenarios.compareIds.includes(scenario.id) ? ' | Compare' : ''}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
