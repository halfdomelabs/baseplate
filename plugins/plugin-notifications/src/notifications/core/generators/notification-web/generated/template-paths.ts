import { reactPathsProvider } from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface NotificationsCoreNotificationWebPaths {
  notificationBell: string;
  notificationOperations: string;
  notificationPanel: string;
}

const notificationsCoreNotificationWebPaths =
  createProviderType<NotificationsCoreNotificationWebPaths>(
    'notifications-core-notification-web-paths',
  );

const notificationsCoreNotificationWebPathsTask = createGeneratorTask({
  dependencies: { reactPaths: reactPathsProvider },
  exports: {
    notificationsCoreNotificationWebPaths:
      notificationsCoreNotificationWebPaths.export(),
  },
  run({ reactPaths }) {
    const componentsRoot = reactPaths.getComponentsFolder();

    return {
      providers: {
        notificationsCoreNotificationWebPaths: {
          notificationBell: `${componentsRoot}/notifications/notification-bell.tsx`,
          notificationOperations: `${componentsRoot}/notifications/notification-operations.ts`,
          notificationPanel: `${componentsRoot}/notifications/notification-panel.tsx`,
        },
      },
    };
  },
});

export const NOTIFICATIONS_CORE_NOTIFICATION_WEB_PATHS = {
  provider: notificationsCoreNotificationWebPaths,
  task: notificationsCoreNotificationWebPathsTask,
};
