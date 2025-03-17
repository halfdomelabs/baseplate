import { expect, test } from './fixtures/server-fixture.test-helper.js';

test('shows initialize page with header', async ({ page, serviceUrl }) => {
  await page.goto(serviceUrl);

  await expect(page.getByText('Welcome to Baseplate')).toBeVisible();
});
