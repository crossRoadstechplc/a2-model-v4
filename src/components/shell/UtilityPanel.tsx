import { useMemo } from 'react';
import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';
import { useUIStore } from '../../store/uiStore';
import { useAppStore } from '../../store/appStore';
import { useModelStore } from '../../store/modelStore';
import { cn } from '../../lib/cn';
import { AlertBanner } from '../ui/AlertBanner';
import { SectionAccordion } from '../ui/SectionAccordion';
import { StatusBadge } from '../ui/StatusBadge';
import { formatDisplayValue } from '../model/formatters';
import { buildIntegrityChecks, groupIntegrityChecks } from '../../model/integrity';
import {
  buildAssumptionDependencySummary,
  buildFormulaTrace,
  buildKpiExplanation,
  buildSelectedAssumptionImpact,
} from '../../model/utilityInsights';
import { buildPlatformCapacitySummary } from '../model/platformCapacityViewModel';

export function UtilityPanel() {
  const isOpen = useUIStore((state) => state.isUtilityPanelOpen);
  const runState = useModelStore((state) => state.runState);
  const changedAssumptionIds = useModelStore((state) => state.changedAssumptionIds);
  const workbook = useModelStore((state) => state.workbook);
  const integrated = useModelStore((state) => state.integrated);
  const hasSuccessfulCalculation = useModelStore(
    (state) => state.hasSuccessfulCalculation,
  );
  const selectedAssumptionKey = useModelStore((state) => state.selectedAssumptionKey);
  const selectedKpiId = useModelStore((state) => state.selectedKpiId);
  const currentValues = useAppStore((state) => state.assumptions.currentValues);
  const baseValues = useAppStore((state) => state.assumptions.baseValues);
  const metadataByKey = useAppStore((state) => state.assumptions.metadataByKey);
  const { displayCurrency, fxRate } = useDisplayCurrency();

  const integritySummary = useMemo(() => {
    const checks = buildIntegrityChecks({
      runState,
      hasSuccessfulCalculation,
      workbook,
      integrated,
    });

    return {
      checks,
      groups: groupIntegrityChecks(checks),
    };
  }, [hasSuccessfulCalculation, integrated, runState, workbook]);

  const kpiExplanation = useMemo(
    () => buildKpiExplanation(selectedKpiId),
    [selectedKpiId],
  );
  const formulaTrace = useMemo(
    () => buildFormulaTrace(selectedKpiId),
    [selectedKpiId],
  );
  const dependencySummary = useMemo(
    () => buildAssumptionDependencySummary(metadataByKey, selectedAssumptionKey),
    [metadataByKey, selectedAssumptionKey],
  );
  const assumptionImpact = useMemo(
    () =>
      buildSelectedAssumptionImpact({
        assumptionKey: selectedAssumptionKey,
        selectedKpiId,
        metadataByKey,
        currentValues,
        baseValues,
        displayCurrency,
        fxRate,
      }),
    [
      baseValues,
      currentValues,
      displayCurrency,
      fxRate,
      metadataByKey,
      selectedAssumptionKey,
      selectedKpiId,
    ],
  );
  const platformCapacitySummary = useMemo(
    () => (integrated ? buildPlatformCapacitySummary(integrated.platform.capacity) : null),
    [integrated],
  );

  return (
    <aside
      className={cn(
        'hidden shrink-0 border-l border-app-border bg-app-panel transition-[width,opacity] duration-300 xl:flex',
        isOpen ? 'w-[22rem] opacity-100' : 'w-0 border-l-0 opacity-0',
      )}
      data-testid="utility-panel"
      data-state={isOpen ? 'open' : 'closed'}
    >
      {isOpen ? (
        <div className="w-[22rem] space-y-4 overflow-y-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-app-subtle">
                Utility Panel
              </p>
              <h2 className="mt-1 text-base font-semibold text-app-text">
                Model explanation
              </h2>
            </div>
            <StatusBadge tone={runState === 'ready' ? 'success' : 'warning'}>
              {runState}
            </StatusBadge>
          </div>

          <AlertBanner
            title="Review surfaces"
            message="Formula trace, dependency notes, KPI context, and integrity signals are grouped here so the assumptions sidebar can stay visible while you work."
            tone="info"
          />

          <SectionAccordion
            title="Integrity Snapshot"
            description="Grouped severity counts from the current visible model state."
          >
            <div className="grid gap-3">
              {[
                ['critical', integritySummary.groups.critical.length, 'warning'],
                ['warning', integritySummary.groups.warning.length, 'warning'],
                ['info', integritySummary.groups.info.length, 'neutral'],
              ].map(([label, count, tone]) => (
                <div
                  key={String(label)}
                  className="rounded-2xl border border-app-border bg-app-muted/50 p-3"
                  data-testid={`utility-severity-${label}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-app-subtle">
                      {label}
                    </p>
                    <StatusBadge tone={tone as 'warning' | 'neutral'}>{count}</StatusBadge>
                  </div>
                </div>
              ))}
              <p className="text-sm text-app-subtle">
                {changedAssumptionIds.length} assumption changes are currently pending or reflected in the visible state.
              </p>
            </div>
          </SectionAccordion>

          <SectionAccordion
            title="Platform Capacity"
            description="Latest generated truck-band lookup from the platform sizing module."
            defaultOpen={false}
          >
            {platformCapacitySummary ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-app-border bg-app-muted/50 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-app-subtle">
                    Current band
                  </p>
                  <p className="mt-2 text-sm font-semibold text-app-text">
                    {platformCapacitySummary.bandLabel}
                  </p>
                  <p className="mt-2 text-sm text-app-subtle">{platformCapacitySummary.period}</p>
                </div>
                <div className="rounded-2xl border border-app-border bg-app-muted/50 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-app-subtle">
                    Lookup status
                  </p>
                  <p className="mt-2 text-sm font-semibold text-app-text">
                    {platformCapacitySummary.status}
                  </p>
                  <p className="mt-2 text-sm text-app-subtle">
                    {platformCapacitySummary.message}
                  </p>
                </div>
                <div className="rounded-2xl border border-app-border bg-app-muted/50 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-app-subtle">
                    Utilization
                  </p>
                  <p className="mt-2 text-sm text-app-text">
                    Swap{' '}
                    {platformCapacitySummary.swapUtilization === null
                      ? 'N/A'
                      : `${(platformCapacitySummary.swapUtilization * 100).toFixed(1)}%`}
                  </p>
                  <p className="mt-1 text-sm text-app-text">
                    Charge{' '}
                    {platformCapacitySummary.chargeUtilization === null
                      ? 'N/A'
                      : `${(platformCapacitySummary.chargeUtilization * 100).toFixed(1)}%`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-app-border bg-app-muted/50 p-3 text-sm text-app-subtle">
                Run the integrated model to view the generated platform capacity band lookup.
              </div>
            )}
          </SectionAccordion>

          <SectionAccordion
            title="Selected KPI"
            description="Explanation and current context for the highlighted KPI card."
            defaultOpen
          >
            {kpiExplanation ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-app-border bg-app-muted/50 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-app-subtle">
                    KPI
                  </p>
                  <p className="mt-2 text-sm font-semibold text-app-text">
                    {kpiExplanation.label}
                  </p>
                  <p className="mt-2 text-sm text-app-subtle">{kpiExplanation.description}</p>
                </div>
                {assumptionImpact ? (
                  <div className="rounded-2xl border border-app-border bg-app-muted/50 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-app-subtle">
                      Impact target
                    </p>
                    <p className="mt-2 text-sm font-semibold text-app-text">
                      {assumptionImpact.targetLabel}
                    </p>
                    <p className="mt-2 text-sm text-app-subtle">
                      Current reference value{' '}
                      {formatDisplayValue(
                        assumptionImpact.currentKpiValue,
                        kpiExplanation.format,
                        {
                          displayCurrency,
                          fxRate,
                        },
                      )}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-app-border bg-app-muted/50 p-3 text-sm text-app-subtle">
                Select a KPI card to view its explanation and trace.
              </div>
            )}
          </SectionAccordion>

          <SectionAccordion
            title="Formula Trace"
            description="High-level dependency chain for the selected KPI."
            defaultOpen={false}
          >
            {formulaTrace.length > 0 ? (
              <ol className="space-y-2 text-sm text-app-subtle">
                {formulaTrace.map((step, index) => (
                  <li
                    key={step}
                    className="rounded-2xl border border-app-border bg-app-muted/50 p-3"
                  >
                    <span className="text-xs uppercase tracking-[0.18em] text-app-subtle">
                      Step {index + 1}
                    </span>
                    <p className="mt-2 text-sm font-medium text-app-text">{step}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="rounded-2xl border border-app-border bg-app-muted/50 p-3 text-sm text-app-subtle">
                No KPI trace is selected yet.
              </div>
            )}
          </SectionAccordion>

          <SectionAccordion
            title="Dependency Summary"
            description="Metadata summary for the selected assumption field."
            defaultOpen
          >
            {dependencySummary ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-app-border bg-app-muted/50 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-app-subtle">
                    Assumption
                  </p>
                  <p className="mt-2 text-sm font-semibold text-app-text">
                    {dependencySummary.label}
                  </p>
                </div>
                <div className="rounded-2xl border border-app-border bg-app-muted/50 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-app-subtle">
                    Group / dependency
                  </p>
                  <p className="mt-2 text-sm text-app-text">
                    {dependencySummary.groupId} / {dependencySummary.dependencyTag}
                  </p>
                </div>
                <div className="rounded-2xl border border-app-border bg-app-muted/50 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-app-subtle">
                    Helper
                  </p>
                  <p className="mt-2 text-sm text-app-subtle">
                    {dependencySummary.helperText}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-app-border bg-app-muted/50 p-3 text-sm text-app-subtle">
                Select an assumption field to view its dependency summary.
              </div>
            )}
          </SectionAccordion>

          <SectionAccordion
            title="Assumption Impact"
            description="Quick +/-10% impact shell for the selected assumption against the selected KPI."
            defaultOpen={false}
          >
            {assumptionImpact && kpiExplanation ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-app-border bg-app-muted/50 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-app-subtle">
                    Current vs base
                  </p>
                  <p className="mt-2 text-sm text-app-text">
                    {assumptionImpact.currentLabel} vs {assumptionImpact.baseLabel}
                  </p>
                </div>
                <div className="rounded-2xl border border-app-border bg-app-muted/50 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-app-subtle">
                    Downside shock
                  </p>
                  <p className="mt-2 text-sm text-app-text">
                    {formatDisplayValue(
                      assumptionImpact.lowKpiValue,
                      kpiExplanation.format,
                      {
                        displayCurrency,
                        fxRate,
                      },
                    )}
                  </p>
                </div>
                <div className="rounded-2xl border border-app-border bg-app-muted/50 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-app-subtle">
                    Upside shock
                  </p>
                  <p className="mt-2 text-sm text-app-text">
                    {formatDisplayValue(
                      assumptionImpact.highKpiValue,
                      kpiExplanation.format,
                      {
                        displayCurrency,
                        fxRate,
                      },
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-app-border bg-app-muted/50 p-3 text-sm text-app-subtle">
                Select an assumption and a KPI to view a quick impact summary.
              </div>
            )}
          </SectionAccordion>
        </div>
      ) : null}
    </aside>
  );
}
