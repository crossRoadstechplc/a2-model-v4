import { act, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { AppRoutes } from '../../../app/AppRoutes';
import {
  MOCK_CALCULATION_DELAY_MS,
  MOCK_RECALC_DEBOUNCE_MS,
} from '../../../store/modelStore';
import { renderWithRouter } from '../../../test/renderApp';

describe('run-state workflow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps dashboards empty until calculate is clicked and then shows workbook outputs', async () => {
    renderWithRouter(<AppRoutes />);

    expect(
      screen.getByText(/Run the model to populate the executive summary/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId('run-state-badge')).toHaveTextContent(
      'Not calculated',
    );

    fireEvent.click(screen.getByTestId('calculate-button'));

    expect(screen.getByTestId('run-state-badge')).toHaveTextContent(
      'Calculating',
    );

    act(() => {
      vi.advanceTimersByTime(MOCK_CALCULATION_DELAY_MS);
    });

    expect(
      screen.getByTestId('kpi-card-investor_25_stake_value'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('run-state-badge')).toHaveTextContent('Ready');
  });

  it('keeps the last successful results visible while stale and during recalculation', async () => {
    renderWithRouter(<AppRoutes />);

    fireEvent.click(screen.getByTestId('calculate-button'));

    act(() => {
      vi.advanceTimersByTime(MOCK_CALCULATION_DELAY_MS);
    });

    const previousValue = screen.getByTestId(
      'kpi-card-investor_25_stake_value-value',
    ).textContent;
    const assumptionsSidebar = screen.getByTestId('assumptions-sidebar');

    fireEvent.click(within(assumptionsSidebar).getByRole('button', { name: /Fleet/i }));

    const fleetSizeInput = screen.getByTestId(
      'sidebar-assumption-input-a2_fleet.number_of_trucks.cy_2027',
    );

    fireEvent.focus(fleetSizeInput);
    fireEvent.change(fleetSizeInput, { target: { value: '50' } });
    fireEvent.blur(fleetSizeInput);

    expect(screen.getByTestId('run-state-badge')).toHaveTextContent('Stale');
    expect(
      screen.getByTestId('kpi-card-investor_25_stake_value-value'),
    ).toHaveTextContent(previousValue ?? '');

    act(() => {
      vi.advanceTimersByTime(MOCK_RECALC_DEBOUNCE_MS);
    });

    expect(screen.getByTestId('run-state-badge')).toHaveTextContent(
      'Calculating',
    );
    expect(
      screen.getByTestId('kpi-card-investor_25_stake_value-value'),
    ).toHaveTextContent(previousValue ?? '');

    act(() => {
      vi.advanceTimersByTime(MOCK_CALCULATION_DELAY_MS);
    });

    expect(screen.getByTestId('run-state-badge')).toHaveTextContent('Ready');
    expect(
      screen.getByTestId('kpi-card-investor_25_stake_value-value').textContent,
    ).not.toBe(previousValue);
  });
});
