import {
  nodeProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
  tsUtilsProvider,
  eslintProvider,
  ImportMapper,
  TypescriptStringReplacement,
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
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service';
import { fastifyOutputProvider } from '@src/generators/core/fastify';
import { fastifyServerProvider } from '@src/generators/core/fastify-server';
import { requestContextProvider } from '@src/generators/core/request-context';
import { rootModuleProvider } from '@src/generators/core/root-module';
import { ScalarFieldType } from '@src/types/fieldTypes';
import { NexusDefinitionWriterOptions } from '@src/writers/nexus-definition';
import {
  DEFAULT_NEXUS_SCALAR_CONFIG,
  NexusScalarConfig,
} from '@src/writers/nexus-definition/scalars';

const descriptorSchema = yup.object({});

interface ContextField {
  type: TypescriptCodeExpression;
  creator: (req: string, reply: string) => TypescriptCodeExpression;
}

export interface MutationField {
  name: string;
  type: TypescriptCodeExpression;
  isOptional?: boolean;
}

export interface NexusGeneratorConfig {
  nexusPlugins: TypescriptCodeExpression[];
  mutationFields: MutationField[];
}

export interface NexusSetupProvider extends ImportMapper {
  addScalarField(config: NexusScalarConfig): void;
  addContextField(name: string, field: ContextField): void;
  registerSchemaFile(file: string): void;
  getConfig(): NonOverwriteableMap<NexusGeneratorConfig>;
}

export const nexusSetupProvider =
  createProviderType<NexusSetupProvider>('nexus-setup');

export interface NexusSchemaProvider extends ImportMapper {
  getScalarConfig(scalar: ScalarFieldType): NexusScalarConfig;
  registerSchemaFile(file: string): void;
  getUtilsImport(): string;
  getUtilsExpression(method: 'STANDARD_MUTATION'): TypescriptCodeExpression;
  getNexusWriterOptions(): NexusDefinitionWriterOptions;
}

export const nexusSchemaProvider =
  createProviderType<NexusSchemaProvider>('nexus-schema');

export interface NexusProvider {
  getConfig(): NonOverwriteableMap<NexusGeneratorConfig>;
}

export const nexusProvider = createProviderType<NexusProvider>('nexus');

const NexusGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    cookies: {
      defaultDescriptor: {
        generator: '@baseplate/fastify/nexus/nexus-cookies',
      },
    },
  }),
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
    errorHandlerService: errorHandlerServiceProvider,
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
      errorHandlerService,
    }
  ) {
    const configMap = createNonOverwriteableMap<NexusGeneratorConfig>(
      { nexusPlugins: [], mutationFields: [] },
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
      'altair-fastify-plugin': '^4.4.1',
      graphql: '^16.3.0',
      mercurius: '^9.3.4',
      nexus: '^1.3.0',
    });

    // needed to properly compile (https://github.com/fastify/fastify-websocket/issues/90)
    node.addDevPackages({
      '@types/ws': '^8.0.0',
    });

    rootModule.addModuleField(
      'schemaTypes',
      new TypescriptCodeExpression(
        'NexusType',
        "import type {NexusType} from '@/src/utils/nexus'"
      )
    );

    const contextFile = typescript.createTemplate({
      CONTEXT_FIELDS: { type: 'code-block' },
      CONTEXT_CREATOR: { type: 'code-expression' },
    });

    const pluginFile = typescript.createTemplate(
      {
        ROOT_MODULE: { type: 'code-expression' },
        PLUGINS: { type: 'code-expression' },
      },
      { importMappers: [errorHandlerService, configService] }
    );

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

    const getScalarConfig = (scalar: ScalarFieldType): NexusScalarConfig => {
      const config = scalarMap.get(scalar);
      if (!config) {
        throw new Error(`No config found for scalar ${scalar}`);
      }
      return config;
    };

    const importMap = {
      '%nexus/context': {
        path: '@/src/plugins/graphql/context',
        allowedImports: ['GraphQLContext'],
      },
      '%nexus/utils': {
        path: '@/src/utils/nexus',
        allowedImports: ['createStandardMutation'],
      },
      '%nexus/typegen': {
        path: '@/src/nexus-typegen',
        allowedImports: ['NexusGenFieldTypes'],
      },
    };

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
          getConfig: () => configMap,
          getImportMap: () => importMap,
        },
        nexusSchema: {
          getScalarConfig,
          registerSchemaFile: (file) => schemaFiles.push(file),
          getUtilsImport: () => '@/src/utils/nexus',
          getNexusWriterOptions: () => ({
            builder: 't',
            lookupScalar: (scalar) => getScalarConfig(scalar),
          }),
          getUtilsExpression(method) {
            switch (method) {
              case 'STANDARD_MUTATION':
                return new TypescriptCodeExpression(
                  'createStandardMutation',
                  `import {createStandardMutation} from '@/src/utils/nexus'`
                );
              default:
                throw new Error(`Unknown method ${method as string}`);
            }
          },
          getImportMap: () => importMap,
        },
        nexus: {
          getConfig: () => configMap,
          getContextFields: () => contextFieldsMap,
        },
      }),
      build: async (builder) => {
        const config = configMap.value();

        const utilsFile = typescript.createTemplate(
          {
            CUSTOM_CREATE_MUTATION_OPTIONS: { type: 'code-block' },
            CUSTOM_MUTATION_FIELDS: {
              type: 'string-replacement',
              asSingleLineComment: true,
            },
          },
          {
            importMappers: [tsUtils],
          }
        );
        utilsFile.addCodeEntries({
          CUSTOM_MUTATION_FIELDS: new TypescriptStringReplacement(
            config.mutationFields.map((f) => f.name).join(',\n')
          ),
          CUSTOM_CREATE_MUTATION_OPTIONS: config.mutationFields.map((f) =>
            f.type
              .prepend(`${`${f.name}${f.isOptional ? '?' : ''}`}: `)
              .toBlock()
          ),
        });
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
            R.mapObjIndexed(
              (field) => field.creator('request', 'reply'),
              contextFields
            )
          )
        );

        await builder.apply(
          contextFile.renderToAction(
            'plugins/graphql/context.ts',
            'src/plugins/graphql/context.ts'
          )
        );

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
          onlyIfChanged: [
            ...schemaFiles,
            'src/plugins/graphql/index.ts',
            'src/utils/nexus.ts',
          ],
        });
      },
    };
  },
});

export default NexusGenerator;
