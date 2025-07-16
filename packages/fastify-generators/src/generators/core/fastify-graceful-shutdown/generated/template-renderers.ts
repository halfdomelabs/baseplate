import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { loggerServiceImportsProvider } from '#src/generators/core/logger-service/generated/ts-import-providers.js';

import { CORE_FASTIFY_GRACEFUL_SHUTDOWN_PATHS } from './template-paths.js';
import { CORE_FASTIFY_GRACEFUL_SHUTDOWN_TEMPLATES } from './typed-templates.js';

export interface CoreFastifyGracefulShutdownRenderers {
  gracefulShutdown: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_FASTIFY_GRACEFUL_SHUTDOWN_TEMPLATES.gracefulShutdown
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const coreFastifyGracefulShutdownRenderers =
  createProviderType<CoreFastifyGracefulShutdownRenderers>(
    'core-fastify-graceful-shutdown-renderers',
  );

const coreFastifyGracefulShutdownRenderersTask = createGeneratorTask({
  dependencies: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    paths: CORE_FASTIFY_GRACEFUL_SHUTDOWN_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    coreFastifyGracefulShutdownRenderers:
      coreFastifyGracefulShutdownRenderers.export(),
  },
  run({
    errorHandlerServiceImports,
    loggerServiceImports,
    paths,
    typescriptFile,
  }) {
    return {
      providers: {
        coreFastifyGracefulShutdownRenderers: {
          gracefulShutdown: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  CORE_FASTIFY_GRACEFUL_SHUTDOWN_TEMPLATES.gracefulShutdown,
                destination: paths.gracefulShutdown,
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

export const CORE_FASTIFY_GRACEFUL_SHUTDOWN_RENDERERS = {
  provider: coreFastifyGracefulShutdownRenderers,
  task: coreFastifyGracefulShutdownRenderersTask,
};
