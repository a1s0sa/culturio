import { expect, test } from '@playwright/test';
test('homepage exposes the archive and museum boundaries', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Discover Africa's history/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Explore the archive' })).toHaveAttribute(
    'href',
    '/gallery'
  );
  await expect(page.getByRole('link', { name: /virtual museum/i })).toHaveAttribute(
    'href',
    '/museum'
  );
});
test('gallery has accessible search, filters, and an intentional empty state', async ({ page }) => {
  await page.goto('/gallery');
  await expect(page.getByRole('heading', { name: 'Explore the archive' })).toBeVisible();
  await expect(page.getByLabel('Search archive')).toBeVisible();
  await expect(page.getByRole('button', { name: /End of the archive|Load more/ })).toBeVisible();
});
test('search state is represented in the URL', async ({ page }) => {
  await page.goto('/gallery');
  await page.getByLabel('Search archive').fill('Benin');
  await expect(page).toHaveURL(/q=Benin/i, { timeout: 2_000 });
});
