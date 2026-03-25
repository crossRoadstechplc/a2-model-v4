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
  type AssumptionMetadata,
} from '../../model/assumptions';
import { useAppStore } from '../../store/appStore';
import { NumericInput } from '../ui/NumericInput';
import { ChangedIndicator } from './ChangedIndicator';

type TruckCountYearEditorProps = {
  definitions: AssumptionMetadata[];
  context: 'sidebar' | 'page';
};

function getYearFromDefinition(definition: AssumptionMetadata) {
  const keyMatch = definition.key.match(/cy_(\d{4})/i);
  if (keyMatch) {
    return Number(keyMatch[1]);
  }

  const labelMatch = definition.label.match(/CY-(\d{4})/i);
  if (labelMatch) {
    return Number(labelMatch[1]);
  }

  return Number.MAX_SAFE_INTEGER;
}

export function TruckCountYearEditor({
  definitions,
  context,
}: TruckCountYearEditorProps) {
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
            : 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_11rem] lg:items-start'
        }
      >
        {isSidebar ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
              <div className="space-y-1">
                <label
                  htmlFor={`${context}-truck-year-select`}
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle"
                >
                  Select year
                </label>
                <select
                  id={`${context}-truck-year-select`}
                  value={selectedDefinition.key}
                  onChange={(event) => {
                    setSelectedKey(event.target.value);
                    selectAssumption(event.target.value);
                  }}
                  className="w-full rounded-xl border border-app-border bg-app-bg px-3 py-2.5 text-sm font-semibold text-app-text outline-none transition focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
                  data-testid={`${context}-truck-year-select`}
                >
                  {sortedDefinitions.map((definition) => (
                    <option key={definition.key} value={definition.key}>
                      {definition.shortLabel}
                    </option>
                  ))}
                </select>
              </div>
              <NumericInput
                label={displayLabel}
                value={displayValue}
                decimals={selectedDefinition.decimals}
                unit={displayUnit}
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
              {displayLabel}
            </h4>
            <span className="inline-flex items-center rounded-full border border-app-border bg-app-panel px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-app-subtle">
              {displayUnit}
            </span>
            <span className="inline-flex items-center rounded-full border border-app-accent/20 bg-app-accentSoft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-app-accent">
              Year selector
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
            Select a fleet deployment year from the dropdown, then edit the truck count for that year without stepping through the full annual list.
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
                  data-testid={`${context}-truck-year-pill-${definition.key}`}
                >
                  {definition.shortLabel}: {definitionValue.toLocaleString()}
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
                htmlFor={`${context}-truck-year-select`}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle"
              >
                Select year
              </label>
              <select
                id={`${context}-truck-year-select`}
                value={selectedDefinition.key}
                onChange={(event) => {
                  setSelectedKey(event.target.value);
                  selectAssumption(event.target.value);
                }}
                className="w-full rounded-xl border border-app-border bg-app-bg px-3 py-2.5 text-sm font-semibold text-app-text outline-none transition focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
                data-testid={`${context}-truck-year-select`}
              >
                {sortedDefinitions.map((definition) => (
                  <option key={definition.key} value={definition.key}>
                    {definition.shortLabel}
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
