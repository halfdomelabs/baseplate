import {
  makeImportAndFilePath,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { errorHandlerServiceProvider } from '../error-handler-service/error-handler-service.generator.js';
import { fastifyServerProvider } from '../fastify-server/fastify-server.generator.js';
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
        fastifyServer: fastifyServerProvider,
        errorHandlerService: errorHandlerServiceProvider,
        loggerService: loggerServiceProvider,
        typescript: typescriptProvider,
      },
      run({ fastifyServer, errorHandlerService, loggerService, typescript }) {
        const [gracefulShutdownImport, gracefulShutdownPath] =
          makeImportAndFilePath('src/plugins/graceful-shutdown.ts');

        fastifyServer.registerPlugin({
          name: 'graceful-shutdown',
          plugin: TypescriptCodeUtils.createExpression(
            'gracefulShutdownPlugin',
            `import { gracefulShutdownPlugin } from '${gracefulShutdownImport}'`,
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
