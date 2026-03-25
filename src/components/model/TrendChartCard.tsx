import { cn } from '../../lib/cn';
import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';
import { StatusBadge } from '../ui/StatusBadge';
import type { TrendSeries } from './a2FleetViewModel';
import { formatDisplayValue, hasMeaningfulChange } from './formatters';

type TrendChartCardProps = {
  title: string;
  description: string;
  periods: string[];
  series: TrendSeries[];
  previousSeries?: TrendSeries[];
  dataTestId: string;
};

function buildPreviousMap(items?: TrendSeries[]) {
  return Object.fromEntries((items ?? []).map((item) => [item.id, item]));
}

const CHART_FRAME = {
  width: 420,
  height: 240,
  paddingTop: 20,
  paddingRight: 28,
  paddingBottom: 42,
  paddingLeft: 56,
} as const;

function getChartBounds() {
  return {
    chartWidth:
      CHART_FRAME.width - CHART_FRAME.paddingLeft - CHART_FRAME.paddingRight,
    chartHeight:
      CHART_FRAME.height - CHART_FRAME.paddingTop - CHART_FRAME.paddingBottom,
  };
}

function buildPath(values: number[], minValue: number, maxValue: number) {
  const { chartWidth, chartHeight } = getChartBounds();
  const xStep = values.length > 1 ? chartWidth / (values.length - 1) : chartWidth;
  const range = maxValue - minValue || 1;

  return values
    .map((value, index) => {
      const x = CHART_FRAME.paddingLeft + index * xStep;
      const normalized = (value - minValue) / range;
      const y = CHART_FRAME.paddingTop + chartHeight - normalized * chartHeight;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function buildPoint(values: number[], index: number, minValue: number, maxValue: number) {
  const { chartWidth, chartHeight } = getChartBounds();
  const xStep = values.length > 1 ? chartWidth / (values.length - 1) : chartWidth;
  const range = maxValue - minValue || 1;
  const value = values[index] ?? 0;
  const normalized = (value - minValue) / range;

  return {
    x: CHART_FRAME.paddingLeft + index * xStep,
    y: CHART_FRAME.paddingTop + chartHeight - normalized * chartHeight,
  };
}

function getTickValues(minValue: number, maxValue: number) {
  const steps = 4;
  const range = maxValue - minValue || 1;
  const stepSize = range / steps;

  return Array.from({ length: steps + 1 }, (_, index) => minValue + stepSize * index);
}

function getAxisLabel(format: TrendSeries['format'], displayCurrency: 'USD' | 'ETB') {
  switch (format) {
    case 'currency':
      return displayCurrency;
    case 'currencyM':
      return `${displayCurrency} millions`;
    case 'percent':
      return 'Percent';
    case 'multiple':
      return 'Multiple';
    case 'integer':
      return 'Count';
    default:
      return 'Value';
  }
}

export function TrendChartCard({
  title,
  description,
  periods,
  series,
  previousSeries,
  dataTestId,
}: TrendChartCardProps) {
  const previousMap = buildPreviousMap(previousSeries);
  const { displayCurrency, fxRate } = useDisplayCurrency();
  const allValues = series.flatMap((item) => item.values);
  const minValue = Math.min(...allValues, 0);
  const maxValue = Math.max(...allValues, 1);
  const tickValues = getTickValues(minValue, maxValue);
  const hasUpdatedSeries = series.some((item) => {
    const previous = previousMap[item.id];
    return item.values.some((value, index) =>
      hasMeaningfulChange(value, previous?.values[index]),
    );
  });
  const xLabelInterval = periods.length > 6 ? 2 : 1;
  const axisLabel = getAxisLabel(series[0]?.format ?? 'number', displayCurrency);

  return (
    <article
      className={cn(
        'rounded-2xl border border-app-border bg-app-bg/80 p-4 transition',
        hasUpdatedSeries && 'border-app-accent/40 bg-app-accentSoft/30 shadow-sm',
      )}
      data-state={hasUpdatedSeries ? 'changed' : 'steady'}
      data-testid={dataTestId}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-app-subtle">
            Trend
          </p>
          <h3 className="mt-2 text-lg font-semibold text-app-text">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-app-subtle">{description}</p>
        </div>
        {hasUpdatedSeries ? <StatusBadge tone="accent">Updated</StatusBadge> : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2" data-testid={`${dataTestId}-legend`}>
        {series.map((item) => (
          <div
            key={item.id}
            className="inline-flex items-center gap-2 rounded-full border border-app-border bg-app-panel/80 px-3 py-1.5 text-xs font-semibold text-app-text"
          >
            <span className={cn('h-2.5 w-2.5 rounded-full', item.colorClassName, 'bg-current')} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-app-border bg-app-panel/80 p-3">
        <svg
          viewBox={`0 0 ${CHART_FRAME.width} ${CHART_FRAME.height}`}
          className="h-56 w-full"
          role="img"
          aria-label={title}
          data-testid={`${dataTestId}-chart`}
        >
          <text
            x={CHART_FRAME.paddingLeft}
            y="12"
            className="fill-current text-[11px] font-semibold uppercase tracking-[0.16em] text-app-subtle"
          >
            {axisLabel}
          </text>
          {tickValues.map((tick) => {
            const normalized = (tick - minValue) / ((maxValue - minValue) || 1);
            const y =
              CHART_FRAME.paddingTop +
              getChartBounds().chartHeight -
              normalized * getChartBounds().chartHeight;

            return (
              <g key={tick}>
                <line
                  x1={CHART_FRAME.paddingLeft}
                  x2={CHART_FRAME.width - CHART_FRAME.paddingRight}
                  y1={y}
                  y2={y}
                  className="stroke-app-border/60"
                  strokeWidth="1"
                />
                <text
                  x={CHART_FRAME.paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-current text-[11px] text-app-subtle"
                >
                  {formatDisplayValue(tick, series[0]?.format ?? 'number', {
                    displayCurrency,
                    fxRate,
                  })}
                </text>
              </g>
            );
          })}
          <line
            x1={CHART_FRAME.paddingLeft}
            x2={CHART_FRAME.paddingLeft}
            y1={CHART_FRAME.paddingTop}
            y2={CHART_FRAME.height - CHART_FRAME.paddingBottom}
            className="stroke-app-border"
            strokeWidth="1.2"
          />
          <line
            x1={CHART_FRAME.paddingLeft}
            x2={CHART_FRAME.width - CHART_FRAME.paddingRight}
            y1={CHART_FRAME.height - CHART_FRAME.paddingBottom}
            y2={CHART_FRAME.height - CHART_FRAME.paddingBottom}
            className="stroke-app-border"
            strokeWidth="1.2"
          />
          {periods.map((period, index) => {
            if (index % xLabelInterval !== 0 && index !== periods.length - 1) {
              return null;
            }

            const point = buildPoint(
              series[0]?.values ?? periods.map(() => 0),
              index,
              minValue,
              maxValue,
            );

            return (
              <g key={period}>
                <line
                  x1={point.x}
                  x2={point.x}
                  y1={CHART_FRAME.height - CHART_FRAME.paddingBottom}
                  y2={CHART_FRAME.height - CHART_FRAME.paddingBottom + 6}
                  className="stroke-app-border"
                  strokeWidth="1"
                />
                <text
                  x={point.x}
                  y={CHART_FRAME.height - 12}
                  textAnchor="middle"
                  className="fill-current text-[11px] text-app-subtle"
                >
                  {period}
                </text>
              </g>
            );
          })}
          {series.map((item) => {
            const lastPoint = buildPoint(
              item.values,
              item.values.length - 1,
              minValue,
              maxValue,
            );
            const previous = previousMap[item.id];

            return (
              <g key={item.id}>
                {previous ? (
                  <path
                    d={buildPath(previous.values, minValue, maxValue)}
                    className={cn('fill-none stroke-[2] opacity-25', item.colorClassName)}
                    strokeDasharray="6 5"
                    vectorEffect="non-scaling-stroke"
                  />
                ) : null}
                <path
                  d={buildPath(item.values, minValue, maxValue)}
                  className={cn('fill-none stroke-[3]', item.colorClassName)}
                  vectorEffect="non-scaling-stroke"
                />
                {item.values.map((_, index) => {
                  const point = buildPoint(item.values, index, minValue, maxValue);

                  return (
                    <circle
                      key={`${item.id}-${periods[index]}`}
                      cx={point.x}
                      cy={point.y}
                      r="3.2"
                      className={cn('fill-current', item.colorClassName)}
                    />
                  );
                })}
                <circle
                  cx={lastPoint.x}
                  cy={lastPoint.y}
                  r="4.5"
                  className={cn('fill-current', item.colorClassName)}
                />
                <text
                  x={Math.min(lastPoint.x + 10, CHART_FRAME.width - CHART_FRAME.paddingRight)}
                  y={lastPoint.y - 8 - series.findIndex((seriesItem) => seriesItem.id === item.id) * 14}
                  className={cn('fill-current text-[11px] font-semibold', item.colorClassName)}
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {series.map((item) => {
          const lastValue = item.values[item.values.length - 1] ?? 0;
          const lastPeriod = periods[periods.length - 1];

          return (
            <div
              key={item.id}
              className="rounded-xl border border-app-border bg-app-panel/80 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-subtle">
                  {item.label}
                </p>
                <span className={cn('text-xs font-semibold', item.colorClassName)}>
                  {lastPeriod}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-app-text">
                {formatDisplayValue(lastValue, item.format, {
                  displayCurrency,
                  fxRate,
                })}
              </p>
            </div>
          );
        })}
      </div>
    </article>
  );
}
