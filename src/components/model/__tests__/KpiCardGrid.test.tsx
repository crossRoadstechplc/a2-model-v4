import { render, screen } from '@testing-library/react';
import { KpiCardGrid } from '../KpiCardGrid';
import type { DashboardKpi } from '../a2FleetViewModel';
import { useAppStore } from '../../../store/appStore';

describe('KpiCardGrid', () => {
  it('renders KPI values and highlights updated metrics', () => {
    const items: DashboardKpi[] = [
      {
        id: 'revenue',
        label: 'Revenue',
        value: 577.5,
        description: 'Latest revenue.',
        format: 'currencyM',
      },
      {
        id: 'ebitda_margin',
        label: 'EBITDA Margin',
        value: 19.4,
        description: 'Latest margin.',
        format: 'percent',
      },
    ];

    render(
      <KpiCardGrid
        items={items}
        previousItems={[
          { ...items[0], value: 540.1 },
          { ...items[1], value: 19.4 },
        ]}
      />,
    );

    expect(screen.getByTestId('kpi-card-revenue-value')).toHaveTextContent('$577.5m');
    expect(screen.getByTestId('kpi-card-revenue')).toHaveAttribute(
      'data-state',
      'changed',
    );
    expect(screen.getByTestId('kpi-card-ebitda_margin')).toHaveAttribute(
      'data-state',
      'steady',
    );
    expect(screen.getByText('Updated')).toBeInTheDocument();
  });

  it('formats currency KPIs in the selected display currency', () => {
    useAppStore.setState((state) => ({
      ...state,
      ui: {
        ...state.ui,
        displayCurrency: 'ETB',
      },
      assumptions: {
        ...state.assumptions,
        currentValues: {
          ...state.assumptions.currentValues,
          'integrated.tax_fx.reference_fx_rate': 50,
        },
        baseValues: {
          ...state.assumptions.baseValues,
          'integrated.tax_fx.reference_fx_rate': 50,
        },
      },
    }));

    render(
      <KpiCardGrid
        items={[
          {
            id: 'revenue',
            label: 'Revenue',
            value: 10,
            description: 'Latest revenue.',
            format: 'currencyM',
          },
        ]}
      />,
    );

    expect(screen.getByTestId('kpi-card-revenue-value')).toHaveTextContent('ETB 500.0m');
  });
});
