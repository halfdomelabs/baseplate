import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  nodeProvider,
  projectScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';
import { authContextImportsProvider } from '@src/generators/auth/index.js';
import { prismaSchemaProvider } from '@src/generators/prisma/index.js';

import {
  configServiceImportsProvider,
  configServiceProvider,
} from '../config-service/config-service.generator.js';
import {
  errorHandlerServiceConfigProvider,
  errorHandlerServiceImportsProvider,
} from '../error-handler-service/error-handler-service.generator.js';
import { fastifyServerConfigProvider } from '../fastify-server/fastify-server.generator.js';
import { fastifyProvider } from '../fastify/fastify.generator.js';
import {
  createFastifySentryImports,
  fastifySentryImportsProvider,
} from './generated/ts-import-maps.js';
import { CORE_FASTIFY_SENTRY_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

const [
  setupTask,
  fastifySentryConfigProvider,
  fastifySentryConfigValuesProvider,
] = createConfigProviderTask(
  (t) => ({
    scopeConfigurationFragments: t.map<string, TsCodeFragment>(),
    shouldLogToSentryFragments: t.map<string, TsCodeFragment>(),
    sentryIntegrations: t.mapFromObj<TsCodeFragment>({
      nodeProfilingIntegration: tsCodeFragment(
        `nodeProfilingIntegration()`,
        tsImportBuilder(['nodeProfilingIntegration']).from(
          '@sentry/profiling-node',
        ),
      ),
      requestDataIntegration: tsCodeFragment(
        `Sentry.requestDataIntegration({ include: { ip: true } })`,
        tsImportBuilder().namespace('Sentry').from('@sentry/node'),
      ),
    }),
  }),
  {
    prefix: 'fastify-sentry',
    configScope: projectScope,
  },
);

export { fastifySentryConfigProvider };

const sentryServicePath = '@/src/services/sentry.ts';
const sentryInstrumentPath = '@/src/instrument.ts';

export const fastifySentryGenerator = createGenerator({
  name: 'core/fastify-sentry',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    setup: setupTask,
    imports: createGeneratorTask({
      exports: {
        fastifySentryImports: fastifySentryImportsProvider.export(projectScope),
      },
      run() {
        return {
          providers: {
            fastifySentryImports: createFastifySentryImports('@/src/services'),
          },
        };
      },
    }),
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
        fastifySentryImports: fastifySentryImportsProvider,
      },
      run({
        node,
        errorHandlerServiceConfig,
        fastifyServerConfig,
        fastifySentryImports,
      }) {
        if (!node.isEsm) {
          fastifyServerConfig.initializerFragments.set(
            'sentry-instrument',
            tsCodeFragment(`import '${sentryInstrumentPath}';`),
          );
        }

        fastifyServerConfig.prePluginFragments.set(
          'sentry-setup',
          tsCodeFragment(
            `Sentry.setupFastifyErrorHandler(fastify);
             registerSentryEventProcessor();`,
            [
              tsImportBuilder(['registerSentryEventProcessor']).from(
                sentryServicePath,
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
                fastifySentryImports.logErrorToSentry.declaration(),
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
    config: createProviderTask(configServiceProvider, (configService) => {
      configService.configFields.set('SENTRY_DSN', {
        comment: 'Sentry DSN',
        validator: tsCodeFragment('z.string().optional()'),
        seedValue: '',
        exampleValue: '',
      });
    }),
    main: createGeneratorTask({
      dependencies: {
        configServiceImports: configServiceImportsProvider,
        typescriptFile: typescriptFileProvider,
        errorHandlerServiceImports: errorHandlerServiceImportsProvider,
        fastifySentryConfigValues: fastifySentryConfigValuesProvider,
      },
      run({
        configServiceImports,
        typescriptFile,
        errorHandlerServiceImports,
        fastifySentryConfigValues: {
          sentryIntegrations,
          scopeConfigurationFragments,
          shouldLogToSentryFragments,
        },
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_FASTIFY_SENTRY_TS_TEMPLATES.sentry,
                destination: sentryServicePath,
                variables: {
                  TPL_SCOPE_CONFIGURATION: TsCodeUtils.mergeFragments(
                    scopeConfigurationFragments,
                    '\n\n',
                  ),
                  TPL_LOG_TO_SENTRY_CONDITIONS: TsCodeUtils.mergeFragments(
                    shouldLogToSentryFragments,
                    '\n\n',
                  ),
                },
                importMapProviders: {
                  configServiceImports,
                  errorHandlerServiceImports,
                },
              }),
            );

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_FASTIFY_SENTRY_TS_TEMPLATES.instrument,
                destination: sentryInstrumentPath,
                variables: {
                  TPL_INTEGRATIONS:
                    TsCodeUtils.mergeFragmentsAsArray(sentryIntegrations),
                },
                importMapProviders: {
                  configServiceImports,
                },
              }),
            );
          },
        };
      },
    }),
    prisma: createGeneratorTask({
      dependencies: {
        prismaSchemaProvider: prismaSchemaProvider.dependency().optional(),
        fastifySentryConfig: fastifySentryConfigProvider,
      },
      run({ prismaSchemaProvider, fastifySentryConfig }) {
        if (prismaSchemaProvider) {
          fastifySentryConfig.sentryIntegrations.set(
            'prismaIntegration',
            tsCodeFragment(
              `Sentry.prismaIntegration()`,
              tsImportBuilder().namespace('Sentry').from('@sentry/node'),
            ),
          );
        }
        return {};
      },
    }),
    auth: createGeneratorTask({
      dependencies: {
        fastifySentryConfig: fastifySentryConfigProvider,
        authContextImports: authContextImportsProvider.dependency().optional(),
      },
      run({ authContextImports, fastifySentryConfig }) {
        if (authContextImports) {
          fastifySentryConfig.scopeConfigurationFragments.set(
            'user-id',
            tsCodeFragment(
              `const userId = requestContext.get('userId');
    if (userId) {
      event.user = {
        ...event.user,
        id: userId,
      };
    }`,
              tsImportBuilder(['requestContext']).from(
                '@fastify/request-context',
              ),
            ),
          );
        }
        return {};
      },
    }),
  }),
});
