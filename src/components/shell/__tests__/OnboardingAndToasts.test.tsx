import { act, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { WALKTHROUGH_STEP_COUNT } from '../../../app/walkthroughContent';
import { AppRoutes } from '../../../app/AppRoutes';
import {
  MOCK_CALCULATION_DELAY_MS,
  MOCK_RECALC_DEBOUNCE_MS,
} from '../../../store/modelStore';
import { renderWithRouter } from '../../../test/renderApp';

describe('walkthrough and calculation notifications', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens the animated walkthrough on app load, supports the full step flow, and reopens from the header', () => {
    renderWithRouter(<AppRoutes />);

    expect(screen.getByTestId('app-walkthrough')).toBeInTheDocument();
    expect(screen.getByTestId('walkthrough-card')).toBeInTheDocument();
    expect(screen.getByText(/Primary navigation/i)).toBeInTheDocument();
    expect(screen.getByTestId('walkthrough-progress')).toHaveTextContent(
      `Step 1 of ${WALKTHROUGH_STEP_COUNT}`,
    );
    expect(screen.getByTestId('walkthrough-spotlight')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('walkthrough-next'));

    expect(screen.getByText(/Entity and analysis tabs/i)).toBeInTheDocument();
    expect(screen.getByTestId('walkthrough-progress')).toHaveTextContent(
      `Step 2 of ${WALKTHROUGH_STEP_COUNT}`,
    );

    fireEvent.click(
      screen.getByTestId(`walkthrough-step-${WALKTHROUGH_STEP_COUNT - 1}`),
    );

    expect(screen.getByText(/How to explore effectively/i)).toBeInTheDocument();
    expect(screen.getByTestId('walkthrough-progress')).toHaveTextContent(
      `Step ${WALKTHROUGH_STEP_COUNT} of ${WALKTHROUGH_STEP_COUNT}`,
    );

    fireEvent.click(screen.getByTestId('walkthrough-close'));
    expect(screen.queryByTestId('app-walkthrough')).not.toBeInTheDocument();

    const walkthroughButton = screen.getByTestId('walkthrough-toggle');
    expect(walkthroughButton).toHaveAttribute('title', 'Open guided walkthrough');

    fireEvent.click(walkthroughButton);

    expect(screen.getByTestId('app-walkthrough')).toBeInTheDocument();
    expect(screen.getByText(/Primary navigation/i)).toBeInTheDocument();
  });

  it('stacks recalculation toasts, lists affected areas, and supports dismissing all at once', () => {
    renderWithRouter(<AppRoutes />);

    fireEvent.click(screen.getByTestId('walkthrough-close'));
    fireEvent.click(screen.getByTestId('calculate-button'));

    const toastStack = screen.getByTestId('calculation-toast-stack');
    expect(toastStack).toBeInTheDocument();
    expect(within(toastStack).getByText(/Initial calculation started/i)).toBeInTheDocument();
    expect(within(toastStack).getByText(/Executive Summary/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(MOCK_CALCULATION_DELAY_MS);
    });

    const fleetSizeInput = screen.getByTestId(
      'sidebar-assumption-input-a2_fleet.number_of_trucks.cy_2027',
    );
    fireEvent.focus(fleetSizeInput);
    fireEvent.change(fleetSizeInput, { target: { value: '50' } });
    fireEvent.blur(fleetSizeInput);

    act(() => {
      vi.advanceTimersByTime(MOCK_RECALC_DEBOUNCE_MS);
    });

    fireEvent.click(screen.getByTestId('calculate-button'));

    expect(within(toastStack).getByText(/Recalculation started/i)).toBeInTheDocument();
    expect(within(toastStack).getByText(/Changes in Fleet/i)).toBeInTheDocument();
    expect(within(toastStack).getAllByText(/A2 Fleet/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId('dismiss-all-toasts')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('dismiss-all-toasts'));
    expect(screen.queryByTestId('calculation-toast-stack')).not.toBeInTheDocument();
  });

  it('supports dismissing an individual calculation toast', () => {
    renderWithRouter(<AppRoutes />);

    fireEvent.click(screen.getByTestId('walkthrough-close'));
    fireEvent.click(screen.getByTestId('calculate-button'));

    expect(screen.getByTestId('calculation-toast-stack')).toBeInTheDocument();

    const dismissButtons = screen.getAllByTestId(/dismiss-toast-/);
    fireEvent.click(dismissButtons[0]);

    expect(screen.queryByTestId('calculation-toast-stack')).not.toBeInTheDocument();
  });
});
