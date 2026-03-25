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

type CurrencyScale = {
  divisor: number;
  suffix: '' | 'M' | 'B' | 'T';
  label: 'Units' | 'Millions' | 'Billions' | 'Trillions';
  decimals: number;
};

const RAW_CURRENCY_SCALES: CurrencyScale[] = [
  { divisor: 1_000_000_000_000, suffix: 'T', label: 'Trillions', decimals: 2 },
  { divisor: 1_000_000_000, suffix: 'B', label: 'Billions', decimals: 2 },
  { divisor: 1_000_000, suffix: 'M', label: 'Millions', decimals: 1 },
  { divisor: 1, suffix: '', label: 'Units', decimals: 0 },
];

const MILLION_CURRENCY_SCALES: CurrencyScale[] = [
  { divisor: 1_000_000, suffix: 'T', label: 'Trillions', decimals: 2 },
  { divisor: 1_000, suffix: 'B', label: 'Billions', decimals: 2 },
  { divisor: 1, suffix: 'M', label: 'Millions', decimals: 1 },
];

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

function getCurrencyPrefix(displayCurrency: DisplayCurrency) {
  return displayCurrency === 'USD' ? '$' : 'ETB ';
}

function resolveCurrencyScale(value: number, scales: CurrencyScale[]) {
  const absoluteValue = Math.abs(value);
  return scales.find((scale) => absoluteValue >= scale.divisor) ?? scales[scales.length - 1];
}

function formatScaledCurrency(
  value: number,
  displayCurrency: DisplayCurrency,
  scale: CurrencyScale,
) {
  if (scale.suffix === '') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: displayCurrency === 'USD' ? 'USD' : 'ETB',
      maximumFractionDigits: 0,
    }).format(value);
  }

  return `${getCurrencyPrefix(displayCurrency)}${(value / scale.divisor).toFixed(
    scale.decimals,
  )}${scale.suffix}`;
}

export function getCurrencyMagnitudeLabel(
  format: Extract<DisplayFormat, 'currency' | 'currencyM'>,
  values: number[],
  options: FormatOptions = {},
) {
  const displayCurrency = options.displayCurrency ?? 'USD';

  if (format === 'currencyM') {
    const convertedValues = values.map((value) =>
      convertCurrencyValue(value, 'USD', displayCurrency, options.fxRate),
    );
    return `${displayCurrency} ${
      resolveCurrencyScale(
        convertedValues.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0),
        MILLION_CURRENCY_SCALES,
      ).label
    }`;
  }

  const convertedValues = values.map((value) =>
    convertCurrencyValue(value, 'USD', displayCurrency, options.fxRate),
  );
  return `${displayCurrency} ${
    resolveCurrencyScale(
      convertedValues.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0),
      RAW_CURRENCY_SCALES,
    ).label
  }`;
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
    const displayCurrency = displayUnit === '$' ? 'USD' : displayUnit === 'ETB' ? 'ETB' : null;

    if (displayCurrency) {
      const scale = resolveCurrencyScale(convertedValue, RAW_CURRENCY_SCALES);
      return formatScaledCurrency(convertedValue, displayCurrency, scale);
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
    const scale = resolveCurrencyScale(Math.abs(convertedValue), MILLION_CURRENCY_SCALES);
    return `${value >= 0 ? '+' : '-'}${getCurrencyPrefix(displayCurrency)}${(
      Math.abs(convertedValue) / scale.divisor
    ).toFixed(scale.decimals)}${scale.suffix}`;
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
