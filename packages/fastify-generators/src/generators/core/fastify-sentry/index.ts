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
} from '@baseplate/core-generators';
import { createGeneratorWithTasks, createProviderType } from '@baseplate/sync';
import { z } from 'zod';
import { authInfoImportProvider } from '@src/generators/auth/auth-service';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { configServiceProvider } from '../config-service';
import {
  errorHandlerServiceProvider,
  errorHandlerServiceSetupProvider,
} from '../error-handler-service';
import { fastifyServerProvider } from '../fastify-server';
import { requestContextProvider } from '../request-context';

const descriptorSchema = z.object({});

export interface FastifySentryProvider extends ImportMapper {
  addScopeConfigurationBlock(block: TypescriptCodeBlock): void;
  addSentryIntegration(integration: TypescriptCodeExpression): void;
}

export const fastifySentryProvider =
  createProviderType<FastifySentryProvider>('fastify-sentry');

const FastifySentryGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'server',
      dependencies: {
        fastifyServer: fastifyServerProvider,
        errorHandlerServiceSetup: errorHandlerServiceSetupProvider,
      },
      run({ errorHandlerServiceSetup, fastifyServer }) {
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
      export function shouldLogToSentry(error: Error): boolean {
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

        return {};
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
      run({ node, requestContext, configService, typescript, errorHandler }) {
        const sentryServiceFile = typescript.createTemplate({
          CONFIG: { type: 'code-expression' },
          REQUEST_INFO_TYPE: { type: 'code-expression' },
          SCOPE_CONFIGURATION_BLOCKS: { type: 'code-block' },
          SENTRY_INTEGRATIONS: { type: 'code-expression' },
        });

        node.addPackages({
          '@sentry/node': '7.7.0',
          '@sentry/tracing': '7.7.0',
          lodash: '4.17.21',
        });

        node.addDevPackages({
          '@sentry/types': '7.7.0',
          '@types/lodash': '4.14.182',
        });

        configService.getConfigEntries().merge({
          SENTRY_DSN: {
            comment: 'Sentry DSN',
            value: TypescriptCodeUtils.createExpression(
              'z.string().optional()'
            ),
            seedValue: '',
            exampleValue: '',
          },
        });

        const [serviceImport, servicePath] = makeImportAndFilePath(
          'src/services/sentry.ts'
        );

        const importMap: ImportMap = {
          '%fastify-sentry/service': {
            path: serviceImport,
            allowedImports: [
              'extractSentryRequestData',
              'configureSentryScope',
              'logErrorToSentry',
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
            `new Sentry.Integrations.Http({ tracing: true })`
          )
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
              REQUEST_INFO_TYPE: requestContext.getRequestInfoType(),
              SCOPE_CONFIGURATION_BLOCKS: scopeConfigurationBlocks,
              SENTRY_INTEGRATIONS:
                TypescriptCodeUtils.mergeExpressionsAsArray(sentryIntegrations),
            });

            await builder.apply(
              sentryServiceFile.renderToAction(
                'services/sentry.ts',
                servicePath
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
          id: userData.id,
          email: userData.email,
          ip_address: requestData?.ip,
        });
      }`
            )
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
            `new Tracing.Integrations.Prisma({ client: prisma })`,
            [
              `import * as Tracing from '@sentry/tracing';`,
              `import { prisma } from '%prisma-service';`,
            ],
            { importMappers: [prismaOutput] }
          )
        );
        return {};
      },
    });
  },
});

export default FastifySentryGenerator;
