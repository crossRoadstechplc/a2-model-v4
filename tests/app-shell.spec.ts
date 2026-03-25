import { expect, test, type Page } from '@playwright/test';

async function dismissWalkthroughIfVisible(page: Page) {
  const walkthrough = page.getByTestId('app-walkthrough');

  if (await walkthrough.isVisible().catch(() => false)) {
    await page.getByTestId('walkthrough-close').click();
    await expect(walkthrough).toBeHidden();
  }
}

test('first run and post-run assumption edits refresh workbook outputs', async ({
  page,
}) => {
  await page.goto('/');
  await dismissWalkthroughIfVisible(page);

  await expect(
    page.getByText('Run the model to populate the executive summary'),
  ).toBeVisible();

  await page.getByTestId('calculate-button').click();
  await expect(page.getByTestId('run-state-badge')).toHaveText('Calculating');
  await expect(page.getByTestId('kpi-card-investor_25_stake_value')).toBeVisible();
  await expect(page.getByTestId('run-state-badge')).toHaveText('Ready');

  const previousValue = await page
    .getByTestId('kpi-card-investor_25_stake_value-value')
    .textContent();

  await page.getByTestId('open-full-assumptions-link').click();
  await expect(
    page.getByRole('heading', { name: 'Assumptions', level: 1 }),
  ).toBeVisible();

  const fleetSizeInput = page.getByTestId(
    'page-assumption-input-a2_fleet.number_of_trucks.cy_2027',
  );
  await fleetSizeInput.click();
  await fleetSizeInput.fill('50');
  await fleetSizeInput.blur();

  await expect(page.getByTestId('run-state-badge')).toHaveText('Stale');

  await page.getByTestId('nav-link-executive-summary').click();
  await expect(
    page.getByTestId('kpi-card-investor_25_stake_value-value'),
  ).toHaveText(previousValue ?? '');
  await expect(page.getByTestId('run-state-badge')).toHaveText(/Calculating|Stale/);

  await expect(page.getByTestId('run-state-badge')).toHaveText('Ready');
  await expect(
    page.getByTestId('kpi-card-investor_25_stake_value-value'),
  ).not.toHaveText(previousValue ?? '');
});
