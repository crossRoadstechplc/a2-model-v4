import { screen } from '@testing-library/react';
import { AppRoutes } from '../../../app/AppRoutes';
import { renderWithRouter } from '../../../test/renderApp';

describe('Documentation dashboard', () => {
  it('renders an in-app explanation of the modeling system', () => {
    renderWithRouter(<AppRoutes />, '/documentation');

    expect(
      screen.getByRole('heading', { name: 'Documentation', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText('How the system is structured')).toBeInTheDocument();
    expect(screen.getByText('How A2 Fleet modeling works')).toBeInTheDocument();
    expect(screen.getByText('How recalculation and freshness work')).toBeInTheDocument();
    expect(
      screen.queryByText(/Reference materials, methodology notes, and source documentation links/i),
    ).not.toBeInTheDocument();
  });
});
