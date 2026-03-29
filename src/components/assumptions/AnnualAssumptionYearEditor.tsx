import { useMemo, useState } from 'react';
import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';
import {
  convertValueForDisplay,
  convertValueFromDisplay,
  getDisplayUnit,
} from '../../model/displayCurrency';
import {
  formatAssumptionValue,
  getDisplayAssumptionLabel,
  hasChangedFromBase,
  formatNumber,
  type AssumptionMetadata,
} from '../../model/assumptions';
import { useAppStore } from '../../store/appStore';
import { NumericInput } from '../ui/NumericInput';
import { ChangedIndicator } from './ChangedIndicator';

type AnnualAssumptionYearEditorProps = {
  definitions: AssumptionMetadata[];
  context: 'sidebar' | 'page';
  seriesKey: string;
  seriesLabel: string;
};

function getYearFromDefinition(definition: AssumptionMetadata) {
  if (definition.workbook?.columnLabel === 'QUANTITY') {
    return Number.MIN_SAFE_INTEGER;
  }

  const keyMatch = definition.key.match(/cy_(\d{4})/i);
  if (keyMatch) {
    return Number(keyMatch[1]);
  }

  const labelMatch = definition.label.match(/CY-(\d{4})/i);
  if (labelMatch) {
    return Number(labelMatch[1]);
  }

  const workbookLabelMatch = definition.workbook?.columnLabel.match(/CY-(\d{4})/i);
  if (workbookLabelMatch) {
    return Number(workbookLabelMatch[1]);
  }

  return Number.MAX_SAFE_INTEGER;
}

function getSelectorOptionLabel(definition: AssumptionMetadata) {
  if (definition.workbook?.columnLabel === 'QUANTITY') {
    return 'Base';
  }

  return definition.workbook?.columnLabel ?? definition.shortLabel;
}

function formatPillValue(value: number, decimals: number) {
  return formatNumber(value, decimals);
}

