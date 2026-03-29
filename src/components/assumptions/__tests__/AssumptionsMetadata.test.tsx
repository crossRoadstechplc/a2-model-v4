import { screen, within } from '@testing-library/react';
import { AppRoutes } from '../../../app/AppRoutes';
import { renderWithRouter } from '../../../test/renderApp';

describe('assumptions metadata integration', () => {
  it('renders assumption groups from metadata on the full assumptions page', () => {
    renderWithRouter(<AppRoutes />, '/assumptions');

    expect(
      screen.getByRole('heading', { name: 'Assumptions', level: 1 }),
    ).toBeInTheDocument();
    const main = within(screen.getByRole('main'));
    const sectionHeadings = main.getAllByRole('heading', { level: 3 });

    expect(sectionHeadings[0]).toHaveTextContent('Timing / Horizon');
    expect(
      main.getByRole('heading', { name: 'Global / Macro', level: 3 }),
    ).toBeInTheDocument();
    expect(main.getByRole('heading', { name: 'Fleet', level: 3 })).toBeInTheDocument();
    expect(
      main.getByRole('heading', { name: 'Platform', level: 3 }),
    ).toBeInTheDocument();
    expect(main.getByRole('heading', { name: 'Energy', level: 3 })).toBeInTheDocument();
    expect(
      main.getByRole('heading', { name: 'Financing', level: 3 }),
    ).toBeInTheDocument();
    expect(
      main.getByRole('heading', {
        name: /Number Of Trucks Added/i,
        level: 4,
      }),
    ).toBeInTheDocument();
    expect(
      main.getByTestId('page-annual-year-select-fleet-assumptions-data-number-of-trucks-added'),
    ).toBeInTheDocument();
    expect(
      main.getByTestId('page-annual-year-select-fleet-assumptions-data-number-of-stations'),
    ).toBeInTheDocument();
    expect(
      main.getByTestId(
        'page-annual-year-select-fleet-assumptions-data-number-of-swaps-per-truck-per-day',
      ),
    ).toBeInTheDocument();
    expect(
      main.getByTestId(
        'page-annual-year-select-energy-assumptions-data-number-of-swapping-bays-per-station',
      ),
    ).toBeInTheDocument();
  });
});
