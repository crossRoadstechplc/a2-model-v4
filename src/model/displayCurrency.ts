export type DisplayCurrency = 'USD' | 'ETB';

export const DISPLAY_CURRENCY_OPTIONS: DisplayCurrency[] = ['USD', 'ETB'];
export const DISPLAY_CURRENCY_FX_KEY = 'integrated.tax_fx.reference_fx_rate';

type DisplayCurrencyFormatOptions = {
  displayCurrency?: DisplayCurrency;
  fxRate?: number;
};

function getSafeFxRate(fxRate?: number) {
  return fxRate && Number.isFinite(fxRate) && fxRate > 0 ? fxRate : 1;
}

export function getUnitCurrency(unit: string): DisplayCurrency | null {
  if (unit === 'ETB' || unit.startsWith('ETB')) {
    return 'ETB';
  }

  if (unit === 'USD' || unit.startsWith('$')) {
    return 'USD';
  }

  return null;
}

export function isCurrencyConvertibleUnit(unit: string) {
  if (unit === 'ETB/USD' || unit === 'USD/ETB') {
    return false;
  }

  return getUnitCurrency(unit) !== null;
}

export function convertCurrencyValue(
  value: number,
  fromCurrency: DisplayCurrency,
  toCurrency: DisplayCurrency,
  fxRate?: number,
) {
  if (fromCurrency === toCurrency) {
    return value;
  }

  const safeFxRate = getSafeFxRate(fxRate);

  return fromCurrency === 'USD' ? value * safeFxRate : value / safeFxRate;
}

export function convertValueForDisplay(
  value: number,
  unit: string,
  options: DisplayCurrencyFormatOptions = {},
) {
  const sourceCurrency = getUnitCurrency(unit);
  if (!sourceCurrency || !isCurrencyConvertibleUnit(unit)) {
    return value;
  }

  return convertCurrencyValue(
    value,
    sourceCurrency,
    options.displayCurrency ?? 'USD',
    options.fxRate,
  );
}

export function convertValueFromDisplay(
  value: number,
  unit: string,
  options: DisplayCurrencyFormatOptions = {},
) {
  const sourceCurrency = getUnitCurrency(unit);
  if (!sourceCurrency || !isCurrencyConvertibleUnit(unit)) {
    return value;
  }

  return convertCurrencyValue(
    value,
    options.displayCurrency ?? 'USD',
    sourceCurrency,
    options.fxRate,
  );
}

export function getDisplayUnit(
  unit: string,
  displayCurrency: DisplayCurrency = 'USD',
) {
  if (!isCurrencyConvertibleUnit(unit)) {
    return unit;
  }

  const currencyToken = displayCurrency === 'USD' ? '$' : 'ETB';
  const codeToken = displayCurrency;

  if (unit.startsWith('$')) {
    return `${currencyToken}${unit.slice(1)}`;
  }

  if (unit.startsWith('USD')) {
    return `${codeToken}${unit.slice(3)}`;
  }

  if (unit.startsWith('ETB')) {
    return `${codeToken}${unit.slice(3)}`;
  }

  return unit;
}

export function getDisplayLabel(
  label: string,
  unit: string,
  displayCurrency: DisplayCurrency = 'USD',
) {
  if (!isCurrencyConvertibleUnit(unit)) {
    return label;
  }

  const replacement = displayCurrency === 'USD' ? 'USD' : 'ETB';
  return label.replace(/\((USD|ETB)\)/g, `(${replacement})`);
}

function getIntlCurrency(displayCurrency: DisplayCurrency) {
  return displayCurrency === 'USD' ? 'USD' : 'ETB';
}

function getCompactCurrencyPrefix(displayCurrency: DisplayCurrency) {
  return displayCurrency === 'USD' ? '$' : 'ETB ';
}

export function formatDisplayCurrencyValue(
  value: number,
  format: 'currency' | 'currencyM',
  options: DisplayCurrencyFormatOptions = {},
) {
  const displayCurrency = options.displayCurrency ?? 'USD';
  const convertedValue =
    format === 'currencyM'
      ? convertCurrencyValue(value, 'USD', displayCurrency, options.fxRate)
      : convertCurrencyValue(value, 'USD', displayCurrency, options.fxRate);

  if (format === 'currencyM') {
    return `${getCompactCurrencyPrefix(displayCurrency)}${convertedValue.toFixed(1)}m`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: getIntlCurrency(displayCurrency),
    maximumFractionDigits: 0,
  }).format(convertedValue);
}
