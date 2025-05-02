import type { TsCodeFragment } from '@halfdomelabs/core-generators';
import type {
  FieldMapValues,
  InferFieldMapSchemaFromBuilder,
} from '@halfdomelabs/utils';

import {
  createNodePackagesTask,
  extractPackageVersions,
  nodeProvider,
  projectScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  TypescriptCodeUtils,
  typescriptFileProvider,
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
import {
  authContextImportsProvider,
  userSessionServiceImportsProvider,
} from '@src/generators/auth/index.js';
import { configServiceImportsProvider } from '@src/generators/core/config-service/config-service.generator.js';
import { errorHandlerServiceImportsProvider } from '@src/generators/core/error-handler-service/error-handler-service.generator.js';
import { fastifyRedisImportsProvider } from '@src/generators/core/fastify-redis/fastify-redis.generator.js';
import { fastifyServerConfigProvider } from '@src/generators/core/fastify-server/fastify-server.generator.js';
import { loggerServiceImportsProvider } from '@src/generators/core/logger-service/logger-service.generator.js';
import { requestServiceContextImportsProvider } from '@src/generators/core/request-service-context/request-service-context.generator.js';

import { YOGA_YOGA_PLUGIN_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({
  enableSubscriptions: z.boolean().optional(),
});

const schemaBuilder = createFieldMapSchemaBuilder((t) => ({
  /**
   * Envelop plugins to be applied to the GraphQL server.
   */
  envelopPlugins: t.mapFromObj<TsCodeFragment>({
    useGraphLogger: tsCodeFragment(
      'useGraphLogger()',
      tsImportBuilder(['useGraphLogger']).from('./useGraphLogger.js'),
    ),
    useDisableIntrospection: tsCodeFragment(
      'useDisableIntrospection({ disableIf: () => !IS_DEVELOPMENT })',
      tsImportBuilder(['useDisableIntrospection']).from(
        '@envelop/disable-introspection',
      ),
    ),
  }),
  /**
   * Fragments to be applied to the GraphQL schema after it is built.
   */
  postSchemaFragments: t.map<string, TsCodeFragment>(),
  /**
   * The GraphQL schema to be used by the GraphQL server.
   */
  schema: t.scalar<TsCodeFragment>(
    tsCodeFragment(
      `new GraphQLSchema({})`,
      tsImportBuilder(['GraphQLSchema']).from('graphql'),
    ),
  ),
  /**
   * Side effect imports prior to loading the GraphQL schema.
   */
  sideEffectImports: t.map<string, TsCodeFragment>(),
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
        typescriptFile: typescriptFileProvider,
        configServiceImports: configServiceImportsProvider,
        errorHandlerServiceImports: errorHandlerServiceImportsProvider,
        requestServiceContextImports: requestServiceContextImportsProvider,
        loggerServiceImports: loggerServiceImportsProvider,
        yogaPluginSetup: yogaPluginSetupProvider,
      },
      run({
        typescriptFile,
        configServiceImports,
        requestServiceContextImports,
        loggerServiceImports,
        errorHandlerServiceImports,
        yogaPluginSetup: config,
      }) {
        return {
          async build(builder) {
            const graphqlHandler = enableSubscriptions
              ? tsCodeFragment(
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
                  tsImportBuilder(['getGraphqlWsHandler']).from(
                    './websocket.js',
                  ),
                )
              : `fastify.route({
url: '/graphql',
method: ['GET', 'POST', 'OPTIONS'],
handler: httpHandler,
});`;

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: YOGA_YOGA_PLUGIN_TS_TEMPLATES.graphqlPlugin,
                destination: '@/src/plugins/graphql/index.ts',
                variables: {
                  TPL_SCHEMA: config.schema,
                  TPL_ENVELOP_PLUGINS: TsCodeUtils.mergeFragmentsAsArray(
                    config.envelopPlugins,
                  ),
                  TPL_GRAPHQL_HANDLER: graphqlHandler,
                  TPL_POST_SCHEMA_FRAGMENTS: TsCodeUtils.mergeFragments(
                    config.postSchemaFragments,
                    '\n\n',
                  ),
                  TPL_SIDE_EFFECT_IMPORTS: TsCodeUtils.mergeFragments(
                    config.sideEffectImports,
                    '\n',
                  ),
                },
                importMapProviders: {
                  configServiceImports,
                  requestServiceContextImports,
                  loggerServiceImports,
                  errorHandlerServiceImports,
                },
              }),
            );

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: YOGA_YOGA_PLUGIN_TS_TEMPLATES.useGraphLogger,
                destination: 'src/plugins/graphql/useGraphLogger.ts',
                importMapProviders: {
                  loggerServiceImports,
                  errorHandlerServiceImports,
                },
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
              typescriptFile: typescriptFileProvider,
              fastifyRedisImports: fastifyRedisImportsProvider,
              authContextImports: authContextImportsProvider
                .dependency()
                .optional(),
              errorHandlerServiceImports: errorHandlerServiceImportsProvider,
              loggerServiceImports: loggerServiceImportsProvider,
              requestServiceContextImports:
                requestServiceContextImportsProvider,
              userSessionServiceImports: userSessionServiceImportsProvider
                .dependency()
                .optional(),
            },
            run({
              node,
              typescriptFile,
              fastifyRedisImports,
              authContextImports,
              errorHandlerServiceImports,
              loggerServiceImports,
              requestServiceContextImports,
              userSessionServiceImports,
            }) {
              node.packages.addPackages({
                prod: extractPackageVersions(FASTIFY_PACKAGES, [
                  '@graphql-yoga/redis-event-target',
                  'graphql-ws',
                ]),
              });

              return {
                async build(builder) {
                  const websocketOnConnect = await builder.readTemplate(
                    'websocket-fragments.ts',
                  );
                  const websocketOnConnectFragment =
                    authContextImports && userSessionServiceImports
                      ? TsCodeUtils.formatFragment(
                          TypescriptCodeUtils.extractTemplateSnippet(
                            websocketOnConnect,
                            'ON_CONNECT',
                          ).replace(/;$/, ''),
                          {
                            TPL_SESSION_INFO_CREATOR: tsCodeFragment(
                              `await userSessionService.getSessionInfoFromToken(
              ctx.extra.request,
              typeof authorizationHeader === 'string'
                ? authorizationHeader
                : undefined,
            )`,
                              userSessionServiceImports.userSessionService.declaration(),
                            ),
                          },
                          [
                            authContextImports.createAuthContextFromSessionInfo.declaration(),
                            errorHandlerServiceImports.HttpError.declaration(),
                          ],
                        )
                      : undefined;

                  await builder.apply(
                    typescriptFile.renderTemplateGroup({
                      group: YOGA_YOGA_PLUGIN_TS_TEMPLATES.subscriptionsGroup,
                      baseDirectory: '@/src/plugins/graphql',
                      variables: {
                        pubsub: {
                          // Placeholder args for now
                          TPL_PUBLISH_ARGS: `{}`,
                        },
                        websocket: {
                          TPL_ON_CONNECT: websocketOnConnectFragment ?? '',
                        },
                      },
                      importMapProviders: {
                        errorHandlerServiceImports,
                        loggerServiceImports,
                        requestServiceContextImports,
                        fastifyRedisImports,
                      },
                    }),
                  );
                },
              };
            },
          }),
        }
      : {}),
  }),
});
