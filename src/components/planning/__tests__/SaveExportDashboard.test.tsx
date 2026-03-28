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
    expect(screen.getByTestId('save-export-summary-download')).toHaveTextContent(
      'Available after calculation',
    );

    fireEvent.click(screen.getByTestId('calculate-button'));

    act(() => {
      vi.advanceTimersByTime(MOCK_CALCULATION_DELAY_MS);
    });

    expect(screen.getByTestId('save-export-summary-download')).toHaveAttribute(
      'download',
      'a2-model-base-reference-summary.md',
    );
    expect(screen.getByTestId('save-export-report-pack-download')).toHaveAttribute(
      'download',
      'a2-model-base-reference-report-pack.json',
    );
    expect(
      screen.getByTestId('save-export-validation-markdown-download'),
    ).toHaveAttribute(
      'download',
      'a2-fleet-validation-report.md',
    );
  });
});
