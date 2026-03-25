export type ReturnMetricFormat = 'currencyM' | 'percent' | 'multiple' | 'number';
export type ReturnMetricStatus = 'ready' | 'pending';

export type ReturnMetricCard = {
  id: string;
  label: string;
  value: number | null;
  format: ReturnMetricFormat;
  description: string;
  status: ReturnMetricStatus;
};

export type EntityReturnsSummary = {
  title: string;
  basisLabel: string;
  cashFlowSeries: number[] | null;
  metrics: ReturnMetricCard[];
};

export function calculateIrr(cashflows: number[], guess = 0.1) {
  const hasPositive = cashflows.some((value) => value > 0);
  const hasNegative = cashflows.some((value) => value < 0);
  if (!hasPositive || !hasNegative) {
    return null;
  }

  let rate = guess;

  for (let iteration = 0; iteration < 100; iteration += 1) {
    let npv = 0;
    let derivative = 0;

    cashflows.forEach((cashflow, period) => {
      const denominator = (1 + rate) ** period;
      npv += cashflow / denominator;
      if (period > 0) {
        derivative += (-period * cashflow) / ((1 + rate) ** (period + 1));
      }
    });

    if (Math.abs(npv) < 1e-10) {
      return rate;
    }

    if (Math.abs(derivative) < 1e-12) {
      break;
    }

    const nextRate = rate - npv / derivative;
    if (!Number.isFinite(nextRate) || nextRate <= -0.999999) {
      break;
    }

    if (Math.abs(nextRate - rate) < 1e-10) {
      return nextRate;
    }

    rate = nextRate;
  }

  let low = -0.9999;
  let high = 10;

  const npvAt = (candidate: number) =>
    cashflows.reduce((total, cashflow, period) => {
      return total + cashflow / (1 + candidate) ** period;
    }, 0);

  let lowValue = npvAt(low);
  let highValue = npvAt(high);

  for (let iteration = 0; iteration < 120; iteration += 1) {
    if (lowValue * highValue < 0) {
      break;
    }

    high *= 1.5;
    highValue = npvAt(high);
  }

  if (lowValue * highValue > 0) {
    return Number.isFinite(rate) ? rate : null;
  }

  for (let iteration = 0; iteration < 200; iteration += 1) {
    const mid = (low + high) / 2;
    const midValue = npvAt(mid);

    if (Math.abs(midValue) < 1e-10) {
      return mid;
    }

    if (lowValue * midValue < 0) {
      high = mid;
      highValue = midValue;
    } else {
      low = mid;
      lowValue = midValue;
    }
  }

  return (low + high) / 2;
}

export function calculatePaybackPeriod(cashflows: number[]) {
  let cumulative = 0;

  for (let index = 0; index < cashflows.length; index += 1) {
    const previousCumulative = cumulative;
    cumulative += cashflows[index];

    if (cumulative >= 0) {
      if (index === 0) {
        return 0;
      }

      const yearCashflow = cashflows[index];
      if (yearCashflow === 0) {
        return index;
      }

      const fraction = (0 - previousCumulative) / yearCashflow;
      return index - 1 + Math.max(0, Math.min(1, fraction));
    }
  }

  return null;
}

export function calculateMoic(cashflows: number[]) {
  const investedCapital = Math.abs(
    cashflows.filter((value) => value < 0).reduce((total, value) => total + value, 0),
  );
  const returnedCapital = cashflows
    .filter((value) => value > 0)
    .reduce((total, value) => total + value, 0);

  if (investedCapital === 0) {
    return null;
  }

  return returnedCapital / investedCapital;
}

export function buildPendingReturnsSummary(
  title: string,
  basisLabel: string,
): EntityReturnsSummary {
  return {
    title,
    basisLabel,
    cashFlowSeries: null,
    metrics: [
      {
        id: 'project_irr',
        label: 'Project IRR',
        value: null,
        format: 'percent',
        description: 'Pending until an entity-level project cash flow stream is implemented.',
        status: 'pending',
      },
      {
        id: 'equity_irr',
        label: 'Equity IRR',
        value: null,
        format: 'percent',
        description: 'Pending until an investable equity cash flow stream is implemented.',
        status: 'pending',
      },
      {
        id: 'npv',
        label: 'NPV',
        value: null,
        format: 'currencyM',
        description: 'Pending until a discount-rate policy is finalized for this entity.',
        status: 'pending',
      },
      {
        id: 'payback_period',
        label: 'Payback Period',
        value: null,
        format: 'number',
        description: 'Pending until the cumulative return stream is finalized.',
        status: 'pending',
      },
      {
        id: 'moic',
        label: 'MOIC',
        value: null,
        format: 'multiple',
        description: 'Pending until terminal value and distribution logic are finalized.',
        status: 'pending',
      },
    ],
  };
}
