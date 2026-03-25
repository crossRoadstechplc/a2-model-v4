import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { AppRoutes } from '../../../app/AppRoutes';
import {
  MOCK_CALCULATION_DELAY_MS,
  MOCK_RECALC_DEBOUNCE_MS,
} from '../../../store/modelStore';
import { renderWithRouter } from '../../../test/renderApp';

describe('A2 Fleet dashboard integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('recalculates statement tables after an assumption edit', () => {
    renderWithRouter(<AppRoutes />, '/a2-fleet');

    expect(
      screen.getByText(/Run the model to populate the A2 Fleet analytical page/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('calculate-button'));

    act(() => {
      vi.advanceTimersByTime(MOCK_CALCULATION_DELAY_MS);
    });

    expect(screen.getByText('Returns / Valuation')).toBeInTheDocument();
    expect(screen.getByTestId('returns-card-project_irr-value')).not.toHaveTextContent(
      'Pending',
    );
    expect(screen.getByTestId('returns-card-equity_irr-value')).not.toHaveTextContent(
      'Pending',
    );
    expect(
      screen.getByTestId('statement-table-valuation-summary').textContent,
    ).not.toContain('IRR');

    const revenue2037Cell = screen.getByTestId(
      'statement-cell-statement-table-income-statement-revenue-CY-2037',
    );
    const previousRevenue = revenue2037Cell.textContent;

    const fleetSizeInput = screen.getByTestId(
      'sidebar-assumption-input-a2_fleet.number_of_trucks.cy_2027',
    );

    fireEvent.focus(fleetSizeInput);
    fireEvent.change(fleetSizeInput, { target: { value: '50' } });
    fireEvent.blur(fleetSizeInput);

    expect(screen.getByTestId('run-state-badge')).toHaveTextContent('Stale');
    expect(revenue2037Cell).toHaveTextContent(previousRevenue ?? '');

    act(() => {
      vi.advanceTimersByTime(MOCK_RECALC_DEBOUNCE_MS);
    });

    expect(screen.getByTestId('run-state-badge')).toHaveTextContent('Calculating');

    act(() => {
      vi.advanceTimersByTime(MOCK_CALCULATION_DELAY_MS);
    });

    expect(screen.getByTestId('run-state-badge')).toHaveTextContent('Ready');
    expect(
      screen.getByTestId(
        'statement-cell-statement-table-income-statement-revenue-CY-2037',
      ).textContent,
    ).not.toBe(previousRevenue);
  });
});
