import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface NotificationsCoreNotificationModulePaths {
  schemaNotificationContentField: string;
  schemaNotificationContentObjectTypes: string;
  schemaNotificationMutations: string;
  schemaNotificationQueries: string;
  schemaNotificationSubscriptions: string;
  servicesGenericType: string;
  servicesInAppChannel: string;
  servicesNotificationChannel: string;
  servicesNotificationContent: string;
  servicesNotificationRegistry: string;
  servicesNotificationService: string;
}

const notificationsCoreNotificationModulePaths =
  createProviderType<NotificationsCoreNotificationModulePaths>(
    'notifications-core-notification-module-paths',
  );

const notificationsCoreNotificationModulePathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: {
    notificationsCoreNotificationModulePaths:
      notificationsCoreNotificationModulePaths.export(),
  },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        notificationsCoreNotificationModulePaths: {
          schemaNotificationContentField: `${moduleRoot}/schema/notification-content.field.ts`,
          schemaNotificationContentObjectTypes: `${moduleRoot}/schema/notification-content.object-types.ts`,
          schemaNotificationMutations: `${moduleRoot}/schema/notification.mutations.ts`,
          schemaNotificationQueries: `${moduleRoot}/schema/notification.queries.ts`,
          schemaNotificationSubscriptions: `${moduleRoot}/schema/notification.subscriptions.ts`,
          servicesGenericType: `${moduleRoot}/services/generic-type.ts`,
          servicesInAppChannel: `${moduleRoot}/services/in-app-channel.ts`,
          servicesNotificationChannel: `${moduleRoot}/services/notification-channel.ts`,
          servicesNotificationContent: `${moduleRoot}/services/notification-content.ts`,
          servicesNotificationRegistry: `${moduleRoot}/services/notification-registry.ts`,
          servicesNotificationService: `${moduleRoot}/services/notification.service.ts`,
        },
      },
    };
  },
});

export const NOTIFICATIONS_CORE_NOTIFICATION_MODULE_PATHS = {
  provider: notificationsCoreNotificationModulePaths,
  task: notificationsCoreNotificationModulePathsTask,
};
