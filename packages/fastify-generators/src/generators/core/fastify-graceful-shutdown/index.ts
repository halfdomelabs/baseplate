import {
  makeImportAndFilePath,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { errorHandlerServiceProvider } from '../error-handler-service';
import { fastifyServerProvider } from '../fastify-server';
import { loggerServiceProvider } from '../logger-service';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
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
    { fastifyServer, errorHandlerService, loggerService, typescript }
  ) {
    const [gracefulShutdownImport, gracefulShutdownPath] =
      makeImportAndFilePath('src/plugins/graceful-shutdown.ts');

    fastifyServer.registerPlugin({
      name: 'graceful-shutdown',
      plugin: TypescriptCodeUtils.createExpression(
        'gracefulShutdownPlugin',
        `import { gracefulShutdownPlugin } from '${gracefulShutdownImport}'`
      ),
    });

    return {
      build: async (builder) => {
        await builder.apply(
          typescript.createCopyAction({
            source: 'graceful-shutdown.ts',
            destination: gracefulShutdownPath,
            importMappers: [loggerService, errorHandlerService],
          })
        );
      },
    };
  },
});

export default FastifyGracefulShutdownGenerator;
