import {
  TsCodeUtils,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { errorHandlerServiceImportsProvider } from '../error-handler-service/generated/ts-import-providers.js';
import { fastifyServerConfigProvider } from '../fastify-server/index.js';
import { loggerServiceImportsProvider } from '../logger-service/index.js';
import { CORE_FASTIFY_GRACEFUL_SHUTDOWN_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export const fastifyGracefulShutdownGenerator = createGenerator({
  name: 'core/fastify-graceful-shutdown',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: CORE_FASTIFY_GRACEFUL_SHUTDOWN_GENERATED.paths.task,
    main: createGeneratorTask({
      dependencies: {
        fastifyServerConfig: fastifyServerConfigProvider,
        errorHandlerServiceImports: errorHandlerServiceImportsProvider,
        loggerServiceImports: loggerServiceImportsProvider,
        typescriptFile: typescriptFileProvider,
        paths: CORE_FASTIFY_GRACEFUL_SHUTDOWN_GENERATED.paths.provider,
      },
      run({
        fastifyServerConfig,
        errorHandlerServiceImports,
        loggerServiceImports,
        typescriptFile,
        paths,
      }) {
        fastifyServerConfig.plugins.set('gracefulShutdownPlugin', {
          plugin: TsCodeUtils.importFragment(
            'gracefulShutdownPlugin',
            paths.gracefulShutdown,
          ),
        });

        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  CORE_FASTIFY_GRACEFUL_SHUTDOWN_GENERATED.templates
                    .gracefulShutdown,
                destination: paths.gracefulShutdown,
                importMapProviders: {
                  loggerServiceImports,
                  errorHandlerServiceImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
