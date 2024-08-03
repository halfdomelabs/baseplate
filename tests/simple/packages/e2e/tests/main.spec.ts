import { test, expect } from '@playwright/test';

test('loads list of blog posts', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  const blogList = await page.getByTestId('blog-list');
  await blogList.waitFor({ state: 'visible' });
  await expect(blogList).toContainText('First post');
  await expect(blogList).toContainText('Hello world!');
  await expect(blogList).toContainText('Goodbye world!');
});
