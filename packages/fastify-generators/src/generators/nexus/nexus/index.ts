import {
  nodeProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
  tsUtilsProvider,
  eslintProvider,
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
import { fastifyOutputProvider } from '@src/generators/core/fastify';
import { fastifyServerProvider } from '@src/generators/core/fastify-server';
import { requestContextProvider } from '@src/generators/core/request-context';
import { rootModuleProvider } from '@src/generators/core/root-module';
import { ScalarFieldType } from '@src/types/fieldTypes';
import {
  DEFAULT_NEXUS_SCALAR_CONFIG,
  NexusScalarConfig,
} from '@src/writers/nexus-definition/scalars';

const descriptorSchema = yup.object({});

interface ContextField {
  type: TypescriptCodeExpression;
  creator: (req: string) => TypescriptCodeExpression;
}

export interface NexusGeneratorConfig {
  nexusPlugins: TypescriptCodeExpression[];
}

export interface NexusSetupProvider {
  addScalarField(config: NexusScalarConfig): void;
  addContextField(name: string, field: ContextField): void;
  registerSchemaFile(file: string): void;
}

export const nexusSetupProvider =
  createProviderType<NexusSetupProvider>('nexus-setup');

export interface NexusSchemaProvider {
  getScalarConfig(scalar: ScalarFieldType): NexusScalarConfig;
  registerSchemaFile(file: string): void;
  getUtilsImport(): string;
}

export const nexusSchemaProvider =
  createProviderType<NexusSchemaProvider>('nexus-schema');

export interface NexusProvider {
  getConfig(): NonOverwriteableMap<NexusGeneratorConfig>;
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
    tsUtils: tsUtilsProvider,
    fastifyOutput: fastifyOutputProvider,
    eslint: eslintProvider,
  },
  exports: {
    nexusSetup: nexusSetupProvider,
    nexusSchema: nexusSchemaProvider.export().dependsOn(nexusSetupProvider),
    nexus: nexusProvider.export().dependsOn(nexusSchemaProvider),
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
      tsUtils,
      fastifyOutput,
      eslint,
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

    const scalarMap = createNonOverwriteableMap<
      Record<ScalarFieldType, NexusScalarConfig>
    >(DEFAULT_NEXUS_SCALAR_CONFIG, {
      defaultsOverwriteable: true,
      name: 'nexus-scalars',
    });

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
      'schemaTypes',
      new TypescriptCodeExpression(
        'NexusType',
        "import {NexusType} from '@/src/utils/nexus'"
      )
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

    // add script to generate types
    node.addScript(
      'nexusgen',
      `ts-node --transpile-only ${fastifyOutput.getDevLoaderString()} src --nexus-exit`
    );

    // ignore nexus typegen file
    eslint.getConfig().appendUnique('eslintIgnore', ['src/nexus-typegen.ts']);

    const schemaFiles: string[] = [];

    return {
      getProviders: () => ({
        nexusSetup: {
          addScalarField: (config) => {
            scalarMap.set(config.scalar, config);
          },
          addContextField: (name, config) => {
            contextFieldsMap.set(name, config);
          },
          registerSchemaFile: (file) => schemaFiles.push(file),
        },
        nexusSchema: {
          getScalarConfig(scalar) {
            const config = scalarMap.get(scalar);
            if (!config) {
              throw new Error(`No config found for scalar ${scalar}`);
            }
            return config;
          },
          registerSchemaFile: (file) => schemaFiles.push(file),
          getUtilsImport: () => '@/src/utils/nexus',
        },
        nexus: {
          getConfig: () => configMap,
          getContextFields: () => contextFieldsMap,
        },
      }),
      build: async (builder) => {
        const utilsFile = typescript.createTemplate({
          CAPITALIZE_STRING: { type: 'code-expression' },
        });
        utilsFile.addCodeExpression(
          'CAPITALIZE_STRING',
          tsUtils.getUtilExpression('capitalizeString')
        );
        await builder.apply(
          utilsFile.renderToAction('utils/nexus.ts', 'src/utils/nexus.ts')
        );

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

        builder.addPostWriteCommand('yarn nexusgen', {
          onlyIfChanged: schemaFiles,
        });
      },
    };
  },
});

export default NexusGenerator;
