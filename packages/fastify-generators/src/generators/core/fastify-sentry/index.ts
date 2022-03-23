import {
  copyTypescriptFileAction,
  nodeProvider,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  NonOverwriteableMap,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import * as yup from 'yup';
import { configServiceProvider } from '../config-service';
import { errorHandlerServiceProvider } from '../error-handler-service';
import { fastifyServerProvider } from '../fastify-server';
import { requestContextProvider } from '../request-context';

const descriptorSchema = yup.object({});

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
    errorHandlerService: errorHandlerServiceProvider,
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
      errorHandlerService,
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
      '@sentry/node': '^6.16.1',
      '@sentry/tracing': '^6.16.1',
      lodash: '^4.17.21',
    });

    node.addDevPackages({
      '@sentry/types': '^6.16.1',
    });

    configService.getConfigEntries().merge({
      SENTRY_DSN: {
        comment: 'Sentry DSN',
        value: TypescriptCodeUtils.createExpression('yup.string()'),
        seedValue: '',
        exampleValue: '<SENTRY_DSN>',
      },
    });

    fastifyServer.registerPlugin({
      name: 'sentryPlugin',
      plugin: TypescriptCodeUtils.createExpression(
        'sentryPlugin',
        "import {sentryPlugin} from '@/src/plugins/sentry'"
      ),
    });

    errorHandlerService.getHandlerFile().addCodeBlock(
      'HEADER',
      TypescriptCodeUtils.createBlock(
        `
function shouldLogToSentry(error: Error): boolean {
  if (error instanceof HttpError) {
    return error.statusCode >= 500;
  }
  return true;
}
        `,
        `import { HttpError } from '${errorHandlerService.getHttpErrorsImport()}'`
      )
    );

    errorHandlerService.getHandlerFile().addCodeBlock(
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
