import type { TypescriptCodeBlock } from '@halfdomelabs/core-generators';
import type { NonOverwriteableMap } from '@halfdomelabs/sync';

import {
  makeImportAndFilePath,
  nodeProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

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

export interface YogaPluginSetupProvider {
  getConfig(): NonOverwriteableMap<YogaPluginConfig>;
  isSubscriptionEnabled(): boolean;
}
export const yogaPluginSetupProvider =
  createProviderType<YogaPluginSetupProvider>('yoga-plugin-setup');

export type YogaPluginProvider = unknown;

export const yogaPluginProvider =
  createProviderType<YogaPluginProvider>('yoga-plugin');

const YogaPluginGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, { enableSubscriptions }) {
    // Setup Task
    const setupTask = taskBuilder.addTask({
      name: 'setup',
      dependencies: {},
      exports: { yogaPluginSetup: yogaPluginSetupProvider },
      run() {
        const configMap = createNonOverwriteableMap<YogaPluginConfig>(
          {
            envelopPlugins: [],
            postSchemaBlocks: [],
            customImports: [],
            schema: new TypescriptCodeExpression(
              `new GraphQLSchema({})`,
              `import { GraphQLSchema } from 'graphql';`,
            ),
          },
          {
            defaultsOverwriteable: true,
          },
        );

        return {
          getProviders() {
            return {
              yogaPluginSetup: {
                getConfig: () => configMap,
                isSubscriptionEnabled: () => !!enableSubscriptions,
              },
            };
          },
          build() {
            configMap.prepend(
              'envelopPlugins',
              new TypescriptCodeExpression(
                'useDisableIntrospection({ disableIf: () => !IS_DEVELOPMENT })',
                "import { useDisableIntrospection } from '@envelop/disable-introspection';",
              ),
            );
            configMap.prepend(
              'envelopPlugins',
              TypescriptCodeUtils.createExpression('useGraphLogger()', [
                "import { useGraphLogger } from './useGraphLogger.js'",
              ]),
            );
            return { configMap };
          },
        };
      },
    });

    // Setup Fastify
    taskBuilder.addTask({
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

        return {};
      },
    });

    taskBuilder.addTask({
      name: 'main',
      taskDependencies: { setupTask },
      dependencies: {
        node: nodeProvider,
        typescript: typescriptProvider,
        configService: configServiceProvider,
        errorHandlerService: errorHandlerServiceProvider,
        requestServiceContext: requestServiceContextProvider,
        loggerService: loggerServiceProvider,
      },
      exports: {
        yogaPlugin: yogaPluginProvider,
      },
      run(
        {
          node,
          typescript,
          configService,
          requestServiceContext,
          loggerService,
          errorHandlerService,
        },
        { setupTask: { configMap } },
      ) {
        node.addPackages({
          'altair-fastify-plugin': '8.0.4',
          graphql: '16.9.0',
          '@envelop/core': '5.0.1',
          '@envelop/disable-introspection': '6.0.0',
          'graphql-yoga': '5.6.1',
        });

        node.addDevPackages({
          '@envelop/types': '5.0.0',
        });

        // needed to properly compile (https://github.com/fastify/fastify-websocket/issues/90)
        node.addDevPackages({
          '@types/ws': '8.5.13',
        });

        return {
          getProviders() {
            return { yogaPlugin: { getConfig: () => configMap } };
          },
          async build(builder) {
            const config = configMap.value();

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
    });

    if (enableSubscriptions) {
      taskBuilder.addTask({
        name: 'server-websocket',
        dependencies: {
          node: nodeProvider,
          fastifyServer: fastifyServerProvider,
        },
        run({ node, fastifyServer }) {
          node.addPackages({
            '@fastify/websocket': '11.0.1',
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
      });

      taskBuilder.addTask({
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
            '@graphql-yoga/redis-event-target': '2.0.0',
            'graphql-ws': '5.16.0',
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
      });
    }
  },
});

export default YogaPluginGenerator;
