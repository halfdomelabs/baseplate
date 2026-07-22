import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { appModuleSetupImportsProvider } from '#src/generators/core/app-module-setup/generated/ts-import-providers.js';
import { appRuntimeImportsProvider } from '#src/generators/core/app-runtime/generated/ts-import-providers.js';
import { configServiceImportsProvider } from '#src/generators/core/config-service/generated/ts-import-providers.js';
import { loggerServiceImportsProvider } from '#src/generators/core/logger-service/generated/ts-import-providers.js';

import { CORE_FASTIFY_SERVER_PATHS } from './template-paths.js';
import { CORE_FASTIFY_SERVER_TEMPLATES } from './typed-templates.js';

export interface CoreFastifyServerRenderers {
  index: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_FASTIFY_SERVER_TEMPLATES.index
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  server: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_FASTIFY_SERVER_TEMPLATES.server
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const coreFastifyServerRenderers =
  createProviderType<CoreFastifyServerRenderers>(
    'core-fastify-server-renderers',
  );

const coreFastifyServerRenderersTask = createGeneratorTask({
  dependencies: {
    appModuleSetupImports: appModuleSetupImportsProvider,
    appRuntimeImports: appRuntimeImportsProvider,
    configServiceImports: configServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    paths: CORE_FASTIFY_SERVER_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { coreFastifyServerRenderers: coreFastifyServerRenderers.export() },
  run({
    appModuleSetupImports,
    appRuntimeImports,
    configServiceImports,
    loggerServiceImports,
    paths,
    typescriptFile,
  }) {
    return {
      providers: {
        coreFastifyServerRenderers: {
          index: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_FASTIFY_SERVER_TEMPLATES.index,
                destination: paths.index,
                importMapProviders: {
                  appRuntimeImports,
                  configServiceImports,
                  loggerServiceImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          server: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_FASTIFY_SERVER_TEMPLATES.server,
                destination: paths.server,
                importMapProviders: {
                  appModuleSetupImports,
                  appRuntimeImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_FASTIFY_SERVER_RENDERERS = {
  provider: coreFastifyServerRenderers,
  task: coreFastifyServerRenderersTask,
};
