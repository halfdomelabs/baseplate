import type { ProjectDefinitionInput } from '@baseplate-dev/project-builder-lib';

import { pluginEntityType } from '@baseplate-dev/project-builder-lib';
import { createTestProjectDefinitionContainer } from '@baseplate-dev/project-builder-lib/testing';
import { describe, expect, it } from 'vitest';

import { createNotificationsWebSubscriptionsChecker } from './notification-web-issue-checker.js';

const PLUGIN_KEY = 'test-notifications';

let nextDevPort = 5000;

function webApp(overrides: {
  name: string;
  includeNotifications?: boolean;
  enableSubscriptions?: boolean;
}): Record<string, unknown> {
  return {
    id: `app:${overrides.name}`,
    type: 'web',
    name: overrides.name,
    devPort: nextDevPort++,
    title: '',
    description: '',
    includeNotifications: overrides.includeNotifications ?? false,
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

describe('createNotificationsWebSubscriptionsChecker', () => {
  const check = createNotificationsWebSubscriptionsChecker(PLUGIN_KEY);

  it('warns when a web app includes notifications but disables subscriptions', () => {
    const container = containerWith([
      webApp({
        name: 'admin',
        includeNotifications: true,
        enableSubscriptions: false,
      }),
    ]);

    const issues = check(container);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      severity: 'warning',
      path: ['enableSubscriptions'],
    });
    expect(issues[0].message).toContain('admin');
  });

  it('offers a fix that enables subscriptions for the offending app', () => {
    const container = containerWith([
      webApp({
        name: 'admin',
        includeNotifications: true,
        enableSubscriptions: false,
      }),
    ]);

    const [issue] = check(container);
    const draft = structuredClone(container.definition);
    issue.fix?.applySetter?.(draft);

    const app = draft.apps.find((a) => a.id === 'app:admin');
    expect(app).toMatchObject({ type: 'web', enableSubscriptions: true });
  });

  it('does not warn when subscriptions are enabled', () => {
    const container = containerWith([
      webApp({
        name: 'admin',
        includeNotifications: true,
        enableSubscriptions: true,
      }),
    ]);

    expect(check(container)).toHaveLength(0);
  });

  it('does not warn for web apps that do not include notifications', () => {
    const container = containerWith([
      webApp({
        name: 'admin',
        includeNotifications: false,
        enableSubscriptions: false,
      }),
    ]);

    expect(check(container)).toHaveLength(0);
  });

  it('does nothing when the plugin is not configured', () => {
    const container = containerWith(
      [
        webApp({
          name: 'admin',
          includeNotifications: true,
          enableSubscriptions: false,
        }),
      ],
      { withPlugin: false },
    );

    expect(check(container)).toHaveLength(0);
  });
});
