import { render, screen } from '@testing-library/react';
import { getBaseAssumptionBundle } from '../../../model/assumptions';
import { runA2FleetWorkbook } from '../../../engine/a2Fleet';
import { StatementTable } from '../StatementTable';
import { useAppStore } from '../../../store/appStore';

describe('StatementTable', () => {
  it('renders dense finance-friendly tables and highlights changed cells', () => {
    const workbook = runA2FleetWorkbook(getBaseAssumptionBundle().baseValues);
    const previousWorkbook = runA2FleetWorkbook({
      ...getBaseAssumptionBundle().baseValues,
      'a2_fleet.number_of_trucks.cy_2027': 700,
    });

    render(
      <StatementTable
        title="Income Statement"
        description="Test table."
        statement={workbook.incomeStatement}
        previousStatement={previousWorkbook.incomeStatement}
        dataTestId="statement-table-income-statement"
      />,
    );

    const revenue2037Cell = screen.getByTestId(
      'statement-cell-statement-table-income-statement-revenue-CY-2037',
    );

    expect(revenue2037Cell).toHaveTextContent('$577.5M');
    expect(revenue2037Cell).toHaveAttribute('data-state', 'changed');
    expect(
      screen.getByTestId('statement-table-income-statement').textContent,
    ).not.toContain('IRR');
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('EBITDA')).toBeInTheDocument();
  });

  it('formats statement currency values and units in ETB billions when the converted scale is large', () => {
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
          'integrated.tax_fx.reference_fx_rate': 155,
        },
        baseValues: {
          ...state.assumptions.baseValues,
          'integrated.tax_fx.reference_fx_rate': 155,
        },
      },
    }));

    const workbook = runA2FleetWorkbook(getBaseAssumptionBundle().baseValues);

    render(
      <StatementTable
        title="Income Statement"
        description="ETB table."
        statement={workbook.incomeStatement}
        dataTestId="statement-table-income-statement-etb"
      />,
    );

    expect(
      screen.getByTestId(
        'statement-cell-statement-table-income-statement-etb-revenue-CY-2037',
      ),
    ).toHaveTextContent('ETB 89.51B');
    expect(screen.getAllByText('ETB').length).toBeGreaterThan(0);
  });
});
