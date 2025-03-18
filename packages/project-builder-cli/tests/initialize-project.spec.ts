import { expect, test } from './fixtures/server-fixture.test-helper.js';

test('can initialize project', async ({ page, addProject }) => {
  const { startUrl } = await addProject();
  await page.goto(startUrl);

  await expect(page.getByText('Welcome to Baseplate')).toBeVisible();

  await page.getByLabel('Project Name').fill('new-project');
  await page.getByLabel('Port Offset').fill('6000');
  await page.getByText('Initialize Project').click();

  await expect(page.getByText('Baseplate Project Builder')).toBeVisible();

  await page.getByText('Settings').click();
  await expect(page.getByLabel('Project Name')).toHaveValue('new-project');
  await expect(page.getByLabel('Port Offset')).toHaveValue('6000');
});
