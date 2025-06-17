import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  nodeProvider,
  projectScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';
import { authContextImportsProvider } from '#src/generators/auth/index.js';

import {
  configServiceImportsProvider,
  configServiceProvider,
} from '../config-service/index.js';
import {
  errorHandlerServiceConfigProvider,
  errorHandlerServiceImportsProvider,
} from '../error-handler-service/index.js';
import { fastifyServerConfigProvider } from '../fastify-server/index.js';
import { fastifyProvider } from '../fastify/index.js';
import { CORE_FASTIFY_SENTRY_GENERATED } from './generated/index.js';
import { fastifySentryImportsProvider } from './generated/ts-import-providers.js';

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
    }),
  }),
  {
    prefix: 'fastify-sentry',
    configScope: projectScope,
  },
);

export { fastifySentryConfigProvider };

export const fastifySentryGenerator = createGenerator({
  name: 'core/fastify-sentry',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: CORE_FASTIFY_SENTRY_GENERATED.paths.task,
    imports: CORE_FASTIFY_SENTRY_GENERATED.imports.task,
    setup: setupTask,
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
        paths: CORE_FASTIFY_SENTRY_GENERATED.paths.provider,
      },
      run({
        node,
        errorHandlerServiceConfig,
        fastifyServerConfig,
        fastifySentryImports,
        paths,
      }) {
        if (!node.isEsm) {
          fastifyServerConfig.initializerFragments.set(
            'sentry-instrument',
            tsCodeFragment(`import '${paths.instrument}';`),
          );
        }

        fastifyServerConfig.prePluginFragments.set(
          'sentry-setup',
          tsCodeFragment(
            `Sentry.setupFastifyErrorHandler(fastify);
             registerSentryEventProcessor();`,
            [
              tsImportBuilder(['registerSentryEventProcessor']).from(
                paths.sentry,
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
        'es-toolkit',
      ]),
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
        paths: CORE_FASTIFY_SENTRY_GENERATED.paths.provider,
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
        paths,
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_FASTIFY_SENTRY_GENERATED.templates.sentry,
                destination: paths.sentry,
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
                template: CORE_FASTIFY_SENTRY_GENERATED.templates.instrument,
                destination: paths.instrument,
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