export function AnnualAssumptionYearEditor({
  definitions,
  context,
  seriesKey,
  seriesLabel,
}: AnnualAssumptionYearEditorProps) {
  const sortedDefinitions = useMemo(
    () => [...definitions].sort((left, right) => getYearFromDefinition(left) - getYearFromDefinition(right)),
    [definitions],
  );
  const [selectedKey, setSelectedKey] = useState(sortedDefinitions[0]?.key ?? '');
  const selectedDefinition =
    sortedDefinitions.find((definition) => definition.key === selectedKey) ??
    sortedDefinitions[0];
  const currentValues = useAppStore((state) => state.assumptions.currentValues);
  const baseValues = useAppStore((state) => state.assumptions.baseValues);
  const setAssumption = useAppStore((state) => state.setAssumption);
  const selectedAssumptionKey = useAppStore((state) => state.ui.selectedAssumptionKey);
  const selectAssumption = useAppStore((state) => state.selectAssumption);
  const { displayCurrency, fxRate } = useDisplayCurrency();

  if (!selectedDefinition) {
    return null;
  }

  const selectedValue = currentValues[selectedDefinition.key];
  const displayValue = convertValueForDisplay(selectedValue, selectedDefinition.unit, {
    displayCurrency,
    fxRate,
  });
  const displayUnit = getDisplayUnit(selectedDefinition.unit, displayCurrency);
  const displayLabel = getDisplayAssumptionLabel(selectedDefinition, displayCurrency);
  const changedCount = sortedDefinitions.filter((definition) =>
    hasChangedFromBase(
      definition.key,
      { [definition.key]: currentValues[definition.key] },
      { [definition.key]: baseValues[definition.key] },
    ),
  ).length;
  const isSidebar = context === 'sidebar';
  const yearSelectId = `${context}-annual-year-select-${seriesKey}`;

  return (
    <div
      className={`rounded-2xl border bg-app-bg/75 p-4 transition ${
        selectedAssumptionKey === selectedDefinition.key
          ? 'border-app-accent/50 shadow-sm'
          : 'border-app-border'
      }`}
      onClick={() => selectAssumption(selectedDefinition.key)}
      data-testid={`${context}-assumption-field-${selectedDefinition.key}`}
    >
      <div
        className={
          isSidebar
            ? 'space-y-4'
            : 'grid gap-4 xl:grid-cols-[minmax(0,1fr)_11rem] xl:items-start'
        }
      >
        {isSidebar ? (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_9rem]">
              <div className="space-y-1">
                <label
                  htmlFor={yearSelectId}
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle"
                >
                  Select year
                </label>
                <select
                  id={yearSelectId}
                  value={selectedDefinition.key}
                  onChange={(event) => {
                    setSelectedKey(event.target.value);
                    selectAssumption(event.target.value);
                  }}
                  className="w-full rounded-xl border border-app-border bg-app-bg px-3 py-2.5 text-sm font-semibold text-app-text outline-none transition focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
                  data-testid={yearSelectId}
                >
                  {sortedDefinitions.map((definition) => (
                    <option key={definition.key} value={definition.key}>
                      {getSelectorOptionLabel(definition)}
                    </option>
                  ))}
                </select>
              </div>
              <NumericInput
                label={displayLabel}
                value={displayValue}
                decimals={selectedDefinition.decimals}
                unit={displayUnit}
                showInlineUnit={false}
                onCommit={(nextValue) =>
                  setAssumption(
                    selectedDefinition.key,
                    convertValueFromDisplay(nextValue, selectedDefinition.unit, {
                      displayCurrency,
                      fxRate,
                    }),
                  )
                }
                showLabel={false}
                className="w-full"
                testId={`${context}-assumption-input-${selectedDefinition.key}`}
              />
            </div>
          </div>
        ) : null}

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-start gap-2">
            <h4 className="min-w-0 text-sm font-semibold leading-6 text-app-text">
              {seriesLabel}
            </h4>
            <span className="inline-flex items-center rounded-full border border-app-border bg-app-panel px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-app-subtle">
              {displayUnit}
            </span>
            <span className="inline-flex items-center rounded-full border border-app-accent/20 bg-app-accentSoft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-app-accent">
              Year selector
            </span>
            <span className="inline-flex items-center rounded-full border border-app-border bg-app-panel px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-app-subtle">
              {getSelectorOptionLabel(selectedDefinition)}
            </span>
            {changedCount > 0 ? (
              <span className="inline-flex items-center rounded-full border border-app-warning/20 bg-app-warning/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-app-warning">
                {changedCount} changed
              </span>
            ) : null}
            {hasChangedFromBase(
              selectedDefinition.key,
              { [selectedDefinition.key]: selectedValue },
              { [selectedDefinition.key]: baseValues[selectedDefinition.key] },
            ) ? (
              <ChangedIndicator definition={selectedDefinition} value={selectedValue} />
            ) : null}
          </div>
          <p className="max-w-3xl text-sm leading-6 text-app-subtle">
            Select a year from the dropdown, then edit that year&apos;s value without stepping through the full annual list.
          </p>
          <div className="flex flex-wrap gap-2">
            {sortedDefinitions.map((definition) => {
              const definitionValue = currentValues[definition.key];
              const isActive = definition.key === selectedDefinition.key;
              const isChanged = hasChangedFromBase(
                definition.key,
                { [definition.key]: definitionValue },
                { [definition.key]: baseValues[definition.key] },
              );

              return (
                <button
                  key={definition.key}
                  type="button"
                  onClick={() => {
                    setSelectedKey(definition.key);
                    selectAssumption(definition.key);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? 'border-app-accent bg-app-accentSoft text-app-accent'
                      : 'border-app-border bg-app-panel text-app-subtle hover:text-app-text'
                  }`}
                  data-testid={`${context}-annual-year-pill-${definition.key}`}
                >
                  {getSelectorOptionLabel(definition)}:{' '}
                  {formatPillValue(definitionValue, definition.decimals)}
                  {isChanged ? ' *' : ''}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-app-subtle">
            <p className="font-medium uppercase tracking-[0.16em]">
              Base:{' '}
              {formatAssumptionValue(selectedDefinition, selectedDefinition.baseValue, {
                displayCurrency,
                fxRate,
              })}
            </p>
          </div>
        </div>

        {!isSidebar ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <label
                htmlFor={yearSelectId}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle"
              >
                Select year
              </label>
              <select
                id={yearSelectId}
                value={selectedDefinition.key}
                onChange={(event) => {
                  setSelectedKey(event.target.value);
                  selectAssumption(event.target.value);
                }}
                className="w-full rounded-xl border border-app-border bg-app-bg px-3 py-2.5 text-sm font-semibold text-app-text outline-none transition focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
                data-testid={yearSelectId}
              >
                {sortedDefinitions.map((definition) => (
                  <option key={definition.key} value={definition.key}>
                    {getSelectorOptionLabel(definition)}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full lg:w-44">
              <NumericInput
                label={displayLabel}
                value={displayValue}
                decimals={selectedDefinition.decimals}
                unit={displayUnit}
                showInlineUnit={false}
                onCommit={(nextValue) =>
                  setAssumption(
                    selectedDefinition.key,
                    convertValueFromDisplay(nextValue, selectedDefinition.unit, {
                      displayCurrency,
                      fxRate,
                    }),
                  )
                }
                showLabel={false}
                testId={`${context}-assumption-input-${selectedDefinition.key}`}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
