import { useMemo, useState } from 'react';
import { formatDisplayValue } from '../model/formatters';
import { RunStateAlert } from '../model/RunStateAlert';
import { AlertBanner } from '../ui/AlertBanner';
import { SectionAccordion } from '../ui/SectionAccordion';
import { StatusBadge } from '../ui/StatusBadge';
import {
  buildValidationJsonArtifact,
  buildValidationMarkdownArtifact,
  buildValidationReport,
} from '../../model/validation';
import { useAppStore } from '../../store/appStore';
import { useModelStore } from '../../store/modelStore';

function downloadHref(content: string, mime: string) {
  return `data:${mime};charset=utf-8,${encodeURIComponent(content)}`;
}

function slugifyFilename(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'scenario';
}

function formatTimestamp(value: number | null) {
  if (!value) {
    return 'Not run yet';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

function buildMetricLines(
  title: string,
  items: Array<{
    label: string;
    value: number;
    format: 'currencyM' | 'percent' | 'number' | 'multiple';
  }>,
) {
  if (items.length === 0) {
    return [`## ${title}`, '', '- No metrics available.', ''];
  }

  return [
    `## ${title}`,
    '',
    ...items.map((item) => `- ${item.label}: ${formatDisplayValue(item.value, item.format)}`),
    '',
  ];
}

function buildRunSummaryMarkdown(params: {
  generatedAt: string;
  lastCalculatedAt: number | null;
  scenarioName: string;
  results: Array<{
    label: string;
    value: number;
    format: 'currencyM' | 'percent' | 'multiple';
  }>;
  platformKpis: Array<{
    label: string;
    value: number;
    format: 'currencyM' | 'percent' | 'number' | 'multiple';
  }>;
  energyKpis: Array<{
    label: string;
    value: number;
    format: 'currencyM' | 'percent' | 'number' | 'multiple';
  }>;
  consolidatedKpis: Array<{
    label: string;
    value: number;
    format: 'currencyM' | 'percent' | 'number' | 'multiple';
  }>;
  validationGate: string;
  validationVerdict: string;
}) {
  return [
    '# A2 Model Run Summary',
    '',
    `Generated at: ${params.generatedAt}`,
    `Scenario: ${params.scenarioName}`,
    `Last calculated at: ${formatTimestamp(params.lastCalculatedAt)}`,
    `Validation gate: ${params.validationGate.toUpperCase()}`,
    '',
    ...buildMetricLines('Fleet Headline KPIs', params.results),
    ...buildMetricLines('Platform KPIs', params.platformKpis.slice(0, 4)),
    ...buildMetricLines('Energy KPIs', params.energyKpis.slice(0, 4)),
    ...buildMetricLines('Consolidated KPIs', params.consolidatedKpis.slice(0, 4)),
    '## Validation Verdict',
    '',
    params.validationVerdict,
    '',
  ].join('\n');
}

function ExportCard({
  title,
  description,
  href,
  download,
  buttonLabel,
  testId,
}: {
  title: string;
  description: string;
  href?: string;
  download?: string;
  buttonLabel: string;
  testId?: string;
}) {
  const buttonClassName =
    'rounded-xl border border-app-border bg-app-panel px-3 py-2 text-sm font-medium text-app-text transition hover:bg-app-muted/70';

  return (
    <div className="rounded-2xl border border-app-border bg-app-bg/75 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="max-w-xl">
          <h3 className="text-sm font-semibold text-app-text">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-app-subtle">{description}</p>
        </div>
        {href && download ? (
          <a
            href={href}
            download={download}
            className={buttonClassName}
            data-testid={testId}
          >
            {buttonLabel}
          </a>
        ) : (
          <span
            className="rounded-xl border border-app-border bg-app-muted/40 px-3 py-2 text-sm font-medium text-app-subtle"
            data-testid={testId}
          >
            {buttonLabel}
          </span>
        )}
      </div>
    </div>
  );
}

export function SaveExportDashboard() {
  const [lastSaveTimestamp, setLastSaveTimestamp] = useState<number | null>(null);
  const currentScenarioId = useAppStore((state) => state.app.currentScenarioId);
  const currentScenario = useAppStore(
    (state) => state.scenarios.byId[state.app.currentScenarioId],
  );
  const assumptions = useAppStore((state) => state.assumptions.currentValues);
  const changedKeys = useAppStore((state) => state.assumptions.changedKeys);
  const saveScenario = useAppStore((state) => state.saveScenario);
  const runState = useModelStore((state) => state.runState);
  const rawResults = useModelStore(
    (state) => state.lastSuccessfulResults ?? state.results,
  );
  const integrated = useModelStore(
    (state) => state.lastSuccessfulIntegrated ?? state.integrated,
  );
  const hasSuccessfulCalculation = useModelStore(
    (state) => state.hasSuccessfulCalculation,
  );
  const lastCalculatedAt = useModelStore((state) => state.lastCalculatedAt);
  const results = rawResults ?? [];

  const scenarioName = currentScenario?.name ?? 'Current scenario';
  const scenarioSlug = slugifyFilename(scenarioName);
  const hasUnsavedScenarioChanges =
    currentScenario?.kind === 'saved' ? currentScenario.isDirty : changedKeys.length > 0;
  const validationReport = useMemo(() => buildValidationReport(), []);
  const validationJsonArtifact = useMemo(
    () => buildValidationJsonArtifact(validationReport),
    [validationReport],
  );
  const validationMarkdownArtifact = useMemo(
    () => buildValidationMarkdownArtifact(validationReport),
    [validationReport],
  );
  const scenarioSnapshotArtifact = useMemo(
    () =>
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          scenario: {
            id: currentScenarioId,
            name: scenarioName,
            kind: currentScenario?.kind ?? 'base',
            probability: currentScenario?.probability ?? 0,
            isDirty: hasUnsavedScenarioChanges,
            changedAssumptionCount: changedKeys.length,
          },
          assumptions,
        },
        null,
        2,
      ),
    [
      assumptions,
      changedKeys.length,
      currentScenario?.kind,
      currentScenario?.probability,
      currentScenarioId,
      hasUnsavedScenarioChanges,
      scenarioName,
    ],
  );
  const reportPackArtifact = useMemo(() => {
    if (!hasSuccessfulCalculation || !integrated || results.length === 0) {
      return null;
    }

    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        scenario: {
          id: currentScenarioId,
          name: scenarioName,
          kind: currentScenario?.kind ?? 'base',
          probability: currentScenario?.probability ?? 0,
        },
        calculation: {
          runState,
          lastCalculatedAt: lastCalculatedAt ? new Date(lastCalculatedAt).toISOString() : null,
        },
        fleetHeadlineMetrics: results,
        platformKpis: integrated.platform.kpis,
        energyKpis: integrated.energy.kpis,
        consolidatedKpis: integrated.consolidated.kpis,
        validation: {
          gateStatus: validationReport.gateStatus,
          fitToProceed: validationReport.fitToProceed,
          verdict: validationReport.verdict,
          passedTargets: validationReport.outputs.passedTargets,
          totalTargets: validationReport.outputs.totalTargets,
          unexpectedVariances: validationReport.outputs.unexpectedVariances.length,
        },
      },
      null,
      2,
    );
  }, [
    currentScenario?.kind,
    currentScenario?.probability,
    currentScenarioId,
    hasSuccessfulCalculation,
    integrated,
    lastCalculatedAt,
    results,
    runState,
    scenarioName,
    validationReport,
  ]);
  const runSummaryArtifact = useMemo(() => {
    if (!hasSuccessfulCalculation || !integrated || results.length === 0) {
      return null;
    }

    return buildRunSummaryMarkdown({
      generatedAt: new Date().toISOString(),
      lastCalculatedAt,
      scenarioName,
      results,
      platformKpis: integrated.platform.kpis,
      energyKpis: integrated.energy.kpis,
      consolidatedKpis: integrated.consolidated.kpis,
      validationGate: validationReport.gateStatus,
      validationVerdict: validationReport.verdict,
    });
  }, [
    hasSuccessfulCalculation,
    integrated,
    lastCalculatedAt,
    results,
    scenarioName,
    validationReport.gateStatus,
    validationReport.verdict,
  ]);

  return (
    <div className="space-y-6" data-testid="save-export-page">
      <section className="rounded-3xl border border-app-border bg-app-panel p-6 shadow-panel">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-app-subtle">
              Save And Export
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-app-text">Save / Export</h1>
            <p className="mt-3 text-sm leading-6 text-app-subtle">
              Save the current scenario state and export investor-facing artifacts from
              the latest successful run.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={hasSuccessfulCalculation ? 'success' : 'warning'}>
              {hasSuccessfulCalculation ? 'Exports ready' : 'Run required'}
            </StatusBadge>
            <StatusBadge tone={hasUnsavedScenarioChanges ? 'warning' : 'neutral'}>
              {hasUnsavedScenarioChanges ? 'Unsaved changes' : 'Scenario saved'}
            </StatusBadge>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-app-border bg-app-bg/75 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-app-subtle">
              Active scenario
            </p>
            <p className="mt-2 text-2xl font-semibold text-app-text">{scenarioName}</p>
          </div>
          <div className="rounded-2xl border border-app-border bg-app-bg/75 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-app-subtle">Run status</p>
            <p className="mt-2 text-2xl font-semibold capitalize text-app-text">{runState}</p>
          </div>
          <div className="rounded-2xl border border-app-border bg-app-bg/75 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-app-subtle">
              Last calculation
            </p>
            <p className="mt-2 text-sm font-semibold text-app-text">
              {formatTimestamp(lastCalculatedAt)}
            </p>
          </div>
          <div className="rounded-2xl border border-app-border bg-app-bg/75 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-app-subtle">
              Changed assumptions
            </p>
            <p className="mt-2 text-2xl font-semibold text-app-text">{changedKeys.length}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-xl border border-app-border bg-app-bg px-4 py-2 text-sm font-medium text-app-text transition hover:bg-app-muted/70"
            onClick={() => {
              const savedId = saveScenario();
              if (savedId) {
                setLastSaveTimestamp(Date.now());
              }
            }}
            data-testid="save-export-save-scenario"
          >
            {currentScenario?.kind === 'saved' ? 'Save current scenario' : 'Save as scenario'}
          </button>
          <p className="text-sm text-app-subtle">
            {lastSaveTimestamp
              ? `Scenario snapshot saved at ${formatTimestamp(lastSaveTimestamp)}.`
              : currentScenario?.kind === 'saved'
                ? 'Use this to persist the current working assumptions back into the active scenario.'
                : 'Use this to create a saved scenario from the current working assumptions.'}
          </p>
        </div>
      </section>

      <RunStateAlert />

      {!hasSuccessfulCalculation ? (
        <AlertBanner
          title="Run the model to unlock report exports"
          message="Scenario assumptions can already be downloaded, but report-pack and markdown summary exports appear only after the first successful calculation."
          tone="warning"
        />
      ) : null}

      <SectionAccordion
        title="Scenario And Run Exports"
        description="Download the current assumptions bundle plus report artifacts derived from the latest successful model run."
        defaultOpen
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <ExportCard
            title="Scenario assumptions JSON"
            description="Portable snapshot of the current scenario metadata and full assumption set."
            href={downloadHref(scenarioSnapshotArtifact, 'application/json')}
            download={`a2-model-${scenarioSlug}-assumptions.json`}
            buttonLabel="Download JSON"
            testId="save-export-scenario-download"
          />
          <ExportCard
            title="Run summary markdown"
            description="Narrative report with fleet, platform, energy, and consolidated headline KPIs plus the validation verdict."
            href={
              runSummaryArtifact
                ? downloadHref(runSummaryArtifact, 'text/markdown')
                : undefined
            }
            download={
              runSummaryArtifact ? `a2-model-${scenarioSlug}-summary.md` : undefined
            }
            buttonLabel={
              runSummaryArtifact ? 'Download Markdown' : 'Available after calculation'
            }
            testId="save-export-summary-download"
          />
          <ExportCard
            title="Model report pack JSON"
            description="Structured export of scenario metadata, headline metrics, integrated KPI packs, and validation status."
            href={
              reportPackArtifact
                ? downloadHref(reportPackArtifact, 'application/json')
                : undefined
            }
            download={
              reportPackArtifact ? `a2-model-${scenarioSlug}-report-pack.json` : undefined
            }
            buttonLabel={
              reportPackArtifact ? 'Download JSON' : 'Available after calculation'
            }
            testId="save-export-report-pack-download"
          />
          <ExportCard
            title="Validation report markdown"
            description="Baseline workbook reconciliation report for audit trail and investor diligence packs."
            href={downloadHref(validationMarkdownArtifact, 'text/markdown')}
            download="a2-fleet-validation-report.md"
            buttonLabel="Download Markdown"
            testId="save-export-validation-markdown-download"
          />
        </div>
      </SectionAccordion>

      <SectionAccordion
        title="Validation Artifacts"
        description="Direct downloads of the validation reconciliation package in both machine-readable and human-readable formats."
        defaultOpen={false}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <ExportCard
            title="Validation report JSON"
            description="Current reconciliation report in JSON format for downstream tooling or archival."
            href={downloadHref(validationJsonArtifact, 'application/json')}
            download="a2-fleet-validation-report.json"
            buttonLabel="Download JSON"
            testId="save-export-validation-json-download"
          />
          <ExportCard
            title="Validation report markdown"
            description="Human-readable markdown version of the workbook replication validation report."
            href={downloadHref(validationMarkdownArtifact, 'text/markdown')}
            download="a2-fleet-validation-report.md"
            buttonLabel="Download Markdown"
            testId="save-export-validation-markdown-download-secondary"
          />
        </div>
      </SectionAccordion>
    </div>
  );
}
