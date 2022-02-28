import {
  nodeProvider,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  NonOverwriteableMap,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import R from 'ramda';
import * as yup from 'yup';
import { configServiceProvider } from '@src/generators/core/config-service';
import { fastifyServerProvider } from '@src/generators/core/fastify-server';
import { requestContextProvider } from '@src/generators/core/request-context';
import { rootModuleProvider } from '@src/generators/core/root-module';

const descriptorSchema = yup.object({});

interface ContextField {
  type: TypescriptCodeExpression;
  creator: (req: string) => TypescriptCodeExpression;
}

export interface NexusGeneratorConfig {
  nexusPlugins: TypescriptCodeExpression[];
}

export interface NexusProvider {
  getConfig(): NonOverwriteableMap<NexusGeneratorConfig>;
  getContextFields(): NonOverwriteableMap<Record<string, ContextField>>;
}

export const nexusProvider = createProviderType<NexusProvider>('nexus');

const NexusGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    rootModule: rootModuleProvider,
    typescript: typescriptProvider,
    configService: configServiceProvider,
    requestContext: requestContextProvider,
    fastifyServer: fastifyServerProvider,
  },
  exports: {
    nexus: nexusProvider,
  },
  createGenerator(
    descriptor,
    {
      node,
      rootModule,
      typescript,
      configService,
      requestContext,
      fastifyServer,
    }
  ) {
    const configMap = createNonOverwriteableMap<NexusGeneratorConfig>(
      { nexusPlugins: [] },
      { name: 'nexus-config' }
    );

    configMap.appendUnique('nexusPlugins', [
      new TypescriptCodeExpression(
        'connectionPlugin({ includeNodesField: true })',
        "import { connectionPlugin } from 'nexus'"
      ),
    ]);

    const contextFieldsMap = createNonOverwriteableMap<
      Record<string, ContextField>
    >({}, { name: 'nexus-context-fields' });

    contextFieldsMap.set('reqInfo', {
      type: requestContext.getRequestInfoType(),
      creator: (req) => new TypescriptCodeExpression(`${req}.reqInfo`),
    });

    node.addPackages({
      'altair-fastify-plugin': '^4.3.1',
      graphql: '15',
      mercurius: '^8.12.0',
      nexus: '^1.1.0',
    });

    rootModule.addModuleField(
      'types',
      new TypescriptCodeExpression('NexusType', null, {
        headerBlocks: [
          new TypescriptCodeBlock('export type NexusType = unknown;'),
        ],
      })
    );

    const contextFile = typescript.createTemplate({
      CONTEXT_FIELDS: { type: 'code-block' },
      CONTEXT_CREATOR: { type: 'code-expression' },
    });

    const pluginFile = typescript.createTemplate({
      CONFIG: { type: 'code-expression' },
      ROOT_MODULE: { type: 'code-expression' },
      PLUGINS: { type: 'code-expression' },
    });

    pluginFile.addCodeExpression('CONFIG', configService.getConfigExpression());
    pluginFile.addCodeExpression('ROOT_MODULE', rootModule.getRootModule());

    fastifyServer.registerPlugin({
      name: 'graphqlPlugin',
      plugin: new TypescriptCodeExpression(
        'graphqlPlugin',
        "import { graphqlPlugin } from '@/src/plugins/graphql'"
      ),
    });

    return {
      getProviders: () => ({
        nexus: {
          getConfig: () => configMap,
          getContextFields: () => contextFieldsMap,
        },
      }),
      build: async (builder) => {
        const contextFields = contextFieldsMap.value();

        contextFile.addCodeBlock(
          'CONTEXT_FIELDS',
          TypescriptCodeUtils.mergeBlocksAsInterfaceContent(
            R.mapObjIndexed((field) => field.type, contextFields)
          )
        );

        contextFile.addCodeExpression(
          'CONTEXT_CREATOR',
          TypescriptCodeUtils.mergeExpressionsAsObject(
            R.mapObjIndexed((field) => field.creator('request'), contextFields)
          )
        );

        await builder.apply(
          contextFile.renderToAction(
            'plugins/graphql/context.ts',
            'src/plugins/graphql/context.ts'
          )
        );

        const config = configMap.value();
        pluginFile.addCodeExpression(
          'PLUGINS',
          TypescriptCodeUtils.mergeExpressionsAsArray(config.nexusPlugins)
        );

        await builder.apply(
          pluginFile.renderToAction(
            'plugins/graphql/index.ts',
            'src/plugins/graphql/index.ts'
          )
        );
      },
    };
  },
});

export default NexusGenerator;
