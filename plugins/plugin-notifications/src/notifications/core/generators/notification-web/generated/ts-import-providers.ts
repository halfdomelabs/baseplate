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

import { NOTIFICATIONS_CORE_NOTIFICATION_WEB_PATHS } from './template-paths.js';

export const notificationWebImportsSchema = createTsImportMapSchema({
  NotificationBell: {},
});

export type NotificationWebImportsProvider = TsImportMapProviderFromSchema<
  typeof notificationWebImportsSchema
>;

export const notificationWebImportsProvider =
  createReadOnlyProviderType<NotificationWebImportsProvider>(
    'notification-web-imports',
  );

const notificationsCoreNotificationWebImportsTask = createGeneratorTask({
  dependencies: {
    paths: NOTIFICATIONS_CORE_NOTIFICATION_WEB_PATHS.provider,
  },
  exports: {
    notificationWebImports: notificationWebImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        notificationWebImports: createTsImportMap(
          notificationWebImportsSchema,
          { NotificationBell: paths.notificationBell },
        ),
      },
    };
  },
});

export const NOTIFICATIONS_CORE_NOTIFICATION_WEB_IMPORTS = {
  task: notificationsCoreNotificationWebImportsTask,
};
