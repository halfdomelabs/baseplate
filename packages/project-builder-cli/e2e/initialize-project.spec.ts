import { expect, test } from './fixtures/server-fixture.test-helper.js';

test('can initialize a barebones project via "Just the basics"', async ({
  page,
  addProject,
}) => {
  const { startUrl, readProjectDefinition } = await addProject();
  await page.goto(startUrl);

  await expect(
    page.getByRole('heading', { name: 'Create a new project' }),
  ).toBeVisible();

  await page.getByLabel('Project name').fill('barebones-project');

  // "Just the basics" only appears once plugins finish loading.
  await page.getByRole('button', { name: 'Just the basics' }).click();

  // Post-init landing page renders.
  await expect(
    page.getByRole('heading', { name: 'Welcome to Baseplate' }),
  ).toBeVisible();
  await expect(page.getByText('barebones-project').first()).toBeVisible();

  // Saved project should be marked initialized with no plugins enabled and
  // the default apps (backend + web + admin) scaffolded.
  const projectDefinition = await readProjectDefinition();
  expect(projectDefinition.isInitialized).toBe(true);
  expect(projectDefinition.settings.general.name).toBe('barebones-project');
  expect(projectDefinition.plugins ?? []).toEqual([]);
  expect(projectDefinition.apps.map((app) => app.name).toSorted()).toEqual([
    'admin',
    'backend',
    'web',
  ]);
});

test('can initialize a project with the default plugin stack', async ({
  page,
  addProject,
}) => {
  const { startUrl, readProjectDefinition } = await addProject();
  await page.goto(startUrl);

  await expect(
    page.getByRole('heading', { name: 'Create a new project' }),
  ).toBeVisible();

  await page.getByLabel('Project name').fill('full-stack-project');

  // Defaults turn on auth (local-auth), email (postmark), observability, and
  // AI dev agents — local-auth in turn forces email + queue (pg-boss).
  await page.getByRole('button', { name: 'Create project' }).click();

  await expect(
    page.getByRole('heading', { name: 'Welcome to Baseplate' }),
  ).toBeVisible();

  const projectDefinition = await readProjectDefinition();
  expect(projectDefinition.isInitialized).toBe(true);
  expect(projectDefinition.settings.general.name).toBe('full-stack-project');

  const pluginPackages = (projectDefinition.plugins ?? []).map(
    (plugin) => `${plugin.packageName}:${plugin.name}`,
  );
  // Parent auth + local-auth impl
  expect(pluginPackages).toContain('@baseplate-dev/plugin-auth:auth');
  expect(pluginPackages).toContain('@baseplate-dev/plugin-auth:local-auth');
  // Email parent + Postmark impl
  expect(pluginPackages).toContain('@baseplate-dev/plugin-email:email');
  expect(pluginPackages).toContain('@baseplate-dev/plugin-email:postmark');
  // Queue forced on by local-auth, pg-boss impl
  expect(pluginPackages).toContain('@baseplate-dev/plugin-queue:queue');
  expect(pluginPackages).toContain('@baseplate-dev/plugin-queue:pg-boss');
  // Rate limit forced on by local-auth
  expect(pluginPackages).toContain(
    '@baseplate-dev/plugin-rate-limit:rate-limit',
  );
  // Observability + AI dev agents on by default
  expect(pluginPackages).toContain(
    '@baseplate-dev/plugin-observability:sentry',
  );
  expect(pluginPackages).toContain('@baseplate-dev/plugin-ai:dev-agents');

  // The enabled plugins must seed their required models inline, in the same
  // save, so the wizard leaves no definition warnings behind.
  const modelNames = projectDefinition.models.map((model) => model.name);
  expect(modelNames).toContain('RateLimiterFlexible');
  expect(modelNames).toContain('User');
  expect(modelNames).toContain('UserAccount');
  expect(modelNames).toContain('UserSession');
});
