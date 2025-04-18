import type { TypescriptCodeBlock } from '@halfdomelabs/core-generators';
import type {
  FieldMapValues,
  InferFieldMapSchemaFromBuilder,
} from '@halfdomelabs/utils';

import {
  createNodePackagesTask,
  extractPackageVersions,
  makeImportAndFilePath,
  nodeProvider,
  projectScope,
  tsCodeFragment,
  tsImportBuilder,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createConfigFieldMap,
  createGenerator,
  createGeneratorTask,
  createProviderType,
  createReadOnlyProviderType,
} from '@halfdomelabs/sync';
import { createFieldMapSchemaBuilder } from '@halfdomelabs/utils';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/index.js';
import { authProvider } from '@src/generators/auth/index.js';
import { configServiceProvider } from '@src/generators/core/config-service/config-service.generator.js';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/error-handler-service.generator.js';
import { fastifyRedisProvider } from '@src/generators/core/fastify-redis/fastify-redis.generator.js';
import { fastifyServerConfigProvider } from '@src/generators/core/fastify-server/fastify-server.generator.js';
import { loggerServiceProvider } from '@src/generators/core/logger-service/logger-service.generator.js';
import { requestServiceContextProvider } from '@src/generators/core/request-service-context/request-service-context.generator.js';

const descriptorSchema = z.object({
  enableSubscriptions: z.boolean().optional(),
});

export interface YogaPluginConfig {
  envelopPlugins: TypescriptCodeExpression[];
  postSchemaBlocks: TypescriptCodeBlock[];
  schema: TypescriptCodeExpression;
  customImports: TypescriptCodeBlock[];
}

const schemaBuilder = createFieldMapSchemaBuilder((t) => ({
  envelopPlugins: t.array<TypescriptCodeExpression>([
    TypescriptCodeUtils.createExpression('useGraphLogger()', [
      "import { useGraphLogger } from './useGraphLogger.js'",
    ]),
    TypescriptCodeUtils.createExpression(
      'useDisableIntrospection({ disableIf: () => !IS_DEVELOPMENT })',
      "import { useDisableIntrospection } from '@envelop/disable-introspection';",
    ),
  ]),
  postSchemaBlocks: t.array<TypescriptCodeBlock>(),
  schema: t.scalar<TypescriptCodeExpression>(
    new TypescriptCodeExpression(
      `new GraphQLSchema({})`,
      `import { GraphQLSchema } from 'graphql';`,
    ),
  ),
  customImports: t.array<TypescriptCodeBlock>(),
}));

export interface YogaPluginConfigProvider
  extends InferFieldMapSchemaFromBuilder<typeof schemaBuilder> {
  isSubscriptionEnabled(): boolean;
}

export const yogaPluginConfigProvider =
  createProviderType<YogaPluginConfigProvider>('yoga-plugin-config');

export const yogaPluginSetupProvider =
  createReadOnlyProviderType<
    FieldMapValues<InferFieldMapSchemaFromBuilder<typeof schemaBuilder>>
  >(`yoga-plugin-setup`);

