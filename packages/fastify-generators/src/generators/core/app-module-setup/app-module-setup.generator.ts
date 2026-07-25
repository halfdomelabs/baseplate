import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  packageScope,
  TsCodeUtils,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { mapValuesOfMap } from '@baseplate-dev/utils';
import { z } from 'zod';

import { appRuntimeImportsProvider } from '../app-runtime/index.js';
import { CORE_APP_MODULE_SETUP_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Declares the fields available on `AppModule`. The value is the field's
 * element TYPE, which may be left `undefined` here and bound later via
 * {@link appModuleFieldTypesProvider}.
 *
 * The split exists because a field's type often lives inside the very feature
 * module that contributes to it (e.g. `storageCategories`'s `FileCategory`
 * lives in the storage module). Resolving that file's path requires
 * `appModuleProvider`, which itself waits on these config values to seal - so
 * registering the type here directly would deadlock. Declaring the field name
 * needs no path, and only this generator's `main` (which nothing depends on)
 * consumes the types.
 */
const [setupTask, appModuleConfigProvider, appModuleConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      moduleFields: t.map<string, TsCodeFragment | undefined>(),
    }),
    {
      prefix: 'app-module',
      configScope: packageScope,
      configValuesScope: packageScope,
    },
  );

export { appModuleConfigProvider, appModuleConfigValuesProvider };

/**
 * Binds the element type for a module field declared with an `undefined` type
 * via `appModuleConfigProvider.moduleFields`.
 */
export interface AppModuleFieldTypesProvider {
  /**
   * Binds a module field's element type.
   *
   * @param fieldName - The field declared on `appModuleConfigProvider.moduleFields`.
   * @param type - The field's element type.
   */
  setFieldType(fieldName: string, type: TsCodeFragment): void;
}

export const appModuleFieldTypesProvider =
  createProviderType<AppModuleFieldTypesProvider>('app-module-field-types');

/**
 * Creates the helper utilities for app modules as well as allows setting up
 * the fields of app modules.
 */
export const appModuleSetupGenerator = createGenerator({
  name: 'core/app-module-setup',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: CORE_APP_MODULE_SETUP_GENERATED.paths.task,
    imports: CORE_APP_MODULE_SETUP_GENERATED.imports.task,
    setupTask,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        appModuleConfigValues: appModuleConfigValuesProvider,
        appRuntimeImports: appRuntimeImportsProvider,
        paths: CORE_APP_MODULE_SETUP_GENERATED.paths.provider,
      },
      exports: {
        appModuleFieldTypes: appModuleFieldTypesProvider.export(packageScope),
      },
      run({
        typescriptFile,
        appModuleConfigValues: { moduleFields },
        appRuntimeImports,
        paths,
      }) {
        const lateBoundFieldTypes = new Map<string, TsCodeFragment>();
        return {
          providers: {
            appModuleFieldTypes: {
              setFieldType(fieldName, type) {
                if (!moduleFields.has(fieldName)) {
                  throw new Error(
                    `Cannot bind a type for undeclared module field "${fieldName}". Declare it with appModuleConfigProvider.moduleFields first.`,
                  );
                }
                lateBoundFieldTypes.set(fieldName, type);
              },
            },
          },
          build: async (builder) => {
            const resolvedFieldTypes = new Map<string, TsCodeFragment>();
            const unboundFields: string[] = [];
            for (const [key, field] of moduleFields) {
              const type = field ?? lateBoundFieldTypes.get(key);
              if (type) {
                resolvedFieldTypes.set(key, type);
              } else {
                unboundFields.push(key);
              }
            }

            if (unboundFields.length > 0) {
              throw new Error(
                `Module fields declared without a type and never bound via appModuleFieldTypesProvider: ${unboundFields.join(', ')}`,
              );
            }

            const moduleFieldsInterface = TsCodeUtils.mergeFragments(
              mapValuesOfMap(
                resolvedFieldTypes,
                (field, key) => TsCodeUtils.template`${key}?: ${field}[];`,
              ),
            );

            const moduleInitializer = TsCodeUtils.mergeFragmentsAsObject(
              mapValuesOfMap(
                moduleFields,
                (_field, key) => `[...(rootModule.${key} ?? [])]`,
              ),
            );

            const moduleMerger = TsCodeUtils.mergeFragments(
              mapValuesOfMap(
                moduleFields,
                (_field, key) => `result.${key}.push(...(child.${key} ?? []))`,
              ),
              '\n',
            );

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_APP_MODULE_SETUP_GENERATED.templates.appModules,
                destination: paths.appModules,
                importMapProviders: {
                  appRuntimeImports,
                },
                variables: {
                  TPL_MODULE_FIELDS: moduleFieldsInterface,
                  TPL_MODULE_INITIALIZER: moduleInitializer,
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
