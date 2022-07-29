import {
  eslintProvider,
  ImportMapper,
  nodeProvider,
  prettierProvider,
  tsUtilsProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
  TypescriptStringReplacement,
} from '@baseplate/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
  NonOverwriteableMap,
} from '@baseplate/sync';
import { z } from 'zod';
import { configServiceProvider } from '@src/generators/core/config-service';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service';
import { fastifyOutputProvider } from '@src/generators/core/fastify';
import { fastifyServerProvider } from '@src/generators/core/fastify-server';
import { loggerServiceProvider } from '@src/generators/core/logger-service';
import { requestServiceContextProvider } from '@src/generators/core/request-service-context';
import {
  rootModuleImportProvider,
  rootModuleProvider,
} from '@src/generators/core/root-module';
import { ScalarFieldType } from '@src/types/fieldTypes';
import { NexusDefinitionWriterOptions } from '@src/writers/nexus-definition';
import {
  DEFAULT_NEXUS_SCALAR_CONFIG,
  NexusScalarConfig,
} from '@src/writers/nexus-definition/scalars';

const descriptorSchema = z.object({});

export interface MutationField {
  name: string;
  type: TypescriptCodeExpression;
  isOptional?: boolean;
}

export interface NexusGeneratorConfig {
  nexusPlugins: TypescriptCodeExpression[];
  envelopPlugins: TypescriptCodeExpression[];
  mutationFields: MutationField[];
}

export interface NexusSetupProvider extends ImportMapper {
  addScalarField(config: NexusScalarConfig): void;
  registerSchemaFile(file: string): void;
  getConfig(): NonOverwriteableMap<NexusGeneratorConfig>;
}

export const nexusSetupProvider =
  createProviderType<NexusSetupProvider>('nexus-setup');

