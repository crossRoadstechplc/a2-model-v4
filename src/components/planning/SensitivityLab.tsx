import { useMemo, useState } from 'react';
import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';
import { useAppStore } from '../../store/appStore';
import { SectionAccordion } from '../ui/SectionAccordion';
import { StatusBadge } from '../ui/StatusBadge';
import { EmptyState } from '../ui/EmptyState';
import {
  calculateOneWaySensitivity,
  calculateTornadoSensitivity,
  calculateTwoWaySensitivity,
} from '../../model/sensitivity';
import { formatDisplayValue } from '../model/formatters';
import { kpiTargetDefinitions } from '../../model/analysisTargets';

const defaultShocks = [-20, -10, 0, 10, 20];

export function SensitivityLab() {
  const hasSuccessfulCalculation = useAppStore(
    (state) => state.app.hasSuccessfulCalculation,
  );
  const currentValues = useAppStore((state) => state.assumptions.currentValues);
  const metadata = useAppStore((state) => state.assumptions.metadata);
  const { displayCurrency, fxRate } = useDisplayCurrency();

  const candidates = metadata.filter((item) =>
    ['global', 'fleet', 'platform', 'energy', 'financing', 'tax_fx', 'timing'].includes(
      item.groupId,
    ),
  );
  const [targetId, setTargetId] = useState('consolidated_revenue');
  const [oneWayKey, setOneWayKey] = useState(
    'a2_fleet.number_of_trucks.cy_2027',
  );
  const [xKey, setXKey] = useState('integrated.platform.fee_per_swap_usd');
  const [yKey, setYKey] = useState('integrated.energy.pack_cost_usd');
  const target =
    kpiTargetDefinitions.find((item) => item.id === targetId) ?? kpiTargetDefinitions[0];

  const oneWay = useMemo(
    () =>
      hasSuccessfulCalculation
        ? calculateOneWaySensitivity({
            baseValues: currentValues,
            variableKey: oneWayKey,
            target,
            shocks: defaultShocks,
          })
        : null,
    [currentValues, hasSuccessfulCalculation, oneWayKey, target],
  );
  const twoWay = useMemo(
    () =>
      hasSuccessfulCalculation
        ? calculateTwoWaySensitivity({
            baseValues: currentValues,
            xKey,
            yKey,
            target,
            shocks: [-15, 0, 15],
          })
        : [],
    [currentValues, hasSuccessfulCalculation, target, xKey, yKey],
  );
  const tornado = useMemo(
    () =>
      hasSuccessfulCalculation
        ? calculateTornadoSensitivity({
            baseValues: currentValues,
            variableKeys: candidates.slice(0, 6).map((item) => item.key),
            target,
            shockPct: 10,
          })
        : [],
    [candidates, currentValues, hasSuccessfulCalculation, target],
  );

  const bestPoint = oneWay
    ? oneWay.points.reduce((best, current) =>
        current.kpiValue > best.kpiValue ? current : best,
      )
    : null;
  const worstPoint = oneWay
    ? oneWay.points.reduce((worst, current) =>
        current.kpiValue < worst.kpiValue ? current : worst,
      )
    : null;
  const range = bestPoint && worstPoint ? bestPoint.kpiValue - worstPoint.kpiValue : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-app-border bg-app-panel p-6 shadow-panel">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-app-subtle">
              Sensitivity Lab
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-app-text">
              Sensitivities
            </h1>
            <p className="mt-3 text-sm leading-6 text-app-subtle">
              One-way, two-way, and tornado views for user-selected variables and KPI targets.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="accent">{target.label}</StatusBadge>
            <StatusBadge tone="neutral">{candidates.length} variables available</StatusBadge>
          </div>
        </div>
      </section>

      {!hasSuccessfulCalculation ? (
        <EmptyState
          title="Run the model to unlock sensitivity analysis"
          description="Sensitivity outputs use the current assumption state as the base case. Calculate once, then return here to explore one-way and two-way impacts."
        />
      ) : (
        <>
          <SectionAccordion
            title="Sensitivity Controls"
            description="Choose KPI targets and variables before reviewing the analysis outputs."
            defaultOpen
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">
                  KPI target
                </label>
                <select
                  value={targetId}
                  onChange={(event) => setTargetId(event.target.value)}
                  className="w-full rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none transition focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
                  data-testid="sensitivity-target-select"
                >
                  {kpiTargetDefinitions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">
                  One-way variable
                </label>
                <select
                  value={oneWayKey}
                  onChange={(event) => setOneWayKey(event.target.value)}
                  className="w-full rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none transition focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
                  data-testid="sensitivity-oneway-select"
                >
                  {candidates.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">
                  Two-way variables
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    value={xKey}
                    onChange={(event) => setXKey(event.target.value)}
                    className="w-full rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none transition focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
                    data-testid="sensitivity-x-select"
                  >
                    {candidates.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={yKey}
                    onChange={(event) => setYKey(event.target.value)}
                    className="w-full rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none transition focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
                    data-testid="sensitivity-y-select"
                  >
                    {candidates.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </SectionAccordion>

          <SectionAccordion
            title="Summary Cards"
            description="At-a-glance readout for the currently selected one-way sweep."
            defaultOpen
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                ['Base', oneWay?.baseKpiValue ?? 0],
                ['Best case', bestPoint?.kpiValue ?? 0],
                ['Worst case', worstPoint?.kpiValue ?? 0],
                ['Range', range],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-2xl border border-app-border bg-app-bg/75 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-app-subtle">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-app-text">
                    {formatDisplayValue(Number(value), target.format, {
                      displayCurrency,
                      fxRate,
                    })}
                  </p>
                </div>
              ))}
            </div>
          </SectionAccordion>

          <SectionAccordion
            title="One-Way Sensitivity"
            description="KPI response to a single variable shock around the current case."
            defaultOpen
          >
            <div className="rounded-2xl border border-app-border bg-app-panel/80 p-4">
              <div className="space-y-3" data-testid="oneway-sensitivity-panel">
                {oneWay?.points.map((point) => (
                  <div key={point.shockPct} className="grid gap-3 md:grid-cols-[6rem_1fr_8rem] md:items-center">
                    <p className="text-sm font-medium text-app-text">{point.shockPct}%</p>
                    <div className="h-3 rounded-full bg-app-muted/60">
                      <div
                        className="h-3 rounded-full bg-app-accent"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              8,
                              (Math.abs(point.kpiValue) /
                                Math.max(Math.abs(bestPoint?.kpiValue ?? 0), 0.0001)) *
                                100,
                            ),
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-right text-sm font-semibold text-app-text">
                      {formatDisplayValue(point.kpiValue, target.format, {
                        displayCurrency,
                        fxRate,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </SectionAccordion>

          <SectionAccordion
            title="Two-Way Matrix"
            description="Matrix view for two selected variables against the current KPI target."
            defaultOpen={false}
          >
            <div className="overflow-x-auto rounded-2xl border border-app-border bg-app-panel/80">
              <table className="min-w-full text-sm" data-testid="two-way-matrix">
                <thead>
                  <tr className="border-b border-app-border bg-app-bg/60">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-app-subtle">
                      Y \ X
                    </th>
                    {[-15, 0, 15].map((shock) => (
                      <th
                        key={shock}
                        className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-app-subtle"
                      >
                        {shock}%
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {twoWay.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-app-border/70 last:border-b-0">
                      <th className="px-4 py-3 text-left font-medium text-app-text">
                        {row[0]?.yShockPct ?? 0}%
                      </th>
                      {row.map((cell) => (
                        <td key={`${cell.xShockPct}-${cell.yShockPct}`} className="px-4 py-3 text-right font-mono text-xs text-app-text">
                          {formatDisplayValue(cell.value, target.format, {
                            displayCurrency,
                            fxRate,
                          })}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionAccordion>

          <SectionAccordion
            title="Tornado Chart"
            description="Largest +/-10% variable impacts for the selected KPI target."
            defaultOpen
          >
            <div className="space-y-3" data-testid="tornado-chart">
              {tornado.map((bar) => {
                const metadata = candidates.find((item) => item.key === bar.variableKey);
                return (
                  <div
                    key={bar.variableKey}
                    className="rounded-2xl border border-app-border bg-app-bg/75 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-app-text">
                        {metadata?.label ?? bar.variableKey}
                      </p>
                      <StatusBadge tone="neutral">
                        {formatDisplayValue(bar.maxAbsDelta, target.format, {
                          displayCurrency,
                          fxRate,
                        })}
                      </StatusBadge>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <p className="text-sm text-app-subtle">
                        Downside:{' '}
                        {formatDisplayValue(bar.lowDelta, target.format, {
                          displayCurrency,
                          fxRate,
                        })}
                      </p>
                      <p className="text-sm text-app-subtle">
                        Upside:{' '}
                        {formatDisplayValue(bar.highDelta, target.format, {
                          displayCurrency,
                          fxRate,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionAccordion>
        </>
      )}
    </div>
  );
}
