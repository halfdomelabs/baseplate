import type { DefinitionIssueChecker } from '@baseplate-dev/project-builder-lib';

import {
  createEntityIssue,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import { getNotificationsWebAppData } from './web-app-schema.js';

/**
 * Warns when a web app opts into notifications but leaves GraphQL subscriptions
 * off.
 *
 * The notification bell subscribes over SSE for live badge/feed updates; without
 * `enableSubscriptions` the app has only an HTTP link, so the subscription has no
 * transport and realtime updates silently never fire. Emitted as a fixable
 * warning (blocks sync, not save) that flips `enableSubscriptions` on for the app.
 */
export function createNotificationsWebSubscriptionsChecker(
  pluginKey: string,
): DefinitionIssueChecker {
  return (container) => {
    if (!PluginUtils.configByKey(container.definition, pluginKey)) return [];

    return container.definition.apps
      .filter(
        (app) =>
          app.type === 'web' &&
          (getNotificationsWebAppData(app, pluginKey)?.includeNotifications ??
            false) &&
          !app.enableSubscriptions,
      )
      .map((app) =>
        createEntityIssue(container, app.id, ['enableSubscriptions'], {
          message: `Web app '${app.name}' includes notifications but has GraphQL subscriptions disabled. The notification bell needs subscriptions for live updates.`,
          severity: 'warning',
          fix: {
            label: 'Enable GraphQL subscriptions',
            applySetter: (draft) => {
              const target = draft.apps.find((a) => a.id === app.id);
              if (target?.type === 'web') {
                target.enableSubscriptions = true;
              }
            },
          },
        }),
      );
  };
}
