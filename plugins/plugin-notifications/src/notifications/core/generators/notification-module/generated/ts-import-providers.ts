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
  getNotificationCategory: {},
  NOTIFICATION_CATEGORIES: {},
  NotificationCategoryKey: { isTypeOnly: true },
  NotificationDeliveryJobData: { isTypeOnly: true },
  notificationDeliveryQueue: {},
  notificationDeliveryWorker: {},
  NotificationEvents: { isTypeOnly: true },
  notificationOutboxSweepQueue: {},
  notificationOutboxSweepWorker: {},
  NotificationRenderer: { isTypeOnly: true },
  notificationRetentionQueue: {},
  notificationRetentionWorker: {},
  RENDER_SOURCE_SELECT: {},
  RenderSource: { isTypeOnly: true },
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
            getNotificationCategory: paths.constantsNotificationCategories,
            NOTIFICATION_CATEGORIES: paths.constantsNotificationCategories,
            NotificationCategoryKey: paths.constantsNotificationCategories,
            NotificationDeliveryJobData: paths.queuesNotificationDelivery,
            notificationDeliveryQueue: paths.queuesNotificationDelivery,
            notificationDeliveryWorker: paths.queuesNotificationDeliveryWorker,
            NotificationEvents: paths.servicesNotificationEvents,
            notificationOutboxSweepQueue: paths.queuesNotificationOutboxSweep,
            notificationOutboxSweepWorker:
              paths.queuesNotificationOutboxSweepWorker,
            NotificationRenderer: paths.servicesNotificationRenderer,
            notificationRetentionQueue: paths.queuesNotificationRetention,
            notificationRetentionWorker:
              paths.queuesNotificationRetentionWorker,
            RENDER_SOURCE_SELECT: paths.servicesNotificationRenderer,
            RenderSource: paths.servicesNotificationRenderer,
          },
        ),
      },
    };
  },
});

export const NOTIFICATIONS_CORE_NOTIFICATION_MODULE_IMPORTS = {
  task: notificationsCoreNotificationModuleImportsTask,
};
