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
  serviceContextImportsProvider,
  yogaPluginImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { emailModuleImportsProvider } from '@baseplate-dev/plugin-email';
import { queuesImportsProvider } from '@baseplate-dev/plugin-queue';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { NOTIFICATIONS_CORE_NOTIFICATION_MODULE_PATHS } from './template-paths.js';
import { NOTIFICATIONS_CORE_NOTIFICATION_MODULE_TEMPLATES } from './typed-templates.js';

export interface NotificationsCoreNotificationModuleRenderers {
  channelsEmailChannel: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof NOTIFICATIONS_CORE_NOTIFICATION_MODULE_TEMPLATES.channelsEmailChannel
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
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
  queuesGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof NOTIFICATIONS_CORE_NOTIFICATION_MODULE_TEMPLATES.queuesGroup
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
    queuesImports: queuesImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
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
    queuesImports,
    serviceContextImports,
    typescriptFile,
    yogaPluginImports,
  }) {
    return {
      providers: {
        notificationsCoreNotificationModuleRenderers: {
          channelsEmailChannel: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  NOTIFICATIONS_CORE_NOTIFICATION_MODULE_TEMPLATES.channelsEmailChannel,
                destination: paths.channelsEmailChannel,
                importMapProviders: {
                  emailModuleImports,
                  errorHandlerServiceImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
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
                  queuesImports,
                  yogaPluginImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          queuesGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group:
                  NOTIFICATIONS_CORE_NOTIFICATION_MODULE_TEMPLATES.queuesGroup,
                paths,
                importMapProviders: {
                  errorHandlerServiceImports,
                  queuesImports,
                  serviceContextImports,
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
                  prismaGeneratedImports,
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
