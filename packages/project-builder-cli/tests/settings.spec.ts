import { expect, test } from './fixtures/server-fixture.test-helper.js';

test('can save a simple update to the settings of the project', async ({
  page,
  addInitializedProject,
}) => {
  const { makeUrl } = await addInitializedProject();

  await page.goto(makeUrl('settings/project-settings'));

  await page.getByLabel('Project Name').fill('new-project-2');
  await page.getByText('Save').click();
  await expect(page.getByLabel('Project Name')).toHaveValue('new-project-2');

  await page.goto(makeUrl('settings/project-settings'));
  await expect(page.getByLabel('Project Name')).toHaveValue('new-project-2');
});

test('can update the project name if modified externally', async ({
  page,
  addInitializedProject,
}) => {
  const { makeUrl, readProjectDefinition, writeProjectDefinition } =
    await addInitializedProject();

  const projectDefinition = await readProjectDefinition();

  await page.goto(makeUrl('settings/project-settings'));
  await expect(page.getByLabel('Project Name')).toHaveValue(
    projectDefinition.name,
  );

  // write project definition with new name
  projectDefinition.name = 'new-project-name';
  await writeProjectDefinition(projectDefinition);

  await expect(page.getByLabel('Project Name')).toHaveValue('new-project-name');
});
