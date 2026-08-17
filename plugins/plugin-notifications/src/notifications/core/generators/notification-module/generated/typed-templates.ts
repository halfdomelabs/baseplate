import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  errorHandlerServiceImportsProvider,
  pothosImportsProvider,
  prismaGeneratedImportsProvider,
  prismaImportsProvider,
  serviceContextImportsProvider,
  yogaPluginImportsProvider,
} from '@baseplate-dev/fastify-generators';
import {
  emailModuleImportsProvider,
  transactionalLibImportsProvider,
} from '@baseplate-dev/plugin-email';
import { queuesImportsProvider } from '@baseplate-dev/plugin-queue';
import path from 'node:path';

const channelsEmailChannel = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    emailModuleImports: emailModuleImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    transactionalLibImports: transactionalLibImportsProvider,
  },
  name: 'channels-email-channel',
  projectExports: {
    createEmailChannel: { isTypeOnly: false },
    notificationEmail: { isTypeOnly: false },
    NotificationEmailContent: { isTypeOnly: true },
  },
  referencedGeneratorTemplates: {
    channelsTypes: {},
    servicesNotificationContent: {},
    servicesNotificationRenderer: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/channels/email.channel.ts',
    ),
  },
  variables: { TPL_NOTIFICATION_DIGEST_EMAIL: {}, TPL_NOTIFICATION_EMAIL: {} },
});

const channelsTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'channels-types',
  projectExports: {
    ChannelDelivery: { isTypeOnly: true },
    NotificationChannel: { isTypeOnly: true },
    NotificationChannelKey: { isTypeOnly: true },
    NotificationChannels: { isTypeOnly: true },
    NotificationRenderers: { isTypeOnly: true },
    NotificationRoutingTarget: { isTypeOnly: true },
    ROUTING_TARGETS: { isTypeOnly: false },
  },
  referencedGeneratorTemplates: { servicesNotificationRenderer: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/channels/types.ts',
    ),
  },
  variables: {
    TPL_CHANNEL_ENTRIES: {},
    TPL_RENDERER_ENTRIES: {},
    TPL_ROUTING_TARGETS: {},
  },
});

const constantsNotificationTopics = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'constants-notification-topics',
  projectExports: {
    getNotificationTopic: { isTypeOnly: false },
    isNotificationTopicKey: { isTypeOnly: false },
    isOutboundTarget: { isTypeOnly: false },
    NOTIFICATION_MODES: { isTypeOnly: false },
    NOTIFICATION_TOPICS: { isTypeOnly: false },
    NotificationChannelSetting: { isTypeOnly: true },
    NotificationMode: { isTypeOnly: true },
    NotificationTopic: { isTypeOnly: true },
    NotificationTopicKey: { isTypeOnly: true },
    resolveChannelSetting: { isTypeOnly: false },
  },
  referencedGeneratorTemplates: { channelsTypes: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/constants/notification-topics.ts',
    ),
  },
  variables: { TPL_TOPICS: {} },
});

const registry = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'registry',
  projectExports: {
    AnyNotificationType: { isTypeOnly: true },
    BatchedNotificationType: { isTypeOnly: true },
    defineBatchedNotificationType: { isTypeOnly: false },
    defineNotificationType: { isTypeOnly: false },
    generatedKey: { isTypeOnly: false },
    isGeneratedKey: { isTypeOnly: false },
    NotificationParamsSchema: { isTypeOnly: true },
    PlainNotificationType: { isTypeOnly: true },
  },
  referencedGeneratorTemplates: {
    channelsTypes: {},
    constantsNotificationTopics: {},
    servicesNotificationContent: {},
  },
  source: {
    path: path.join(import.meta.dirname, '../templates/module/registry.ts'),
  },
  variables: {},
});

const servicesGenericType = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'services-generic-type',
  referencedGeneratorTemplates: { registry: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/generic-type.ts',
    ),
  },
  variables: {},
});

const servicesNotificationContent = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'services-notification-content',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/notification-content.ts',
    ),
  },
  variables: {},
});

const servicesNotificationEvents = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: { yogaPluginImports: yogaPluginImportsProvider },
  name: 'services-notification-events',
  projectExports: {
    createNotificationEvents: {},
    NotificationEvents: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/notification-events.ts',
    ),
  },
  variables: {},
});

const servicesNotificationOutbox = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
    queuesImports: queuesImportsProvider,
  },
  name: 'services-notification-outbox',
  referencedGeneratorTemplates: {
    channelsTypes: {},
    constantsNotificationTopics: {},
    queuesNotificationDelivery: {},
    registry: {},
    servicesNotificationRenderer: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/notification-outbox.ts',
    ),
  },
  variables: { TPL_USER_DELEGATE: {} },
});

const servicesNotificationRenderer = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
  },
  name: 'services-notification-renderer',
  projectExports: {
    createNotificationRenderer: { isTypeOnly: false },
    NotificationRenderer: { isTypeOnly: true },
    RENDER_SOURCE_SELECT: { isTypeOnly: false },
    RenderSource: { isTypeOnly: true },
  },
  referencedGeneratorTemplates: {
    constantsNotificationTopics: {},
    registry: {},
    servicesNotificationContent: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/notification-renderer.ts',
    ),
  },
  variables: {},
});

const servicesNotificationService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
  },
  name: 'services-notification-service',
  referencedGeneratorTemplates: {
    channelsTypes: {},
    constantsNotificationTopics: {},
    registry: {},
    servicesGenericType: {},
    servicesNotificationContent: {},
    servicesNotificationEvents: {},
    servicesNotificationOutbox: {},
    servicesNotificationRenderer: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/notification.service.ts',
    ),
  },
  variables: {},
});

