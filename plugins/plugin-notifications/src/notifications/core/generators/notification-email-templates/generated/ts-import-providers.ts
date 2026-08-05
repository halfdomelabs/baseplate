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

import { NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_PATHS } from './template-paths.js';

export const notificationEmailTemplatesImportsSchema = createTsImportMapSchema({
  NotificationEmailSegment: { isTypeOnly: true },
  SegmentsView: {},
  SegmentView: {},
});

export type NotificationEmailTemplatesImportsProvider =
  TsImportMapProviderFromSchema<typeof notificationEmailTemplatesImportsSchema>;

export const notificationEmailTemplatesImportsProvider =
  createReadOnlyProviderType<NotificationEmailTemplatesImportsProvider>(
    'notification-email-templates-imports',
  );

const notificationsCoreNotificationEmailTemplatesImportsTask =
  createGeneratorTask({
    dependencies: {
      paths: NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_PATHS.provider,
    },
    exports: {
      notificationEmailTemplatesImports:
        notificationEmailTemplatesImportsProvider.export(packageScope),
    },
    run({ paths }) {
      return {
        providers: {
          notificationEmailTemplatesImports: createTsImportMap(
            notificationEmailTemplatesImportsSchema,
            {
              NotificationEmailSegment: paths.notificationSegmentView,
              SegmentsView: paths.notificationSegmentView,
              SegmentView: paths.notificationSegmentView,
            },
          ),
        },
      };
    },
  });

export const NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_IMPORTS = {
  task: notificationsCoreNotificationEmailTemplatesImportsTask,
};
