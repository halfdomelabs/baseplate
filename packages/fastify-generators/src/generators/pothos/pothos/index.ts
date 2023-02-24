import {
  eslintProvider,
  ImportMapper,
  makeImportAndFilePath,
  nodeProvider,
  prettierProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
  NonOverwriteableMap,
} from '@baseplate/sync';
import { z } from 'zod';
import { fastifyOutputProvider } from '@src/generators/core/fastify';
import { requestServiceContextProvider } from '@src/generators/core/request-service-context';
import { rootModuleImportProvider } from '@src/generators/core/root-module';
import { yogaPluginSetupProvider } from '@src/generators/yoga/yoga-plugin';
import { PothosEnumConfig } from '@src/writers/pothos-definition/enums';
import { PothosScalarConfig } from '@src/writers/pothos-definition/scalars';

const descriptorSchema = z.object({});

interface PothosScalarConfigWithTypes extends PothosScalarConfig {
  inputType: string;
  outputType: string;
}

export interface PothosGeneratorConfig {
  pothosPlugins: TypescriptCodeExpression[];
  customScalars: PothosScalarConfigWithTypes[];
  schemaTypeOptions: { key: string; value: TypescriptCodeExpression }[];
  schemaBuilderOptions: { key: string; value: TypescriptCodeExpression }[];
  pothosEnums: PothosEnumConfig[];
}

export interface PothosSetupProvider extends ImportMapper {
  getConfig: () => NonOverwriteableMap<PothosGeneratorConfig>;
  registerSchemaFile: (filePath: string) => void;
}

export const pothosSetupProvider =
  createProviderType<PothosSetupProvider>('pothos-setup');

export interface PothosSchemaProvider extends ImportMapper {
  registerSchemaFile: (filePath: string) => void;
}

export const pothosSchemaProvider =
  createProviderType<PothosSchemaProvider>('pothos-schema');

export type PothosProvider = unknown;

export const pothosProvider = createProviderType<PothosProvider>('pothos');

const PothosGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder) {
    const setupTask = taskBuilder.addTask({
      name: 'setup',
      dependencies: {},
      exports: { pothosSetup: pothosSetupProvider },
      run() {
        const config = createNonOverwriteableMap<PothosGeneratorConfig>({
          pothosPlugins: [],
          schemaTypeOptions: [],
          customScalars: [],
          schemaBuilderOptions: [],
          pothosEnums: [],
        });

        // TODO: Make type options/builder options

        const schemaFiles: string[] = [];

        return {
          getProviders() {
            return {
              pothosSetup: {
                getConfig: () => config,
                getImportMap: () => ({
                  '%pothos': {
                    path: '@/src/plugins/graphql/builder',
                    allowedImports: ['builder'],
                  },
                }),
                registerSchemaFile: (filePath) => {
                  schemaFiles.push(filePath);
                },
              },
            };
          },
          build: () => ({ config, schemaFiles }),
        };
      },
    });

    const schemaTask = taskBuilder.addTask({
      name: 'schema',
      dependencies: {},
      exports: { pothosSchema: pothosSchemaProvider },
      taskDependencies: { setupTask },
      run(deps, { setupTask: { schemaFiles } }) {
        return {
          getProviders() {
            return {
              pothosSchema: {
                getImportMap: () => ({
                  '%pothos': {
                    path: '@/src/plugins/graphql/builder',
                    allowedImports: ['builder'],
                  },
                }),
                registerSchemaFile(filePath) {
                  schemaFiles.push(filePath);
                },
              },
            };
          },
          build: () => ({ schemaFiles }),
        };
      },
    });

    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        typescript: typescriptProvider,
        eslint: eslintProvider,
        requestServiceContext: requestServiceContextProvider,
        prettier: prettierProvider,
        rootModuleImport: rootModuleImportProvider,
        yogaPluginSetup: yogaPluginSetupProvider,
      },
      taskDependencies: { setupTask, schemaTask },
      exports: {
        pothos: pothosProvider,
      },
      run(
        {
          node,
          typescript,
          requestServiceContext,
          prettier,
          rootModuleImport,
          yogaPluginSetup,
        },
        { setupTask: { config: configMap }, schemaTask: { schemaFiles } }
      ) {
        node.addPackages({
          '@pothos/core': '3.27.0',
          '@pothos/plugin-simple-objects': '3.6.7',
        });

        // ignore prettier for schema.graphql
        prettier.addPrettierIgnore('/schema.graphql');

        return {
          getProviders() {
            return { pothos: {} };
          },
          async build(builder) {
            const config = configMap.value();

            const schemaTypeOptions =
              TypescriptCodeUtils.mergeBlocksAsInterfaceContent({
                Context: TypescriptCodeUtils.createExpression(
                  `RequestServiceContext`,
                  `import { RequestServiceContext } from '%request-service-context'`,
                  { importMappers: [requestServiceContext] }
                ),
                DefaultFieldNullability: `true`,
                Scalars: config.customScalars?.length
                  ? TypescriptCodeUtils.mergeExpressionsAsObject(
                      Object.fromEntries(
                        config.customScalars.map((scalar) => [
                          scalar.name,
                          TypescriptCodeUtils.createExpression(
                            `{ Input: ${scalar.inputType}, Output: ${scalar.outputType} }`
                          ),
                        ])
                      )
                    )
                  : undefined,
                ...Object.fromEntries(
                  config.schemaTypeOptions.map((option) => [
                    option.key,
                    option.value,
                  ])
                ),
              });

            const DEFAULT_PLUGINS = [
              TypescriptCodeUtils.createExpression(
                `pothosFieldWithInputPayloadPlugin`,
                `import { pothosFieldWithInputPayloadPlugin } from './FieldWithInputPayloadPlugin'`
              ),
              TypescriptCodeUtils.createExpression(
                `SimpleObjectsPlugin`,
                `import SimpleObjectsPlugin from '@pothos/plugin-simple-objects';`
              ),
            ];

            const schemaOptions = TypescriptCodeUtils.mergeExpressionsAsObject({
              plugins: TypescriptCodeUtils.mergeExpressionsAsArray([
                ...DEFAULT_PLUGINS,
                ...config.pothosPlugins,
              ]),
              defaultFieldNullability: 'true',
              ...Object.fromEntries(
                config.schemaBuilderOptions.map((option) => [
                  option.key,
                  option.value,
                ])
              ),
            });

            const [builderImport, builderPath] = makeImportAndFilePath(
              `src/plugins/graphql/builder.ts`
            );
            const builderFile = typescript.createTemplate({
              SCHEMA_TYPE_OPTIONS: schemaTypeOptions,
              SCHEMA_BUILDER_OPTIONS: schemaOptions,
            });
            await builder.apply(
              builderFile.renderToAction('builder.ts', builderPath)
            );

            const schemaExpression = TypescriptCodeUtils.createExpression(
              `builder.toSchema()`,
              [
                `import { builder } from '${builderImport}';`,
                `import '%root-module';`,
              ],
              { importMappers: [rootModuleImport] }
            );

            const yogaConfig = yogaPluginSetup.getConfig();

            yogaConfig.set('schema', schemaExpression);

            yogaConfig.appendUnique('postSchemaBlocks', [
              TypescriptCodeUtils.createBlock(
                `if (IS_DEVELOPMENT) {
                fs.writeFileSync(
                  './schema.graphql',
                  printSchema(lexicographicSortSchema(schema))
                );

                if (process.argv.includes('--exit-after-generate-schema')) {
                  process.exit(0);
                }
              }`,
                [
                  `import { printSchema, lexicographicSortSchema } from 'graphql';`,
                  `import fs from 'fs';`,
                ]
              ),
            ]);

            await builder.apply(
              typescript.createCopyFilesAction({
                sourceBaseDirectory: 'FieldWithInputPayloadPlugin',
                destinationBaseDirectory:
                  'src/plugins/graphql/FieldWithInputPayloadPlugin',
                paths: [
                  'global-types.ts',
                  'index.ts',
                  'schema-builder.ts',
                  'types.ts',
                ],
              })
            );

            builder.addPostWriteCommand('yarn generate:schema', {
              onlyIfChanged: [
                ...schemaFiles,
                'src/plugins/graphql/index.ts',
                'src/plugins/graphql/builder.ts',
              ],
            });
          },
        };
      },
    });

    // split out schemagen steps to avoid cyclical dependencies
    taskBuilder.addTask({
      name: 'generate-schema',
      dependencies: {
        node: nodeProvider,
        fastifyOutput: fastifyOutputProvider,
      },
      run({ node, fastifyOutput }) {
        // add script to generate types
        node.addScript(
          'generate:schema',
          `ts-node --transpile-only ${fastifyOutput.getDevLoaderString()} src --exit-after-generate-schema`
        );
        return {};
      },
    });
  },
});

export default PothosGenerator;
