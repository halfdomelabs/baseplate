import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface NotificationsCoreNotificationModulePaths {
  channelsEmailChannel: string;
  channelsTypes: string;
  constantsNotificationTopics: string;
  queuesNotificationDelivery: string;
  queuesNotificationDeliveryWorker: string;
  queuesNotificationDigest: string;
  queuesNotificationDigestWorker: string;
  queuesNotificationOutboxSweep: string;
  queuesNotificationOutboxSweepWorker: string;
  queuesNotificationRetention: string;
  queuesNotificationRetentionWorker: string;
  registry: string;
  schemaNotificationContentField: string;
  schemaNotificationContentObjectTypes: string;
  schemaNotificationFeedQueries: string;
  schemaNotificationMutations: string;
  schemaNotificationPreference: string;
  schemaNotificationSubscriptions: string;
  servicesGenericType: string;
  servicesNotificationContent: string;
  servicesNotificationEvents: string;
  servicesNotificationOutbox: string;
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
          channelsEmailChannel: `${moduleRoot}/channels/email.channel.ts`,
          channelsTypes: `${moduleRoot}/channels/types.ts`,
          constantsNotificationTopics: `${moduleRoot}/constants/notification-topics.ts`,
          queuesNotificationDelivery: `${moduleRoot}/queues/notification-delivery.queue.ts`,
          queuesNotificationDeliveryWorker: `${moduleRoot}/queues/notification-delivery.worker.ts`,
          queuesNotificationDigest: `${moduleRoot}/queues/notification-digest.queue.ts`,
          queuesNotificationDigestWorker: `${moduleRoot}/queues/notification-digest.worker.ts`,
          queuesNotificationOutboxSweep: `${moduleRoot}/queues/notification-outbox-sweep.queue.ts`,
          queuesNotificationOutboxSweepWorker: `${moduleRoot}/queues/notification-outbox-sweep.worker.ts`,
          queuesNotificationRetention: `${moduleRoot}/queues/notification-retention.queue.ts`,
          queuesNotificationRetentionWorker: `${moduleRoot}/queues/notification-retention.worker.ts`,
          registry: `${moduleRoot}/registry.ts`,
          schemaNotificationContentField: `${moduleRoot}/schema/notification-content.field.ts`,
          schemaNotificationContentObjectTypes: `${moduleRoot}/schema/notification-content.object-types.ts`,
          schemaNotificationFeedQueries: `${moduleRoot}/schema/notification-feed.queries.ts`,
          schemaNotificationMutations: `${moduleRoot}/schema/notification.mutations.ts`,
          schemaNotificationPreference: `${moduleRoot}/schema/notification-preference.schema.ts`,
          schemaNotificationSubscriptions: `${moduleRoot}/schema/notification.subscriptions.ts`,
          servicesGenericType: `${moduleRoot}/services/generic-type.ts`,
          servicesNotificationContent: `${moduleRoot}/services/notification-content.ts`,
          servicesNotificationEvents: `${moduleRoot}/services/notification-events.ts`,
          servicesNotificationOutbox: `${moduleRoot}/services/notification-outbox.ts`,
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
