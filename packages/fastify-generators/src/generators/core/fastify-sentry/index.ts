import {
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
import { prismaSchemaProvider } from '@src/generators/prisma/index.js';

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
        fastifyServer.addInitializerBlock(`import './instrument';`);
        fastifyServer.addPrePluginBlock(
          TypescriptCodeUtils.createBlock(
            `Sentry.setupFastifyErrorHandler(fastify);
          registerSentryEventProcessor();`,
            [
              `import { registerSentryEventProcessor } from '@/src/services/sentry';`,
              `import * as Sentry from '@sentry/node';`,
            ],
          ),
        );

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
          SCOPE_CONFIGURATION_BLOCKS: { type: 'code-block' },
        });

        node.addPackages({
          '@sentry/core': '8.19.0',
          '@sentry/node': '8.19.0',
          '@sentry/profiling-node': '8.19.0',
          lodash: '4.17.21',
        });

        node.addDevPackages({
          '@sentry/types': '8.19.0',
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
            `nodeProfilingIntegration()`,
            `import { nodeProfilingIntegration } from '@sentry/profiling-node'`,
          ),
          TypescriptCodeUtils.createExpression(
            `Sentry.requestDataIntegration({ include: { ip: true } })`,
            `import * as Sentry from '@sentry/node'`,
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
              SCOPE_CONFIGURATION_BLOCKS: scopeConfigurationBlocks,
            });

            await builder.apply(
              sentryServiceFile.renderToAction(
                'services/sentry.ts',
                servicePath,
              ),
            );

            const sentryInstrumentFile = typescript.createTemplate(
              {
                SENTRY_INTEGRATIONS:
                  TypescriptCodeUtils.mergeExpressionsAsArray(
                    sentryIntegrations,
                  ),
              },
              { importMappers: [configService] },
            );

            await builder.apply(
              sentryInstrumentFile.renderToAction(
                'instrument.ts',
                'src/instrument.ts',
              ),
            );
          },
        };
      },
    });

    taskBuilder.addTask({
      name: 'prisma',
      dependencies: {
        prismaSchemaProvider: prismaSchemaProvider.dependency().optional(),
        fastifySentryProvider,
      },
      run({ prismaSchemaProvider, fastifySentryProvider }) {
        if (prismaSchemaProvider) {
          fastifySentryProvider.addSentryIntegration(
            TypescriptCodeUtils.createExpression(
              `Sentry.prismaIntegration()`,
              `import * as Sentry from '@sentry/node'`,
            ),
          );
        }
        return {};
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
      event.user = {
        ...event.user,
        id: userData.id,
      };
    }`,
              `import { requestContext } from '@fastify/request-context';`,
            ),
          );
        }
        return {};
      },
    });
  },
});

export default FastifySentryGenerator;
