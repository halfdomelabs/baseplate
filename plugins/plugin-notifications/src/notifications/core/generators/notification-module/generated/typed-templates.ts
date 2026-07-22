import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  errorHandlerServiceImportsProvider,
  pothosImportsProvider,
  prismaGeneratedImportsProvider,
  prismaImportsProvider,
  yogaPluginImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

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

const servicesInAppChannel = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    prismaImports: prismaImportsProvider,
    yogaPluginImports: yogaPluginImportsProvider,
  },
  name: 'services-in-app-channel',
  referencedGeneratorTemplates: { servicesNotificationChannel: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/in-app-channel.ts',
    ),
  },
  variables: {},
});

const servicesNotificationChannel = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'services-notification-channel',
  referencedGeneratorTemplates: {
    servicesInAppChannel: {},
    servicesNotificationContent: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/notification-channel.ts',
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

const servicesNotificationRegistry = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'services-notification-registry',
  referencedGeneratorTemplates: {
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

const servicesNotificationService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
    yogaPluginImports: yogaPluginImportsProvider,
  },
  name: 'services-notification-service',
  referencedGeneratorTemplates: {
    servicesGenericType: {},
    servicesNotificationChannel: {},
    servicesNotificationContent: {},
    servicesNotificationRegistry: {},
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
  servicesGenericType,
  servicesInAppChannel,
  servicesNotificationChannel,
  servicesNotificationContent,
  servicesNotificationRegistry,
  servicesNotificationService,
};

const schemaNotificationContentField = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'schema',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-notification-content-field',
  referencedGeneratorTemplates: {
    schemaNotificationContentObjectTypes: {},
    servicesNotificationService: {},
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

const schemaNotificationMutations = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'schema',
  importMapProviders: {
    pothosImports: pothosImportsProvider,
    prismaImports: prismaImportsProvider,
  },
  name: 'schema-notification-mutations',
  referencedGeneratorTemplates: { servicesNotificationService: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/notification.mutations.ts',
    ),
  },
  variables: { TPL_NOTIFICATION_OBJECT_TYPE: {} },
});

const schemaNotificationQueries = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'schema',
  importMapProviders: {
    pothosImports: pothosImportsProvider,
    prismaImports: prismaImportsProvider,
  },
  name: 'schema-notification-queries',
  referencedGeneratorTemplates: { servicesNotificationService: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/notification.queries.ts',
    ),
  },
  variables: {},
});

const schemaNotificationSubscriptions = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'schema',
  importMapProviders: {
    pothosImports: pothosImportsProvider,
    prismaImports: prismaImportsProvider,
    yogaPluginImports: yogaPluginImportsProvider,
  },
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
  schemaNotificationMutations,
  schemaNotificationQueries,
  schemaNotificationSubscriptions,
};

export const NOTIFICATIONS_CORE_NOTIFICATION_MODULE_TEMPLATES = {
  mainGroup,
  schemaGroup,
};
