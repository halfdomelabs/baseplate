import type { PluginConfigMigration } from '@baseplate-dev/project-builder-lib';

import type { NotificationMode } from './plugin-definition.js';

import {
  buildDefaultNotificationTopic,
  notificationTopicEntityType,
} from './plugin-definition.js';

/** The v4 category shape, as it exists in definitions written before v5. */
interface LegacyNotificationCategory {
  id: string;
  key: string;
  label: string;
  defaultChannels?: string[];
  mandatory?: boolean;
}

export const NOTIFICATIONS_PLUGIN_CONFIG_MIGRATIONS: PluginConfigMigration[] = [
  {
    name: 'add-categories',
    version: 1,
    migrate: (config) => {
      const typedConfig = config as { notificationsFeatureRef: string };
      return {
        updatedConfig: {
          ...typedConfig,
          // An inline v4 literal, NOT the current default builder: this
          // migration is a historical step whose output the next one parses as
          // a v4 category. Seeding a v5 topic here would leave v2 unable to
          // find `defaultChannels`, and every channel would migrate to `off`.
          categories: [
            {
              id: notificationTopicEntityType.generateNewId(),
              key: 'general',
              label: 'General',
              defaultChannels: ['inApp'],
              mandatory: false,
            },
          ],
        },
      };
    },
  },
  {
    // v5 replaced the two preference scopes (category and type) with one:
    // topics. `defaultChannels` becomes a per-channel mode map, and `mandatory`
    // is deleted — a mandatory category has no topic equivalent, because topic
    // membership is now what makes a notification user-controllable. Dropping
    // those categories is what moves their types to the unsuppressible path.
    name: 'categories-to-topics',
    version: 2,
    migrate: (config) => {
      const { categories, ...rest } = config as {
        notificationsFeatureRef: string;
        categories?: LegacyNotificationCategory[];
      };

      const topics = (categories ?? [])
        .filter((category) => !category.mandatory)
        .map((category) => ({
          // A fresh id, not `category.id`: entity ids are namespaced by their
          // type's prefix, and carrying a `notification-category:` id into a
          // `notification-topic` entity fails validation.
          id: notificationTopicEntityType.generateNewId(),
          key: category.key,
          label: category.label,
          defaults: Object.fromEntries(
            (category.defaultChannels ?? []).map((channel) => [
              channel,
              { mode: 'immediate' satisfies NotificationMode },
            ]),
          ),
        }));

      return {
        updatedConfig: {
          ...rest,
          // The schema requires at least one topic, and dropping every
          // mandatory category can empty the list.
          topics:
            topics.length > 0 ? topics : [buildDefaultNotificationTopic()],
        },
      };
    },
  },
];
