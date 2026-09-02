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
  AnyNotificationType: { isTypeOnly: true },
  applyUnsubscribeLink: {},
  BatchedNotificationType: { isTypeOnly: true },
  buildUnsubscribeUrl: {},
  ChannelDelivery: { isTypeOnly: true },
  createEmailChannel: {},
  createNotificationEvents: {},
  createNotificationRenderer: {},
  defineBatchedNotificationType: {},
  defineNotificationType: {},
  generatedKey: {},
  getNotificationTopic: {},
  isGeneratedKey: {},
  isNotificationTopicKey: {},
  isOutboundTarget: {},
  NOTIFICATION_MODES: {},
  NOTIFICATION_TOPICS: {},
  NotificationChannel: { isTypeOnly: true },
  NotificationChannelKey: { isTypeOnly: true },
  NotificationChannels: { isTypeOnly: true },
  NotificationChannelSetting: { isTypeOnly: true },
  NotificationDeliveryJobData: { isTypeOnly: true },
  notificationDeliveryQueue: {},
  notificationDeliveryWorker: {},
  notificationDigestQueue: {},
  notificationDigestWorker: {},
  notificationEmail: {},
  NotificationEmailContent: { isTypeOnly: true },
  NotificationEvents: { isTypeOnly: true },
  NotificationMode: { isTypeOnly: true },
  notificationOutboxSweepQueue: {},
  notificationOutboxSweepWorker: {},
  NotificationParamsSchema: { isTypeOnly: true },
  NotificationRenderer: { isTypeOnly: true },
  NotificationRenderers: { isTypeOnly: true },
  notificationRetentionQueue: {},
  notificationRetentionWorker: {},
  NotificationRoutingTarget: { isTypeOnly: true },
  NotificationTopic: { isTypeOnly: true },
  NotificationTopicKey: { isTypeOnly: true },
  notificationUnsubscribePlugin: {},
  parseUnsubscribeLink: {},
  PlainNotificationType: { isTypeOnly: true },
  RENDER_SOURCE_SELECT: {},
  RenderSource: { isTypeOnly: true },
  resolveChannelSetting: {},
  ROUTING_TARGETS: {},
  UNSUBSCRIBE_PATH: {},
  UNSUBSCRIBE_TOKEN_PARAM: {},
  UnsubscribeLink: { isTypeOnly: true },
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
            AnyNotificationType: paths.registry,
            applyUnsubscribeLink: paths.servicesNotificationUnsubscribe,
            BatchedNotificationType: paths.registry,
            buildUnsubscribeUrl: paths.servicesNotificationUnsubscribe,
            ChannelDelivery: paths.channelsTypes,
            createEmailChannel: paths.channelsEmailChannel,
            createNotificationEvents: paths.servicesNotificationEvents,
            createNotificationRenderer: paths.servicesNotificationRenderer,
            defineBatchedNotificationType: paths.registry,
            defineNotificationType: paths.registry,
            generatedKey: paths.registry,
            getNotificationTopic: paths.constantsNotificationTopics,
            isGeneratedKey: paths.registry,
            isNotificationTopicKey: paths.constantsNotificationTopics,
            isOutboundTarget: paths.constantsNotificationTopics,
            NOTIFICATION_MODES: paths.constantsNotificationTopics,
            NOTIFICATION_TOPICS: paths.constantsNotificationTopics,
            NotificationChannel: paths.channelsTypes,
            NotificationChannelKey: paths.channelsTypes,
            NotificationChannels: paths.channelsTypes,
            NotificationChannelSetting: paths.constantsNotificationTopics,
            NotificationDeliveryJobData: paths.queuesNotificationDelivery,
            notificationDeliveryQueue: paths.queuesNotificationDelivery,
            notificationDeliveryWorker: paths.queuesNotificationDeliveryWorker,
            notificationDigestQueue: paths.queuesNotificationDigest,
            notificationDigestWorker: paths.queuesNotificationDigestWorker,
            notificationEmail: paths.channelsEmailChannel,
            NotificationEmailContent: paths.channelsEmailChannel,
            NotificationEvents: paths.servicesNotificationEvents,
            NotificationMode: paths.constantsNotificationTopics,
            notificationOutboxSweepQueue: paths.queuesNotificationOutboxSweep,
            notificationOutboxSweepWorker:
              paths.queuesNotificationOutboxSweepWorker,
            NotificationParamsSchema: paths.registry,
            NotificationRenderer: paths.servicesNotificationRenderer,
            NotificationRenderers: paths.channelsTypes,
            notificationRetentionQueue: paths.queuesNotificationRetention,
            notificationRetentionWorker:
              paths.queuesNotificationRetentionWorker,
            NotificationRoutingTarget: paths.channelsTypes,
            NotificationTopic: paths.constantsNotificationTopics,
            NotificationTopicKey: paths.constantsNotificationTopics,
            notificationUnsubscribePlugin: paths.pluginsNotificationUnsubscribe,
            parseUnsubscribeLink: paths.servicesNotificationUnsubscribe,
            PlainNotificationType: paths.registry,
            RENDER_SOURCE_SELECT: paths.servicesNotificationRenderer,
            RenderSource: paths.servicesNotificationRenderer,
            resolveChannelSetting: paths.constantsNotificationTopics,
            ROUTING_TARGETS: paths.channelsTypes,
            UNSUBSCRIBE_PATH: paths.servicesNotificationUnsubscribe,
            UNSUBSCRIBE_TOKEN_PARAM: paths.servicesNotificationUnsubscribe,
            UnsubscribeLink: paths.servicesNotificationUnsubscribe,
          },
        ),
      },
    };
  },
});

export const NOTIFICATIONS_CORE_NOTIFICATION_MODULE_IMPORTS = {
  generatorName:
    '@baseplate-dev/plugin-notifications#notifications/core/notification-module',
  task: notificationsCoreNotificationModuleImportsTask,
};
