import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_LOGGER_SERVICE_PATHS } from './template-paths.js';
import { CORE_LOGGER_SERVICE_TEMPLATES } from './typed-templates.js';

export interface CoreLoggerServiceRenderers {
  logger: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_LOGGER_SERVICE_TEMPLATES.logger
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const coreLoggerServiceRenderers =
  createProviderType<CoreLoggerServiceRenderers>(
    'core-logger-service-renderers',
  );

const coreLoggerServiceRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_LOGGER_SERVICE_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { coreLoggerServiceRenderers: coreLoggerServiceRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        coreLoggerServiceRenderers: {
          logger: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_LOGGER_SERVICE_TEMPLATES.logger,
                destination: paths.logger,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_LOGGER_SERVICE_RENDERERS = {
  provider: coreLoggerServiceRenderers,
  task: coreLoggerServiceRenderersTask,
};
