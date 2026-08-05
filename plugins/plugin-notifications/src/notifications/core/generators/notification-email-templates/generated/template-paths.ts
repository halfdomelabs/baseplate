import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface NotificationsCoreNotificationEmailTemplatesPaths {
  notificationDigestEmail: string;
  notificationEmail: string;
  notificationSegmentView: string;
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
            notificationDigestEmail: `${srcRoot}/emails/notifications/notification-digest.email.tsx`,
            notificationEmail: `${srcRoot}/emails/notifications/notification.email.tsx`,
            notificationSegmentView: `${srcRoot}/emails/notifications/segment-view.tsx`,
          },
        },
      };
    },
  });

export const NOTIFICATIONS_CORE_NOTIFICATION_EMAIL_TEMPLATES_PATHS = {
  provider: notificationsCoreNotificationEmailTemplatesPaths,
  task: notificationsCoreNotificationEmailTemplatesPathsTask,
};
