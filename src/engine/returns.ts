export type ReturnMetricFormat = 'currencyM' | 'percent' | 'multiple' | 'number';
export type ReturnMetricStatus = 'ready' | 'pending';
export type IrrSolveMethod = 'newton' | 'bisection' | 'invalid';
export type ReturnMetricKey =
  | 'projectIrr'
  | 'equityIrr'
  | 'npv'
  | 'paybackPeriod'
  | 'moic';
export type TerminalValueMethod =
  | 'equityStake'
  | 'enterpriseMultiple'
  | 'netAssets'
  | 'bookValue'
  | 'none';

export type IrrSolveResult = {
  value: number | null;
  method: IrrSolveMethod;
};

export type ReturnMetricCard = {
  id: string;
  label: string;
  value: number | null;
  format: ReturnMetricFormat;
  description: string;
  status: ReturnMetricStatus;
  notes?: string[];
};

export type ReturnsMetricMap = Record<ReturnMetricKey, ReturnMetricCard>;

export type ReturnSeriesDefinition = {
  type: 'project' | 'equity' | 'workbookParity';
  label: string;
  values: number[] | null;
  note: string;
};

export type TerminalValuePolicy = {
  method: TerminalValueMethod;
  value: number | null;
  note: string;
};

export type EntityReturnsSummary = {
  title: string;
  basisLabel: string;
  cashFlowSeries: number[] | null;
  returnsMetrics: ReturnsMetricMap;
  metrics: ReturnMetricCard[];
  additionalMetrics?: ReturnMetricCard[];
  seriesDefinitions: ReturnSeriesDefinition[];
  terminalValuePolicy: TerminalValuePolicy | null;
  notes?: string[];
};

type ComputedReturnsSummaryParams = {
  title: string;
  basisLabel: string;
  projectCashFlowSeries?: number[] | null;
  equityCashFlowSeries?: number[] | null;
  discountRatePct?: number | null;
  fallbackInitialInvestment?: number | null;
  useProjectSeriesForEquity?: boolean;
  npvDescription?: string;
  projectIrrNotes?: string[];
  equityIrrNotes?: string[];
  npvNotes?: string[];
  paybackNotes?: string[];
  moicNotes?: string[];
  terminalValuePolicy?: TerminalValuePolicy | null;
  seriesDefinitions?: ReturnSeriesDefinition[];
  notes?: string[];
};

function buildReturnMetricCards(
  returnsMetrics: ReturnsMetricMap,
  additionalMetrics: ReturnMetricCard[] = [],
) {
  return [
    returnsMetrics.projectIrr,
    returnsMetrics.equityIrr,
    returnsMetrics.npv,
    returnsMetrics.paybackPeriod,
    returnsMetrics.moic,
    ...additionalMetrics,
  ];
}

function calculateDiscountedCashFlow(cashflows: number[], rate: number) {
  return cashflows.reduce((total, cashflow, period) => {
    return total + cashflow / (1 + rate) ** period;
  }, 0);
}

function calculateDiscountedCashFlowDerivative(cashflows: number[], rate: number) {
  return cashflows.reduce((total, cashflow, period) => {
    if (period === 0) {
      return total;
    }

    return total + (-period * cashflow) / ((1 + rate) ** (period + 1));
  }, 0);
}

