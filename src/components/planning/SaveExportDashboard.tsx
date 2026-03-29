import { useMemo, useState } from 'react';
import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';
import { RunStateAlert } from '../model/RunStateAlert';
import { AlertBanner } from '../ui/AlertBanner';
import { SectionAccordion } from '../ui/SectionAccordion';
import { StatusBadge } from '../ui/StatusBadge';
import { buildValidationReport } from '../../model/validation';
import { useAppStore } from '../../store/appStore';
import { useModelStore } from '../../store/modelStore';
import { buildRunSummaryPdf } from './pdfReport';

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 max-w-xl">
          <h3 className="text-sm font-semibold text-app-text">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-app-subtle">{description}</p>
        </div>
        {href && download ? (
          <a
            href={href}
            download={download}
            className={`${buttonClassName} w-full text-center sm:w-auto`}
            data-testid={testId}
          >
            {buttonLabel}
          </a>
        ) : (
          <span
            className="w-full rounded-xl border border-app-border bg-app-muted/40 px-3 py-2 text-center text-sm font-medium text-app-subtle sm:w-auto"
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
  const { displayCurrency, fxRate } = useDisplayCurrency();
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
  const workbook = useModelStore(
    (state) => state.lastSuccessfulWorkbook ?? state.workbook,
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
  const pdfSummaryArtifact = useMemo(() => {
    if (!hasSuccessfulCalculation || !integrated || !workbook || results.length === 0) {
      return null;
    }

    return buildRunSummaryPdf({
      generatedAt: new Date().toISOString(),
      lastCalculatedAt: formatTimestamp(lastCalculatedAt),
      scenarioName,
      validationGate: validationReport.gateStatus,
      validationVerdict: validationReport.verdict,
      displayCurrency,
      fxRate,
      assumptions,
      workbook,
      integrated,
      results,
      platformKpis: integrated.platform.kpis,
      energyKpis: integrated.energy.kpis,
      consolidatedKpis: integrated.consolidated.kpis,
    });
  }, [
    assumptions,
    displayCurrency,
    fxRate,
    hasSuccessfulCalculation,
    integrated,
    lastCalculatedAt,
    results,
    scenarioName,
    validationReport.gateStatus,
    validationReport.verdict,
    workbook,
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
          title="Run the model to unlock the PDF report"
          message="The detailed PDF export becomes available after the first successful calculation."
          tone="warning"
        />
      ) : null}

      <SectionAccordion
        title="PDF Report Export"
        description="Download a detailed PDF report derived from the latest successful model run."
        defaultOpen
      >
        <div className="grid gap-4">
          <ExportCard
            title="Readable report PDF"
            description="Detailed user-facing PDF with assumptions tables, financial statements, charts, validation status, and cross-module analysis from the latest successful run."
            href={
              pdfSummaryArtifact
                ? downloadHref(pdfSummaryArtifact, 'application/pdf')
                : undefined
            }
            download={
              pdfSummaryArtifact ? `a2-model-${scenarioSlug}-summary.pdf` : undefined
            }
            buttonLabel={pdfSummaryArtifact ? 'Download PDF' : 'Available after calculation'}
            testId="save-export-pdf-download"
          />
        </div>
      </SectionAccordion>
    </div>
  );
}
