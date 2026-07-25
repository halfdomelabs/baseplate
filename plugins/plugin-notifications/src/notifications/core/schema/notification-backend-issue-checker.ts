import type { DefinitionIssueChecker } from '@baseplate-dev/project-builder-lib';

import {
  createEntityIssue,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

/**
 * Errors when the notifications plugin is enabled but a backend app leaves
 * GraphQL subscriptions off.
 *
 * The notification module publishes unseen-count changes over the GraphQL pubsub
 * (`getPubSub`, the `notificationsChanged` topic). Those are only generated when
 * the backend app has `enableSubscriptions` on — without it the module fails to
 * build. Emitted as a fixable error (not just a warning) that flips
 * `enableSubscriptions` on for the app.
 */
export function createNotificationsBackendSubscriptionsChecker(
  pluginKey: string,
): DefinitionIssueChecker {
  return (container) => {
    if (!PluginUtils.configByKey(container.definition, pluginKey)) return [];

    return container.definition.apps
      .filter((app) => app.type === 'backend' && !app.enableSubscriptions)
      .map((app) =>
        createEntityIssue(container, app.id, ['enableSubscriptions'], {
          message: `Backend app '${app.name}' hosts notifications but has GraphQL subscriptions disabled. The notification module publishes real-time updates over the pubsub and will not build without subscriptions.`,
          severity: 'error',
          fix: {
            label: 'Enable GraphQL subscriptions',
            applySetter: (draft) => {
              const target = draft.apps.find((a) => a.id === app.id);
              if (target?.type === 'backend') {
                target.enableSubscriptions = true;
              }
            },
          },
        }),
      );
  };
}