function solveIrrByBisection(cashflows: number[]) {
  let low = -0.9999;
  let high = 10;
  let lowValue = calculateDiscountedCashFlow(cashflows, low);
  let highValue = calculateDiscountedCashFlow(cashflows, high);

  for (let iteration = 0; iteration < 120; iteration += 1) {
    if (lowValue * highValue < 0) {
      break;
    }

    high *= 1.5;
    highValue = calculateDiscountedCashFlow(cashflows, high);
  }

  if (lowValue * highValue > 0) {
    return null;
  }

  for (let iteration = 0; iteration < 200; iteration += 1) {
    const mid = (low + high) / 2;
    const midValue = calculateDiscountedCashFlow(cashflows, mid);

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

/**
 * Solves IRR for the standard investment equation:
 *   NPV(r) = Σ [ CF_t / (1 + r)^t ] = 0
 *
 * The solver tries Newton-Raphson first for speed, then falls back to
 * bisection if the Newton path becomes unstable or non-finite.
 */
export function solveIrr(cashflows: number[], guess = 0.1): IrrSolveResult {
  const hasPositive = cashflows.some((value) => value > 0);
  const hasNegative = cashflows.some((value) => value < 0);
  if (!hasPositive || !hasNegative) {
    return {
      value: null,
      method: 'invalid',
    };
  }

  let rate = guess;

  for (let iteration = 0; iteration < 100; iteration += 1) {
    const npv = calculateDiscountedCashFlow(cashflows, rate);
    const derivative = calculateDiscountedCashFlowDerivative(cashflows, rate);

    if (Math.abs(npv) < 1e-10) {
      return {
        value: rate,
        method: 'newton',
      };
    }

    if (Math.abs(derivative) < 1e-12) {
      break;
    }

    const nextRate = rate - npv / derivative;
    if (!Number.isFinite(nextRate) || nextRate <= -0.999999) {
      break;
    }

    if (Math.abs(nextRate - rate) < 1e-10) {
      return {
        value: nextRate,
        method: 'newton',
      };
    }

    rate = nextRate;
  }

  const bisectionValue = solveIrrByBisection(cashflows);
  if (bisectionValue !== null) {
    return {
      value: bisectionValue,
      method: 'bisection',
    };
  }

  return {
    value: Number.isFinite(rate) ? rate : null,
    method: 'invalid',
  };
}

export function calculateIrr(cashflows: number[], guess = 0.1) {
  return solveIrr(cashflows, guess).value;
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

export function calculateNpv(cashflows: number[], discountRatePct: number) {
  const discountRate = discountRatePct / 100;
  return calculateDiscountedCashFlow(cashflows, discountRate);
}

function seedInitialInvestment(
  cashflows: number[] | null | undefined,
  fallbackInitialInvestment?: number | null,
) {
  if (!cashflows || cashflows.length === 0) {
    return null;
  }

  const seeded = [...cashflows];
  const hasNegative = seeded.some((value) => value < 0);
  const safeFallback =
    fallbackInitialInvestment && Number.isFinite(fallbackInitialInvestment)
      ? Math.abs(fallbackInitialInvestment)
      : 0;

  if (!hasNegative && safeFallback > 0) {
    seeded[0] -= safeFallback;
  }

  return seeded;
}

export function buildComputedReturnsSummary({
  title,
  basisLabel,
  projectCashFlowSeries,
  equityCashFlowSeries,
  discountRatePct,
  fallbackInitialInvestment,
  useProjectSeriesForEquity = false,
  npvDescription,
  projectIrrNotes,
  equityIrrNotes,
  npvNotes,
  paybackNotes,
  moicNotes,
  terminalValuePolicy = null,
  seriesDefinitions,
  notes,
}: ComputedReturnsSummaryParams): EntityReturnsSummary {
  const seededProjectSeries = seedInitialInvestment(
    projectCashFlowSeries,
    fallbackInitialInvestment,
  );
  const seededEquitySeries = seedInitialInvestment(
    equityCashFlowSeries ??
      (useProjectSeriesForEquity ? seededProjectSeries ?? undefined : undefined),
    fallbackInitialInvestment,
  );
  const primarySeries = seededEquitySeries ?? seededProjectSeries;
  const projectIrr = seededProjectSeries ? calculateIrr(seededProjectSeries) : null;
  const equityIrr = seededEquitySeries ? calculateIrr(seededEquitySeries) : null;
  const paybackPeriod = primarySeries ? calculatePaybackPeriod(primarySeries) : null;
  const moic = primarySeries ? calculateMoic(primarySeries) : null;
  const npv =
    primarySeries &&
    discountRatePct !== null &&
    discountRatePct !== undefined &&
    Number.isFinite(discountRatePct)
      ? calculateNpv(primarySeries, discountRatePct)
      : null;
  const resolvedSeriesDefinitions =
    seriesDefinitions ??
    [
      {
        type: 'project',
        label: 'Project cash flow series',
        values: seededProjectSeries,
        note: 'Cash flow basis used for Project IRR.',
      },
      {
        type: 'equity',
        label: 'Equity cash flow series',
        values: seededEquitySeries,
        note: useProjectSeriesForEquity
          ? 'Currently mirrors the project cash flow basis until a separate equity financing stack is modeled.'
          : 'Cash flow basis used for Equity IRR.',
      },
    ];
  const returnsMetrics: ReturnsMetricMap = {
    projectIrr: {
      id: 'project_irr',
      label: 'Project IRR',
      value: projectIrr !== null ? projectIrr * 100 : null,
      format: 'percent',
      description:
        projectIrr !== null
          ? 'Return across the currently modeled project-level cash flow stream.'
          : 'Pending until an explicit project cash flow stream is available.',
      status: projectIrr !== null ? 'ready' : 'pending',
      notes: projectIrrNotes,
    },
    equityIrr: {
      id: 'equity_irr',
      label: 'Equity IRR',
      value: equityIrr !== null ? equityIrr * 100 : null,
      format: 'percent',
      description:
        equityIrr !== null
          ? useProjectSeriesForEquity
            ? 'Currently mirrors the project cash flow basis until entity-specific financing logic is separated.'
            : 'Return across the currently modeled equity cash flow stream.'
          : 'Pending until an explicit equity investor cash flow stream is available.',
      status: equityIrr !== null ? 'ready' : 'pending',
      notes: equityIrrNotes,
    },
    npv: {
      id: 'npv',
      label: 'NPV',
      value: npv !== null ? npv / 1_000_000 : null,
      format: 'currencyM',
      description:
        npvDescription ??
        'Net present value using the current modeled cash flow stream and discount-rate assumption.',
      status: npv !== null ? 'ready' : 'pending',
      notes: npvNotes,
    },
    paybackPeriod: {
      id: 'payback_period',
      label: 'Payback Period',
      value: paybackPeriod,
      format: 'number',
      description:
        'Years required for cumulative modeled cash flows to recover the initial investment.',
      status: paybackPeriod !== null ? 'ready' : 'pending',
      notes: paybackNotes,
    },
    moic: {
      id: 'moic',
      label: 'MOIC',
      value: moic,
      format: 'multiple',
      description: 'Multiple of invested capital across the same modeled cash flow basis.',
      status: moic !== null ? 'ready' : 'pending',
      notes: moicNotes,
    },
  };

  return {
    title,
    basisLabel,
    cashFlowSeries: primarySeries,
    returnsMetrics,
    metrics: buildReturnMetricCards(returnsMetrics),
    additionalMetrics: [],
    seriesDefinitions: resolvedSeriesDefinitions,
    terminalValuePolicy,
    notes,
  };
}

export function buildPendingReturnsSummary(
  title: string,
  basisLabel: string,
): EntityReturnsSummary {
  const returnsMetrics: ReturnsMetricMap = {
    projectIrr: {
      id: 'project_irr',
      label: 'Project IRR',
      value: null,
      format: 'percent',
      description: 'Pending until an entity-level project cash flow stream is implemented.',
      status: 'pending',
    },
    equityIrr: {
      id: 'equity_irr',
      label: 'Equity IRR',
      value: null,
      format: 'percent',
      description: 'Pending until an investable equity cash flow stream is implemented.',
      status: 'pending',
    },
    npv: {
      id: 'npv',
      label: 'NPV',
      value: null,
      format: 'currencyM',
      description: 'Pending until a discount-rate policy is finalized for this entity.',
      status: 'pending',
    },
    paybackPeriod: {
      id: 'payback_period',
      label: 'Payback Period',
      value: null,
      format: 'number',
      description: 'Pending until the cumulative return stream is finalized.',
      status: 'pending',
    },
    moic: {
      id: 'moic',
      label: 'MOIC',
      value: null,
      format: 'multiple',
      description: 'Pending until terminal value and distribution logic are finalized.',
      status: 'pending',
    },
  };

  return {
    title,
    basisLabel,
    cashFlowSeries: null,
    returnsMetrics,
    metrics: buildReturnMetricCards(returnsMetrics),
    additionalMetrics: [],
    seriesDefinitions: [],
    terminalValuePolicy: null,
  };
}
