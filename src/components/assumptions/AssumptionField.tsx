import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';
import {
  convertValueForDisplay,
  convertValueFromDisplay,
  getDisplayUnit,
} from '../../model/displayCurrency';
import { useAppStore } from '../../store/appStore';
import {
  getDisplayAssumptionLabel,
  formatAssumptionValue,
  hasChangedFromBase,
  type AssumptionMetadata,
} from '../../model/assumptions';
import { NumericInput } from '../ui/NumericInput';
import { ChangedIndicator } from './ChangedIndicator';

type AssumptionFieldProps = {
  definition: AssumptionMetadata;
  context: 'sidebar' | 'page';
};

export function AssumptionField({
  definition,
  context,
}: AssumptionFieldProps) {
  const value = useAppStore((state) => state.assumptions.currentValues[definition.key]);
  const baseValues = useAppStore((state) => state.assumptions.baseValues);
  const setAssumption = useAppStore((state) => state.setAssumption);
  const selectedAssumptionKey = useAppStore((state) => state.ui.selectedAssumptionKey);
  const selectAssumption = useAppStore((state) => state.selectAssumption);
  const { displayCurrency, fxRate } = useDisplayCurrency();
  const changed = hasChangedFromBase(
    definition.key,
    { [definition.key]: value },
    { [definition.key]: baseValues[definition.key] },
  );
  const isSidebar = context === 'sidebar';
  const displayValue = convertValueForDisplay(value, definition.unit, {
    displayCurrency,
    fxRate,
  });
  const displayUnit = getDisplayUnit(definition.unit, displayCurrency);
  const displayLabel = getDisplayAssumptionLabel(definition, displayCurrency);

  return (
    <div
      className={`rounded-2xl border bg-app-bg/75 p-4 transition ${
        selectedAssumptionKey === definition.key
          ? 'border-app-accent/50 shadow-sm'
          : 'border-app-border'
      }`}
      onClick={() => selectAssumption(definition.key)}
      data-testid={`${context}-assumption-field-${definition.key}`}
    >
      <div
        className={
          isSidebar
            ? 'space-y-3'
            : 'grid gap-4 xl:grid-cols-[minmax(0,1fr)_11rem] xl:items-start'
        }
      >
        {isSidebar ? (
          <div className="w-full">
            <NumericInput
              label={displayLabel}
              value={displayValue}
              decimals={definition.decimals}
              unit={displayUnit}
              showInlineUnit={false}
              onCommit={(nextValue) =>
                setAssumption(
                  definition.key,
                  convertValueFromDisplay(nextValue, definition.unit, {
                    displayCurrency,
                    fxRate,
                  }),
                )
              }
              showLabel={false}
              className="w-full"
              testId={`${context}-assumption-input-${definition.key}`}
            />
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
            {definition.dependencyTag ? (
              <span className="inline-flex items-center rounded-full border border-app-accent/20 bg-app-accentSoft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-app-accent">
                {definition.dependencyTag}
              </span>
            ) : null}
            {changed ? <ChangedIndicator definition={definition} value={value} /> : null}
          </div>
          {definition.helperText ? (
            <p className="max-w-3xl text-sm leading-6 text-app-subtle">
              {definition.helperText}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-app-subtle">
            <p className="font-medium uppercase tracking-[0.16em]">
              Base:{' '}
              {formatAssumptionValue(definition, definition.baseValue, {
                displayCurrency,
                fxRate,
              })}
            </p>
          </div>
        </div>

        {!isSidebar ? (
          <div className="w-full lg:w-44">
            <NumericInput
              label={displayLabel}
              value={displayValue}
              decimals={definition.decimals}
              unit={displayUnit}
              showInlineUnit={false}
              onCommit={(nextValue) =>
                setAssumption(
                  definition.key,
                  convertValueFromDisplay(nextValue, definition.unit, {
                    displayCurrency,
                    fxRate,
                  }),
                )
              }
              showLabel={false}
              testId={`${context}-assumption-input-${definition.key}`}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
