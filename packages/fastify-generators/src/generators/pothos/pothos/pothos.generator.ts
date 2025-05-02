import type {
  ImportMapper,
  TsCodeFragment,
} from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  eslintProvider,
  extractPackageVersions,
  nodeProvider,
  prettierProvider,
  projectScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  tsUtilsImportsProvider,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderType,
  createReadOnlyProviderType,
  POST_WRITE_COMMAND_PRIORITY,
} from '@halfdomelabs/sync';
import path from 'node:path';
import { z } from 'zod';

import type { ScalarFieldType } from '@src/types/field-types.js';
import type {
  PothosCustomScalarConfig,
  PothosScalarConfig,
  PothosTypeReference,
} from '@src/writers/pothos/index.js';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';
import { appModuleImportsProvider } from '@src/generators/core/app-module/app-module.generator.js';
import { fastifyOutputProvider } from '@src/generators/core/fastify/fastify.generator.js';
import { requestServiceContextImportsProvider } from '@src/generators/core/request-service-context/request-service-context.generator.js';
import { yogaPluginConfigProvider } from '@src/generators/yoga/yoga-plugin/yoga-plugin.generator.js';
import { INBUILT_POTHOS_SCALARS } from '@src/writers/pothos/index.js';

import {
  createPothosImports,
  pothosImportsProvider,
} from './generated/ts-import-maps.js';
import { POTHOS_POTHOS_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

const [setupTask, pothosConfigProvider, pothosConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      pothosPlugins: t.map<string, TsCodeFragment>(),
      schemaTypeOptions: t.map<string, TsCodeFragment>(),
      schemaBuilderOptions: t.map<string, TsCodeFragment>(),
      schemaFiles: t.array<string>(),
      enums: t.map<string, PothosTypeReference>(),
      inputTypes: t.map<string, PothosTypeReference>(),
      customScalars: t.map<ScalarFieldType, PothosCustomScalarConfig>(),
    }),
    {
      prefix: 'pothos',
      configScope: projectScope,
    },
  );

export { pothosConfigProvider };

export interface PothosSchemaProvider extends ImportMapper {
  registerSchemaFile: (filePath: string) => void;
}

export const pothosSchemaProvider =
  createProviderType<PothosSchemaProvider>('pothos-schema');

export interface PothosSchemaBaseTypesProvider {
  scalarConfig: (name: ScalarFieldType) => PothosScalarConfig;
  enumRef: (name: string) => PothosTypeReference | undefined;
  enumRefOrThrow: (name: string) => PothosTypeReference;
  inputRef: (name: string) => PothosTypeReference | undefined;
  inputRefOrThrow: (name: string) => PothosTypeReference;
}

/**
 * A provider that provides base types for the Pothos schema, e.g. enums.
 */
export const pothosSchemaBaseTypesProvider =
  createReadOnlyProviderType<PothosSchemaBaseTypesProvider>(
    'pothos-schema-base-types',
  );

const pothosSchemaOutputProvider = createReadOnlyProviderType<{
  schemaFiles: string[];
}>('pothos-schema-output');

const basePath = '@/src/plugins/graphql';

