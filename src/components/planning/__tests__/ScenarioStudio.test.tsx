import { fireEvent, screen, within } from '@testing-library/react';
import { AppRoutes } from '../../../app/AppRoutes';
import { renderWithRouter } from '../../../test/renderApp';

describe('Scenario Studio integration', () => {
  it('creates, loads, and compares scenarios side by side', () => {
    renderWithRouter(<AppRoutes />, '/scenarios');

    fireEvent.change(screen.getByTestId('scenario-create-name'), {
      target: { value: 'Downside' },
    });
    fireEvent.click(screen.getByTestId('scenario-create-button'));

    const scenarioCard = screen.getByTestId('scenario-card-scenario-2');
    expect(scenarioCard).toBeInTheDocument();
    expect(screen.getByTestId('scenario-chip-scenario-2')).toBeInTheDocument();

    const probabilityInput = screen.getByTestId('scenario-probability-scenario-2');
    fireEvent.focus(probabilityInput);
    fireEvent.change(probabilityInput, { target: { value: '35' } });
    fireEvent.blur(probabilityInput);

    fireEvent.click(screen.getByTestId('scenario-compare-base-reference'));
    fireEvent.click(screen.getByTestId('scenario-compare-scenario-2'));

    expect(screen.getByTestId('scenario-compare-panel')).toBeInTheDocument();
    expect(screen.getByText(/Total probability 135.0%/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('scenario-load-scenario-2'));
    expect(within(scenarioCard).getByText('Active')).toBeInTheDocument();
  });
});
