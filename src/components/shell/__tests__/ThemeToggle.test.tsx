import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../../../app/AppRoutes';
import { renderWithRouter } from '../../../test/renderApp';

describe('Theme toggle', () => {
  it('uses icons instead of mode text and persists dark mode', async () => {
    const user = userEvent.setup();
    renderWithRouter(<AppRoutes />);

    const themeToggle = screen.getByTestId('theme-toggle');
    expect(themeToggle).toHaveAttribute('title', 'Switch to dark mode');
    expect(themeToggle).not.toHaveTextContent(/light mode|dark mode/i);

    await user.click(themeToggle);

    await waitFor(() => {
      expect(document.documentElement).toHaveClass('dark');
    });

    expect(themeToggle).toHaveAttribute('title', 'Switch to light mode');
    expect(localStorage.getItem('a2-shell-store')).toContain('"theme":"dark"');
  });
});
