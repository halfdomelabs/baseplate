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
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
  NonOverwriteableMap,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { fastifyOutputProvider } from '@src/generators/core/fastify/index.js';
import { requestServiceContextProvider } from '@src/generators/core/request-service-context/index.js';
import {
  rootModuleImportProvider,
  rootModuleProvider,
} from '@src/generators/core/root-module/index.js';
import { yogaPluginSetupProvider } from '@src/generators/yoga/yoga-plugin/index.js';
import { ScalarFieldType } from '@src/types/fieldTypes.js';
import { NexusDefinitionWriterOptions } from '@src/writers/nexus-definition/index.js';
import {
  DEFAULT_NEXUS_SCALAR_CONFIG,
  NexusScalarConfig,
} from '@src/writers/nexus-definition/scalars.js';

const descriptorSchema = z.object({
  enableSubscriptions: z.boolean().optional(),
});

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
          { nexusPlugins: [], mutationFields: [] },
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
      name: 'root',
      dependencies: {
        rootModule: rootModuleProvider,
      },
      run({ rootModule }) {
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
        tsUtils: tsUtilsProvider,
        eslint: eslintProvider,
        requestServiceContext: requestServiceContextProvider,
        prettier: prettierProvider,
        rootModuleImport: rootModuleImportProvider,
        yogaPluginSetup: yogaPluginSetupProvider,
      },
      exports: {
        nexus: nexusProvider,
      },
      run(
        {
          node,
          typescript,
          requestServiceContext,
          eslint,
          prettier,
          tsUtils,
          rootModuleImport,
          // yogaPluginSetup,
        },
        { setupTask: { configMap, schemaFiles } }
      ) {
        node.addPackages({
          nexus: '1.3.0',
        });

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

            const schemaExpression = TypescriptCodeUtils.formatExpression(
              `makeSchema({
                types: ROOT_MODULE.schemaTypes,
                outputs: {
                  typegen: join(__dirname, '../..', 'nexus-typegen.ts'),
                  schema: join(__dirname, '../../..', 'schema.graphql'),
                },
                plugins: NEXUS_PLUGINS,
                contextType: {
                  module: join(__dirname, '../../..', 'CONTEXT_PATH'),
                  export: 'RequestServiceContext',
                },
                shouldExitAfterGenerateArtifacts: process.argv.includes('--nexus-exit'),
              })`,
              {
                ROOT_MODULE: rootModuleImport.getRootModule(),
                NEXUS_PLUGINS: TypescriptCodeUtils.mergeExpressionsAsArray(
                  config.nexusPlugins
                ),
                CONTEXT_PATH: requestServiceContext.getContextPath(),
              },
              {
                importText: [
                  `import { makeSchema } from 'nexus';`,
                  `import { join } from 'path';`,
                ],
              }
            );

            // yogaPluginSetup.getConfig().set('schema', schemaExpression);

            await builder.apply(
              typescript.createCopyAction({
                source: 'plugins/graphql/missing-type-plugin.ts',
                destination: 'src/plugins/graphql/missing-type-plugin.ts',
              })
            );

            // builder.addPostWriteCommand('yarn nexusgen', {
            //   onlyIfChanged: [
            //     ...schemaFiles,
            //     'src/plugins/graphql/index.ts',
            //     'src/plugins/graphql/missing-type-plugin.ts',
            //     'src/utils/nexus.ts',
            //   ],
            // });
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
          `tsx --transpile-only ${fastifyOutput.getDevLoaderString()} src --nexus-exit`
        );
        return {};
      },
    });
  },
});

export default NexusGenerator;
