import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface NotificationsCoreNotificationEmailTemplatesPaths {
  notificationEmail: string;
}

const notificationsCoreNotificationEmailTemplatesPaths =
  createProviderType<NotificationsCoreNotificationEmailTemplatesPaths>(
    'notifications-core-notification-email-templates-paths',
  );

const notificationsCoreNotificationEmailTemplatesPathsTask =
  createGeneratorTask({
    dependencies: { packageInfo: packageInfoProvider },
    exports: {
      notificationsCoreNotificationEmailTemplatesPaths:
        notificationsCoreNotificationEmailTemplatesPaths.export(),
    },
    run({ packageInfo }) {
      const srcRoot = packageInfo.getPackageSrcPath();

      return {
        providers: {
          notificationsCoreNotificationEmailTemplatesPaths: {
            notificationEmail: `${srcRoot}/emails/notifications/notification.email.tsx`,
          },
        },
      };
    },
  });

export const NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_PATHS = {
  provider: notificationsCoreNotificationEmailTemplatesPaths,
  task: notificationsCoreNotificationEmailTemplatesPathsTask,
};
