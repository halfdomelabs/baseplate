import {
  makeImportAndFilePath,
  tsCodeFragment,
  tsImportBuilder,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { errorHandlerServiceProvider } from '../error-handler-service/error-handler-service.generator.js';
import { fastifyServerConfigProvider } from '../fastify-server/fastify-server.generator.js';
import { loggerServiceProvider } from '../logger-service/logger-service.generator.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export const fastifyGracefulShutdownGenerator = createGenerator({
  name: 'core/fastify-graceful-shutdown',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        fastifyServerConfig: fastifyServerConfigProvider,
        errorHandlerService: errorHandlerServiceProvider,
        loggerService: loggerServiceProvider,
        typescript: typescriptProvider,
      },
      run({
        fastifyServerConfig,
        errorHandlerService,
        loggerService,
        typescript,
      }) {
        const [gracefulShutdownImport, gracefulShutdownPath] =
          makeImportAndFilePath('src/plugins/graceful-shutdown.ts');

        fastifyServerConfig.plugins.set('gracefulShutdownPlugin', {
          plugin: tsCodeFragment(
            'gracefulShutdownPlugin',
            tsImportBuilder(['gracefulShutdownPlugin']).from(
              gracefulShutdownImport,
            ),
          ),
        });

        return {
          build: async (builder) => {
            await builder.apply(
              typescript.createCopyAction({
                source: 'graceful-shutdown.ts',
                destination: gracefulShutdownPath,
                importMappers: [loggerService, errorHandlerService],
              }),
            );
          },
        };
      },
    }),
  }),
});
