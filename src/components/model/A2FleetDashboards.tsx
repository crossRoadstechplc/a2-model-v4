import { useModelStore } from '../../store/modelStore';
import { AlertBanner } from '../ui/AlertBanner';
import { EmptyState } from '../ui/EmptyState';
import { LoadingState } from '../ui/LoadingState';
import { SectionAccordion } from '../ui/SectionAccordion';
import { StatusBadge } from '../ui/StatusBadge';
import { A2FleetIntegrityPanel } from './A2FleetIntegrityPanel';
import { KpiCardGrid } from './KpiCardGrid';
import { ReturnsMetricGrid } from './ReturnsMetricGrid';
import { RunStateAlert } from './RunStateAlert';
import { StatementTable } from './StatementTable';
import { TrendChartCard } from './TrendChartCard';
import {
  buildCashSeries,
  buildEnergyCostSeries,
  buildExecutiveKpis,
  buildFleetMetricKpis,
  buildFleetOverviewKpis,
  buildIntegrityMessages,
  buildOperationsSeries,
  buildRevenueAndEbitdaSeries,
} from './a2FleetViewModel';
import {
  buildPlatformCapacityKpis,
  buildPlatformCapacitySummary,
} from './platformCapacityViewModel';

function AnalyticalPageHeader({
  title,
  intro,
  pageBadge,
}: {
  title: string;
  intro: string;
  pageBadge: string;
}) {
  const runState = useModelStore((state) => state.runState);
  const lastCalculatedAt = useModelStore((state) => state.lastCalculatedAt);

  return (
    <section className="rounded-3xl border border-app-border bg-app-panel p-6 shadow-panel">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-app-subtle">
            Analytical Module
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-app-text">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-app-subtle">{intro}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="accent">{pageBadge}</StatusBadge>
          <StatusBadge tone={runState === 'ready' ? 'success' : 'neutral'}>
            A2 Fleet workbook
          </StatusBadge>
          {lastCalculatedAt ? (
            <StatusBadge tone="neutral">
              {new Date(lastCalculatedAt).toLocaleTimeString()}
            </StatusBadge>
          ) : null}
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
    return (
      <EmptyState
        title={title}
        description={description}
        actionLabel="Use Calculate in the header to run the workbook"
      />
    );
  }

  if (runState === 'running' && !hasSuccessfulCalculation) {
    return (
      <LoadingState
        title="Running the A2 Fleet workbook"
        description="The first workbook replication pass is in progress. This page will populate once the calculation completes."
      />
    );
  }

  return null;
}

