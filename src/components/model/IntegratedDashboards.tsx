import { useModelStore } from '../../store/modelStore';
import { AlertBanner } from '../ui/AlertBanner';
import { EmptyState } from '../ui/EmptyState';
import { LoadingState } from '../ui/LoadingState';
import { SectionAccordion } from '../ui/SectionAccordion';
import { StatusBadge } from '../ui/StatusBadge';
import { KpiCardGrid } from './KpiCardGrid';
import { PlatformCapacityTable } from './PlatformCapacityTable';
import { ReturnsMetricGrid } from './ReturnsMetricGrid';
import { RunStateAlert } from './RunStateAlert';
import { StatementTable } from './StatementTable';
import { TrendChartCard } from './TrendChartCard';
import type { DashboardKpi, TrendSeries } from './a2FleetViewModel';
import {
  buildPlatformCapacityKpis,
  buildPlatformCapacitySummary,
  getPlatformCapacityWarningCount,
} from './platformCapacityViewModel';

type StatementLike = {
  periods: string[];
  rows: Array<{ key: string; label: string; values: number[] }>;
};

function mapEngineKpis(
  items: Array<{
    id: string;
    label: string;
    value: number;
    format: 'currencyM' | 'percent' | 'number' | 'multiple';
    description: string;
  }>,
): DashboardKpi[] {
  return items.map((item) => ({
    id: item.id,
    label: item.label,
    value: item.value,
    format: item.format,
    description: item.description,
  }));
}

function buildSeriesFromStatement(params: {
  statement: StatementLike;
  keys: Array<{
    key: string;
    colorClassName: string;
    format: 'currencyM' | 'percent' | 'number' | 'multiple';
  }>;
  divisor?: number;
}): TrendSeries[] {
  return params.keys.map((config) => {
    const row = params.statement.rows.find((item) => item.key === config.key);
    return {
      id: config.key,
      label: row?.label ?? config.key,
      values: (row?.values ?? []).map((value) =>
        params.divisor ? value / params.divisor : value,
      ),
      colorClassName: config.colorClassName,
      format: config.format,
    };
  });
}

function AnalyticalPageHeader({
  title,
  intro,
  badge,
}: {
  title: string;
  intro: string;
  badge: string;
}) {
  return (
    <section className="rounded-3xl border border-app-border bg-app-panel p-6 shadow-panel">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-app-subtle">
            Integrated Model
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-app-text">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-app-subtle">{intro}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="accent">{badge}</StatusBadge>
          <StatusBadge tone="neutral">Interdependent modules</StatusBadge>
        </div>
      </div>
    </section>
  );
}

function PreCalculationState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const runState = useModelStore((state) => state.runState);
  const hasSuccessfulCalculation = useModelStore(
    (state) => state.hasSuccessfulCalculation,
  );

  if (runState === 'empty') {
    return <EmptyState title={title} description={description} />;
  }

  if (runState === 'running' && !hasSuccessfulCalculation) {
    return (
      <LoadingState
        title="Running the integrated model expansion"
        description="Platform, Energy, inter-company flows, and consolidated outputs are being calculated."
      />
    );
  }

  return null;
}

