import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../../../app/AppRoutes';
import { renderWithRouter } from '../../../test/renderApp';

describe('Assumptions panel refinements', () => {
  it('opens the full assumptions view from the sidebar and removes favorites controls', async () => {
    const user = userEvent.setup();
    renderWithRouter(<AppRoutes />, '/');

    expect(screen.getAllByText('Quick edit').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /favorites/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/^favorites$/i)).not.toBeInTheDocument();

    await user.click(screen.getByTestId('open-full-assumptions-link'));

    expect(
      screen.getByRole('heading', { name: 'Assumptions', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('nav-link-assumptions')).not.toBeInTheDocument();
  });

  it('keeps dense assumption rows separated without duplicate visible input labels', () => {
    renderWithRouter(<AppRoutes />, '/assumptions');

    const field = screen.getByTestId('page-assumption-field-a2_fleet.number_of_trucks.cy_2027');
    const visibleLabels = field.querySelectorAll('label:not(.sr-only)');

    expect(field.querySelector('.grid')).not.toBeNull();
    expect(within(field).getByTestId('page-truck-year-select')).toBeInTheDocument();
    expect(
      within(field).getByTestId('page-assumption-input-a2_fleet.number_of_trucks.cy_2027'),
    ).toBeInTheDocument();
    expect(visibleLabels).toHaveLength(1);
  });

  it('stacks the sidebar assumption input above the text block in narrow sidebar cards', () => {
    renderWithRouter(<AppRoutes />, '/');

    const field = screen.getByTestId('sidebar-assumption-field-a2_fleet.number_of_trucks.cy_2027');
    const input = within(field).getByTestId(
      'sidebar-assumption-input-a2_fleet.number_of_trucks.cy_2027',
    );
    const title = within(field).getByRole('heading', {
      level: 4,
      name: /Number Of Trucks \(CY-2027\)/i,
    });

    expect(input.closest('.w-full')).not.toBeNull();
    expect(title.closest('.space-y-3')).not.toBeNull();
  });

  it('uses a year selector for annual truck inputs instead of rendering the full annual list', async () => {
    const user = userEvent.setup();
    renderWithRouter(<AppRoutes />, '/assumptions');

    expect(screen.getByTestId('page-truck-year-select')).toBeInTheDocument();
    expect(screen.queryByText(/Number Of Trucks \(CY-2028\)/i)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByTestId('page-truck-year-select'), [
      'a2_fleet.number_of_trucks.cy_2030',
    ]);

    expect(
      screen.getByTestId('page-assumption-field-a2_fleet.number_of_trucks.cy_2030'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('page-assumption-input-a2_fleet.number_of_trucks.cy_2030'),
    ).toBeInTheDocument();
  });

  it('switches display currency from the assumptions workspace controls', async () => {
    const user = userEvent.setup();
    renderWithRouter(<AppRoutes />, '/assumptions');

    const field = screen.getByTestId('page-assumption-field-integrated.platform.fee_per_swap_usd');
    const pageHeader = screen
      .getByRole('heading', { name: 'Assumptions', level: 1 })
      .closest('section');

    expect(pageHeader).not.toBeNull();
    expect(within(field).getAllByText('$').length).toBeGreaterThan(0);

    await user.click(within(pageHeader as HTMLElement).getByTestId('display-currency-etb'));

    expect(within(field).getAllByText('ETB').length).toBeGreaterThan(0);
    expect(localStorage.getItem('a2-shell-store')).toContain('"displayCurrency":"ETB"');
  });

  it('lets the user edit the display exchange rate directly from the currency control', async () => {
    const user = userEvent.setup();
    renderWithRouter(<AppRoutes />, '/assumptions');

    const pageHeader = screen
      .getByRole('heading', { name: 'Assumptions', level: 1 })
      .closest('section');

    expect(pageHeader).not.toBeNull();

    const fxInput = within(pageHeader as HTMLElement).getByTestId(
      'display-currency-fx-rate-input',
    );

    expect(fxInput).toHaveValue('155.0');

    await user.clear(fxInput);
    await user.type(fxInput, '160');
    await user.tab();

    expect(fxInput).toHaveValue('160.0');
  });
});
