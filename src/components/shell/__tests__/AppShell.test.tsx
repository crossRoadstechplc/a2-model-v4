import { screen } from '@testing-library/react';
import { AppRoutes } from '../../../app/AppRoutes';
import { renderWithRouter } from '../../../test/renderApp';

describe('App shell layout', () => {
  it('renders grouped navigation and keeps the assumptions route out of the primary nav', () => {
    renderWithRouter(<AppRoutes />, '/a2-platform');

    expect(
      screen.getByRole('navigation', { name: 'Primary navigation' }),
    ).toBeInTheDocument();
    expect(screen.getByAltText('A2 Model logo')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'A2 Platform', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('assumptions-sidebar')).toHaveAttribute(
      'data-state',
      'open',
    );
    expect(screen.getByTestId('utility-panel')).toHaveAttribute(
      'data-state',
      'closed',
    );
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Entities')).toBeInTheDocument();
    expect(screen.queryByTestId('nav-link-assumptions')).not.toBeInTheDocument();
  });
});
