import { useEffect, useId, useState } from 'react';
import { cn } from '../../lib/cn';
import { formatNumber } from '../../model/assumptions';

type NumericInputProps = {
  label: string;
  value: number;
  decimals?: number;
  unit?: string;
  onCommit: (value: number) => void;
  showLabel?: boolean;
  className?: string;
  inputClassName?: string;
  testId?: string;
};

function isEditableNumericString(value: string) {
  return (
    value === '' ||
    value === '-' ||
    value === '.' ||
    value === '-.' ||
    /^-?\d*(\.\d*)?$/.test(value)
  );
}

export function NumericInput({
  label,
  value,
  decimals = 0,
  unit,
  onCommit,
  showLabel = true,
  className,
  inputClassName,
  testId,
}: NumericInputProps) {
  const inputId = useId();
  const [isFocused, setIsFocused] = useState(false);
  const [draft, setDraft] = useState(() => formatNumber(value, decimals));

  useEffect(() => {
    if (!isFocused) {
      setDraft(formatNumber(value, decimals));
    }
  }, [decimals, isFocused, value]);

  const commitValue = () => {
    const trimmed = draft.trim();

    if (
      trimmed === '' ||
      trimmed === '-' ||
      trimmed === '.' ||
      trimmed === '-.'
    ) {
      setDraft(formatNumber(value, decimals));
      return;
    }

    const parsedValue = Number(trimmed.split(',').join(''));

    if (Number.isNaN(parsedValue)) {
      setDraft(formatNumber(value, decimals));
      return;
    }

    onCommit(parsedValue);
    setDraft(formatNumber(parsedValue, decimals));
  };

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel ? (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle"
        >
          {label}
        </label>
      ) : (
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={(event) => {
            const nextValue = event.target.value.split(',').join('');
            if (isEditableNumericString(nextValue)) {
              setDraft(nextValue);
            }
          }}
          onFocus={() => {
            setIsFocused(true);
            setDraft(String(value));
          }}
          onBlur={() => {
            commitValue();
            setIsFocused(false);
          }}
          onWheel={(event) => {
            event.preventDefault();
            event.currentTarget.blur();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }

            if (event.key === 'Escape') {
              setDraft(formatNumber(value, decimals));
              setIsFocused(false);
              event.currentTarget.blur();
            }
          }}
          aria-label={label}
          data-testid={testId}
          className={cn(
            'w-full rounded-xl border border-app-border bg-app-bg px-3 py-2.5 pr-16 text-right text-sm font-semibold text-app-text outline-none transition focus:border-app-accent focus:ring-2 focus:ring-app-accent/20',
            inputClassName,
          )}
        />
        {unit ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}