export function ExecutiveSummaryDashboard() {
  const workbook = useModelStore((state) => state.workbook);
  const previousWorkbook = useModelStore((state) => state.previousWorkbook);
  const results = useModelStore((state) => state.results);
  const previousResults = useModelStore((state) => state.previousResults);
  const integrated = useModelStore((state) => state.integrated);
  const previousIntegrated = useModelStore((state) => state.previousIntegrated);

  const preCalculation = (
    <PreCalculationState
      title="Run the model to populate the executive summary"
      description="The shell and assumptions are ready, but executive outputs remain intentionally empty until the workbook is calculated."
    />
  );

  return (
    <div className="space-y-6">
      <AnalyticalPageHeader
        title="Executive Summary"
        intro="Investor-facing highlights from the A2 Fleet workbook, organized into the few sections needed for first-pass feasibility review."
        pageBadge="Executive view"
      />

      {preCalculation}
      {workbook ? (
        <>
          <RunStateAlert />

          <SectionAccordion
            title="Executive Signals"
            description="Top-line investor metrics drawn from the current workbook replication run."
            defaultOpen
            meta={<StatusBadge tone="accent">Priority</StatusBadge>}
          >
            <div className="space-y-4">
              <KpiCardGrid
                items={buildExecutiveKpis(results)}
                previousItems={buildExecutiveKpis(previousResults)}
                dataTestId="executive-kpi-grid"
              />
              <div className="grid gap-4 xl:grid-cols-2">
                <TrendChartCard
                  title="Revenue and EBITDA trajectory"
                  description="Top-line growth and operating earnings across the modeled horizon."
                  periods={workbook.incomeStatement.periods}
                  series={buildRevenueAndEbitdaSeries(workbook)}
                  previousSeries={
                    previousWorkbook
                      ? buildRevenueAndEbitdaSeries(previousWorkbook)
                      : undefined
                  }
                  dataTestId="executive-chart-revenue-ebitda"
                />
                <TrendChartCard
                  title="Liquidity trend"
                  description="Closing cash remains visible while recalculation is pending."
                  periods={workbook.cashFlow.periods}
                  series={buildCashSeries(workbook)}
                  previousSeries={
                    previousWorkbook ? buildCashSeries(previousWorkbook) : undefined
                  }
                  dataTestId="executive-chart-cash"
                />
              </div>
              {integrated?.platform.capacity ? (
                <div className="rounded-2xl border border-app-border bg-app-bg/75 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">
                        Platform Capacity Summary
                      </p>
                      <h3 className="mt-2 text-sm font-semibold text-app-text">
                        Infrastructure sizing linked to the current Fleet truck path
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-app-subtle">
                        The sizing policy is generated from code and mapped to the latest modeled truck count, ready for later Platform capex and economics layers.
                      </p>
                    </div>
                    {buildPlatformCapacitySummary(integrated.platform.capacity) ? (
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge
                          tone={
                            buildPlatformCapacitySummary(integrated.platform.capacity)?.status ===
                            'ok'
                              ? 'accent'
                              : 'warning'
                          }
                        >
                          {buildPlatformCapacitySummary(integrated.platform.capacity)?.status}
                        </StatusBadge>
                        <StatusBadge tone="neutral">
                          {buildPlatformCapacitySummary(integrated.platform.capacity)?.bandLabel}
                        </StatusBadge>
                      </div>
                    ) : null}
                  </div>
                  {buildPlatformCapacitySummary(integrated.platform.capacity)?.insufficientCapacity ? (
                    <div className="mt-4">
                      <AlertBanner
                        title="Capacity attention required"
                        message={
                          buildPlatformCapacitySummary(integrated.platform.capacity)?.message ??
                          'Platform capacity requires review.'
                        }
                        tone="warning"
                      />
                    </div>
                  ) : null}
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    {buildPlatformCapacityKpis(integrated.platform.capacity).map((item, index) => {
                      const previousItem = buildPlatformCapacityKpis(
                        previousIntegrated?.platform.capacity ?? integrated.platform.capacity,
                      )[index];

                      return (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-app-border bg-app-panel px-4 py-3"
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-app-subtle">
                            {item.label}
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-app-text">
                            {item.value.toLocaleString()}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-app-subtle">
                            {item.description}
                          </p>
                          {previousItem && previousItem.value !== item.value ? (
                            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-app-accent">
                              Updated
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </SectionAccordion>

          <SectionAccordion
            title="Operating Snapshot"
            description="Selected fleet capacity and throughput drivers supporting the executive view."
            defaultOpen={false}
            meta={<StatusBadge tone="neutral">Collapsed by default</StatusBadge>}
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <TrendChartCard
                title="Fleet deployment and throughput"
                description="Operating fleet scale and chargeable tonnes progress together through the build-out."
                periods={workbook.derivedAssumptions.periods}
                series={buildOperationsSeries(workbook)}
                previousSeries={
                  previousWorkbook ? buildOperationsSeries(previousWorkbook) : undefined
                }
                dataTestId="executive-chart-operations"
              />
              <TrendChartCard
                title="Energy cost trend"
                description="Energy spend is tracked separately because it is the dominant direct operating burden in the workbook."
                periods={workbook.derivedAssumptions.periods}
                series={buildEnergyCostSeries(workbook)}
                previousSeries={
                  previousWorkbook ? buildEnergyCostSeries(previousWorkbook) : undefined
                }
                dataTestId="executive-chart-energy-cost"
              />
            </div>
          </SectionAccordion>

          <SectionAccordion
            title="Integrity and Constraints"
            description="Workbook parity checks and early feasibility warnings relevant to the current run."
            defaultOpen={false}
            meta={<StatusBadge tone="warning">Review</StatusBadge>}
          >
            <A2FleetIntegrityPanel messages={buildIntegrityMessages(workbook)} />
          </SectionAccordion>
        </>
      ) : null}
    </div>
  );
}

export function FleetAnalyticsDashboard() {
  const workbook = useModelStore((state) => state.workbook);
  const previousWorkbook = useModelStore((state) => state.previousWorkbook);

  const preCalculation = (
    <PreCalculationState
      title="Run the model to populate the A2 Fleet analytical page"
      description="This page will render workbook-backed KPI cards, charts, and statement tables after the first calculation."
    />
  );

  return (
    <div className="space-y-6">
      <AnalyticalPageHeader
        title="A2 Fleet"
        intro="Workbook-replicated operating, financial, funding, and KPI views for the A2 Fleet business case."
        pageBadge="Fleet analysis"
      />

      {preCalculation}
      {workbook ? (
        <>
          <RunStateAlert />

          <SectionAccordion
            title="Overview"
            description="Core scale, value, and liquidity signals for the fleet model."
            defaultOpen
            meta={<StatusBadge tone="accent">Priority</StatusBadge>}
          >
            <div className="space-y-4">
              <KpiCardGrid
                items={buildFleetOverviewKpis(workbook)}
                previousItems={
                  previousWorkbook ? buildFleetOverviewKpis(previousWorkbook) : undefined
                }
                dataTestId="fleet-overview-kpis"
              />
              <div className="grid gap-4 xl:grid-cols-2">
                <TrendChartCard
                  title="Revenue and EBITDA"
                  description="Commercial scale and operating earnings from the workbook income statement."
                  periods={workbook.incomeStatement.periods}
                  series={buildRevenueAndEbitdaSeries(workbook)}
                  previousSeries={
                    previousWorkbook
                      ? buildRevenueAndEbitdaSeries(previousWorkbook)
                      : undefined
                  }
                  dataTestId="fleet-chart-revenue-ebitda"
                />
                <TrendChartCard
                  title="Fleet deployment and throughput"
                  description="Operating trucks and chargeable tonnes from the derived assumption cascade."
                  periods={workbook.derivedAssumptions.periods}
                  series={buildOperationsSeries(workbook)}
                  previousSeries={
                    previousWorkbook ? buildOperationsSeries(previousWorkbook) : undefined
                  }
                  dataTestId="fleet-chart-operations"
                />
              </div>
            </div>
          </SectionAccordion>

          <SectionAccordion
            title="Operations"
            description="Operating assumptions translated into fleet scale, trips, throughput, and energy burden."
            defaultOpen={false}
          >
            <div className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-2">
                <TrendChartCard
                  title="Energy cost"
                  description="Energy cost trend from the workbook operating cascade."
                  periods={workbook.derivedAssumptions.periods}
                  series={buildEnergyCostSeries(workbook)}
                  previousSeries={
                    previousWorkbook ? buildEnergyCostSeries(previousWorkbook) : undefined
                  }
                  dataTestId="fleet-chart-energy-cost"
                />
                <StatementTable
                  title="Operational Drivers"
                  description="Selected derived assumptions that directly feed revenue and energy cost."
                  statement={workbook.derivedAssumptions}
                  previousStatement={previousWorkbook?.derivedAssumptions}
                  rowKeys={[
                    'trucks_in_operation',
                    'fleet_km',
                    'energy_purchased',
                    'energy_cost',
                    'fleet_trips',
                    'chargeable_tonnes',
                  ]}
                  dataTestId="statement-table-operational-drivers"
                />
              </div>
            </div>
          </SectionAccordion>

          <SectionAccordion
            title="Financials"
            description="Dense but readable statement views sourced directly from the workbook replication engine."
            defaultOpen
            meta={<StatusBadge tone="accent">Priority</StatusBadge>}
          >
            <div className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-2">
                <TrendChartCard
                  title="Liquidity"
                  description="Closing cash remains visible during stale and recalculating states."
                  periods={workbook.cashFlow.periods}
                  series={buildCashSeries(workbook)}
                  previousSeries={
                    previousWorkbook ? buildCashSeries(previousWorkbook) : undefined
                  }
                  dataTestId="fleet-chart-cash"
                />
              </div>
              <StatementTable
                title="Income Statement"
                description="Revenue, costs, EBITDA, tax, and net income."
                statement={workbook.incomeStatement}
                previousStatement={previousWorkbook?.incomeStatement}
                dataTestId="statement-table-income-statement"
              />
              <StatementTable
                title="Cash Flow"
                description="Operating, investing, financing, and liquidity movement."
                statement={workbook.cashFlow}
                previousStatement={previousWorkbook?.cashFlow}
                dataTestId="statement-table-cash-flow"
              />
              <StatementTable
                title="Balance Sheet"
                description="Cash, PP&E, and equity structure with the retained earnings plug preserved."
                statement={workbook.balanceSheet}
                previousStatement={previousWorkbook?.balanceSheet}
                dataTestId="statement-table-balance-sheet"
              />
            </div>
          </SectionAccordion>

          <SectionAccordion
            title="Funding"
            description="Source/use of funds supporting the investor case and capital structure."
            defaultOpen={false}
          >
            <div className="space-y-4">
              <StatementTable
                title="Source / Use of Funds"
                description="Equity subscription, change in equity, and total use of funds."
                statement={workbook.sourceUseOfFunds}
                previousStatement={previousWorkbook?.sourceUseOfFunds}
                dataTestId="statement-table-source-use"
              />
            </div>
          </SectionAccordion>

          <SectionAccordion
            title="Returns / Valuation"
            description="Cumulative return metrics belong here rather than inside annual statement rows."
            defaultOpen
            meta={<StatusBadge tone="accent">Priority</StatusBadge>}
          >
            <div className="space-y-4">
              <ReturnsMetricGrid
                summary={workbook.returnsSummary}
                previousSummary={previousWorkbook?.returnsSummary}
                dataTestId="fleet-returns-grid"
              />
              <StatementTable
                title="Valuation Summary"
                description="EBITDA multiple valuation, enterprise value, equity value, stake value, and MOIC."
                statement={workbook.valuationSummary}
                previousStatement={previousWorkbook?.valuationSummary}
                dataTestId="statement-table-valuation-summary"
              />
            </div>
          </SectionAccordion>

          <SectionAccordion
            title="KPIs"
            description="Margins and investor performance metrics from the workbook output layer."
            defaultOpen={false}
          >
            <KpiCardGrid
              items={buildFleetMetricKpis(workbook)}
              previousItems={
                previousWorkbook ? buildFleetMetricKpis(previousWorkbook) : undefined
              }
              dataTestId="fleet-kpi-grid"
            />
          </SectionAccordion>

          <SectionAccordion
            title="Risks / Constraints"
            description="Model integrity signals and feasibility warnings worth reviewing before export."
            defaultOpen={false}
            meta={<StatusBadge tone="warning">Review</StatusBadge>}
          >
            <A2FleetIntegrityPanel messages={buildIntegrityMessages(workbook)} />
          </SectionAccordion>
        </>
      ) : null}
    </div>
  );
}
