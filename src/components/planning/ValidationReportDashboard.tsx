import { useMemo, useState } from 'react';
import { AlertBanner } from '../ui/AlertBanner';
import { SectionAccordion } from '../ui/SectionAccordion';
import { StatusBadge } from '../ui/StatusBadge';
import {
  buildValidationReport,
  type OutputReconciliationItem,
  type ValidationGateStatus,
} from '../../model/validation';

function formatNumber(value: number) {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: Math.abs(value) >= 100 ? 2 : 6,
  }).format(value);
}

function formatAvailability(status: 'available' | 'referenced' | 'missing') {
  if (status === 'available') {
    return 'Available';
  }

  if (status === 'missing') {
    return 'Missing';
  }

  return 'Referenced';
}

function gateTone(status: ValidationGateStatus) {
  return status === 'pass' ? 'success' : 'warning';
}

function OutputVarianceCard({ item }: { item: OutputReconciliationItem }) {
  return (
    <div
      className="rounded-2xl border border-app-border bg-app-bg/75 p-4"
      data-testid={`validation-output-card-${item.targetKey}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-subtle">
            {item.sectionTitle}
          </p>
          <h3 className="mt-2 text-sm font-semibold text-app-text">{item.targetLabel}</h3>
          <p className="mt-1 text-xs text-app-subtle">
            {item.sheet.trim()} row {item.row}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={item.withinTolerance ? 'success' : 'warning'}>
            {item.withinTolerance ? 'Pass' : 'Fail'}
          </StatusBadge>
          {item.knownAnomalyRelated ? (
            <StatusBadge tone="warning">Known quirk</StatusBadge>
          ) : null}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.16em] text-app-subtle">
              <th className="border-b border-app-border px-3 py-2 font-medium">Period</th>
              <th className="border-b border-app-border px-3 py-2 font-medium">Reference</th>
              <th className="border-b border-app-border px-3 py-2 font-medium">App</th>
              <th className="border-b border-app-border px-3 py-2 font-medium">Abs variance</th>
              <th className="border-b border-app-border px-3 py-2 font-medium">Rel variance</th>
            </tr>
          </thead>
          <tbody>
            {item.periods.map((period) => (
              <tr key={`${item.targetKey}-${period.period}`}>
                <td className="border-b border-app-border/60 px-3 py-2 text-app-text">
                  {period.period}
                </td>
                <td className="border-b border-app-border/60 px-3 py-2 text-app-text">
                  {formatNumber(period.expected)}
                </td>
                <td className="border-b border-app-border/60 px-3 py-2 text-app-text">
                  {formatNumber(period.actual)}
                </td>
                <td className="border-b border-app-border/60 px-3 py-2 text-app-text">
                  {formatNumber(period.absoluteVariance)}
                </td>
                <td className="border-b border-app-border/60 px-3 py-2 text-app-text">
                  {formatNumber(period.relativeVariance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ValidationReportDashboard() {
  const [runVersion, setRunVersion] = useState(0);

  const report = useMemo(
    () => buildValidationReport(),
    [runVersion],
  );

  return (
    <div className="space-y-6" data-testid="validation-report-page">
      <section className="rounded-3xl border border-app-border bg-app-panel p-6 shadow-panel">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-app-subtle">
              Workbook Validation
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-app-text">
              Validation Report
            </h1>
            <p className="mt-3 text-sm leading-6 text-app-subtle">
              Baseline reconciliation between the coded charging / platform model
              and the workbook reference set in /Docs.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div data-testid="validation-gate-badge">
              <StatusBadge tone={gateTone(report.gateStatus)}>
                {report.gateStatus}
              </StatusBadge>
            </div>
            <button
              type="button"
              className="rounded-xl border border-app-border bg-app-bg px-4 py-2 text-sm font-medium text-app-text transition hover:bg-app-muted/70"
              onClick={() => setRunVersion((value) => value + 1)}
              data-testid="validation-refresh-button"
            >
              Refresh validation
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-app-border bg-app-bg/75 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-app-subtle">Gate</p>
            <p
              className="mt-2 text-2xl font-semibold text-app-text"
              data-testid="validation-fit-summary"
            >
              {report.fitToProceed ? 'Fit to proceed' : 'Not fit to proceed'}
            </p>
          </div>
          <div className="rounded-2xl border border-app-border bg-app-bg/75 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-app-subtle">
              Assumption matches
            </p>
            <p
              className="mt-2 text-2xl font-semibold text-app-text"
              data-testid="validation-assumptions-matched-count"
            >
              {report.assumptions.matched.length}
            </p>
          </div>
          <div className="rounded-2xl border border-app-border bg-app-bg/75 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-app-subtle">
              Output targets passed
            </p>
            <p
              className="mt-2 text-2xl font-semibold text-app-text"
              data-testid="validation-outputs-passed-count"
            >
              {report.outputs.passedTargets}
            </p>
          </div>
          <div className="rounded-2xl border border-app-border bg-app-bg/75 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-app-subtle">
              Unexpected variances
            </p>
            <p className="mt-2 text-2xl font-semibold text-app-text">
              {report.outputs.unexpectedVariances.length}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <AlertBanner
            title={
              report.fitToProceed
                ? 'Workbook replication baseline passed'
                : 'Workbook replication baseline failed'
            }
            message={report.verdict}
            tone={report.fitToProceed ? 'info' : 'warning'}
          />
        </div>
      </section>

      <SectionAccordion
        title="Reference Sources"
        description="Source artifacts used for this validation pass and any availability notes."
        defaultOpen
      >
        <div className="grid gap-3">
          {report.referenceSources.map((source) => (
            <div
              key={source.id}
              className="rounded-2xl border border-app-border bg-app-bg/75 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-app-text">{source.label}</h3>
                  <p className="mt-1 text-sm text-app-subtle">{source.path}</p>
                </div>
                <StatusBadge
                  tone={
                    source.availability === 'missing'
                      ? 'warning'
                      : source.availability === 'available'
                        ? 'success'
                        : 'neutral'
                  }
                >
                  {formatAvailability(source.availability)}
                </StatusBadge>
              </div>
              {source.note ? (
                <p className="mt-3 text-sm leading-6 text-app-subtle">{source.note}</p>
              ) : null}
            </div>
          ))}
        </div>
      </SectionAccordion>

      <SectionAccordion
        title="Base Assumptions Reconciliation"
        description="Compares workbook-backed base inputs in the app against the reference contract and shows normalization mappings."
        defaultOpen
        meta={<StatusBadge tone={report.assumptions.mismatched.length > 0 ? 'warning' : 'success'}>{report.assumptions.matched.length} matched</StatusBadge>}
      >
        <div className="grid gap-4 md:grid-cols-5">
          {[
            ['Matched', report.assumptions.matched.length],
            ['Missing in app', report.assumptions.missingInApp.length],
            ['Missing in reference', report.assumptions.missingInReference.length],
            ['Mismatched', report.assumptions.mismatched.length],
            ['Normalized', report.assumptions.transformed.length],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-app-border bg-app-bg/75 p-4"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-app-subtle">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-app-text">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-app-border bg-app-bg/75 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-app-text">Matched assumptions</h3>
              <StatusBadge tone="success">{report.assumptions.matched.length}</StatusBadge>
            </div>
            <div className="mt-4 max-h-[28rem] overflow-auto">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.16em] text-app-subtle">
                    <th className="border-b border-app-border px-3 py-2 font-medium">Key</th>
                    <th className="border-b border-app-border px-3 py-2 font-medium">Cell</th>
                    <th className="border-b border-app-border px-3 py-2 font-medium">Reference</th>
                    <th className="border-b border-app-border px-3 py-2 font-medium">App</th>
                  </tr>
                </thead>
                <tbody>
                  {report.assumptions.matched.map((item) => (
                    <tr key={`matched-${item.key}`}>
                      <td className="border-b border-app-border/60 px-3 py-2 text-app-text">
                        <div className="font-medium">{item.label}</div>
                        <div className="mt-1 text-xs text-app-subtle">{item.key}</div>
                      </td>
                      <td className="border-b border-app-border/60 px-3 py-2 text-app-text">
                        {item.sheet}!{item.cell}
                      </td>
                      <td className="border-b border-app-border/60 px-3 py-2 text-app-text">
                        {formatNumber(item.referenceValue)}
                      </td>
                      <td className="border-b border-app-border/60 px-3 py-2 text-app-text">
                        {formatNumber(item.appValue ?? Number.NaN)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-app-border bg-app-bg/75 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-app-text">
                Normalization transforms
              </h3>
              <StatusBadge tone="accent">{report.assumptions.transformed.length}</StatusBadge>
            </div>
            <p className="mt-2 text-sm leading-6 text-app-subtle">
              Stable assumption keys are normalized into workbook input coordinates
              before calculation. Values should be preserved across that mapping.
            </p>
            <div className="mt-4 max-h-[28rem] overflow-auto">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.16em] text-app-subtle">
                    <th className="border-b border-app-border px-3 py-2 font-medium">Key</th>
                    <th className="border-b border-app-border px-3 py-2 font-medium">Workbook</th>
                    <th className="border-b border-app-border px-3 py-2 font-medium">Preserved</th>
                  </tr>
                </thead>
                <tbody>
                  {report.assumptions.transformed.map((item) => (
                    <tr key={`transform-${item.key}`}>
                      <td className="border-b border-app-border/60 px-3 py-2 text-app-text">
                        <div className="font-medium">{item.label}</div>
                        <div className="mt-1 text-xs text-app-subtle">{item.key}</div>
                      </td>
                      <td className="border-b border-app-border/60 px-3 py-2 text-app-text">
                        {item.referenceCellId}
                      </td>
                      <td className="border-b border-app-border/60 px-3 py-2 text-app-text">
                        {item.valuePreserved ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {report.assumptions.missingInApp.length > 0 ||
        report.assumptions.missingInReference.length > 0 ||
        report.assumptions.mismatched.length > 0 ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            {[...report.assumptions.missingInApp, ...report.assumptions.missingInReference, ...report.assumptions.mismatched].map(
              (item) => (
                <div
                  key={`assumption-issue-${item.key ?? item.cell}`}
                  className="rounded-2xl border border-app-warning/20 bg-app-warning/10 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-app-text">{item.label}</h3>
                    <StatusBadge tone="warning">{item.status.replace(/_/g, ' ')}</StatusBadge>
                  </div>
                  <p className="mt-3 text-sm text-app-subtle">
                    {item.sheet}!{item.cell}
                  </p>
                  {item.note ? (
                    <p className="mt-2 text-sm leading-6 text-app-subtle">{item.note}</p>
                  ) : null}
                </div>
              ),
            )}
          </div>
        ) : null}
      </SectionAccordion>

      <SectionAccordion
        title="Baseline Output Reconciliation"
        description="Explicit workbook-target variance tables for revenue, statements, valuation, and key metrics."
        defaultOpen
        meta={
          <StatusBadge tone={report.outputs.failedTargets > 0 ? 'warning' : 'success'}>
            {report.outputs.passedTargets}/{report.outputs.totalTargets} pass
          </StatusBadge>
        }
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-app-border bg-app-bg/75 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-app-subtle">Tolerance</p>
            <p className="mt-2 text-sm font-semibold text-app-text">
              Abs {report.tolerances.outputs.absolute}
            </p>
            <p className="mt-1 text-sm text-app-subtle">
              Rel {report.tolerances.outputs.relative}
            </p>
          </div>
          <div className="rounded-2xl border border-app-border bg-app-bg/75 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-app-subtle">
              Passed targets
            </p>
            <p className="mt-2 text-2xl font-semibold text-app-text">
              {report.outputs.passedTargets}
            </p>
          </div>
          <div className="rounded-2xl border border-app-border bg-app-bg/75 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-app-subtle">
              Unexpected variances
            </p>
            <p className="mt-2 text-2xl font-semibold text-app-text">
              {report.outputs.unexpectedVariances.length}
            </p>
          </div>
          <div className="rounded-2xl border border-app-border bg-app-bg/75 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-app-subtle">
              Known-anomaly variances
            </p>
            <p className="mt-2 text-2xl font-semibold text-app-text">
              {report.outputs.knownAnomalyVariances.length}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4">
          {report.outputs.sections.map((item) => (
            <OutputVarianceCard key={item.targetKey} item={item} />
          ))}
        </div>
      </SectionAccordion>

      <SectionAccordion
        title="Known Workbook Quirks"
        description="Documented workbook behaviors and anomalies isolated from unexpected mismatches."
        defaultOpen={false}
        meta={<StatusBadge tone="neutral">{report.knownWorkbookQuirks.length}</StatusBadge>}
      >
        <div className="grid gap-3">
          {report.knownWorkbookQuirks.map((quirk, index) => (
            <div
              key={`quirk-${index + 1}`}
              className="rounded-2xl border border-app-border bg-app-bg/75 p-4"
            >
              <p className="text-sm leading-6 text-app-text">{quirk}</p>
            </div>
          ))}
        </div>
        {report.notes.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {report.notes.map((note, index) => (
              <AlertBanner
                key={`validation-note-${index + 1}`}
                title="Validation note"
                message={note}
                tone="info"
              />
            ))}
          </div>
        ) : null}
      </SectionAccordion>

    </div>
  );
}
