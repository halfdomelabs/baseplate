import type {
  RenderTsTemplateFileActionInput,
  RenderTsTemplateGroupActionInput,
} from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  errorHandlerServiceImportsProvider,
  pothosImportsProvider,
  prismaGeneratedImportsProvider,
  prismaImportsProvider,
  yogaPluginImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { emailModuleImportsProvider } from '@baseplate-dev/plugin-email';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { NOTIFICATIONS_CORE_NOTIFICATION_MODULE_PATHS } from './template-paths.js';
import { NOTIFICATIONS_CORE_NOTIFICATION_MODULE_TEMPLATES } from './typed-templates.js';

export interface NotificationsCoreNotificationModuleRenderers {
  mainGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof NOTIFICATIONS_CORE_NOTIFICATION_MODULE_TEMPLATES.mainGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  schemaGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof NOTIFICATIONS_CORE_NOTIFICATION_MODULE_TEMPLATES.schemaGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  servicesEmailChannel: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof NOTIFICATIONS_CORE_NOTIFICATION_MODULE_TEMPLATES.servicesEmailChannel
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const notificationsCoreNotificationModuleRenderers =
  createProviderType<NotificationsCoreNotificationModuleRenderers>(
    'notifications-core-notification-module-renderers',
  );

const notificationsCoreNotificationModuleRenderersTask = createGeneratorTask({
  dependencies: {
    emailModuleImports: emailModuleImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    paths: NOTIFICATIONS_CORE_NOTIFICATION_MODULE_PATHS.provider,
    pothosImports: pothosImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
    typescriptFile: typescriptFileProvider,
    yogaPluginImports: yogaPluginImportsProvider,
  },
  exports: {
    notificationsCoreNotificationModuleRenderers:
      notificationsCoreNotificationModuleRenderers.export(),
  },
  run({
    emailModuleImports,
    errorHandlerServiceImports,
    paths,
    pothosImports,
    prismaGeneratedImports,
    prismaImports,
    typescriptFile,
    yogaPluginImports,
  }) {
    return {
      providers: {
        notificationsCoreNotificationModuleRenderers: {
          mainGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group:
                  NOTIFICATIONS_CORE_NOTIFICATION_MODULE_TEMPLATES.mainGroup,
                paths,
                importMapProviders: {
                  errorHandlerServiceImports,
                  prismaGeneratedImports,
                  prismaImports,
                  yogaPluginImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          schemaGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group:
                  NOTIFICATIONS_CORE_NOTIFICATION_MODULE_TEMPLATES.schemaGroup,
                paths,
                importMapProviders: {
                  pothosImports,
                  prismaImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          servicesEmailChannel: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  NOTIFICATIONS_CORE_NOTIFICATION_MODULE_TEMPLATES.servicesEmailChannel,
                destination: paths.servicesEmailChannel,
                importMapProviders: {
                  emailModuleImports,
                  prismaImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const NOTIFICATIONS_CORE_NOTIFICATION_MODULE_RENDERERS = {
  provider: notificationsCoreNotificationModuleRenderers,
  task: notificationsCoreNotificationModuleRenderersTask,
};