export const yogaPluginGenerator = createGenerator({
  name: 'yoga/yoga-plugin',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ enableSubscriptions }) => ({
    setup: createGeneratorTask({
      exports: {
        yogaPluginConfig: yogaPluginConfigProvider.export(projectScope),
      },
      outputs: {
        yogaPluginSetup: yogaPluginSetupProvider.export(),
      },
      run() {
        const configMap = createConfigFieldMap(schemaBuilder);

        return {
          providers: {
            yogaPluginConfig: {
              ...configMap,
              isSubscriptionEnabled: () => !!enableSubscriptions,
            },
          },
          build() {
            return {
              yogaPluginSetup: configMap.getValues(),
            };
          },
        };
      },
    }),
    fastify: createGeneratorTask({
      dependencies: {
        fastifyServerConfig: fastifyServerConfigProvider,
      },
      run({ fastifyServerConfig }) {
        fastifyServerConfig.plugins.set('graphqlPlugin', {
          plugin: tsCodeFragment(
            'graphqlPlugin',
            tsImportBuilder(['graphqlPlugin']).from(
              '@/src/plugins/graphql/index.js',
            ),
          ),
        });
      },
    }),
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, [
        'altair-fastify-plugin',
        'graphql',
        '@envelop/core',
        '@envelop/disable-introspection',
        'graphql-yoga',
      ]),
      dev: extractPackageVersions(FASTIFY_PACKAGES, [
        '@envelop/types',
        // needed to properly compile (https://github.com/fastify/fastify-websocket/issues/90)
        '@types/ws',
      ]),
    }),
    main: createGeneratorTask({
      dependencies: {
        typescript: typescriptProvider,
        configService: configServiceProvider,
        errorHandlerService: errorHandlerServiceProvider,
        requestServiceContext: requestServiceContextProvider,
        loggerService: loggerServiceProvider,
        yogaPluginSetup: yogaPluginSetupProvider,
      },
      run({
        typescript,
        configService,
        requestServiceContext,
        loggerService,
        errorHandlerService,
        yogaPluginSetup: config,
      }) {
        return {
          async build(builder) {
            const pluginFile = typescript.createTemplate(
              {
                SCHEMA: { type: 'code-expression' },
                ROOT_MODULE: { type: 'code-expression' },
                ENVELOP_PLUGINS: { type: 'code-expression' },
                GRAPHQL_HANDLER: { type: 'code-block' },
                POST_SCHEMA_BLOCKS: TypescriptCodeUtils.mergeBlocks(
                  config.postSchemaBlocks,
                  '\n\n',
                ),
                CUSTOM_IMPORTS: TypescriptCodeUtils.mergeBlocks(
                  config.customImports,
                ),
              },
              {
                importMappers: [
                  errorHandlerService,
                  configService,
                  requestServiceContext,
                  loggerService,
                ],
              },
            );

            pluginFile.addCodeExpression('SCHEMA', config.schema);

            pluginFile.addCodeExpression(
              'ENVELOP_PLUGINS',
              TypescriptCodeUtils.mergeExpressionsAsArray(
                config.envelopPlugins,
              ),
            );

            pluginFile.addCodeBlock(
              'GRAPHQL_HANDLER',
              enableSubscriptions
                ? TypescriptCodeUtils.createBlock(
                    `fastify.route({
                  url: '/graphql',
                  method: 'GET',
                  handler: httpHandler,
                  wsHandler: getGraphqlWsHandler(graphQLServer),
                });
                
                fastify.route({
                  url: '/graphql',
                  method: ['POST', 'OPTIONS'],
                  handler: httpHandler,
                });`,
                    "import { getGraphqlWsHandler } from './websocket.js';",
                  )
                : `fastify.route({
              url: '/graphql',
              method: ['GET', 'POST', 'OPTIONS'],
              handler: httpHandler,
            });`,
            );

            await builder.apply(
              pluginFile.renderToAction(
                'plugins/graphql/index.ts',
                'src/plugins/graphql/index.ts',
              ),
            );

            await builder.apply(
              typescript.createCopyAction({
                source: 'plugins/graphql/useGraphLogger.ts',
                destination: 'src/plugins/graphql/useGraphLogger.ts',
                importMappers: [loggerService, errorHandlerService],
              }),
            );
          },
        };
      },
    }),
    ...(enableSubscriptions
      ? {
          serverWebsocket: createGeneratorTask({
            dependencies: {
              node: nodeProvider,
              fastifyServerConfig: fastifyServerConfigProvider,
            },
            run({ node, fastifyServerConfig }) {
              node.packages.addPackages({
                prod: extractPackageVersions(FASTIFY_PACKAGES, [
                  '@fastify/websocket',
                ]),
              });

              fastifyServerConfig.plugins.set('websocketPlugin', {
                plugin: tsCodeFragment(
                  'websocketPlugin',
                  tsImportBuilder()
                    .default('websocketPlugin')
                    .from('@fastify/websocket'),
                ),
                orderPriority: 'EARLY',
              });

              return {};
            },
          }),
          subscription: createGeneratorTask({
            dependencies: {
              node: nodeProvider,
              typescript: typescriptProvider,
              fastifyRedis: fastifyRedisProvider,
              auth: authProvider.dependency().optional(),
              errorLoggerService: errorHandlerServiceProvider,
              loggerService: loggerServiceProvider,
              requestServiceContext: requestServiceContextProvider,
            },
            run({
              node,
              typescript,
              fastifyRedis,
              auth,
              errorLoggerService,
              loggerService,
              requestServiceContext,
            }) {
              node.packages.addPackages({
                prod: extractPackageVersions(FASTIFY_PACKAGES, [
                  '@graphql-yoga/redis-event-target',
                  'graphql-ws',
                ]),
              });

              const [, pubsubPath] = makeImportAndFilePath(
                'src/plugins/graphql/pubsub.ts',
              );
              const [, websocketPath] = makeImportAndFilePath(
                'src/plugins/graphql/websocket.ts',
              );

              return {
                async build(builder) {
                  await builder.apply(
                    typescript.createCopyAction({
                      source: 'plugins/graphql/pubsub.ts',
                      destination: pubsubPath,
                      importMappers: [fastifyRedis],
                    }),
                  );

                  const websocketFile = typescript.createTemplate(
                    {
                      AUTH_INFO_CREATOR: auth
                        ? TypescriptCodeUtils.createExpression(
                            `await userSessionService.getSessionInfoFromToken(
              ctx.extra.request,
              typeof authorizationHeader === 'string'
                ? authorizationHeader
                : undefined,
            )`,
                            "import { userSessionService } from '%auth/user-session-service';",
                          )
                        : { type: 'code-expression' },
                    },
                    {
                      importMappers: [
                        errorLoggerService,
                        loggerService,
                        requestServiceContext,
                        auth,
                      ],
                    },
                  );

                  await builder.apply(
                    websocketFile.renderToAction(
                      'plugins/graphql/websocket.ts',
                      websocketPath,
                      {
                        preprocessWithEta: {
                          data: { authEnabled: !!auth },
                        },
                      },
                    ),
                  );
                },
              };
            },
          }),
        }
      : {}),
  }),
});
