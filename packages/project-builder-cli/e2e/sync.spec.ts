import {
  appEntityType,
  featureEntityType,
  modelEntityType,
  modelScalarFieldEntityType,
} from '@baseplate-dev/project-builder-lib';

import {
  expect,
  getInitializedTestProjectDefinition,
  test,
} from './fixtures/server-fixture.test-helper.js';

test('can sync a minimal project', async ({ page, addProject }) => {
  const modelId = modelEntityType.idFromKey('test-model');
  const featureId = featureEntityType.idFromKey('test-feature');
  const appId = appEntityType.idFromKey('test-app');
  const fieldId = modelScalarFieldEntityType.idFromKey('test-field');

  const { startUrl } = await addProject({
    ...getInitializedTestProjectDefinition(),
    apps: [
      {
        name: 'test-app',
        id: appId,
        type: 'backend',
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

  await page.goto(startUrl);

  await page.getByTestId('sync-button').click();

  await expect(page.getByTestId('sync-button')).toHaveText('Syncing...');

  await expect(page.getByText('Synced')).toBeVisible({
    // this might take a while to sync
    timeout: 30_000,
  });
});
