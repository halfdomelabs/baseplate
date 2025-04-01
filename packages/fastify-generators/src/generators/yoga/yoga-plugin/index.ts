import type { TypescriptCodeBlock } from '@halfdomelabs/core-generators';
import type {
  FieldMapValues,
  InferFieldMapSchemaFromBuilder,
} from '@halfdomelabs/utils';

import {
  makeImportAndFilePath,
  nodeProvider,
  projectScope,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createOutputProviderType,
  createProviderType,
} from '@halfdomelabs/sync';
import {
  createFieldMap,
  createFieldMapSchemaBuilder,
} from '@halfdomelabs/utils';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/index.js';
import { authProvider } from '@src/generators/auth/index.js';
import { configServiceProvider } from '@src/generators/core/config-service/index.js';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/index.js';
import { fastifyRedisProvider } from '@src/generators/core/fastify-redis/index.js';
import { fastifyServerProvider } from '@src/generators/core/fastify-server/index.js';
import { loggerServiceProvider } from '@src/generators/core/logger-service/index.js';
import { requestServiceContextProvider } from '@src/generators/core/request-service-context/index.js';

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
  createOutputProviderType<
    FieldMapValues<InferFieldMapSchemaFromBuilder<typeof schemaBuilder>>
  >(`yoga-plugin-setup`);

export const yogaPluginGenerator = createGenerator({
  name: 'yoga/yoga-plugin',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ enableSubscriptions }) => [
    createGeneratorTask({
      name: 'setup',
      exports: {
        yogaPluginConfig: yogaPluginConfigProvider.export(projectScope),
      },
      outputs: {
        yogaPluginSetup: yogaPluginSetupProvider.export(),
      },
      run() {
        const configMap = createFieldMap(schemaBuilder);

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
    createGeneratorTask({
      name: 'fastify',
      dependencies: {
        fastifyServer: fastifyServerProvider,
      },
      run({ fastifyServer }) {
        fastifyServer.registerPlugin({
          name: 'graphqlPlugin',
          plugin: new TypescriptCodeExpression(
            'graphqlPlugin',
            "import { graphqlPlugin } from '@/src/plugins/graphql/index.js",
          ),
        });
      },
    }),
    createGeneratorTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        typescript: typescriptProvider,
        configService: configServiceProvider,
        errorHandlerService: errorHandlerServiceProvider,
        requestServiceContext: requestServiceContextProvider,
        loggerService: loggerServiceProvider,
        yogaPluginSetup: yogaPluginSetupProvider,
      },
      run({
        node,
        typescript,
        configService,
        requestServiceContext,
        loggerService,
        errorHandlerService,
        yogaPluginSetup: config,
      }) {
        node.addPackages({
          'altair-fastify-plugin': FASTIFY_PACKAGES['altair-fastify-plugin'],
          graphql: FASTIFY_PACKAGES.graphql,
          '@envelop/core': FASTIFY_PACKAGES['@envelop/core'],
          '@envelop/disable-introspection':
            FASTIFY_PACKAGES['@envelop/disable-introspection'],
          'graphql-yoga': FASTIFY_PACKAGES['graphql-yoga'],
        });

        node.addDevPackages({
          '@envelop/types': FASTIFY_PACKAGES['@envelop/types'],
          // needed to properly compile (https://github.com/fastify/fastify-websocket/issues/90)
          '@types/ws': FASTIFY_PACKAGES['@types/ws'],
        });

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
      ? [
          createGeneratorTask({
            name: 'server-websocket',
            dependencies: {
              node: nodeProvider,
              fastifyServer: fastifyServerProvider,
            },
            run({ node, fastifyServer }) {
              node.addPackages({
                '@fastify/websocket': FASTIFY_PACKAGES['@fastify/websocket'],
              });

              fastifyServer.registerPlugin({
                name: 'websocketPlugin',
                plugin: TypescriptCodeUtils.createExpression(
                  'websocketPlugin',
                  "import websocketPlugin from '@fastify/websocket';",
                ),
                orderPriority: 'EARLY',
              });

              return {};
            },
          }),
          createGeneratorTask({
            name: 'subscription',
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
              node.addPackages({
                '@graphql-yoga/redis-event-target':
                  FASTIFY_PACKAGES['@graphql-yoga/redis-event-target'],
                'graphql-ws': FASTIFY_PACKAGES['graphql-ws'],
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
        ]
      : []),
  ],
});
