import {
  appEntityType,
  featureEntityType,
  modelEntityType,
  modelScalarFieldEntityType,
} from '@halfdomelabs/project-builder-lib';

import {
  expect,
  getInitializedTestProjectDefinition,
  test,
} from './fixtures/server-fixture.test-helper.js';

test('can sync a minimal project', async ({ page, addProject }) => {
  const modelId = modelEntityType.fromUid('test-model');
  const featureId = featureEntityType.fromUid('test-feature');
  const appId = appEntityType.fromUid('test-app');
  const fieldId = modelScalarFieldEntityType.fromUid('test-field');

  const { makeUrl } = await addProject({
    ...getInitializedTestProjectDefinition(),
    apps: [
      {
        name: 'test-app',
        id: appId,
        type: 'backend',
        packageLocation: 'packages/backend',
      },
    ],
    features: [
      {
        name: 'test-feature',
        id: featureId,
      },
    ],
    models: [
      {
        name: 'TestModel',
        id: modelId,
        featureRef: 'test-feature',
        model: {
          fields: [
            {
              name: 'id',
              id: fieldId,
              type: 'string',
              isOptional: false,
              options: {
                default: '',
                genUuid: true,
              },
            },
          ],
          primaryKeyFieldRefs: ['id'],
        },
        service: {
          create: {
            enabled: false,
          },
          update: {
            enabled: false,
          },
          delete: {
            enabled: false,
          },
          transformers: [],
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
