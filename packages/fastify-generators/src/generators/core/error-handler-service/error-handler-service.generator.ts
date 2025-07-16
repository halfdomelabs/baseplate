import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  packageScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { fastifyServerConfigProvider } from '../fastify-server/index.js';
import { CORE_ERROR_HANDLER_SERVICE_GENERATED } from './generated/index.js';
import { errorHandlerServiceImportsProvider } from './generated/ts-import-providers.js';

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
    configScope: packageScope,
  },
);

export const errorHandlerServiceGenerator = createGenerator({
  name: 'core/error-handler-service',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: CORE_ERROR_HANDLER_SERVICE_GENERATED.paths.task,
    imports: CORE_ERROR_HANDLER_SERVICE_GENERATED.imports.task,
    renderers: CORE_ERROR_HANDLER_SERVICE_GENERATED.renderers.task,
    fastifyPlugin: createGeneratorTask({
      dependencies: {
        fastifyServerConfig: fastifyServerConfigProvider,
        errorHandlerServiceImports: errorHandlerServiceImportsProvider,
        paths: CORE_ERROR_HANDLER_SERVICE_GENERATED.paths.provider,
        renderers: CORE_ERROR_HANDLER_SERVICE_GENERATED.renderers.provider,
      },
      run({
        fastifyServerConfig,
        errorHandlerServiceImports,
        renderers,
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
            await builder.apply(renderers.errorHandlerPlugin.render({}));
          },
        };
      },
    }),
    configTask,
    errorLogger: createGeneratorTask({
      dependencies: {
        errorHandlerServiceConfigValues:
          errorHandlerServiceConfigValuesProvider,
        renderers: CORE_ERROR_HANDLER_SERVICE_GENERATED.renderers.provider,
      },
      run({
        errorHandlerServiceConfigValues: { contextActions, loggerActions },
        renderers,
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderers.errorLogger.render({
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
        renderers: CORE_ERROR_HANDLER_SERVICE_GENERATED.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.utilsGroup.render({}));
          },
        };
      },
    }),
  }),
});
