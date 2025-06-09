import type { TsCodeFragment } from '@baseplate-dev/core-generators';
import type { InferFieldMapSchemaFromBuilder } from '@baseplate-dev/utils';

import {
  featureScope,
  pathRootsProvider,
  projectScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createConfigFieldMap,
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import {
  createFieldMapSchemaBuilder,
  mapValuesOfMap,
  quot,
} from '@baseplate-dev/utils';
import { camelCase, kebabCase } from 'change-case';
import { z } from 'zod';

import { appModuleConfigValuesProvider } from '../app-module-setup/app-module-setup.generator.js';
import { appModuleSetupImportsProvider } from '../app-module-setup/generated/ts-import-maps.js';
import { CORE_APP_MODULE_TS_TEMPLATES } from './generated/ts-templates.js';

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

export interface AppModuleImportsProvider {
  getModuleFragment(): TsCodeFragment;
  getModulePath(): string;
}

export const appModuleImportsProvider =
  createProviderType<AppModuleImportsProvider>('app-module-imports');

const descriptorSchema = z.object({
  /**
   * The unique identifier for the module.
   */
  id: z.string().min(1),
  /**
   * The name of the module.
   */
  name: z.string().min(1),
  /**
   * Whether the module is the root module.
   */
  isRoot: z.boolean().optional(),
});

export const appModuleGenerator = createGenerator({
  name: 'core/app-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  scopes: [featureScope],
  getInstanceName: (descriptor) => descriptor.name,
  buildTasks: ({ id, name, isRoot }) => ({
    main: createGeneratorTask({
      dependencies: {
        pathRoots: pathRootsProvider,
        typescriptFile: typescriptFileProvider,
        appModuleConfigValues: appModuleConfigValuesProvider,
        appModuleSetupImports: appModuleSetupImportsProvider,
        appModule: isRoot
          ? undefined
          : appModuleProvider.dependency().parentScopeOnly(),
      },
      exports: {
        appModule: appModuleProvider.export(
          isRoot ? projectScope : featureScope,
        ),
        appModuleImports: appModuleImportsProvider.export(
          isRoot ? projectScope : featureScope,
        ),
      },
      run({
        typescriptFile,
        appModule,
        appModuleConfigValues,
        appModuleSetupImports,
        pathRoots,
      }) {
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

        pathRoots.registerPathRoot('module-root', moduleFolder);

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
            appModuleImports: {
              getModuleFragment: () =>
                TsCodeUtils.importFragment(
                  moduleName,
                  `${moduleFolder}/index.ts`,
                ),
              getModulePath: () => `${moduleFolder}/index.ts`,
            },
          },
          build: async (builder) => {
            const appModuleFields = appModuleConfig.getValues();

            const invalidKeys = Object.keys(
              appModuleFields.moduleFields,
            ).filter((key) => !appModuleConfigValues.moduleFields.has(key));

            if (invalidKeys.length > 0) {
              throw new Error(
                `Invalid module fields: ${invalidKeys.join(', ')}`,
              );
            }

            await builder.apply(
              typescriptFile.renderTemplateFile({
                id: `module-${id}`,
                template: CORE_APP_MODULE_TS_TEMPLATES.index,
                destination: `${moduleFolder}/index.ts`,
                importMapProviders: {
                  appModuleSetupImports,
                },
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
    }),
  }),
});
