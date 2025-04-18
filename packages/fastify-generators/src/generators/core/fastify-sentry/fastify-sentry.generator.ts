import type {
  ImportMap,
  ImportMapper,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  makeImportAndFilePath,
  nodeProvider,
  projectScope,
  tsCodeFragment,
  tsHoistedFragment,
  tsImportBuilder,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';
import { authProvider } from '@src/generators/auth/index.js';
import { prismaSchemaProvider } from '@src/generators/prisma/index.js';

import { configServiceProvider } from '../config-service/config-service.generator.js';
import {
  errorHandlerServiceConfigProvider,
  errorHandlerServiceProvider,
} from '../error-handler-service/error-handler-service.generator.js';
import { fastifyServerConfigProvider } from '../fastify-server/fastify-server.generator.js';
import { fastifyProvider } from '../fastify/fastify.generator.js';
import { requestContextProvider } from '../request-context/request-context.generator.js';

const descriptorSchema = z.object({});

export interface FastifySentryProvider extends ImportMapper {
  addScopeConfigurationBlock(block: TypescriptCodeBlock): void;
  addShouldLogToSentryBlock(block: TypescriptCodeBlock): void;
  addSentryIntegration(integration: TypescriptCodeExpression): void;
}

export const fastifySentryProvider =
  createProviderType<FastifySentryProvider>('fastify-sentry');

const sentryServicePath = 'src/services/sentry.ts';

export const fastifySentryGenerator = createGenerator({
  name: 'core/fastify-sentry',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    fastifyInstrument: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
        fastify: fastifyProvider,
      },
      run({ fastify, node }) {
        if (node.isEsm) {
          fastify.nodeFlags.mergeObj({
            ['instrument-dev']: {
              flag: '--import ./src/instrument.ts',
              useCase: 'instrument',
              targetEnvironment: 'dev',
            },
            ['instrument-prod']: {
              flag: '--import ./dist/instrument.ts',
              useCase: 'instrument',
              targetEnvironment: 'prod',
            },
          });
        }
        return {};
      },
    }),
    server: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
        fastifyServerConfig: fastifyServerConfigProvider,
        errorHandlerServiceConfig: errorHandlerServiceConfigProvider,
      },
      run({ node, errorHandlerServiceConfig, fastifyServerConfig }) {
        if (!node.isEsm) {
          fastifyServerConfig.initializerFragments.set(
            'sentry-instrument',
            tsCodeFragment('', [], {
              hoistedFragments: [
                tsHoistedFragment(
                  "import './instrument.js';",
                  'sentry-instrument',
                  'beforeImports',
                ),
              ],
            }),
          );
        }

        fastifyServerConfig.prePluginFragments.set(
          'sentry-setup',
          tsCodeFragment(
            `Sentry.setupFastifyErrorHandler(fastify);
          registerSentryEventProcessor();`,
            [
              tsImportBuilder(['registerSentryEventProcessor']).from(
                '@/src/services/sentry.js',
              ),
              tsImportBuilder().namespace('Sentry').from('@sentry/node'),
            ],
          ),
        );

        return {
          build: () => {
            errorHandlerServiceConfig.loggerActions.set(
              'logErrorToSentry',
              tsCodeFragment(
                `context.errorId = logErrorToSentry(error, context);`,
                tsImportBuilder(['logErrorToSentry']).from(
                  '@/src/services/sentry.js',
                ),
              ),
            );
          },
        };
      },
    }),
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, [
        '@sentry/core',
        '@sentry/node',
        '@sentry/profiling-node',
        'lodash',
      ]),
      dev: extractPackageVersions(FASTIFY_PACKAGES, ['@types/lodash']),
    }),
    main: createGeneratorTask({
      dependencies: {
        requestContext: requestContextProvider,
        configService: configServiceProvider,
        typescript: typescriptProvider,
        errorHandler: errorHandlerServiceProvider,
      },
      exports: {
        fastifySentry: fastifySentryProvider.export(projectScope),
      },
      run({ configService, typescript, errorHandler }) {
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

        configService.configFields.set('SENTRY_DSN', {
          comment: 'Sentry DSN',
          validator: tsCodeFragment('z.string().optional()'),
          seedValue: '',
          exampleValue: '',
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
          providers: {
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
          },
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
    }),
    prisma: createGeneratorTask({
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
    }),
    auth: createGeneratorTask({
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
    }),
  }),
});
