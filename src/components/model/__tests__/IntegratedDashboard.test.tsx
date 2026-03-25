import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { AppRoutes } from '../../../app/AppRoutes';
import {
  MOCK_CALCULATION_DELAY_MS,
  MOCK_RECALC_DEBOUNCE_MS,
} from '../../../store/modelStore';
import { renderWithRouter } from '../../../test/renderApp';

describe('integrated dashboard routing and recalculation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders platform assumptions in the sidebar and refreshes outputs after edits', () => {
    renderWithRouter(<AppRoutes />, '/a2-platform');

    expect(
      screen.getByText(/Run the model to populate the A2 Platform page/i),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('sidebar-assumption-input-integrated.platform.fee_per_swap_usd'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('calculate-button'));

    act(() => {
      vi.advanceTimersByTime(MOCK_CALCULATION_DELAY_MS);
    });

    expect(screen.getByText('Returns / Valuation')).toBeInTheDocument();
    expect(screen.getByText('Capacity / Infrastructure')).toBeInTheDocument();

    const revenueValue = screen.getByTestId('kpi-card-platform_revenue-value');
    const previousValue = revenueValue.textContent;

    const feeInput = screen.getByTestId(
      'sidebar-assumption-input-integrated.platform.fee_per_swap_usd',
    );
    fireEvent.focus(feeInput);
    fireEvent.change(feeInput, { target: { value: '40' } });
    fireEvent.blur(feeInput);

    expect(screen.getByTestId('run-state-badge')).toHaveTextContent('Stale');
    expect(revenueValue).toHaveTextContent(previousValue ?? '');

    act(() => {
      vi.advanceTimersByTime(MOCK_RECALC_DEBOUNCE_MS);
    });

    expect(screen.getByTestId('run-state-badge')).toHaveTextContent('Calculating');
    expect(revenueValue).toHaveTextContent(previousValue ?? '');

    act(() => {
      vi.advanceTimersByTime(MOCK_CALCULATION_DELAY_MS);
    });

    expect(screen.getByTestId('run-state-badge')).toHaveTextContent('Ready');
    expect(screen.getByTestId('kpi-card-platform_revenue-value').textContent).not.toBe(
      previousValue,
    );
    expect(screen.getByTestId('platform-capacity-table')).toBeInTheDocument();
    expect(screen.getByTestId('platform-capacity-kpis')).toBeInTheDocument();
  });

  it('shows the compact platform capacity summary on the executive page after calculate', () => {
    renderWithRouter(<AppRoutes />, '/');

    fireEvent.click(screen.getByTestId('calculate-button'));

    act(() => {
      vi.advanceTimersByTime(MOCK_CALCULATION_DELAY_MS);
    });

    expect(screen.getByText(/Platform Capacity Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/infrastructure sizing linked to the current fleet truck path/i)).toBeInTheDocument();
  });

  it('shows a pending returns section on the consolidated page', () => {
    renderWithRouter(<AppRoutes />, '/corridor-view');

    fireEvent.click(screen.getByTestId('calculate-button'));

    act(() => {
      vi.advanceTimersByTime(MOCK_CALCULATION_DELAY_MS);
    });

    fireEvent.click(screen.getByRole('button', { name: /Returns \/ Valuation/i }));

    expect(screen.getByTestId('consolidated-returns-grid')).toBeInTheDocument();
    expect(screen.getByTestId('returns-card-equity_irr-value')).toHaveTextContent('Pending');
  });
});
