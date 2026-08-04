import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface NotificationsCoreNotificationModulePaths {
  constantsNotificationTopics: string;
  queuesNotificationDelivery: string;
  queuesNotificationDeliveryWorker: string;
  queuesNotificationOutboxSweep: string;
  queuesNotificationOutboxSweepWorker: string;
  queuesNotificationRetention: string;
  queuesNotificationRetentionWorker: string;
  schemaNotificationContentField: string;
  schemaNotificationContentObjectTypes: string;
  schemaNotificationFeedQueries: string;
  schemaNotificationMutations: string;
  schemaNotificationPreference: string;
  schemaNotificationSubscriptions: string;
  servicesEmailChannel: string;
  servicesGenericType: string;
  servicesNotificationChannel: string;
  servicesNotificationContent: string;
  servicesNotificationEvents: string;
  servicesNotificationOutbox: string;
  servicesNotificationRegistry: string;
  servicesNotificationRenderer: string;
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
          constantsNotificationTopics: `${moduleRoot}/constants/notification-topics.ts`,
          queuesNotificationDelivery: `${moduleRoot}/queues/notification-delivery.queue.ts`,
          queuesNotificationDeliveryWorker: `${moduleRoot}/queues/notification-delivery.worker.ts`,
          queuesNotificationOutboxSweep: `${moduleRoot}/queues/notification-outbox-sweep.queue.ts`,
          queuesNotificationOutboxSweepWorker: `${moduleRoot}/queues/notification-outbox-sweep.worker.ts`,
          queuesNotificationRetention: `${moduleRoot}/queues/notification-retention.queue.ts`,
          queuesNotificationRetentionWorker: `${moduleRoot}/queues/notification-retention.worker.ts`,
          schemaNotificationContentField: `${moduleRoot}/schema/notification-content.field.ts`,
          schemaNotificationContentObjectTypes: `${moduleRoot}/schema/notification-content.object-types.ts`,
          schemaNotificationFeedQueries: `${moduleRoot}/schema/notification-feed.queries.ts`,
          schemaNotificationMutations: `${moduleRoot}/schema/notification.mutations.ts`,
          schemaNotificationPreference: `${moduleRoot}/schema/notification-preference.schema.ts`,
          schemaNotificationSubscriptions: `${moduleRoot}/schema/notification.subscriptions.ts`,
          servicesEmailChannel: `${moduleRoot}/services/email-channel.ts`,
          servicesGenericType: `${moduleRoot}/services/generic-type.ts`,
          servicesNotificationChannel: `${moduleRoot}/services/notification-channel.ts`,
          servicesNotificationContent: `${moduleRoot}/services/notification-content.ts`,
          servicesNotificationEvents: `${moduleRoot}/services/notification-events.ts`,
          servicesNotificationOutbox: `${moduleRoot}/services/notification-outbox.ts`,
          servicesNotificationRegistry: `${moduleRoot}/services/notification-registry.ts`,
          servicesNotificationRenderer: `${moduleRoot}/services/notification-renderer.ts`,
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
