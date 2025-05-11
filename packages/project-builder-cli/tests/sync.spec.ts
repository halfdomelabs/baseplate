import {
  expect,
  getInitializedTestProjectDefinition,
  test,
} from './fixtures/server-fixture.test-helper.js';

test('can sync a minimal project', async ({ page, addProject }) => {
  const { makeUrl } = await addProject({
    ...getInitializedTestProjectDefinition(),
    apps: [
      {
        name: 'test-app',
        id: 'test-app',
        type: 'backend',
        packageLocation: 'packages/backend',
      },
    ],
    features: [
      {
        name: 'test-feature',
        id: 'test-feature',
      },
    ],
    models: [
      {
        name: 'TestModel',
        id: 'test-model',
        featureRef: 'test-feature',
        model: {
          fields: [
            {
              name: 'id',
              id: 'id',
              type: 'string',
            },
          ],
          primaryKeyFieldRefs: ['id'],
        },
      },
    ],
  });

  await page.goto(makeUrl('/'));

  await page.getByTestId('sync-button').click();

  await expect(page.getByTestId('sync-button')).toHaveText('Syncing...');

  await expect(page.getByText('Synced')).toBeVisible({
    // this might take a while to sync
    timeout: 30_000,
  });
});
