import type {
  ImportMapper,
  TsCodeFragment,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';
import type { AnyGeneratorTask } from '@halfdomelabs/sync';
import type { InferFieldMapSchemaFromBuilder } from '@halfdomelabs/utils';

import {
  featureScope,
  projectScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  TypescriptCodeUtils,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createConfigFieldMap,
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import {
  createFieldMapSchemaBuilder,
  mapValuesOfMap,
  quot,
} from '@halfdomelabs/utils';
import { camelCase, kebabCase } from 'change-case';
import { z } from 'zod';

import {
  createRootModuleImports,
  rootModuleImportsProvider,
} from './generated/ts-import-maps.js';
import { CORE_ROOT_MODULE_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

const [setupTask, rootModuleConfigProvider, rootModuleConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      moduleFields: t.map<string, TsCodeFragment>(),
    }),
    {
      prefix: 'root-module',
      configScope: projectScope,
      configValuesScope: projectScope,
    },
  );

export { rootModuleConfigProvider, rootModuleConfigValuesProvider };

export interface RootModuleImport extends ImportMapper {
  getRootModule: () => TypescriptCodeExpression;
  getRootModuleImport: () => string;
}

export const rootModuleImportProvider = createProviderType<RootModuleImport>(
  'root-module-import',
  {
    isReadOnly: true,
  },
);

const appModuleConfigSchema = createFieldMapSchemaBuilder((t) => ({
  moduleFields: t.mapOfMaps<string, string, TsCodeFragment>(),
  moduleImports: t.array<string>(),
}));

export interface AppModuleProvider
  extends InferFieldMapSchemaFromBuilder<typeof appModuleConfigSchema> {
  getModuleFolder(): string;
}

export const appModuleProvider =
  createProviderType<AppModuleProvider>('app-module');

export function createAppModuleTask(
  name: string,
  isRoot?: boolean,
): AnyGeneratorTask {
  return createGeneratorTask({
    dependencies: {
      typescriptFile: typescriptFileProvider,
      rootModuleSetup: rootModuleConfigValuesProvider,
      appModule: isRoot
        ? undefined
        : appModuleProvider.dependency().parentScopeOnly(),
    },
    exports: {
      appModule: appModuleProvider.export(isRoot ? projectScope : featureScope),
    },
    run({ typescriptFile, appModule, rootModuleSetup }) {
      const appModuleConfig = createConfigFieldMap(appModuleConfigSchema);
      const parentFolder = appModule?.getModuleFolder();

      if (!isRoot && !appModule) {
        throw new Error('Parent folder is required for non-root modules');
      }

      const moduleName = `${camelCase(name)}Module`;
      const moduleFolder = isRoot
        ? '@/src/modules'
        : `${parentFolder}/${kebabCase(name)}`;
      const modulePath = `${moduleFolder}/index.ts`;

      if (appModule) {
        appModule.moduleFields.set(
          'children',
          moduleName,
          tsCodeFragment(
            moduleName,
            tsImportBuilder([moduleName]).from(modulePath),
          ),
        );
      }

      return {
        providers: {
          appModule: {
            getModuleFolder: () => moduleFolder,
            ...appModuleConfig,
          },
        },
        build: async (builder) => {
          const appModuleFields = appModuleConfig.getValues();

          const invalidKeys = Object.keys(appModuleFields.moduleFields).filter(
            (key) => !rootModuleSetup.moduleFields.has(key),
          );

          if (invalidKeys.length > 0) {
            throw new Error(`Invalid module fields: ${invalidKeys.join(', ')}`);
          }

          await builder.apply(
            typescriptFile.renderTemplateFile({
              id: `module-${kebabCase(name)}`,
              template: CORE_ROOT_MODULE_TS_TEMPLATES.moduleIndex,
              destination: `${moduleFolder}/index.ts`,
              variables: {
                TPL_IMPORTS: TsCodeUtils.mergeFragmentsPresorted(
                  appModuleFields.moduleImports
                    .map((value) => `import ${quot(value)};`)
                    .toSorted(),
                  '\n',
                ),
                TPL_MODULE_NAME: `${camelCase(name)}Module`,
                TPL_MODULE_CONTENTS: TsCodeUtils.mergeFragmentsAsObject(
                  mapValuesOfMap(appModuleFields.moduleFields, (value) =>
                    TsCodeUtils.mergeFragmentsAsArray(value),
                  ),
                ),
              },
            }),
          );
        },
      };
    },
  });
}

export const rootModuleGenerator = createGenerator({
  name: 'core/root-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  scopes: [featureScope],
  buildTasks: () => ({
    setup: createGeneratorTask(setupTask),
    rootModuleImport: createGeneratorTask({
      exports: {
        rootModuleImport: rootModuleImportProvider.export(projectScope),
        rootModuleImports: rootModuleImportsProvider.export(projectScope),
      },
      run() {
        return {
          providers: {
            rootModuleImport: {
              getRootModule: () =>
                TypescriptCodeUtils.createExpression(
                  'rootModule',
                  "import { rootModule } from '@/src/modules/index.js'",
                ),
              getRootModuleImport: () => `@/src/modules/index.js`,
              getImportMap: () => ({
                '%root-module': {
                  path: '@/src/modules/index.js',
                  allowedImports: ['rootModule'],
                },
              }),
            },
            rootModuleImports: createRootModuleImports('@/src'),
          },
        };
      },
    }),
    appModule: createAppModuleTask('root', true),
    appModuleUtil: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        rootModuleSetup: rootModuleConfigValuesProvider,
      },
      run({ typescriptFile, rootModuleSetup: { moduleFields } }) {
        return {
          build: async (builder) => {
            const moduleFieldsInterface = TsCodeUtils.mergeFragments(
              mapValuesOfMap(
                moduleFields,
                (field, key) => TsCodeUtils.template`${key}?: ${field}[];`,
              ),
            );

            const moduleMerger = TsCodeUtils.mergeFragmentsAsObject(
              mapValuesOfMap(moduleFields, (field, key) =>
                tsCodeFragment(
                  `[...(prev.${key} ?? []), ...(current.${key} ?? [])]`,
                ),
              ),
              { wrapWithParenthesis: true },
            );

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_ROOT_MODULE_TS_TEMPLATES.appModules,
                destination: 'src/modules/app-modules.ts',
                variables: {
                  TPL_MODULE_FIELDS: moduleFieldsInterface,
                  TPL_MODULE_MERGER: moduleMerger,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});

export { rootModuleImportsProvider } from './generated/ts-import-maps.js';
