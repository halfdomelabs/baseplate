import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  projectScope,
  TsCodeUtils,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@baseplate-dev/sync';
import { mapValuesOfMap } from '@baseplate-dev/utils';
import { z } from 'zod';

import { CORE_APP_MODULE_SETUP_GENERATED } from './generated/index.js';

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
    paths: CORE_APP_MODULE_SETUP_GENERATED.paths.task,
    imports: CORE_APP_MODULE_SETUP_GENERATED.imports.task,
    setupTask,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        appModuleConfigValues: appModuleConfigValuesProvider,
        paths: CORE_APP_MODULE_SETUP_GENERATED.paths.provider,
      },
      run({ typescriptFile, appModuleConfigValues: { moduleFields }, paths }) {
        return {
          build: async (builder) => {
            const moduleFieldsInterface = TsCodeUtils.mergeFragments(
              mapValuesOfMap(
                moduleFields,
                (field, key) => TsCodeUtils.template`${key}?: ${field}[];`,
              ),
            );

            const moduleInitializer = TsCodeUtils.mergeFragmentsAsObject(
              mapValuesOfMap(
                moduleFields,
                (field, key) => `[...(rootModule.${key} ?? [])]`,
              ),
            );

            const moduleMerger = TsCodeUtils.mergeFragments(
              mapValuesOfMap(
                moduleFields,
                (field, key) => `result.${key}.push(...(child.${key} ?? []))`,
              ),
              '\n',
            );

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_APP_MODULE_SETUP_GENERATED.templates.appModules,
                destination: paths.appModules,
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
