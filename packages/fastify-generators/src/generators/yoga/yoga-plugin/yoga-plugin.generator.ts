import type { TsCodeFragment } from '@baseplate-dev/core-generators';
import type {
  FieldMapValues,
  InferFieldMapSchemaFromBuilder,
} from '@baseplate-dev/utils';

import {
  createNodePackagesTask,
  extractPackageVersions,
  nodeProvider,
  packageScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createConfigFieldMap,
  createGenerator,
  createGeneratorTask,
  createProviderType,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';
import { createFieldMapSchemaBuilder } from '@baseplate-dev/utils';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/index.js';
import { configServiceImportsProvider } from '#src/generators/core/config-service/index.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/index.js';
import { fastifyRedisImportsProvider } from '#src/generators/core/fastify-redis/index.js';
import { fastifyServerConfigProvider } from '#src/generators/core/fastify-server/index.js';
import { loggerServiceImportsProvider } from '#src/generators/core/logger-service/index.js';
import { requestServiceContextImportsProvider } from '#src/generators/core/request-service-context/index.js';

import { YOGA_YOGA_PLUGIN_GENERATED } from './generated/index.js';

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
      tsImportBuilder(['useGraphLogger']).from('./use-graph-logger.ts'),
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

export interface YogaPluginConfigProvider extends InferFieldMapSchemaFromBuilder<
  typeof schemaBuilder
> {
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
    paths: YOGA_YOGA_PLUGIN_GENERATED.paths.task,
    setup: createGeneratorTask({
      exports: {
        yogaPluginConfig: yogaPluginConfigProvider.export(packageScope),
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
        'graphql',
        '@envelop/core',
        '@envelop/disable-introspection',
        'graphql-yoga',
      ]),
      dev: extractPackageVersions(FASTIFY_PACKAGES, ['@envelop/types']),
    }),
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        paths: YOGA_YOGA_PLUGIN_GENERATED.paths.provider,
        configServiceImports: configServiceImportsProvider,
        errorHandlerServiceImports: errorHandlerServiceImportsProvider,
        requestServiceContextImports: requestServiceContextImportsProvider,
        loggerServiceImports: loggerServiceImportsProvider,
        yogaPluginSetup: yogaPluginSetupProvider,
      },
      run({
        typescriptFile,
        paths,
        configServiceImports,
        requestServiceContextImports,
        loggerServiceImports,
        errorHandlerServiceImports,
        yogaPluginSetup: config,
      }) {
        return {
          async build(builder) {
            // GraphQL Yoga serves queries, mutations, and subscriptions (over
            // SSE) from a single HTTP route. Subscriptions stream when the
            // client sends `Accept: text/event-stream`.
            const graphqlHandler = `fastify.route({
  url: '/graphql',
  method: ['GET', 'POST', 'OPTIONS'],
  handler: httpHandler,
});`;

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: YOGA_YOGA_PLUGIN_GENERATED.templates.graphqlPlugin,
                destination: paths.graphqlPlugin,
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
                template: YOGA_YOGA_PLUGIN_GENERATED.templates.useGraphLogger,
                destination: paths.useGraphLogger,
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
          subscription: createGeneratorTask({
            dependencies: {
              node: nodeProvider,
              typescriptFile: typescriptFileProvider,
              paths: YOGA_YOGA_PLUGIN_GENERATED.paths.provider,
              fastifyRedisImports: fastifyRedisImportsProvider,
            },
            run({ node, typescriptFile, paths, fastifyRedisImports }) {
              node.packages.addPackages({
                prod: extractPackageVersions(FASTIFY_PACKAGES, [
                  '@graphql-yoga/redis-event-target',
                ]),
              });

              return {
                async build(builder) {
                  await builder.apply(
                    typescriptFile.renderTemplateFile({
                      template: YOGA_YOGA_PLUGIN_GENERATED.templates.pubsub,
                      destination: paths.pubsub,
                      variables: {
                        // Projects add their own channels here, e.g.
                        // `{ myChannel: [payload: MyPayload] }`.
                        TPL_PUBLISH_ARGS: 'Record<string, never>',
                      },
                      importMapProviders: { fastifyRedisImports },
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
