import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { AppRoutes } from '../../../app/AppRoutes';
import { MOCK_CALCULATION_DELAY_MS } from '../../../store/modelStore';
import { renderWithRouter } from '../../../test/renderApp';

describe('SaveExportDashboard integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows report export actions after the first successful calculation', () => {
    renderWithRouter(<AppRoutes />, '/save-export');

    expect(
      screen.getByRole('heading', { name: 'Save / Export', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('save-export-pdf-download')).toHaveTextContent(
      'Available after calculation',
    );
    expect(screen.queryByText(/Download JSON/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Download Markdown/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('calculate-button'));

    act(() => {
      vi.advanceTimersByTime(MOCK_CALCULATION_DELAY_MS);
    });

    expect(screen.getByTestId('save-export-pdf-download')).toHaveAttribute(
      'download',
      'a2-model-base-reference-summary.pdf',
    );
  });
});
