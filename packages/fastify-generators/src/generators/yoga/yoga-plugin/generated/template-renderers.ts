import type {
  RenderTsTemplateFileActionInput,
  RenderTsTemplateGroupActionInput,
} from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { configServiceImportsProvider } from '#src/generators/core/config-service/generated/ts-import-providers.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { fastifyRedisImportsProvider } from '#src/generators/core/fastify-redis/generated/ts-import-providers.js';
import { loggerServiceImportsProvider } from '#src/generators/core/logger-service/generated/ts-import-providers.js';
import { requestServiceContextImportsProvider } from '#src/generators/core/request-service-context/generated/ts-import-providers.js';

import { YOGA_YOGA_PLUGIN_PATHS } from './template-paths.js';
import { YOGA_YOGA_PLUGIN_TEMPLATES } from './typed-templates.js';

export interface YogaYogaPluginRenderers {
  graphqlPlugin: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof YOGA_YOGA_PLUGIN_TEMPLATES.graphqlPlugin
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  subscriptionsGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof YOGA_YOGA_PLUGIN_TEMPLATES.subscriptionsGroup
        >,
        'importMapProviders' | 'group' | 'paths'
      >,
    ) => BuilderAction;
  };
  useGraphLogger: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof YOGA_YOGA_PLUGIN_TEMPLATES.useGraphLogger
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const yogaYogaPluginRenderers = createProviderType<YogaYogaPluginRenderers>(
  'yoga-yoga-plugin-renderers',
);

const yogaYogaPluginRenderersTask = createGeneratorTask({
  dependencies: {
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    fastifyRedisImports: fastifyRedisImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    paths: YOGA_YOGA_PLUGIN_PATHS.provider,
    requestServiceContextImports: requestServiceContextImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { yogaYogaPluginRenderers: yogaYogaPluginRenderers.export() },
  run({
    configServiceImports,
    errorHandlerServiceImports,
    fastifyRedisImports,
    loggerServiceImports,
    paths,
    requestServiceContextImports,
    typescriptFile,
  }) {
    return {
      providers: {
        yogaYogaPluginRenderers: {
          graphqlPlugin: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: YOGA_YOGA_PLUGIN_TEMPLATES.graphqlPlugin,
                destination: paths.graphqlPlugin,
                importMapProviders: {
                  configServiceImports,
                  errorHandlerServiceImports,
                  loggerServiceImports,
                  requestServiceContextImports,
                },
                ...options,
              }),
          },
          subscriptionsGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: YOGA_YOGA_PLUGIN_TEMPLATES.subscriptionsGroup,
                paths,
                importMapProviders: {
                  errorHandlerServiceImports,
                  fastifyRedisImports,
                  loggerServiceImports,
                  requestServiceContextImports,
                },
                ...options,
              }),
          },
          useGraphLogger: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: YOGA_YOGA_PLUGIN_TEMPLATES.useGraphLogger,
                destination: paths.useGraphLogger,
                importMapProviders: {
                  errorHandlerServiceImports,
                  loggerServiceImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const YOGA_YOGA_PLUGIN_RENDERERS = {
  provider: yogaYogaPluginRenderers,
  task: yogaYogaPluginRenderersTask,
};
