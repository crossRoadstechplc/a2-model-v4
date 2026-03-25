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
  });
});
