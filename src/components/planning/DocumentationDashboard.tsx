import { AlertBanner } from '../ui/AlertBanner';
import { SectionAccordion } from '../ui/SectionAccordion';
import { StatusBadge } from '../ui/StatusBadge';

const shellLayers = [
  {
    title: 'Assumptions and scenario layer',
    body:
      'Stable assumption keys live in Zustand and are validated with Zod before they reach the engine. Base values come from the workbook-reference adapter, scenarios store assumption snapshots, and UI metadata controls grouping, labels, helper text, and context filtering.',
  },
  {
    title: 'Calculation layer',
    body:
      'The charging/platform workbook engine runs as a pure pipeline: normalize assumptions, derive workbook-linked drivers, calculate power and revenue layers, build capex and depreciation, assemble source and use of funds, then produce the income statement, cash flow, balance sheet, valuation summary, and KPIs.',
  },
  {
    title: 'Planning and audit layer',
    body:
      'Scenario Studio, Sensitivity Lab, Integrity Checks, Validation Report, and the Utility Panel all read from the shared model state. That keeps planning, explanation, and reconciliation surfaces aligned with the same assumptions and output snapshots.',
  },
];

const fleetStages = [
  'Normalize stable assumption keys into workbook-oriented inputs and preserve workbook quirks where they materially affect output parity.',
  'Build derived assumptions such as cumulative trucks, swap demand, battery-pack needs, and cascade drivers that feed later statements.',
  'Project power-sales, subscription, and direct operating cost lines from the workbook-driven demand and pricing logic.',
  'Roll forward capex, depreciation, source and use of funds, then assemble the income statement, cash flow, and balance sheet in periodized form.',
  'Calculate valuation summary outputs and KPI surfaces that feed the Executive Summary and A2 Fleet analytical pages.',
];

const integratedLayers = [
  'A2 Fleet acts as the demand-driver layer and supplies truck deployment, swap demand, and service-consumption signals to the broader model.',
  'A2 Platform converts fleet-linked throughput into site sizing, software economics, platform revenue, opex, capex, and breakeven signals.',
  'A2 Energy sizes battery inventory, replacement burden, power-sales economics, power-cost burden, and energy capex and depreciation.',
  'An inter-company flow layer explicitly models Fleet-to-Platform fees and Platform-to-Energy transfers while the consolidated view stays anchored to workbook totals.',
  'A sequential-with-feedback convergence layer records iteration history, max delta, override usage, and convergence status so circular dependencies remain explainable.',
];

const workflowStates = [
  ['Empty', 'Base assumptions may be loaded, but outputs remain intentionally blank until Calculate is clicked.'],
  ['Running', 'The current assumption snapshot is being processed.'],
  ['Ready', 'The latest successful result set is available for dashboards, statements, and planning tools.'],
  ['Stale', 'An assumption changed after a successful run. Existing results stay visible while a debounced recalculation is prepared.'],
  ['Error', 'The last run failed. The app keeps the last successful outputs visible where possible and surfaces the error state clearly.'],
];

const planningSurfaces = [
  'Scenario Studio creates, duplicates, renames, weights, loads, and compares scenario snapshots without changing engine code.',
  'Sensitivity Lab runs one-way, two-way, and tornado analyses against selected KPI targets using the current assumption base case.',
  'Integrity Checks aggregate freshness, reconciliation, convergence, elimination, and adequacy warnings into a severity-based review surface.',
  'Validation Report is the workbook-baseline acceptance gate. It reconciles base assumptions and outputs against the reference contract before broader planning work proceeds.',
];

export function DocumentationDashboard() {
  return (
    <div className="space-y-6" data-testid="documentation-page">
      <section className="rounded-3xl border border-app-border bg-app-panel p-6 shadow-panel">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-app-subtle">
              System Guide
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-app-text">Documentation</h1>
            <p className="mt-3 text-sm leading-6 text-app-subtle">
              This workspace explains how the analytical shell, workbook replication
              engine, integrated model layers, and planning controls fit together.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="accent">Model guide</StatusBadge>
            <StatusBadge tone="neutral">Reference-driven architecture</StatusBadge>
          </div>
        </div>

        <div className="mt-6">
          <AlertBanner
            title="What this page is for"
            message="Use this view as the in-app operating manual: how assumptions flow into the model, how recalculation behaves, how the three businesses interact, and how workbook validation gates the baseline."
            tone="info"
          />
        </div>
      </section>

      <SectionAccordion
        title="How the system is structured"
        description="The app is organized into distinct state, engine, and review layers so model logic stays separate from presentation."
        defaultOpen
      >
        <div className="grid gap-4 xl:grid-cols-3">
          {shellLayers.map((layer) => (
            <article
              key={layer.title}
              className="rounded-2xl border border-app-border bg-app-bg/75 p-4"
            >
              <h3 className="text-sm font-semibold text-app-text">{layer.title}</h3>
              <p className="mt-3 text-sm leading-6 text-app-subtle">{layer.body}</p>
            </article>
          ))}
        </div>
      </SectionAccordion>

      <SectionAccordion
        title="How A2 Fleet modeling works"
        description="The baseline engine is designed to replicate the workbook flow as closely as practical while remaining pure and testable."
        defaultOpen
      >
        <div className="space-y-3">
          {fleetStages.map((stage, index) => (
            <div
              key={stage}
              className="rounded-2xl border border-app-border bg-app-bg/75 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-subtle">
                Stage {index + 1}
              </p>
              <p className="mt-2 text-sm leading-6 text-app-text">{stage}</p>
            </div>
          ))}
        </div>
      </SectionAccordion>

      <SectionAccordion
        title="How the integrated model expands the base"
        description="Platform and Energy are layered on top of fleet demand, with explicit transfer flows and a workbook-anchored consolidated view."
        defaultOpen={false}
      >
        <div className="grid gap-3">
          {integratedLayers.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-app-border bg-app-bg/75 p-4 text-sm leading-6 text-app-text"
            >
              {item}
            </div>
          ))}
        </div>
      </SectionAccordion>

      <SectionAccordion
        title="How recalculation and freshness work"
        description="The app keeps the shell responsive and avoids flashing empty dashboards once a valid result set exists."
        defaultOpen
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {workflowStates.map(([title, body]) => (
            <div
              key={title}
              className="rounded-2xl border border-app-border bg-app-bg/75 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-subtle">
                {title}
              </p>
              <p className="mt-3 text-sm leading-6 text-app-text">{body}</p>
            </div>
          ))}
        </div>
      </SectionAccordion>

      <SectionAccordion
        title="How planning and audit surfaces fit in"
        description="Scenario comparison, sensitivity analysis, integrity review, and workbook validation are built around the same shared state."
        defaultOpen={false}
      >
        <div className="grid gap-3">
          {planningSurfaces.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-app-border bg-app-bg/75 p-4 text-sm leading-6 text-app-text"
            >
              {item}
            </div>
          ))}
        </div>
      </SectionAccordion>
    </div>
  );
}
