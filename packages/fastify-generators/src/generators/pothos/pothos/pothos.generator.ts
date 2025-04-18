import type {
  ImportMapper,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';
import type { NonOverwriteableMap } from '@halfdomelabs/sync';

import {
  createNodePackagesTask,
  eslintProvider,
  extractPackageVersions,
  makeImportAndFilePath,
  nodeProvider,
  prettierProvider,
  projectScope,
  tsUtilsProvider,
  TypescriptCodeUtils,
  typescriptProvider,
  TypescriptStringReplacement,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
  createProviderType,
  createReadOnlyProviderType,
  POST_WRITE_COMMAND_PRIORITY,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';
import { appModuleImportsProvider } from '@src/generators/core/app-module/app-module.generator.js';
import { fastifyOutputProvider } from '@src/generators/core/fastify/fastify.generator.js';
import { requestServiceContextProvider } from '@src/generators/core/request-service-context/request-service-context.generator.js';
import { yogaPluginConfigProvider } from '@src/generators/yoga/yoga-plugin/yoga-plugin.generator.js';
import { PothosTypeReferenceContainer } from '@src/writers/pothos/index.js';

const descriptorSchema = z.object({});

export interface PothosGeneratorConfig {
  pothosPlugins: TypescriptCodeExpression[];
  schemaTypeOptions: { key: string; value: TypescriptCodeExpression }[];
  schemaBuilderOptions: { key: string; value: TypescriptCodeExpression }[];
}

export interface PothosSetupProvider extends ImportMapper {
  getConfig: () => NonOverwriteableMap<PothosGeneratorConfig>;
  registerSchemaFile: (filePath: string) => void;
  getTypeReferences(): PothosTypeReferenceContainer;
}

export const pothosSetupProvider =
  createProviderType<PothosSetupProvider>('pothos-setup');

const pothosSetupOutputProvider = createReadOnlyProviderType<{
  config: NonOverwriteableMap<PothosGeneratorConfig>;
  schemaFiles: string[];
  pothosTypes: PothosTypeReferenceContainer;
}>('pothos-setup-output');

export interface PothosSchemaProvider extends ImportMapper {
  registerSchemaFile: (filePath: string) => void;
  getTypeReferences: () => PothosTypeReferenceContainer;
}

export const pothosSchemaProvider =
  createProviderType<PothosSchemaProvider>('pothos-schema');

const pothosSchemaOutputProvider = createReadOnlyProviderType<{
  schemaFiles: string[];
}>('pothos-schema-output');

export type PothosProvider = unknown;

export const pothosProvider = createProviderType<PothosProvider>('pothos');

export const pothosGenerator = createGenerator({
  name: 'pothos/pothos',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    setup: createGeneratorTask({
      dependencies: {},
      exports: {
        pothosSetup: pothosSetupProvider.export(projectScope),
      },
      outputs: { pothosSetupOutput: pothosSetupOutputProvider.export() },
      run() {
        const config = createNonOverwriteableMap<PothosGeneratorConfig>({
          pothosPlugins: [],
          schemaTypeOptions: [],
          schemaBuilderOptions: [],
        });

        const pothosTypes = new PothosTypeReferenceContainer();

        // TODO: Make type options/builder options

        const schemaFiles: string[] = [];

        return {
          providers: {
            pothosSetup: {
              getConfig: () => config,
              getImportMap: () => ({
                '%pothos': {
                  path: '@/src/plugins/graphql/builder.js',
                  allowedImports: ['builder'],
                },
              }),
              registerSchemaFile: (filePath) => {
                schemaFiles.push(filePath);
              },
              getTypeReferences: () => pothosTypes,
            },
          },
          build: () => ({
            pothosSetupOutput: { config, schemaFiles, pothosTypes },
          }),
        };
      },
    }),
    schema: createGeneratorTask({
      dependencies: {
        pothosSetupOutput: pothosSetupOutputProvider,
      },
      exports: {
        pothosSchema: pothosSchemaProvider.export(projectScope),
      },
      outputs: { pothosSchemaOutput: pothosSchemaOutputProvider.export() },
      run({ pothosSetupOutput: { schemaFiles, pothosTypes } }) {
        return {
          providers: {
            pothosSchema: {
              getImportMap: () => ({
                '%pothos': {
                  path: '@/src/plugins/graphql/builder.js',
                  allowedImports: ['builder'],
                },
              }),
              registerSchemaFile(filePath) {
                schemaFiles.push(filePath);
              },
              getTypeReferences() {
                return pothosTypes;
              },
            },
          },
          build: () => ({
            pothosSchemaOutput: { schemaFiles },
          }),
        };
      },
    }),
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, [
        '@pothos/core',
        '@pothos/plugin-simple-objects',
        '@pothos/plugin-relay',
      ]),
    }),
    main: createGeneratorTask({
      dependencies: {
        typescript: typescriptProvider,
        eslint: eslintProvider,
        requestServiceContext: requestServiceContextProvider,
        prettier: prettierProvider,
        appModuleImports: appModuleImportsProvider,
        yogaPluginConfig: yogaPluginConfigProvider,
        tsUtils: tsUtilsProvider,
        pothosSetupOutput: pothosSetupOutputProvider,
        pothosSchemaOutput: pothosSchemaOutputProvider,
      },
      exports: {
        pothos: pothosProvider.export(projectScope),
      },
      run(
        {
          typescript,
          requestServiceContext,
          prettier,
          appModuleImports,
          yogaPluginConfig,
          tsUtils,
          pothosSetupOutput: { config: configMap, pothosTypes },
          pothosSchemaOutput: { schemaFiles },
        },
        { taskId },
      ) {
        // ignore prettier for schema.graphql
        prettier.addPrettierIgnore('/schema.graphql');

        return {
          providers: {
            pothos: {},
          },
          async build(builder) {
            const config = configMap.value();

            const customScalars = pothosTypes.getCustomScalars();

            const schemaTypeOptions =
              TypescriptCodeUtils.mergeBlocksAsInterfaceContent({
                Context: TypescriptCodeUtils.createExpression(
                  `RequestServiceContext`,
                  `import { RequestServiceContext } from '%request-service-context'`,
                  { importMappers: [requestServiceContext] },
                ),
                Scalars:
                  customScalars.length > 0
                    ? TypescriptCodeUtils.mergeExpressionsAsObject(
                        Object.fromEntries(
                          customScalars.map((scalar) => [
                            scalar.name,
                            TypescriptCodeUtils.createExpression(
                              `{ Input: ${scalar.inputType}, Output: ${scalar.outputType} }`,
                            ),
                          ]),
                        ),
                      )
                    : undefined,
                DefaultEdgesNullability: 'false',
                DefaultFieldNullability: 'false',
                ...Object.fromEntries(
                  config.schemaTypeOptions.map((option) => [
                    option.key,
                    option.value,
                  ]),
                ),
              });

            const DEFAULT_PLUGINS = [
              TypescriptCodeUtils.createExpression(
                `pothosFieldWithInputPayloadPlugin`,
                `import { pothosFieldWithInputPayloadPlugin } from './FieldWithInputPayloadPlugin/index.js'`,
              ),
              TypescriptCodeUtils.createExpression(
                'pothosStripQueryMutationPlugin',
                `import { pothosStripQueryMutationPlugin } from './stripQueryMutationPlugin.js'`,
              ),
              TypescriptCodeUtils.createExpression(
                `SimpleObjectsPlugin`,
                `import SimpleObjectsPlugin from '@pothos/plugin-simple-objects';`,
              ),
              TypescriptCodeUtils.createExpression(
                `RelayPlugin`,
                `import RelayPlugin from '@pothos/plugin-relay';`,
              ),
            ];

            const schemaOptions = TypescriptCodeUtils.mergeExpressionsAsObject({
              plugins: TypescriptCodeUtils.mergeExpressionsAsArray([
                ...DEFAULT_PLUGINS,
                ...config.pothosPlugins,
              ]),
              relay: TypescriptCodeUtils.mergeExpressionsAsObject({
                clientMutationId: "'omit'",
                cursorType: "'String'",
                edgesFieldOptions: '{ nullable: false }',
              }),
              defaultFieldNullability:
                TypescriptCodeUtils.createExpression('false'),
              ...Object.fromEntries(
                config.schemaBuilderOptions.map((option) => [
                  option.key,
                  option.value,
                ]),
              ),
            });

            const [builderImport, builderPath] = makeImportAndFilePath(
              `src/plugins/graphql/builder.ts`,
            );
            const builderFile = typescript.createTemplate({
              SCHEMA_TYPE_OPTIONS: schemaTypeOptions,
              SCHEMA_BUILDER_OPTIONS: schemaOptions,
              'SUBSCRIPTION_TYPE;': new TypescriptStringReplacement(
                yogaPluginConfig.isSubscriptionEnabled()
                  ? `builder.subscriptionType();`
                  : '',
              ),
            });
            await builder.apply(
              builderFile.renderToAction('builder.ts', builderPath),
            );

            const schemaExpression = TypescriptCodeUtils.createExpression(
              `builder.toSchema()`,
              [
                `import { builder } from '${builderImport}';`,
                `import '${appModuleImports.getModulePath()}';`,
              ],
            );

            yogaPluginConfig.schema.set(schemaExpression, taskId);

            yogaPluginConfig.postSchemaBlocks.push(
              TypescriptCodeUtils.createBlock(
                `
async function writeSchemaToFile(): Promise<void> {
  // only write the schema to file if it has changed to avoid unnecessary GraphQL codegen generations
  const existingSchema = await fs
    .readFile('./schema.graphql', 'utf-8')
    .catch(() => undefined);
  const newSchema = printSchema(lexicographicSortSchema(schema));
  if (existingSchema !== newSchema) {
    await fs.writeFile('./schema.graphql', newSchema);
  }

  if (process.argv.includes('--exit-after-generate-schema')) {
    process.exit(0);
  }
}

if (IS_DEVELOPMENT) {
  writeSchemaToFile().catch((err) => logger.error(err));
}`,
                [
                  `import { printSchema, lexicographicSortSchema } from 'graphql';`,
                  `import fs from 'fs/promises';`,
                ],
              ),
            );

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
                importMappers: [tsUtils],
              }),
            );

            await builder.apply(
              typescript.createCopyAction({
                source: 'stripQueryMutationPlugin.ts',
                destination: 'src/plugins/graphql/stripQueryMutationPlugin.ts',
              }),
            );

            builder.addPostWriteCommand('pnpm generate:schema', {
              priority: POST_WRITE_COMMAND_PRIORITY.CODEGEN,
              onlyIfChanged: [
                ...schemaFiles,
                'src/plugins/graphql/index.ts',
                'src/plugins/graphql/builder.ts',
              ],
            });
          },
        };
      },
    }),
    generateSchemaScript: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
        fastifyOutput: fastifyOutputProvider,
      },
      run({ node, fastifyOutput }, { taskId }) {
        // add script to generate types
        node.scripts.set(
          'generate:schema',
          [
            'tsx',
            ...fastifyOutput.getNodeFlagsDev('dev-env'),
            'src/index.ts --exit-after-generate-schema',
          ].join(' '),
          taskId,
        );
      },
    }),
  }),
});
