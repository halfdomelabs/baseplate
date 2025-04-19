import {
  projectScope,
  tsCodeFragment,
  type TsCodeFragment,
  TsCodeUtils,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@halfdomelabs/sync';
import { mapValuesOfMap } from '@halfdomelabs/utils';
import { z } from 'zod';

import {
  appModuleSetupImportsProvider,
  createAppModuleSetupImports,
} from './generated/ts-import-maps.js';
import { CORE_APP_MODULE_SETUP_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

const [setupTask, appModuleConfigProvider, appModuleConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      moduleFields: t.map<string, TsCodeFragment>(),
    }),
    {
      prefix: 'app-module',
      configScope: projectScope,
      configValuesScope: projectScope,
    },
  );

export { appModuleConfigProvider, appModuleConfigValuesProvider };

/**
 * Creates the helper utilities for app modules as well as allows setting up
 * the fields of app modules.
 */
export const appModuleSetupGenerator = createGenerator({
  name: 'core/app-module-setup',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    setupTask,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        appModuleConfigValues: appModuleConfigValuesProvider,
      },
      exports: {
        appModuleSetupImports:
          appModuleSetupImportsProvider.export(projectScope),
      },
      run({ typescriptFile, appModuleConfigValues: { moduleFields } }) {
        return {
          providers: {
            appModuleSetupImports: createAppModuleSetupImports('@/src/utils'),
          },
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
                template: CORE_APP_MODULE_SETUP_TS_TEMPLATES.appModules,
                destination: 'src/utils/app-modules.ts',
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
