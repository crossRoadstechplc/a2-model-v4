import { expect, test, type Page } from '@playwright/test';

async function dismissWalkthroughIfVisible(page: Page) {
  const walkthrough = page.getByTestId('app-walkthrough');

  if (await walkthrough.isVisible().catch(() => false)) {
    await page.getByTestId('walkthrough-close').click();
    await expect(walkthrough).toBeHidden();
  }
}

test('validation report renders the workbook baseline reconciliation gate', async ({
  page,
}) => {
  await page.goto('/validation-report');
  await dismissWalkthroughIfVisible(page);

  await expect(
    page.getByRole('heading', { name: 'Validation Report', level: 1 }),
  ).toBeVisible();
  await expect(page.getByTestId('validation-fit-summary')).toHaveText(
    'Fit to proceed',
  );
  await expect(page.getByTestId('validation-assumptions-matched-count')).toHaveText(
    '33',
  );
  await expect(page.getByTestId('validation-outputs-passed-count')).toHaveText('8');
  await page.getByRole('button', { name: /^Export Artifacts/ }).click();
  await expect(page.getByTestId('validation-json-download')).toHaveAttribute(
    'download',
    'a2-fleet-validation-report.json',
  );
});
