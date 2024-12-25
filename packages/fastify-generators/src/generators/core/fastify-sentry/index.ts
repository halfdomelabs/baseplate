import type {
  ImportMap,
  ImportMapper,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';

import {
  makeImportAndFilePath,
  nodeProvider,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { authProvider } from '@src/generators/auth/index.js';
import { prismaSchemaProvider } from '@src/generators/prisma/index.js';

import { configServiceProvider } from '../config-service/index.js';
import {
  errorHandlerServiceProvider,
  errorHandlerServiceSetupProvider,
} from '../error-handler-service/index.js';
import { fastifyServerProvider } from '../fastify-server/index.js';
import { fastifyProvider } from '../fastify/index.js';
import { requestContextProvider } from '../request-context/index.js';

const descriptorSchema = z.object({});

export interface FastifySentryProvider extends ImportMapper {
  addScopeConfigurationBlock(block: TypescriptCodeBlock): void;
  addShouldLogToSentryBlock(block: TypescriptCodeBlock): void;
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
      name: 'fastify-instrument',
      dependencies: {
        node: nodeProvider,
        fastify: fastifyProvider,
      },
      run({ fastify, node }) {
        if (node.isEsm()) {
          fastify.getConfig().appendUnique('nodeFlags', [
            {
              flag: '--import ./src/instrument.ts',
              useCase: 'instrument',
              targetEnvironment: 'dev',
            },
            {
              flag: '--import ./dist/instrument.ts',
              useCase: 'instrument',
              targetEnvironment: 'prod',
            },
          ]);
        }
        return {};
      },
    });
    taskBuilder.addTask({
      name: 'server',
      dependencies: {
        node: nodeProvider,
        fastifyServer: fastifyServerProvider,
        errorHandlerServiceSetup: errorHandlerServiceSetupProvider,
      },
      run({ node, errorHandlerServiceSetup, fastifyServer }) {
        if (!node.isEsm()) {
          fastifyServer.addInitializerBlock("import './instrument.js';\n");
        }

        fastifyServer.addPrePluginBlock(
          TypescriptCodeUtils.createBlock(
            `Sentry.setupFastifyErrorHandler(fastify);
          registerSentryEventProcessor();`,
            [
              `import { registerSentryEventProcessor } from '@/src/services/sentry.js';`,
              `import * as Sentry from '@sentry/node';`,
            ],
          ),
        );

        return {
          build: () => {
            errorHandlerServiceSetup
              .getHandlerFile()
              .addCodeBlock(
                'LOGGER_ACTIONS',
                TypescriptCodeUtils.createBlock(
                  `context.errorId = logErrorToSentry(error, context);`,
                  "import { logErrorToSentry } from '@/src/services/sentry.js",
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
        const sentryServiceFile = typescript.createTemplate(
          {
            SHOULD_LOG_TO_SENTRY_BLOCKS: { type: 'code-block' },
            SCOPE_CONFIGURATION_BLOCKS: { type: 'code-block' },
          },
          {
            importMappers: [errorHandler],
          },
        );

        const shouldLogToSentryBlocks: TypescriptCodeBlock[] = [];

        node.addPackages({
          '@sentry/core': '8.41.0',
          '@sentry/node': '8.41.0',
          '@sentry/profiling-node': '8.41.0',
          lodash: '4.17.21',
        });

        node.addDevPackages({
          '@sentry/types': '8.41.0',
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

        const errorLoggerPath =
          errorHandler.getImportMap()['%error-logger']?.path;

        if (!errorLoggerPath) {
          throw new Error('Error logger path not found');
        }

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
            path: errorLoggerPath,
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
              addShouldLogToSentryBlock(block) {
                shouldLogToSentryBlocks.push(block);
              },
              addSentryIntegration(integration) {
                sentryIntegrations.push(integration);
              },
            },
          }),
          build: async (builder) => {
            sentryServiceFile.addCodeEntries({
              SCOPE_CONFIGURATION_BLOCKS: scopeConfigurationBlocks,
              SHOULD_LOG_TO_SENTRY_BLOCKS: TypescriptCodeUtils.mergeBlocks(
                shouldLogToSentryBlocks,
              ),
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
        auth: authProvider.dependency().optional(),
      },
      run({ auth, fastifySentry }) {
        if (auth) {
          fastifySentry.addScopeConfigurationBlock(
            TypescriptCodeUtils.createBlock(
              `const userId = requestContext.get('userId');
    if (userId) {
      event.user = {
        ...event.user,
        id: userId,
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
