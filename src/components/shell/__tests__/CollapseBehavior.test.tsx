import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../../../app/AppRoutes';
import { renderWithRouter } from '../../../test/renderApp';

describe('Sidebar behavior', () => {
  it('collapses and expands the primary and assumptions sidebars independently', async () => {
    const user = userEvent.setup();
    renderWithRouter(<AppRoutes />);

    expect(screen.getByTestId('primary-sidebar')).toHaveAttribute('data-state', 'open');
    expect(screen.getByTestId('assumptions-sidebar')).toHaveAttribute(
      'data-state',
      'open',
    );

    await user.click(screen.getByTestId('primary-sidebar-toggle'));
    expect(screen.getByTestId('primary-sidebar')).toHaveAttribute('data-state', 'closed');
    expect(screen.getByTestId('assumptions-sidebar')).toHaveAttribute(
      'data-state',
      'open',
    );
    expect(
      within(screen.getByTestId('primary-sidebar')).getByRole('link', {
        name: 'Executive Summary',
      }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('primary-sidebar')).queryByText('Executive Summary'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByTestId('assumptions-toggle'));
    expect(screen.getByTestId('assumptions-sidebar')).toHaveAttribute(
      'data-state',
      'closed',
    );
    expect(screen.getByTestId('primary-sidebar')).toHaveAttribute('data-state', 'closed');

    await user.click(screen.getByTestId('primary-sidebar-toggle'));
    expect(screen.getByTestId('primary-sidebar')).toHaveAttribute('data-state', 'open');
    expect(screen.getByTestId('assumptions-sidebar')).toHaveAttribute(
      'data-state',
      'closed',
    );

    await user.click(screen.getByTestId('assumptions-toggle'));
    expect(screen.getByTestId('assumptions-sidebar')).toHaveAttribute(
      'data-state',
      'open',
    );
  });

  it('resizes the assumptions sidebar within min and max bounds', () => {
    renderWithRouter(<AppRoutes />);

    const sidebar = screen.getByTestId('assumptions-sidebar');
    const handle = screen.getByTestId('assumptions-resize-handle');

    expect(sidebar).toHaveAttribute('data-width', '360');

    fireEvent.mouseDown(handle, { clientX: 360 });
    fireEvent.mouseMove(window, { clientX: 430 });
    expect(sidebar).toHaveAttribute('data-width', '430');

    fireEvent.mouseMove(window, { clientX: 900 });
    expect(sidebar).toHaveAttribute('data-width', '560');

    fireEvent.mouseMove(window, { clientX: 100 });
    expect(sidebar).toHaveAttribute('data-width', '320');

    fireEvent.mouseUp(window);
  });

  it('keeps sidebars and main workspace independently scrollable', () => {
    renderWithRouter(<AppRoutes />);

    expect(screen.getByTestId('primary-sidebar-scroll')).toHaveClass('overflow-y-auto');
    expect(screen.getByTestId('assumptions-sidebar-scroll')).toHaveClass(
      'overflow-y-auto',
    );
    expect(screen.getByTestId('main-workspace-scroll')).toHaveClass('overflow-y-auto');
  });
});
