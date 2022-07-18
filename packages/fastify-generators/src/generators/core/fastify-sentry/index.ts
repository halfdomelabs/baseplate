import {
  copyTypescriptFileAction,
  nodeProvider,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createNonOverwriteableMap,
  createProviderType,
  NonOverwriteableMap,
} from '@baseplate/sync';
import { z } from 'zod';
import { configServiceProvider } from '../config-service';
import { errorHandlerServiceSetupProvider } from '../error-handler-service';
import { fastifyServerProvider } from '../fastify-server';
import { requestContextProvider } from '../request-context';

const descriptorSchema = z.object({});

export interface FastifySentryGeneratorConfig {
  setting?: string;
}

export interface FastifySentryProvider {
  getConfig(): NonOverwriteableMap<FastifySentryGeneratorConfig>;
}

export const fastifySentryProvider =
  createProviderType<FastifySentryProvider>('fastify-sentry');

const FastifySentryGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    requestContext: requestContextProvider,
    configService: configServiceProvider,
    fastifyServer: fastifyServerProvider,
    errorHandlerServiceSetup: errorHandlerServiceSetupProvider,
    typescript: typescriptProvider,
  },
  exports: {
    fastifySentry: fastifySentryProvider,
  },
  createGenerator(
    descriptor,
    {
      node,
      requestContext,
      configService,
      fastifyServer,
      errorHandlerServiceSetup,
      typescript,
    }
  ) {
    const config = createNonOverwriteableMap(
      {},
      { name: 'fastify-sentry-config' }
    );

    const sentryServiceFile = typescript.createTemplate({
      CONFIG: { type: 'code-expression' },
      REQUEST_INFO_TYPE: { type: 'code-expression' },
    });

    node.addPackages({
      '@sentry/node': '7.5.1',
      '@sentry/tracing': '7.5.1',
      lodash: '4.17.21',
    });

    node.addDevPackages({
      '@sentry/types': '7.5.1',
      '@types/lodash': '4.14.182',
    });

    configService.getConfigEntries().merge({
      SENTRY_DSN: {
        comment: 'Sentry DSN',
        value: TypescriptCodeUtils.createExpression('z.string().optional()'),
        seedValue: '',
        exampleValue: '',
      },
    });

    fastifyServer.registerPlugin({
      name: 'sentryPlugin',
      plugin: TypescriptCodeUtils.createExpression(
        'sentryPlugin',
        "import {sentryPlugin} from '@/src/plugins/sentry'"
      ),
      orderPriority: 'EARLY',
    });

    errorHandlerServiceSetup.getHandlerFile().addCodeBlock(
      'HEADER',
      TypescriptCodeUtils.createBlock(
        `
function shouldLogToSentry(error: Error): boolean {
  if (error instanceof HttpError) {
    return error.statusCode >= 500;
  }

  const fastifyError = error as FastifyError;
  if (fastifyError.statusCode) {
    return fastifyError.statusCode <= 500;
  }

  return true;
}
        `,
        [
          `import { HttpError } from '${errorHandlerServiceSetup.getHttpErrorsImport()}'`,
          "import { FastifyError } from 'fastify';",
        ]
      )
    );

    errorHandlerServiceSetup.getHandlerFile().addCodeBlock(
      'LOGGER_ACTIONS',
      TypescriptCodeUtils.createBlock(
        `
if (error instanceof Error && shouldLogToSentry(error)) {
  logErrorToSentry(error);
} else if (typeof error === 'string') {
  logErrorToSentry(new Error(error));
}
`,
        "import { logErrorToSentry } from '@/src/services/sentry'"
      )
    );

    return {
      getProviders: () => ({
        fastifySentry: {
          getConfig: () => config,
        },
      }),
      build: async (builder) => {
        sentryServiceFile.addCodeExpression(
          'CONFIG',
          configService.getConfigExpression()
        );
        sentryServiceFile.addCodeExpression(
          'REQUEST_INFO_TYPE',
          requestContext.getRequestInfoType()
        );

        await builder.apply(
          sentryServiceFile.renderToAction(
            'services/sentry.ts',
            'src/services/sentry.ts'
          )
        );

        await builder.apply(
          copyTypescriptFileAction({
            source: 'plugins/sentry.ts',
            destination: 'src/plugins/sentry.ts',
          })
        );
      },
    };
  },
});

export default FastifySentryGenerator;