export interface NexusSchemaProvider extends ImportMapper {
  getScalarConfig(scalar: ScalarFieldType): NexusScalarConfig;
  registerSchemaFile(file: string): void;
  /**
   * Attempts to register schema type. If already used, returns false.
   *
   * This is a hack to allow for the same type to be added in multiple places.
   *
   * TODO: Figure out a more deterministic way to place the type.
   */
  registerSchemaType(name: string): boolean;
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

const NexusGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder) {
    // Setup Task
    const setupTask = taskBuilder.addTask({
      name: 'setup',
      dependencies: {},
      exports: { nexusSetup: nexusSetupProvider },
      run() {
        const configMap = createNonOverwriteableMap<NexusGeneratorConfig>(
          { nexusPlugins: [], envelopPlugins: [], mutationFields: [] },
          { name: 'nexus-config' }
        );

        configMap.appendUnique('nexusPlugins', [
          new TypescriptCodeExpression(
            'connectionPlugin({ includeNodesField: true })',
            "import { connectionPlugin } from 'nexus'"
          ),
        ]);

        configMap.appendUnique('nexusPlugins', [
          new TypescriptCodeExpression(
            'missingTypePlugin',
            "import { missingTypePlugin } from './missing-type-plugin'"
          ),
        ]);

        configMap.appendUnique('envelopPlugins', [
          new TypescriptCodeExpression(
            'useGraphLogger()',
            "import { useGraphLogger } from './useGraphLogger'"
          ),
        ]);
        configMap.appendUnique('envelopPlugins', [
          new TypescriptCodeExpression(
            'useDisableIntrospection({ disableIf: () => !IS_DEVELOPMENT })',
            "import { useDisableIntrospection } from '@envelop/disable-introspection';"
          ),
        ]);

        const scalarMap = createNonOverwriteableMap<
          Record<ScalarFieldType, NexusScalarConfig>
        >(DEFAULT_NEXUS_SCALAR_CONFIG, {
          defaultsOverwriteable: true,
          name: 'nexus-scalars',
        });

        const schemaFiles: string[] = [];

        const importMap = {
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
          getProviders() {
            return {
              nexusSetup: {
                addScalarField: (config) => {
                  scalarMap.set(config.scalar, config);
                },
                registerSchemaFile: (file) => schemaFiles.push(file),
                getConfig: () => configMap,
                getImportMap: () => importMap,
              },
            };
          },
          build() {
            return { scalarMap, schemaFiles, configMap, importMap };
          },
        };
      },
    });

    // Setup Fastify
    taskBuilder.addTask({
      name: 'fastify',
      dependencies: {
        fastifyServer: fastifyServerProvider,
        rootModule: rootModuleProvider,
      },
      run({ fastifyServer, rootModule }) {
        fastifyServer.registerPlugin({
          name: 'graphqlPlugin',
          plugin: new TypescriptCodeExpression(
            'graphqlPlugin',
            "import { graphqlPlugin } from '@/src/plugins/graphql'"
          ),
        });

        rootModule.addModuleField(
          'schemaTypes',
          new TypescriptCodeExpression(
            'NexusType',
            "import type {NexusType} from '@/src/utils/nexus'"
          )
        );

        return {};
      },
    });

    // Schema Task
    taskBuilder.addTask({
      name: 'schema',
      taskDependencies: { setupTask },
      exports: {
        nexusSchema: nexusSchemaProvider,
      },
      run(deps, { setupTask: { scalarMap, schemaFiles, importMap } }) {
        const getScalarConfig = (
          scalar: ScalarFieldType
        ): NexusScalarConfig => {
          const config = scalarMap.get(scalar);
          if (!config) {
            throw new Error(`No config found for scalar ${scalar}`);
          }
          return config;
        };

        const usedSchemaTypes: string[] = [];

        return {
          getProviders() {
            return {
              nexusSchema: {
                getScalarConfig,
                registerSchemaFile: (file) => schemaFiles.push(file),
                registerSchemaType: (name) => {
                  if (usedSchemaTypes.includes(name)) {
                    return false;
                  }
                  usedSchemaTypes.push(name);
                  return true;
                },
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
            };
          },
          build() {
            return { usedSchemaTypes };
          },
        };
      },
    });

    taskBuilder.addTask({
      name: 'main',
      taskDependencies: { setupTask },
      dependencies: {
        node: nodeProvider,
        typescript: typescriptProvider,
        configService: configServiceProvider,
        tsUtils: tsUtilsProvider,
        eslint: eslintProvider,
        errorHandlerService: errorHandlerServiceProvider,
        requestServiceContext: requestServiceContextProvider,
        prettier: prettierProvider,
        rootModuleImport: rootModuleImportProvider,
        loggerService: loggerServiceProvider,
      },
      exports: {
        nexus: nexusProvider,
      },
      run(
        {
          node,
          typescript,
          configService,
          requestServiceContext,
          eslint,
          prettier,
          tsUtils,
          rootModuleImport,
          loggerService,
          errorHandlerService,
        },
        { setupTask: { configMap, schemaFiles } }
      ) {
        node.addPackages({
          'altair-fastify-plugin': '4.5.1',
          graphql: '^16.3.0',
          nexus: '1.3.0',
          '@envelop/core': '2.4.0',
          '@envelop/disable-introspection': '3.4.0',
          '@graphql-yoga/node': '2.13.4',
        });

        node.addDevPackages({
          '@envelop/types': '2.3.0',
        });

        // needed to properly compile (https://github.com/fastify/fastify-websocket/issues/90)
        node.addDevPackages({
          '@types/ws': '8.5.3',
        });

        const pluginFile = typescript.createTemplate(
          {
            ROOT_MODULE: { type: 'code-expression' },
            NEXUS_PLUGINS: { type: 'code-expression' },
            ENVELOP_PLUGINS: { type: 'code-expression' },
            CONTEXT_PATH: { type: 'string-replacement' },
          },
          {
            importMappers: [
              errorHandlerService,
              configService,
              requestServiceContext,
              loggerService,
            ],
          }
        );

        pluginFile.addStringReplacement(
          'CONTEXT_PATH',
          requestServiceContext.getContextPath()
        );

        pluginFile.addCodeExpression(
          'ROOT_MODULE',
          rootModuleImport.getRootModule()
        );

        // ignore nexus typegen file
        eslint
          .getConfig()
          .appendUnique('eslintIgnore', ['src/nexus-typegen.ts']);
        prettier.addPrettierIgnore('/src/nexus-typegen.ts');
        prettier.addPrettierIgnore('/schema.graphql');

        return {
          getProviders() {
            return { nexus: { getConfig: () => configMap } };
          },
          async build(builder) {
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

            pluginFile.addCodeExpression(
              'NEXUS_PLUGINS',
              TypescriptCodeUtils.mergeExpressionsAsArray(config.nexusPlugins)
            );

            pluginFile.addCodeExpression(
              'ENVELOP_PLUGINS',
              TypescriptCodeUtils.mergeExpressionsAsArray(config.envelopPlugins)
            );

            await builder.apply(
              pluginFile.renderToAction(
                'plugins/graphql/index.ts',
                'src/plugins/graphql/index.ts'
              )
            );

            await builder.apply(
              typescript.createCopyAction({
                source: 'plugins/graphql/missing-type-plugin.ts',
                destination: 'src/plugins/graphql/missing-type-plugin.ts',
              })
            );

            await builder.apply(
              typescript.createCopyAction({
                source: 'plugins/graphql/useGraphLogger.ts',
                destination: 'src/plugins/graphql/useGraphLogger.ts',
                importMappers: [loggerService],
              })
            );

            builder.addPostWriteCommand('yarn nexusgen', {
              onlyIfChanged: [
                ...schemaFiles,
                'src/plugins/graphql/index.ts',
                'src/plugins/graphql/missing-type-plugin.ts',
                'src/utils/nexus.ts',
              ],
            });
          },
        };
      },
    });

    // split out nexusgen steps to avoid cyclical dependencies
    taskBuilder.addTask({
      name: 'nexusgen',
      dependencies: {
        node: nodeProvider,
        fastifyOutput: fastifyOutputProvider,
      },
      run({ node, fastifyOutput }) {
        // add script to generate types
        node.addScript(
          'nexusgen',
          `ts-node --transpile-only ${fastifyOutput.getDevLoaderString()} src --nexus-exit`
        );
        return {};
      },
    });
  },
});

export default NexusGenerator;
