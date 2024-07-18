import {
  copyTypescriptFileAction,
  ImportMap,
  ImportMapper,
  makeImportAndFilePath,
  nodeProvider,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { configServiceProvider } from '../config-service/index.js';
import {
  errorHandlerServiceProvider,
  errorHandlerServiceSetupProvider,
} from '../error-handler-service/index.js';
import { fastifyServerProvider } from '../fastify-server/index.js';
import { requestContextProvider } from '../request-context/index.js';
import { authInfoImportProvider } from '@src/generators/auth/auth-service/index.js';
import { prismaOutputProvider } from '@src/generators/prisma/prisma/index.js';

const descriptorSchema = z.object({});

export interface FastifyServerSentryProvider extends ImportMapper {
  addShouldLogToSentryBlock(block: TypescriptCodeBlock): void;
}

export const fastifyServerSentryProvider =
  createProviderType<FastifyServerSentryProvider>('fastify-server-sentry');

export interface FastifySentryProvider extends ImportMapper {
  addScopeConfigurationBlock(block: TypescriptCodeBlock): void;
  addSentryIntegration(integration: TypescriptCodeExpression): void;
}

export const fastifySentryProvider =
  createProviderType<FastifySentryProvider>('fastify-sentry');

const sentryServicePath = 'src/services/sentry.ts';

const FastifySentryGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'server',
      dependencies: {
        fastifyServer: fastifyServerProvider,
        errorHandlerServiceSetup: errorHandlerServiceSetupProvider,
        errorHandlerService: errorHandlerServiceProvider,
      },
      exports: {
        fastifyServerSentry: fastifyServerSentryProvider,
      },
      run({ errorHandlerServiceSetup, fastifyServer, errorHandlerService }) {
        fastifyServer.registerPlugin({
          name: 'sentryPlugin',
          plugin: TypescriptCodeUtils.createExpression(
            'sentryPlugin',
            "import {sentryPlugin} from '@/src/plugins/sentry'",
          ),
          orderPriority: 'EARLY',
        });

        const shouldLogToSentryBlocks: TypescriptCodeBlock[] = [];

        const [serviceImport] = makeImportAndFilePath(sentryServicePath);

        const importMap: ImportMap = {
          '%fastify-sentry/service': {
            path: serviceImport,
            allowedImports: [
              'extractSentryRequestData',
              'configureSentryScope',
              'logErrorToSentry',
              'isSentryEnabled',
            ],
          },
        };

        return {
          getProviders: () => ({
            fastifyServerSentry: {
              addShouldLogToSentryBlock(block) {
                shouldLogToSentryBlocks.push(block);
              },
              getImportMap: () => importMap,
            },
          }),
          build: () => {
            errorHandlerServiceSetup.getHandlerFile().addCodeBlock(
              'HEADER',
              TypescriptCodeUtils.formatBlock(
                `
      export function shouldLogToSentry(error: Error): boolean {
        if (error instanceof HttpError) {
          return error.statusCode >= 500;
        }
      
        const fastifyError = error as FastifyError;
        if (fastifyError.statusCode) {
          return fastifyError.statusCode <= 500;
        }

        SHOULD_LOG_TO_SENTRY_BLOCKS
      
        return true;
      }
              `,
                {
                  SHOULD_LOG_TO_SENTRY_BLOCKS: TypescriptCodeUtils.mergeBlocks(
                    shouldLogToSentryBlocks,
                  ),
                },
                {
                  importText: [
                    `import { HttpError } from '${errorHandlerService.getHttpErrorsImport()}'`,
                    "import { FastifyError } from 'fastify';",
                  ],
                },
              ),
            );

            errorHandlerServiceSetup.getHandlerFile().addCodeBlock(
              'LOGGER_ACTIONS',
              TypescriptCodeUtils.createBlock(
                `
if (error instanceof Error && shouldLogToSentry(error)) {
  context.errorId = logErrorToSentry(error, context);
} else if (typeof error === 'string') {
  context.errorId = logErrorToSentry(new Error(error), context);
}
      `,
                "import { logErrorToSentry } from '@/src/services/sentry'",
              ),
            );
          },
        };
      },
    });
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        requestContext: requestContextProvider,
        configService: configServiceProvider,
        typescript: typescriptProvider,
        errorHandler: errorHandlerServiceProvider,
      },
      exports: {
        fastifySentry: fastifySentryProvider,
      },
      run({ node, configService, typescript, errorHandler }) {
        const sentryServiceFile = typescript.createTemplate({
          CONFIG: { type: 'code-expression' },
          REQUEST_INFO_TYPE: { type: 'code-expression' },
          SCOPE_CONFIGURATION_BLOCKS: { type: 'code-block' },
          SENTRY_INTEGRATIONS: { type: 'code-expression' },
        });

        node.addPackages({
          '@sentry/node': '7.81.1',
          '@sentry/core': '7.81.1',
          '@sentry/utils': '7.81.1',
          lodash: '4.17.21',
        });

        node.addDevPackages({
          '@sentry/types': '7.81.1',
          '@types/lodash': '4.17.7',
        });

        configService.getConfigEntries().merge({
          SENTRY_DSN: {
            comment: 'Sentry DSN',
            value: TypescriptCodeUtils.createExpression(
              'z.string().optional()',
            ),
            seedValue: '',
            exampleValue: '',
          },
        });

        const [serviceImport, servicePath] =
          makeImportAndFilePath(sentryServicePath);

        const importMap: ImportMap = {
          '%fastify-sentry/service': {
            path: serviceImport,
            allowedImports: [
              'extractSentryRequestData',
              'configureSentryScope',
              'logErrorToSentry',
              'isSentryEnabled',
            ],
          },
          '%fastify-sentry/logger': {
            path: errorHandler.getImportMap()['%error-logger'].path,
            allowedImports: ['shouldLogToSentry'],
          },
        };

        const scopeConfigurationBlocks: TypescriptCodeBlock[] = [];

        const sentryIntegrations: TypescriptCodeExpression[] = [];

        sentryIntegrations.push(
          TypescriptCodeUtils.createExpression(
            `new Sentry.Integrations.Http({ tracing: true })`,
          ),
        );

        return {
          getProviders: () => ({
            fastifySentry: {
              getImportMap: () => importMap,
              addScopeConfigurationBlock(block) {
                scopeConfigurationBlocks.push(block);
              },
              addSentryIntegration(integration) {
                sentryIntegrations.push(integration);
              },
            },
          }),
          build: async (builder) => {
            sentryServiceFile.addCodeEntries({
              CONFIG: configService.getConfigExpression(),
              SCOPE_CONFIGURATION_BLOCKS: scopeConfigurationBlocks,
              SENTRY_INTEGRATIONS:
                TypescriptCodeUtils.mergeExpressionsAsArray(sentryIntegrations),
            });

            await builder.apply(
              sentryServiceFile.renderToAction(
                'services/sentry.ts',
                servicePath,
              ),
            );

            await builder.apply(
              copyTypescriptFileAction({
                source: 'plugins/sentry.ts',
                destination: 'src/plugins/sentry.ts',
              }),
            );
          },
        };
      },
    });

    taskBuilder.addTask({
      name: 'auth',
      dependencies: {
        fastifySentry: fastifySentryProvider,
        authInfoImport: authInfoImportProvider.dependency().optional(),
      },
      run({ authInfoImport, fastifySentry }) {
        if (authInfoImport) {
          fastifySentry.addScopeConfigurationBlock(
            TypescriptCodeUtils.createBlock(
              `const userData = requestContext.get('user');
      if (userData) {
        scope.setUser({
          ...scope.getUser(),
          id: userData.id,
        });
      }`,
              `import { requestContext } from '@fastify/request-context';`,
            ),
          );
        }
        return {};
      },
    });

    taskBuilder.addTask({
      name: 'prisma',
      dependencies: {
        fastifySentry: fastifySentryProvider,
        prismaOutput: prismaOutputProvider,
      },
      run({ fastifySentry, prismaOutput }) {
        fastifySentry.addSentryIntegration(
          TypescriptCodeUtils.createExpression(
            `new Sentry.Integrations.Prisma({ client: prisma })`,
            [
              `import * as Sentry from '@sentry/node';`,
              `import { prisma } from '%prisma-service';`,
            ],
            { importMappers: [prismaOutput] },
          ),
        );
        return {};
      },
    });
  },
});

export default FastifySentryGenerator;
