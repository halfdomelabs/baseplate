import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  projectScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { configServiceImportsProvider } from '../config-service/index.js';
import { fastifyServerConfigProvider } from '../fastify-server/fastify-server.generator.js';
import { loggerServiceImportsProvider } from '../logger-service/index.js';
import { CORE_ERROR_HANDLER_SERVICE_PATHS } from './generated/template-paths.js';
import {
  coreErrorHandlerServiceImportsTask,
  errorHandlerServiceImportsProvider,
} from './generated/ts-import-providers.js';
import { CORE_ERROR_HANDLER_SERVICE_TEMPLATES } from './generated/typed-templates.js';

const descriptorSchema = z.object({});

export const [
  configTask,
  errorHandlerServiceConfigProvider,
  errorHandlerServiceConfigValuesProvider,
] = createConfigProviderTask(
  (t) => ({
    contextActions: t.map<string, TsCodeFragment>(),
    loggerActions: t.map<string, TsCodeFragment>(),
  }),
  {
    prefix: 'error-handler-service',
    configScope: projectScope,
  },
);

export const errorHandlerServiceGenerator = createGenerator({
  name: 'core/error-handler-service',
  generatorFileUrl: import.meta.url,
  descriptorSchema,

  buildTasks: () => ({
    paths: CORE_ERROR_HANDLER_SERVICE_PATHS.task,
    imports: coreErrorHandlerServiceImportsTask,
    fastifyPlugin: createGeneratorTask({
      dependencies: {
        fastifyServerConfig: fastifyServerConfigProvider,
        typescriptFile: typescriptFileProvider,
        configServiceImports: configServiceImportsProvider,
        errorHandlerServiceImports: errorHandlerServiceImportsProvider,
        paths: CORE_ERROR_HANDLER_SERVICE_PATHS.provider,
      },
      run({
        fastifyServerConfig,
        typescriptFile,
        configServiceImports,
        errorHandlerServiceImports,
        paths,
      }) {
        fastifyServerConfig.plugins.set('errorHandlerPlugin', {
          plugin: tsCodeFragment(
            'errorHandlerPlugin',
            tsImportBuilder(['errorHandlerPlugin']).from(
              paths.errorHandlerPlugin,
            ),
          ),
          orderPriority: 'EARLY',
        });

        fastifyServerConfig.errorHandlerFunction.set(
          errorHandlerServiceImports.logError.fragment(),
        );

        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  CORE_ERROR_HANDLER_SERVICE_TEMPLATES.errorHandlerPlugin,
                destination: paths.errorHandlerPlugin,
                variables: {},
                importMapProviders: {
                  configServiceImports,
                },
              }),
            );
          },
        };
      },
    }),
    configTask,
    errorLogger: createGeneratorTask({
      dependencies: {
        loggerServiceImports: loggerServiceImportsProvider,
        typescriptFile: typescriptFileProvider,
        errorHandlerServiceConfigValues:
          errorHandlerServiceConfigValuesProvider,
        paths: CORE_ERROR_HANDLER_SERVICE_PATHS.provider,
      },
      run({
        loggerServiceImports,
        typescriptFile,
        errorHandlerServiceConfigValues: { contextActions, loggerActions },
        paths,
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_ERROR_HANDLER_SERVICE_TEMPLATES.errorLogger,
                destination: paths.errorLogger,
                importMapProviders: { loggerServiceImports },
                variables: {
                  TPL_CONTEXT_ACTIONS: TsCodeUtils.mergeFragments(
                    contextActions,
                    '\n\n',
                  ),
                  TPL_LOGGER_ACTIONS: TsCodeUtils.mergeFragments(
                    loggerActions,
                    '\n\n',
                  ),
                },
              }),
            );
          },
        };
      },
    }),
    utils: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        paths: CORE_ERROR_HANDLER_SERVICE_PATHS.provider,
      },
      run({ typescriptFile, paths }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateGroupV2({
                group: CORE_ERROR_HANDLER_SERVICE_TEMPLATES.utils,
                paths,
              }),
            );
          },
        };
      },
    }),
  }),
});
