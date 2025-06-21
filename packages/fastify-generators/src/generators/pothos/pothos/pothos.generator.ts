import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  nodeProvider,
  prettierProvider,
  packageScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  tsUtilsImportsProvider,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderType,
  createReadOnlyProviderType,
  POST_WRITE_COMMAND_PRIORITY,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import type { ScalarFieldType } from '#src/types/field-types.js';
import type {
  PothosCustomScalarConfig,
  PothosScalarConfig,
  PothosTypeReference,
} from '#src/writers/pothos/index.js';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';
import { appModuleImportsProvider } from '#src/generators/core/app-module/index.js';
import { fastifyOutputProvider } from '#src/generators/core/fastify/index.js';
import { requestServiceContextImportsProvider } from '#src/generators/core/request-service-context/index.js';
import { yogaPluginConfigProvider } from '#src/generators/yoga/yoga-plugin/index.js';
import { INBUILT_POTHOS_SCALARS } from '#src/writers/pothos/index.js';

import { POTHOS_POTHOS_GENERATED } from './generated/index.js';

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
      configScope: packageScope,
    },
  );

export { pothosConfigProvider };

export interface PothosSchemaProvider {
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

export const pothosGenerator = createGenerator({
  name: 'pothos/pothos',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: POTHOS_POTHOS_GENERATED.paths.task,
    imports: POTHOS_POTHOS_GENERATED.imports.task,
    setup: setupTask,
    schema: createGeneratorTask({
      dependencies: {
        pothosConfigValues: pothosConfigValuesProvider,
      },
      exports: {
        pothosSchema: pothosSchemaProvider.export(packageScope),
        pothosSchemaBaseTypes:
          pothosSchemaBaseTypesProvider.export(packageScope),
      },
      outputs: { pothosSchemaOutput: pothosSchemaOutputProvider.export() },
      run({
        pothosConfigValues: { schemaFiles, customScalars, enums, inputTypes },
      }) {
        return {
          providers: {
            pothosSchema: {
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
        paths: POTHOS_POTHOS_GENERATED.paths.provider,
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
        paths,
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
                  requestServiceContextImports.RequestServiceContext.typeFragment(),
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

            const DEFAULT_PLUGINS = {
              pothosFieldWithInputPayloadPlugin: TsCodeUtils.importFragment(
                'pothosFieldWithInputPayloadPlugin',
                paths.fieldWithInputPlugin,
              ),
              pothosStripQueryMutationPlugin: TsCodeUtils.importFragment(
                'pothosStripQueryMutationPlugin',
                paths.stripQueryMutationPlugin,
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

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: POTHOS_POTHOS_GENERATED.templates.builder,
                destination: paths.builder,
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
              tsImportBuilder(['builder']).from(paths.builder),
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
    .readFile('./schema.graphql', 'utf8')
    .catch(() => undefined);
  const newSchema = printSchema(lexicographicSortSchema(schema));
  if (existingSchema !== newSchema) {
    await fs.writeFile('./schema.graphql', newSchema);
  }

  if (process.argv.includes('--exit-after-generate-schema')) {
    // eslint-disable-next-line unicorn/no-process-exit -- we want to exit after the schema is generated
    process.exit(0);
  }
}

if (IS_DEVELOPMENT && process.env.NODE_ENV !== 'test') {
  writeSchemaToFile().catch((err: unknown) => {
    logger.error(err);
  });
}`,
                [
                  tsImportBuilder([
                    'printSchema',
                    'lexicographicSortSchema',
                  ]).from('graphql'),
                  tsImportBuilder().default('fs').from('node:fs/promises'),
                ],
              ),
            );

            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group:
                  POTHOS_POTHOS_GENERATED.templates.fieldWithInputPayloadGroup,
                paths,
                importMapProviders: {
                  tsUtilsImports,
                },
              }),
            );

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  POTHOS_POTHOS_GENERATED.templates.stripQueryMutationPlugin,
                destination: paths.stripQueryMutationPlugin,
              }),
            );

            builder.addPostWriteCommand('pnpm generate:schema', {
              priority: POST_WRITE_COMMAND_PRIORITY.CODEGEN,
              onlyIfChanged: [
                ...schemaFiles,
                'src/plugins/graphql/index.ts',
                paths.builder,
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