function ConvergencePanel() {
  const integrated = useModelStore((state) => state.integrated);

  if (!integrated) {
    return null;
  }

  return (
    <div className="space-y-4">
      <AlertBanner
        title={`Convergence ${integrated.convergence.status}`}
        message={`Iterations: ${integrated.convergence.iterations}. Max delta: ${integrated.convergence.maxDelta.toFixed(6)}. Tolerance: ${integrated.convergence.tolerance.toFixed(6)}.`}
        tone={
          integrated.convergence.status === 'converged' ||
          integrated.convergence.status === 'manual_override'
            ? 'info'
            : 'warning'
        }
      />
      <div className="overflow-x-auto rounded-2xl border border-app-border bg-app-panel/80">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-app-border bg-app-bg/60">
              {['Iteration', 'Service Factor', 'Sites', 'Battery Packs', 'Replacement Rate', 'Max Delta'].map(
                (label) => (
                  <th
                    key={label}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-app-subtle"
                  >
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {integrated.convergence.history.map((item) => (
              <tr key={item.iteration} className="border-b border-app-border/70 last:border-b-0">
                <td className="px-4 py-3">{item.iteration}</td>
                <td className="px-4 py-3">{(item.serviceFactor * 100).toFixed(1)}%</td>
                <td className="px-4 py-3">{item.platformSites.toLocaleString()}</td>
                <td className="px-4 py-3">{item.batteryPacks.toLocaleString()}</td>
                <td className="px-4 py-3">{(item.replacementRate * 100).toFixed(2)}%</td>
                <td className="px-4 py-3">{item.maxDelta.toFixed(6)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {integrated.convergence.usedOverrides.length > 0 ? (
        <p className="text-xs uppercase tracking-[0.16em] text-app-subtle">
          Overrides active: {integrated.convergence.usedOverrides.join(', ')}
        </p>
      ) : null}
    </div>
  );
}

export function PlatformDashboard() {
  const integrated = useModelStore((state) => state.integrated);
  const previousIntegrated = useModelStore((state) => state.previousIntegrated);

  return (
    <div className="space-y-6">
      <AnalyticalPageHeader
        title="A2 Platform"
        intro="Platform sizing, revenue, opex, capex, depreciation, and breakeven views driven by fleet demand and the workbook subscription stack."
        badge="Platform module"
      />
      <PreCalculationState
        title="Run the model to populate the A2 Platform page"
        description="Platform outputs will appear here once the integrated model has completed its first calculation."
      />
      {integrated ? (
        <>
          <RunStateAlert />
          <SectionAccordion
            title="Overview"
            description="Top-line revenue, margin, and infrastructure signals for the platform business."
            defaultOpen
            meta={<StatusBadge tone="accent">Priority</StatusBadge>}
          >
            <div className="space-y-4">
              <KpiCardGrid
                items={mapEngineKpis(integrated.platform.kpis)}
                previousItems={
                  previousIntegrated
                    ? mapEngineKpis(previousIntegrated.platform.kpis)
                    : undefined
                }
                dataTestId="platform-kpis"
              />
              <div className="grid gap-4 xl:grid-cols-2">
                <TrendChartCard
                  title="Platform revenue and EBITDA"
                  description="Revenue mix and earnings from the first working platform module."
                  periods={integrated.platform.periods}
                  series={buildSeriesFromStatement({
                    statement: integrated.platform.incomeStatement,
                    keys: [
                      {
                        key: 'total_revenue',
                        colorClassName: 'text-app-accent',
                        format: 'currencyM',
                      },
                      {
                        key: 'ebitda',
                        colorClassName: 'text-app-success',
                        format: 'currencyM',
                      },
                    ],
                    divisor: 1_000_000,
                  })}
                  previousSeries={
                    previousIntegrated
                      ? buildSeriesFromStatement({
                          statement: previousIntegrated.platform.incomeStatement,
                          keys: [
                            {
                              key: 'total_revenue',
                              colorClassName: 'text-app-accent',
                              format: 'currencyM',
                            },
                            {
                              key: 'ebitda',
                              colorClassName: 'text-app-success',
                              format: 'currencyM',
                            },
                          ],
                          divisor: 1_000_000,
                        })
                      : undefined
                  }
                  dataTestId="platform-chart-revenue"
                />
                <TrendChartCard
                  title="Infrastructure sizing"
                  description="Required sites and chargers driven by fleet-linked throughput demand."
                  periods={integrated.platform.periods}
                  series={buildSeriesFromStatement({
                    statement: integrated.platform.operations,
                    keys: [
                      {
                        key: 'required_sites',
                        colorClassName: 'text-app-warning',
                        format: 'number',
                      },
                      {
                        key: 'chargers_required',
                        colorClassName: 'text-app-success',
                        format: 'number',
                      },
                    ],
                  })}
                  previousSeries={
                    previousIntegrated
                      ? buildSeriesFromStatement({
                          statement: previousIntegrated.platform.operations,
                          keys: [
                            {
                              key: 'required_sites',
                              colorClassName: 'text-app-warning',
                              format: 'number',
                            },
                            {
                              key: 'chargers_required',
                              colorClassName: 'text-app-success',
                              format: 'number',
                            },
                          ],
                        })
                      : undefined
                  }
                  dataTestId="platform-chart-sizing"
                />
              </div>
            </div>
          </SectionAccordion>

          <SectionAccordion
            title="Capacity / Infrastructure"
            description="Truck-band infrastructure sizing generated from code and paired with fleet-linked throughput demand."
            defaultOpen
            meta={
              <StatusBadge
                tone={
                  getPlatformCapacityWarningCount(integrated.platform.capacity) > 0
                    ? 'warning'
                    : 'accent'
                }
              >
                {getPlatformCapacityWarningCount(integrated.platform.capacity) > 0
                  ? `${getPlatformCapacityWarningCount(integrated.platform.capacity)} warning${getPlatformCapacityWarningCount(integrated.platform.capacity) === 1 ? '' : 's'}`
                  : 'Sized'}
              </StatusBadge>
            }
          >
            <div className="space-y-4">
              {buildPlatformCapacitySummary(integrated.platform.capacity)?.insufficientCapacity ||
              buildPlatformCapacitySummary(integrated.platform.capacity)?.status !== 'ok' ? (
                <AlertBanner
                  title="Capacity policy requires review"
                  message={
                    buildPlatformCapacitySummary(integrated.platform.capacity)?.message ??
                    'Current truck counts do not map cleanly into the generated capacity policy.'
                  }
                  tone="warning"
                />
              ) : null}
              <KpiCardGrid
                items={buildPlatformCapacityKpis(integrated.platform.capacity)}
                previousItems={
                  previousIntegrated
                    ? buildPlatformCapacityKpis(previousIntegrated.platform.capacity)
                    : undefined
                }
                dataTestId="platform-capacity-kpis"
              />
              <PlatformCapacityTable
                title="Platform Capacity Bands by Period"
                description="Generated infrastructure policy showing the selected truck band, installed charging/swap capacity, and utilization by modeled period."
                capacity={integrated.platform.capacity}
                previousCapacity={previousIntegrated?.platform.capacity}
                dataTestId="platform-capacity-table"
              />
              <StatementTable
                title="Platform Operations"
                description="Throughput demand, required sites, chargers, and service-factor outputs alongside the capacity policy."
                statement={integrated.platform.operations}
                previousStatement={previousIntegrated?.platform.operations}
                dataTestId="statement-table-platform-operations"
              />
            </div>
          </SectionAccordion>

          <SectionAccordion
            title="Financials"
            description="Platform revenue, opex, EBITDA, depreciation, and capex."
            defaultOpen
            meta={<StatusBadge tone="accent">Priority</StatusBadge>}
          >
            <div className="space-y-4">
              <StatementTable
                title="Platform Income Statement"
                description="Internal revenue, external revenue, opex, and breakeven coverage."
                statement={integrated.platform.incomeStatement}
                previousStatement={previousIntegrated?.platform.incomeStatement}
                dataTestId="statement-table-platform-income"
              />
              <StatementTable
                title="Platform Capex & Depreciation"
                description="Capex additions, depreciation roll-forward, and asset base."
                statement={integrated.platform.capexDepreciation}
                previousStatement={previousIntegrated?.platform.capexDepreciation}
                dataTestId="statement-table-platform-capex"
              />
            </div>
          </SectionAccordion>

          <SectionAccordion
            title="Inter-Company Links"
            description="Platform dependencies on Fleet demand and Energy charging-stack economics."
            defaultOpen={false}
          >
            <StatementTable
              title="Inter-Company Flow Layer"
              description="Fleet-to-Platform fees and Platform-to-Energy transfers."
              statement={integrated.intercompany.statement}
              previousStatement={previousIntegrated?.intercompany.statement}
              dataTestId="statement-table-intercompany-platform"
            />
          </SectionAccordion>

          <SectionAccordion
            title="Returns / Valuation"
            description="Project return metrics are shown here now, with room for a fuller Platform financing and investor-distribution layer later."
            defaultOpen={false}
          >
            <ReturnsMetricGrid
              summary={integrated.platform.returnsSummary}
              previousSummary={previousIntegrated?.platform.returnsSummary}
              dataTestId="platform-returns-grid"
            />
          </SectionAccordion>
        </>
      ) : null}
    </div>
  );
}

export function EnergyDashboard() {
  const integrated = useModelStore((state) => state.integrated);
  const previousIntegrated = useModelStore((state) => state.previousIntegrated);

  return (
    <div className="space-y-6">
      <AnalyticalPageHeader
        title="A2 Energy"
        intro="Battery fleet sizing, replacement, power-sales economics, and energy capex/opex built from the integrated charging model."
        badge="Energy module"
      />
      <PreCalculationState
        title="Run the model to populate the A2 Energy page"
        description="Energy outputs will appear here once the integrated model has completed its first calculation."
      />
      {integrated ? (
        <>
          <RunStateAlert />
          <SectionAccordion
            title="Overview"
            description="Top-line energy economics and battery service metrics."
            defaultOpen
            meta={<StatusBadge tone="accent">Priority</StatusBadge>}
          >
            <div className="space-y-4">
              <KpiCardGrid
                items={mapEngineKpis(integrated.energy.kpis)}
                previousItems={
                  previousIntegrated ? mapEngineKpis(previousIntegrated.energy.kpis) : undefined
                }
                dataTestId="energy-kpis"
              />
              <div className="grid gap-4 xl:grid-cols-2">
                <TrendChartCard
                  title="Energy revenue and EBITDA"
                  description="Lease income and revenue-share driven energy business build."
                  periods={integrated.energy.periods}
                  series={buildSeriesFromStatement({
                    statement: integrated.energy.incomeStatement,
                    keys: [
                      {
                        key: 'total_revenue',
                        colorClassName: 'text-app-accent',
                        format: 'currencyM',
                      },
                      {
                        key: 'ebitda',
                        colorClassName: 'text-app-success',
                        format: 'currencyM',
                      },
                    ],
                    divisor: 1_000_000,
                  })}
                  previousSeries={
                    previousIntegrated
                      ? buildSeriesFromStatement({
                          statement: previousIntegrated.energy.incomeStatement,
                          keys: [
                            {
                              key: 'total_revenue',
                              colorClassName: 'text-app-accent',
                              format: 'currencyM',
                            },
                            {
                              key: 'ebitda',
                              colorClassName: 'text-app-success',
                              format: 'currencyM',
                            },
                          ],
                          divisor: 1_000_000,
                        })
                      : undefined
                  }
                  dataTestId="energy-chart-revenue"
                />
                <TrendChartCard
                  title="Battery sizing and replacements"
                  description="Required battery fleet and replacement volume across the horizon."
                  periods={integrated.energy.periods}
                  series={buildSeriesFromStatement({
                    statement: integrated.energy.operations,
                    keys: [
                      {
                        key: 'battery_packs_required',
                        colorClassName: 'text-app-warning',
                        format: 'number',
                      },
                      {
                        key: 'battery_replacements',
                        colorClassName: 'text-app-success',
                        format: 'number',
                      },
                    ],
                  })}
                  previousSeries={
                    previousIntegrated
                      ? buildSeriesFromStatement({
                          statement: previousIntegrated.energy.operations,
                          keys: [
                            {
                              key: 'battery_packs_required',
                              colorClassName: 'text-app-warning',
                              format: 'number',
                            },
                            {
                              key: 'battery_replacements',
                              colorClassName: 'text-app-success',
                              format: 'number',
                            },
                          ],
                        })
                      : undefined
                  }
                  dataTestId="energy-chart-batteries"
                />
              </div>
            </div>
          </SectionAccordion>

          <SectionAccordion
            title="Battery Fleet & Provision"
            description="Battery sizing, replacement burden, provision logic, and service factor."
            defaultOpen
            meta={<StatusBadge tone="accent">Priority</StatusBadge>}
          >
            <StatementTable
              title="Energy Operations"
              description="Battery inventory, provisions, replacements, and converged service support."
              statement={integrated.energy.operations}
              previousStatement={previousIntegrated?.energy.operations}
              dataTestId="statement-table-energy-operations"
            />
          </SectionAccordion>

          <SectionAccordion
            title="Financials"
            description="Lease income, revenue share, opex, capex, and depreciation."
            defaultOpen={false}
          >
            <div className="space-y-4">
              <StatementTable
                title="Energy Income Statement"
                description="Standalone income build for the Energy business."
                statement={integrated.energy.incomeStatement}
                previousStatement={previousIntegrated?.energy.incomeStatement}
                dataTestId="statement-table-energy-income"
              />
              <StatementTable
                title="Energy Capex & Depreciation"
                description="Energy capex additions and resulting asset base."
                statement={integrated.energy.capexDepreciation}
                previousStatement={previousIntegrated?.energy.capexDepreciation}
                dataTestId="statement-table-energy-capex"
              />
            </div>
          </SectionAccordion>

          <SectionAccordion
            title="Inter-Company Links"
            description="Energy receives lease and revenue-share flows from the Platform layer."
            defaultOpen={false}
          >
            <StatementTable
              title="Inter-Company Flow Layer"
              description="Shared transfer-pricing layer for the integrated model."
              statement={integrated.intercompany.statement}
              previousStatement={previousIntegrated?.intercompany.statement}
              dataTestId="statement-table-intercompany-energy"
            />
          </SectionAccordion>

          <SectionAccordion
            title="Returns / Valuation"
            description="Project return metrics are shown here now, with room for a fuller Energy investment case and financing layer later."
            defaultOpen={false}
          >
            <ReturnsMetricGrid
              summary={integrated.energy.returnsSummary}
              previousSummary={previousIntegrated?.energy.returnsSummary}
              dataTestId="energy-returns-grid"
            />
          </SectionAccordion>
        </>
      ) : null}
    </div>
  );
}

export function ConsolidatedDashboard() {
  const integrated = useModelStore((state) => state.integrated);
  const previousIntegrated = useModelStore((state) => state.previousIntegrated);

  return (
    <div className="space-y-6">
      <AnalyticalPageHeader
        title="Consolidated / Corridor View"
        intro="Workbook-anchored consolidated view combining Fleet demand, Platform, and Energy diagnostics with explicit eliminations and convergence diagnostics."
        badge="Consolidated view"
      />
      <PreCalculationState
        title="Run the model to populate the consolidated view"
        description="Consolidated statements, eliminations, and convergence diagnostics remain empty until the integrated model is calculated."
      />
      {integrated ? (
        <>
          <RunStateAlert />
          <SectionAccordion
            title="Consolidated KPIs"
            description="Workbook-anchored consolidated KPIs paired with the analytical elimination bridge."
            defaultOpen
            meta={<StatusBadge tone="accent">Priority</StatusBadge>}
          >
            <KpiCardGrid
              items={mapEngineKpis(integrated.consolidated.kpis)}
              previousItems={
                previousIntegrated
                  ? mapEngineKpis(previousIntegrated.consolidated.kpis)
                  : undefined
              }
              dataTestId="consolidated-kpis"
            />
          </SectionAccordion>

          <SectionAccordion
            title="Convergence"
            description="Sequential-with-feedback convergence diagnostics for the first integrated pass."
            defaultOpen
            meta={<StatusBadge tone="warning">Diagnostics</StatusBadge>}
          >
            <ConvergencePanel />
          </SectionAccordion>

          <SectionAccordion
            title="Inter-Company Flow Layer"
            description="Explicit transfer flows between Fleet, Platform, and Energy."
            defaultOpen
            meta={<StatusBadge tone="accent">Priority</StatusBadge>}
          >
            <div className="space-y-4">
              <StatementTable
                title="Inter-Company Flows"
                description="Internal fee, lease, and revenue-share flows used by the elimination bridge."
                statement={integrated.intercompany.statement}
                previousStatement={previousIntegrated?.intercompany.statement}
                dataTestId="statement-table-intercompany-consolidated"
              />
              <div className="rounded-2xl border border-app-border bg-app-panel/80 p-4">
                <h3 className="text-sm font-semibold text-app-text">Elimination Objects</h3>
                <div className="mt-3 grid gap-3">
                  {integrated.consolidated.eliminations.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-app-border bg-app-bg/70 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-app-text">{item.label}</p>
                        <StatusBadge tone="neutral">
                          {`${item.source} -> ${item.target}`}
                        </StatusBadge>
                      </div>
                      <p className="mt-2 text-sm text-app-subtle">
                        Revenue line `{item.revenueLine}` eliminates against expense line `{item.expenseLine}`.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionAccordion>

          <SectionAccordion
            title="Consolidated Statements"
            description="Workbook-anchored consolidated statements paired with explicit eliminations and diagnostic overlays."
            defaultOpen={false}
          >
            <div className="space-y-4">
              <StatementTable
                title="Consolidated Income Statement"
                description="Revenue, eliminations, operating costs, EBITDA, EBIT, tax, and net income."
                statement={integrated.consolidated.incomeStatement}
                previousStatement={previousIntegrated?.consolidated.incomeStatement}
                dataTestId="statement-table-consolidated-income"
              />
              <StatementTable
                title="Consolidated Cash Flow"
                description="Workbook cash flow anchor paired with analytical expansion-capex context."
                statement={integrated.consolidated.cashFlow}
                previousStatement={previousIntegrated?.consolidated.cashFlow}
                dataTestId="statement-table-consolidated-cash"
              />
              <StatementTable
                title="Consolidated Balance Sheet"
                description="Workbook balance-sheet anchor with Platform and Energy asset diagnostics alongside it."
                statement={integrated.consolidated.balanceSheet}
                previousStatement={previousIntegrated?.consolidated.balanceSheet}
                dataTestId="statement-table-consolidated-balance"
              />
            </div>
          </SectionAccordion>

          <SectionAccordion
            title="Returns / Valuation"
            description="Project return metrics are shown here now, with room for a fuller integrated financing and distribution model later."
            defaultOpen={false}
          >
            <ReturnsMetricGrid
              summary={integrated.consolidated.returnsSummary}
              previousSummary={previousIntegrated?.consolidated.returnsSummary}
              dataTestId="consolidated-returns-grid"
            />
          </SectionAccordion>
        </>
      ) : null}
    </div>
  );
}
