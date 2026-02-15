import { expect, test } from '@playwright/test';

test('loads list of blog posts', async ({ page }) => {
  await page.goto('http://localhost:3030/');

  const blogList = page.getByTestId('blog-list');
  await blogList.waitFor({ state: 'visible' });
  await expect(blogList).toContainText('First post');
  await expect(blogList).toContainText('Hello world!');
  await expect(blogList).toContainText('Goodbye world!');
});
