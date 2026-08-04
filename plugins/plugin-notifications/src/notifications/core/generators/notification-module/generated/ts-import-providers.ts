import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { NOTIFICATIONS_CORE_NOTIFICATION_MODULE_PATHS } from './template-paths.js';

export const notificationModuleImportsSchema = createTsImportMapSchema({
  createNotificationEvents: {},
  createNotificationRenderer: {},
  getNotificationTopic: {},
  isNotificationTopicKey: {},
  isOutboundTarget: {},
  NOTIFICATION_MODES: {},
  NOTIFICATION_TOPICS: {},
  NotificationChannelSetting: { isTypeOnly: true },
  NotificationDeliveryJobData: { isTypeOnly: true },
  notificationDeliveryQueue: {},
  notificationDeliveryWorker: {},
  NotificationEvents: { isTypeOnly: true },
  NotificationMode: { isTypeOnly: true },
  notificationOutboxSweepQueue: {},
  notificationOutboxSweepWorker: {},
  NotificationRenderer: { isTypeOnly: true },
  notificationRetentionQueue: {},
  notificationRetentionWorker: {},
  NotificationTopic: { isTypeOnly: true },
  NotificationTopicKey: { isTypeOnly: true },
  RENDER_SOURCE_SELECT: {},
  RenderSource: { isTypeOnly: true },
  resolveChannelSetting: {},
});

export type NotificationModuleImportsProvider = TsImportMapProviderFromSchema<
  typeof notificationModuleImportsSchema
>;

export const notificationModuleImportsProvider =
  createReadOnlyProviderType<NotificationModuleImportsProvider>(
    'notification-module-imports',
  );

const notificationsCoreNotificationModuleImportsTask = createGeneratorTask({
  dependencies: {
    paths: NOTIFICATIONS_CORE_NOTIFICATION_MODULE_PATHS.provider,
  },
  exports: {
    notificationModuleImports:
      notificationModuleImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        notificationModuleImports: createTsImportMap(
          notificationModuleImportsSchema,
          {
            createNotificationEvents: paths.servicesNotificationEvents,
            createNotificationRenderer: paths.servicesNotificationRenderer,
            getNotificationTopic: paths.constantsNotificationTopics,
            isNotificationTopicKey: paths.constantsNotificationTopics,
            isOutboundTarget: paths.constantsNotificationTopics,
            NOTIFICATION_MODES: paths.constantsNotificationTopics,
            NOTIFICATION_TOPICS: paths.constantsNotificationTopics,
            NotificationChannelSetting: paths.constantsNotificationTopics,
            NotificationDeliveryJobData: paths.queuesNotificationDelivery,
            notificationDeliveryQueue: paths.queuesNotificationDelivery,
            notificationDeliveryWorker: paths.queuesNotificationDeliveryWorker,
            NotificationEvents: paths.servicesNotificationEvents,
            NotificationMode: paths.constantsNotificationTopics,
            notificationOutboxSweepQueue: paths.queuesNotificationOutboxSweep,
            notificationOutboxSweepWorker:
              paths.queuesNotificationOutboxSweepWorker,
            NotificationRenderer: paths.servicesNotificationRenderer,
            notificationRetentionQueue: paths.queuesNotificationRetention,
            notificationRetentionWorker:
              paths.queuesNotificationRetentionWorker,
            NotificationTopic: paths.constantsNotificationTopics,
            NotificationTopicKey: paths.constantsNotificationTopics,
            RENDER_SOURCE_SELECT: paths.servicesNotificationRenderer,
            RenderSource: paths.servicesNotificationRenderer,
            resolveChannelSetting: paths.constantsNotificationTopics,
          },
        ),
      },
    };
  },
});

export const NOTIFICATIONS_CORE_NOTIFICATION_MODULE_IMPORTS = {
  task: notificationsCoreNotificationModuleImportsTask,
};
