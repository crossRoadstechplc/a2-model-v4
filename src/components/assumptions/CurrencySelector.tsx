import { DISPLAY_CURRENCY_OPTIONS, type DisplayCurrency } from '../../model/displayCurrency';
import { cn } from '../../lib/cn';
import { NumericInput } from '../ui/NumericInput';

type CurrencySelectorProps = {
  value: DisplayCurrency;
  onChange: (currency: DisplayCurrency) => void;
  fxRate: number;
  onFxRateChange: (fxRate: number) => void;
  compact?: boolean;
};

export function CurrencySelector({
  value,
  onChange,
  fxRate,
  onFxRateChange,
  compact = false,
}: CurrencySelectorProps) {
  return (
    <div className="space-y-3" data-testid="display-currency-selector">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">
          Display currency
        </p>
        <p className="text-xs text-app-subtle">FX reference: {fxRate.toFixed(1)} ETB/USD</p>
      </div>
      <div
        className={cn(
          'grid gap-2',
          compact ? 'grid-cols-2' : 'grid-cols-1 sm:w-[14rem] sm:grid-cols-2',
        )}
      >
        {DISPLAY_CURRENCY_OPTIONS.map((currency) => (
          <button
            key={currency}
            type="button"
            onClick={() => onChange(currency)}
            className={cn(
              'rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition',
              value === currency
                ? 'border-app-accent bg-app-accentSoft text-app-accent'
                : 'border-app-border bg-app-panel text-app-subtle hover:text-app-text',
            )}
            data-testid={`display-currency-${currency.toLowerCase()}`}
            aria-pressed={value === currency}
          >
            {currency}
          </button>
        ))}
      </div>
      <div
        className={cn(
          'rounded-2xl border border-app-border bg-app-panel/70 p-3',
          compact ? 'space-y-2' : 'space-y-3',
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-subtle">
          Exchange rate
        </p>
        <div
          className={cn(
            'grid gap-3 items-end',
            compact
              ? 'grid-cols-1 sm:grid-cols-[minmax(0,1fr)_7rem]'
              : 'grid-cols-1 sm:grid-cols-[minmax(0,1fr)_8rem]',
          )}
        >
          <div className="space-y-1">
            <p className="text-sm font-medium text-app-text">1 USD =</p>
            <p className="text-xs leading-5 text-app-subtle">
              Used for consistent ETB/USD display conversion across cards, charts, and tables.
            </p>
          </div>
          <NumericInput
            label="Exchange rate"
            value={fxRate}
            decimals={1}
            unit="ETB"
            onCommit={onFxRateChange}
            showLabel={false}
            className="w-full"
            testId="display-currency-fx-rate-input"
          />
        </div>
      </div>
    </div>
  );
}
