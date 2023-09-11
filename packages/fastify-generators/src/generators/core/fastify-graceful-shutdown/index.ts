import {
  makeImportAndFilePath,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';
import { errorHandlerServiceProvider } from '../error-handler-service/index.js';
import { fastifyServerProvider } from '../fastify-server/index.js';
import { loggerServiceProvider } from '../logger-service/index.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

const FastifyGracefulShutdownGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    fastifyServer: fastifyServerProvider,
    errorHandlerService: errorHandlerServiceProvider,
    loggerService: loggerServiceProvider,
    typescript: typescriptProvider,
  },
  createGenerator(
    descriptor,
    { fastifyServer, errorHandlerService, loggerService, typescript },
  ) {
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
});

export default FastifyGracefulShutdownGenerator;
