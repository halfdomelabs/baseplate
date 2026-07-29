import type { ProjectDefinitionInput } from '@baseplate-dev/project-builder-lib';

import { pluginEntityType } from '@baseplate-dev/project-builder-lib';
import { createTestProjectDefinitionContainer } from '@baseplate-dev/project-builder-lib/testing';
import { describe, expect, it } from 'vitest';

import { createNotificationsBackendSubscriptionsChecker } from './notification-backend-issue-checker.js';

const PLUGIN_KEY = 'test-notifications';

let nextDevPort = 6000;

function backendApp(overrides: {
  name: string;
  enableSubscriptions?: boolean;
}): Record<string, unknown> {
  return {
    id: `app:${overrides.name}`,
    type: 'backend',
    name: overrides.name,
    devPort: nextDevPort++,
    title: '',
    description: '',
    enableSubscriptions: overrides.enableSubscriptions ?? false,
  };
}

function containerWith(
  apps: Record<string, unknown>[],
  { withPlugin = true }: { withPlugin?: boolean } = {},
): ReturnType<typeof createTestProjectDefinitionContainer> {
  const input: Partial<ProjectDefinitionInput> = {
    apps: apps as ProjectDefinitionInput['apps'],
    plugins: withPlugin
      ? [
          {
            id: pluginEntityType.idFromKey(PLUGIN_KEY),
            packageName: '@baseplate-dev/plugin-notifications',
            name: 'notifications',
            version: '0.1.0',
            config: {},
          },
        ]
      : [],
  };
  return createTestProjectDefinitionContainer(input);
}

describe('createNotificationsBackendSubscriptionsChecker', () => {
  const check = createNotificationsBackendSubscriptionsChecker(PLUGIN_KEY);

  it('errors when a backend app disables subscriptions', () => {
    const container = containerWith([
      backendApp({ name: 'backend', enableSubscriptions: false }),
    ]);

    const issues = check(container);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      severity: 'error',
      path: ['enableSubscriptions'],
    });
    expect(issues[0]?.message).toContain('backend');
  });

  it('offers a fix that enables subscriptions for the offending app', () => {
    const container = containerWith([
      backendApp({ name: 'backend', enableSubscriptions: false }),
    ]);

    const issue = check(container)[0];
    const draft = structuredClone(container.definition);
    issue?.fix?.applySetter?.(draft);

    const app = draft.apps.find((a) => a.id === 'app:backend');
    expect(app).toMatchObject({ type: 'backend', enableSubscriptions: true });
  });

  it('does not error when subscriptions are enabled', () => {
    const container = containerWith([
      backendApp({ name: 'backend', enableSubscriptions: true }),
    ]);

    expect(check(container)).toHaveLength(0);
  });

  it('does nothing when the plugin is not configured', () => {
    const container = containerWith(
      [backendApp({ name: 'backend', enableSubscriptions: false })],
      { withPlugin: false },
    );

    expect(check(container)).toHaveLength(0);
  });
});
