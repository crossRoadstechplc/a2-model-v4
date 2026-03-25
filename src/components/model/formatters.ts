import {
  convertCurrencyValue,
  convertValueForDisplay,
  formatDisplayCurrencyValue,
  getDisplayUnit,
  type DisplayCurrency,
} from '../../model/displayCurrency';

export type DisplayFormat =
  | 'currency'
  | 'currencyM'
  | 'percent'
  | 'multiple'
  | 'number'
  | 'integer';

type FormatOptions = {
  displayCurrency?: DisplayCurrency;
  fxRate?: number;
};

function compactNumber(value: number, decimals = 1) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: decimals,
  }).format(value);
}

function signedNumber(value: number, decimals = 1) {
  return `${value >= 0 ? '+' : ''}${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
  }).format(value)}`;
}

export function formatDisplayValue(
  value: number,
  format: DisplayFormat,
  options: FormatOptions = {},
) {
  switch (format) {
    case 'currency':
      return formatDisplayCurrencyValue(value, 'currency', options);
    case 'currencyM':
      return formatDisplayCurrencyValue(value, 'currencyM', options);
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'multiple':
      return `${value.toFixed(2)}x`;
    case 'integer':
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
      }).format(value);
    default:
      return compactNumber(value);
  }
}

export function formatStatementValue(
  value: number,
  unit: string,
  options: FormatOptions = {},
) {
  if (unit === '$' || unit === 'USD' || unit.startsWith('$') || unit.startsWith('ETB')) {
    const convertedValue = convertValueForDisplay(value, unit, options);
    const displayUnit = getDisplayUnit(unit, options.displayCurrency);

    if (displayUnit === '$' || displayUnit === 'ETB') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: displayUnit === '$' ? 'USD' : 'ETB',
        maximumFractionDigits: 0,
      }).format(convertedValue);
    }

    return `${displayUnit} ${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(convertedValue)}`;
  }

  if (unit === '%') {
    return `${(value * 100).toFixed(1)}%`;
  }

  if (unit === 'x') {
    return `${value.toFixed(2)}x`;
  }

  if (unit === 'count') {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(value);
  }

  if (unit === 'km' || unit === 'tonnes' || unit === 'kWh') {
    return compactNumber(value, 1);
  }

  if (Math.abs(value) >= 1_000) {
    return compactNumber(value, 1);
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatDelta(
  value: number,
  format: DisplayFormat,
  options: FormatOptions = {},
) {
  if (format === 'currencyM') {
    const displayCurrency = options.displayCurrency ?? 'USD';
    const convertedValue = convertCurrencyValue(
      value,
      'USD',
      displayCurrency,
      options.fxRate,
    );
    const prefix = displayCurrency === 'USD' ? '$' : 'ETB ';
    return `${value >= 0 ? '+' : '-'}${prefix}${Math.abs(convertedValue).toFixed(1)}m`;
  }

  if (format === 'percent') {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)} pts`;
  }

  if (format === 'multiple') {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}x`;
  }

  if (format === 'currency') {
    const formatted = formatDisplayCurrencyValue(Math.abs(value), 'currency', options);
    return `${value >= 0 ? '+' : '-'}${formatted}`;
  }

  return signedNumber(value);
}

export function hasMeaningfulChange(current: number, previous: number | undefined | null) {
  if (previous === undefined || previous === null) {
    return false;
  }

  return Math.abs(current - previous) > 0.000001;
}
