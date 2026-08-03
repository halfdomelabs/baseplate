import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  errorHandlerServiceImportsProvider,
  pothosImportsProvider,
  prismaGeneratedImportsProvider,
  prismaImportsProvider,
  serviceContextImportsProvider,
  yogaPluginImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { emailModuleImportsProvider } from '@baseplate-dev/plugin-email';
import { queuesImportsProvider } from '@baseplate-dev/plugin-queue';
import path from 'node:path';

const constantsNotificationCategories = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'constants-notification-categories',
  projectExports: {
    getNotificationCategory: { isTypeOnly: false },
    NOTIFICATION_CATEGORIES: { isTypeOnly: false },
    NotificationCategoryKey: { isTypeOnly: true },
  },
  referencedGeneratorTemplates: { servicesNotificationChannel: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/constants/notification-categories.ts',
    ),
  },
  variables: { TPL_CATEGORIES: {} },
});

const servicesGenericType = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'services-generic-type',
  referencedGeneratorTemplates: { servicesNotificationRegistry: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/generic-type.ts',
    ),
  },
  variables: {},
});

const servicesNotificationChannel = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'services-notification-channel',
  referencedGeneratorTemplates: { servicesNotificationRenderer: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/notification-channel.ts',
    ),
  },
  variables: { TPL_CHANNEL_ENTRIES: {} },
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
    prismaImports: prismaImportsProvider,
    queuesImports: queuesImportsProvider,
  },
  name: 'services-notification-outbox',
  referencedGeneratorTemplates: {
    queuesNotificationDelivery: {},
    servicesNotificationChannel: {},
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

const servicesNotificationRegistry = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'services-notification-registry',
  referencedGeneratorTemplates: {
    constantsNotificationCategories: {},
    servicesNotificationChannel: {},
    servicesNotificationContent: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/notification-registry.ts',
    ),
  },
  variables: {},
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
    constantsNotificationCategories: {},
    servicesNotificationContent: {},
    servicesNotificationRegistry: {},
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
    constantsNotificationCategories: {},
    servicesGenericType: {},
    servicesNotificationChannel: {},
    servicesNotificationContent: {},
    servicesNotificationEvents: {},
    servicesNotificationOutbox: {},
    servicesNotificationRegistry: {},
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
  constantsNotificationCategories,
  servicesGenericType,
  servicesNotificationChannel,
  servicesNotificationContent,
  servicesNotificationEvents,
  servicesNotificationOutbox,
  servicesNotificationRegistry,
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
  schemaNotificationSubscriptions,
};

const servicesEmailChannel = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { emailModuleImports: emailModuleImportsProvider },
  name: 'services-email-channel',
  referencedGeneratorTemplates: {
    servicesNotificationChannel: {},
    servicesNotificationRenderer: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/email-channel.ts',
    ),
  },
  variables: { TPL_NOTIFICATION_EMAIL: {} },
});

export const NOTIFICATIONS_CORE_NOTIFICATION_MODULE_TEMPLATES = {
  mainGroup,
  queuesGroup,
  schemaGroup,
  servicesEmailChannel,
};
