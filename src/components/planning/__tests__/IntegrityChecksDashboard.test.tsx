import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { AppRoutes } from '../../../app/AppRoutes';
import {
  MOCK_CALCULATION_DELAY_MS,
} from '../../../store/modelStore';
import { useAppStore } from '../../../store/appStore';
import { renderWithRouter } from '../../../test/renderApp';

describe('Integrity Checks integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows grouped severity surfaces and freshness warnings when outputs go stale', () => {
    renderWithRouter(<AppRoutes />, '/integrity-checks');

    expect(
      screen.getByText(/Run the model to populate integrity checks/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('calculate-button'));

    act(() => {
      vi.advanceTimersByTime(MOCK_CALCULATION_DELAY_MS);
    });

    act(() => {
      useAppStore
        .getState()
        .setAssumption('integrated.platform.fee_per_swap_usd', 40);
    });

    expect(screen.getByRole('heading', { name: 'Integrity Checks', level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId('run-state-badge')).toHaveTextContent('Stale');
    expect(screen.getByTestId('integrity-group-warnings')).toBeInTheDocument();
    expect(screen.getByText(/checks currently grouped under warnings/i)).toBeInTheDocument();
  });

  it('surfaces platform capacity warnings when the generated policy is exceeded', () => {
    renderWithRouter(<AppRoutes />, '/integrity-checks');

    act(() => {
      useAppStore
        .getState()
        .setAssumption('a2_fleet.number_of_swaps_per_truck_per_day.quantity', 20);
    });

    fireEvent.click(screen.getByTestId('calculate-button'));

    act(() => {
      vi.advanceTimersByTime(MOCK_CALCULATION_DELAY_MS);
    });

    expect(screen.getByText(/Platform capacity sufficiency/i)).toBeInTheDocument();
    expect(
      screen.getByText(/show insufficient swap or charging capacity under the generated policy/i),
    ).toBeInTheDocument();
  });
});
