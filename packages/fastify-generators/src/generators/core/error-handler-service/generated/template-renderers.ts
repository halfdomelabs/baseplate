import type {
  RenderTsTemplateFileActionInput,
  RenderTsTemplateGroupActionInput,
} from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { configServiceImportsProvider } from '#src/generators/core/config-service/generated/ts-import-providers.js';
import { loggerServiceImportsProvider } from '#src/generators/core/logger-service/generated/ts-import-providers.js';

import { CORE_ERROR_HANDLER_SERVICE_PATHS } from './template-paths.js';
import { CORE_ERROR_HANDLER_SERVICE_TEMPLATES } from './typed-templates.js';

export interface CoreErrorHandlerServiceRenderers {
  errorHandlerPlugin: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_ERROR_HANDLER_SERVICE_TEMPLATES.errorHandlerPlugin
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  errorLogger: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_ERROR_HANDLER_SERVICE_TEMPLATES.errorLogger
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  utilsGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof CORE_ERROR_HANDLER_SERVICE_TEMPLATES.utilsGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const coreErrorHandlerServiceRenderers =
  createProviderType<CoreErrorHandlerServiceRenderers>(
    'core-error-handler-service-renderers',
  );

const coreErrorHandlerServiceRenderersTask = createGeneratorTask({
  dependencies: {
    configServiceImports: configServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    paths: CORE_ERROR_HANDLER_SERVICE_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    coreErrorHandlerServiceRenderers: coreErrorHandlerServiceRenderers.export(),
  },
  run({ configServiceImports, loggerServiceImports, paths, typescriptFile }) {
    return {
      providers: {
        coreErrorHandlerServiceRenderers: {
          errorHandlerPlugin: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  CORE_ERROR_HANDLER_SERVICE_TEMPLATES.errorHandlerPlugin,
                destination: paths.errorHandlerPlugin,
                importMapProviders: {
                  configServiceImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          errorLogger: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_ERROR_HANDLER_SERVICE_TEMPLATES.errorLogger,
                destination: paths.errorLogger,
                importMapProviders: {
                  loggerServiceImports,
                },
                ...options,
              }),
          },
          utilsGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: CORE_ERROR_HANDLER_SERVICE_TEMPLATES.utilsGroup,
                paths,
                generatorPaths: paths,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_ERROR_HANDLER_SERVICE_RENDERERS = {
  provider: coreErrorHandlerServiceRenderers,
  task: coreErrorHandlerServiceRenderersTask,
};