export const mainGroup = {
  channelsTypes,
  constantsNotificationTopics,
  registry,
  servicesGenericType,
  servicesNotificationContent,
  servicesNotificationEvents,
  servicesNotificationOutbox,
  servicesNotificationRenderer,
  servicesNotificationService,
};

const queuesNotificationDelivery = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'queues',
  importMapProviders: { queuesImports: queuesImportsProvider },
  name: 'queues-notification-delivery',
  projectExports: {
    NotificationDeliveryJobData: { isTypeOnly: true },
    notificationDeliveryQueue: { isTypeOnly: false },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/queues/notification-delivery.queue.ts',
    ),
  },
  variables: {},
});

const queuesNotificationDeliveryWorker = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'queues',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    queuesImports: queuesImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'queues-notification-delivery-worker',
  projectExports: { notificationDeliveryWorker: { isTypeOnly: false } },
  referencedGeneratorTemplates: { queuesNotificationDelivery: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/queues/notification-delivery.worker.ts',
    ),
  },
  variables: {},
});

const queuesNotificationDigest = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'queues',
  importMapProviders: { queuesImports: queuesImportsProvider },
  name: 'queues-notification-digest',
  projectExports: { notificationDigestQueue: { isTypeOnly: false } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/queues/notification-digest.queue.ts',
    ),
  },
  variables: {},
});

const queuesNotificationDigestWorker = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'queues',
  importMapProviders: {
    queuesImports: queuesImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'queues-notification-digest-worker',
  projectExports: { notificationDigestWorker: { isTypeOnly: false } },
  referencedGeneratorTemplates: { queuesNotificationDigest: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/queues/notification-digest.worker.ts',
    ),
  },
  variables: {},
});

const queuesNotificationOutboxSweep = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'queues',
  importMapProviders: { queuesImports: queuesImportsProvider },
  name: 'queues-notification-outbox-sweep',
  projectExports: { notificationOutboxSweepQueue: { isTypeOnly: false } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/queues/notification-outbox-sweep.queue.ts',
    ),
  },
  variables: {},
});

const queuesNotificationOutboxSweepWorker = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'queues',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    queuesImports: queuesImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'queues-notification-outbox-sweep-worker',
  projectExports: { notificationOutboxSweepWorker: { isTypeOnly: false } },
  referencedGeneratorTemplates: {
    queuesNotificationDelivery: {},
    queuesNotificationOutboxSweep: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/queues/notification-outbox-sweep.worker.ts',
    ),
  },
  variables: {},
});

const queuesNotificationRetention = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'queues',
  importMapProviders: { queuesImports: queuesImportsProvider },
  name: 'queues-notification-retention',
  projectExports: { notificationRetentionQueue: { isTypeOnly: false } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/queues/notification-retention.queue.ts',
    ),
  },
  variables: {},
});

const queuesNotificationRetentionWorker = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'queues',
  importMapProviders: {
    queuesImports: queuesImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'queues-notification-retention-worker',
  projectExports: { notificationRetentionWorker: { isTypeOnly: false } },
  referencedGeneratorTemplates: { queuesNotificationRetention: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/queues/notification-retention.worker.ts',
    ),
  },
  variables: {},
});

export const queuesGroup = {
  queuesNotificationDelivery,
  queuesNotificationDeliveryWorker,
  queuesNotificationDigest,
  queuesNotificationDigestWorker,
  queuesNotificationOutboxSweep,
  queuesNotificationOutboxSweepWorker,
  queuesNotificationRetention,
  queuesNotificationRetentionWorker,
};

const schemaNotificationContentField = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'schema',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-notification-content-field',
  referencedGeneratorTemplates: {
    schemaNotificationContentObjectTypes: {},
    servicesNotificationRenderer: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/notification-content.field.ts',
    ),
  },
  variables: { TPL_NOTIFICATION_OBJECT_TYPE: {} },
});

const schemaNotificationContentObjectTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'schema',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-notification-content-object-types',
  referencedGeneratorTemplates: { servicesNotificationContent: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/notification-content.object-types.ts',
    ),
  },
  variables: {},
});

const schemaNotificationFeedQueries = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'schema',
  importMapProviders: {
    pothosImports: pothosImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
  },
  name: 'schema-notification-feed-queries',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/notification-feed.queries.ts',
    ),
  },
  variables: {},
});

const schemaNotificationMutations = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'schema',
  importMapProviders: {
    pothosImports: pothosImportsProvider,
    prismaImports: prismaImportsProvider,
  },
  name: 'schema-notification-mutations',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/notification.mutations.ts',
    ),
  },
  variables: { TPL_NOTIFICATION_OBJECT_TYPE: {} },
});

const schemaNotificationPreference = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'schema',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-notification-preference',
  referencedGeneratorTemplates: {
    channelsTypes: {},
    constantsNotificationTopics: {},
    servicesNotificationService: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/notification-preference.schema.ts',
    ),
  },
  variables: {},
});

const schemaNotificationSubscriptions = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'schema',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-notification-subscriptions',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/notification.subscriptions.ts',
    ),
  },
  variables: {},
});

export const schemaGroup = {
  schemaNotificationContentField,
  schemaNotificationContentObjectTypes,
  schemaNotificationFeedQueries,
  schemaNotificationMutations,
  schemaNotificationPreference,
  schemaNotificationSubscriptions,
};

export const NOTIFICATIONS_CORE_NOTIFICATION_MODULE_TEMPLATES = {
  channelsEmailChannel,
  mainGroup,
  queuesGroup,
  schemaGroup,
};