export const pothosGenerator = createGenerator({
  name: 'pothos/pothos',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    imports: createGeneratorTask({
      exports: {
        pothosImports: pothosImportsProvider.export(projectScope),
      },
      run() {
        return {
          providers: {
            pothosImports: createPothosImports(basePath),
          },
        };
      },
    }),
    setup: setupTask,
    schema: createGeneratorTask({
      dependencies: {
        pothosConfigValues: pothosConfigValuesProvider,
      },
      exports: {
        pothosSchema: pothosSchemaProvider.export(projectScope),
        pothosSchemaBaseTypes:
          pothosSchemaBaseTypesProvider.export(projectScope),
      },
      outputs: { pothosSchemaOutput: pothosSchemaOutputProvider.export() },
      run({
        pothosConfigValues: { schemaFiles, customScalars, enums, inputTypes },
      }) {
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
            },
            pothosSchemaBaseTypes: {
              scalarConfig: (name) =>
                customScalars.get(name) ?? INBUILT_POTHOS_SCALARS[name],
              enumRef: (name) => enums.get(name),
              enumRefOrThrow: (name) => {
                const ref = enums.get(name);
                if (!ref) {
                  throw new Error(`Enum ${name} not found`);
                }
                return ref;
              },
              inputRef: (name) => inputTypes.get(name),
              inputRefOrThrow: (name) => {
                const ref = inputTypes.get(name);
                if (!ref) {
                  throw new Error(`Input type ${name} not found`);
                }
                return ref;
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
        typescriptFile: typescriptFileProvider,
        eslint: eslintProvider,
        requestServiceContextImports: requestServiceContextImportsProvider,
        prettier: prettierProvider,
        appModuleImports: appModuleImportsProvider,
        yogaPluginConfig: yogaPluginConfigProvider,
        tsUtilsImports: tsUtilsImportsProvider,
        pothosSchemaOutput: pothosSchemaOutputProvider,
        pothosConfigValues: pothosConfigValuesProvider,
      },
      run({
        typescriptFile,
        requestServiceContextImports,
        prettier,
        appModuleImports,
        yogaPluginConfig,
        tsUtilsImports,
        pothosConfigValues: {
          pothosPlugins,
          schemaTypeOptions,
          schemaBuilderOptions,
          customScalars,
        },
        pothosSchemaOutput: { schemaFiles },
      }) {
        // ignore prettier for schema.graphql
        prettier.addPrettierIgnore('/schema.graphql');

        return {
          async build(builder) {
            const schemaTypeOptionsFragment =
              TsCodeUtils.mergeFragmentsAsInterfaceContent({
                Context:
                  requestServiceContextImports.RequestServiceContext.fragment(),
                Scalars:
                  customScalars.size > 0
                    ? TsCodeUtils.mergeFragmentsAsObject(
                        Object.fromEntries(
                          [...customScalars].map(([, scalar]) => [
                            scalar.name,
                            tsCodeFragment(
                              `{ Input: ${scalar.inputType}, Output: ${scalar.outputType} }`,
                            ),
                          ]),
                        ),
                      )
                    : undefined,
                DefaultEdgesNullability: 'false',
                DefaultFieldNullability: 'false',
                ...Object.fromEntries(schemaTypeOptions),
              });

            const fieldWithInputPayloadPluginPath = path.posix.join(
              basePath,
              'FieldWithInputPayloadPlugin/index.ts',
            );
            const stripQueryMutationPluginPath = path.posix.join(
              basePath,
              'stripQueryMutationPlugin.ts',
            );

            const DEFAULT_PLUGINS = {
              pothosFieldWithInputPayloadPlugin: TsCodeUtils.importFragment(
                'pothosFieldWithInputPayloadPlugin',
                fieldWithInputPayloadPluginPath,
              ),
              pothosStripQueryMutationPlugin: TsCodeUtils.importFragment(
                'pothosStripQueryMutationPlugin',
                stripQueryMutationPluginPath,
              ),
              simpleObjectsPlugin: tsCodeFragment(
                `SimpleObjectsPlugin`,
                tsImportBuilder()
                  .default('SimpleObjectsPlugin')
                  .from('@pothos/plugin-simple-objects'),
              ),
              relayPlugin: tsCodeFragment(
                `RelayPlugin`,
                tsImportBuilder()
                  .default('RelayPlugin')
                  .from('@pothos/plugin-relay'),
              ),
            };

            const schemaOptionsFragment = TsCodeUtils.mergeFragmentsAsObject({
              plugins: TsCodeUtils.mergeFragmentsAsArray({
                ...DEFAULT_PLUGINS,
                ...Object.fromEntries(pothosPlugins),
              }),
              relay: TsCodeUtils.mergeFragmentsAsObject({
                clientMutationId: "'omit'",
                cursorType: "'String'",
                edgesFieldOptions: '{ nullable: false }',
              }),
              defaultFieldNullability: tsCodeFragment('false'),
              ...Object.fromEntries(schemaBuilderOptions),
            });

            const builderPath = path.posix.join(basePath, 'builder.ts');

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: POTHOS_POTHOS_TS_TEMPLATES.builder,
                destination: builderPath,
                variables: {
                  TPL_SCHEMA_TYPE_OPTIONS: schemaTypeOptionsFragment,
                  TPL_SCHEMA_BUILDER_OPTIONS: schemaOptionsFragment,
                  TPL_SUBSCRIPTION_TYPE:
                    yogaPluginConfig.isSubscriptionEnabled()
                      ? `builder.subscriptionType();`
                      : '',
                },
              }),
            );

            const schemaExpression = tsCodeFragment(
              `builder.toSchema()`,
              tsImportBuilder(['builder']).from(builderPath),
            );

            yogaPluginConfig.schema.set(schemaExpression);

            yogaPluginConfig.sideEffectImports.set(
              'rootModule',
              tsCodeFragment(`import '${appModuleImports.getModulePath()}';`),
            );

            yogaPluginConfig.postSchemaFragments.set(
              'writeSchemaToFile',
              tsCodeFragment(
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
                  tsImportBuilder([
                    'printSchema',
                    'lexicographicSortSchema',
                  ]).from('graphql'),
                  tsImportBuilder().default('fs').from('fs/promises'),
                ],
              ),
            );

            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: POTHOS_POTHOS_TS_TEMPLATES.fieldWithInputPayloadGroup,
                baseDirectory: path.posix.dirname(
                  fieldWithInputPayloadPluginPath,
                ),
                importMapProviders: {
                  tsUtilsImports,
                },
              }),
            );

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: POTHOS_POTHOS_TS_TEMPLATES.stripQueryMutationPlugin,
                destination: stripQueryMutationPluginPath,
              }),
            );

            builder.addPostWriteCommand('pnpm generate:schema', {
              priority: POST_WRITE_COMMAND_PRIORITY.CODEGEN,
              onlyIfChanged: [
                ...schemaFiles,
                'src/plugins/graphql/index.ts',
                builderPath,
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
      run({ node, fastifyOutput }) {
        // add script to generate types
        node.scripts.set(
          'generate:schema',
          [
            'tsx',
            ...fastifyOutput.getNodeFlagsDev('dev-env'),
            'src/index.ts --exit-after-generate-schema',
          ].join(' '),
        );
      },
    }),
  }),
});
