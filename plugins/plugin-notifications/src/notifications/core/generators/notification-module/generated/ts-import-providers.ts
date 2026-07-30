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
  NotificationEvents: { isTypeOnly: true },
  NotificationRenderer: { isTypeOnly: true },
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
            NotificationEvents: paths.servicesNotificationEvents,
            NotificationRenderer: paths.servicesNotificationRenderer,
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
