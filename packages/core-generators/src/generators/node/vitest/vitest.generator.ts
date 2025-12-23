import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { CORE_PACKAGES } from '#src/constants/index.js';
import { packageScope } from '#src/providers/scopes.js';
import { extractPackageVersions } from '#src/utils/extract-packages.js';

import { eslintConfigProvider } from '../eslint/index.js';
import { createNodePackagesTask } from '../node/index.js';

const descriptorSchema = z.object({});

import { stringifyPrettyStable } from '@baseplate-dev/utils';

import type { TsCodeFragment } from '#src/renderers/index.js';

import {
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
} from '#src/renderers/index.js';

import { NODE_VITEST_GENERATED } from './generated/index.js';

const [setupTask, vitestConfigProvider, vitestConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      globalSetupOperations: t.map<string, TsCodeFragment>(),
      setupFiles: t.array<string>(),
    }),
    {
      prefix: 'vitest',
      configScope: packageScope,
    },
  );

export { vitestConfigProvider };

export const vitestGenerator = createGenerator({
  name: 'node/vitest',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: NODE_VITEST_GENERATED.paths.task,
    renderers: NODE_VITEST_GENERATED.renderers.task,
    nodePackages: createNodePackagesTask({
      dev: extractPackageVersions(CORE_PACKAGES, [
        'vitest',
        'vite-tsconfig-paths',
      ]),
    }),
    setup: setupTask,
    main: createGeneratorTask({
      dependencies: {
        renderers: NODE_VITEST_GENERATED.renderers.provider,
        eslintConfig: eslintConfigProvider,
        vitestConfigValues: vitestConfigValuesProvider,
        paths: NODE_VITEST_GENERATED.paths.provider,
      },
      run({
        eslintConfig,
        vitestConfigValues: { globalSetupOperations, setupFiles },
        paths,
        renderers,
      }) {
        const vitestConfigFilename = 'vitest.config.ts';

        eslintConfig.tsDefaultProjectFiles.push(vitestConfigFilename);

        return {
          build: async (builder) => {
            const hasGlobalSetup = globalSetupOperations.size > 0;
            if (hasGlobalSetup) {
              await builder.apply(
                renderers.globalSetup.render({
                  variables: {
                    TPL_OPERATIONS: TsCodeUtils.mergeFragments(
                      globalSetupOperations,
                    ),
                  },
                }),
              );
            }

            const configValues = {
              clearMocks: true,
              passWithNoTests: true,
              root: './src',
              globalSetup: hasGlobalSetup
                ? `./${paths.globalSetup.replace('@/src/', '')}`
                : undefined,
              setupFiles:
                setupFiles.length > 0 ? setupFiles.toSorted() : undefined,
              maxWorkers: 1,
            };

            const plugins = TsCodeUtils.mergeFragmentsAsArray({
              tsconfigPaths: tsCodeFragment('tsconfigPaths()', [
                tsImportBuilder()
                  .default('tsconfigPaths')
                  .from('vite-tsconfig-paths'),
              ]),
            });

            await builder.apply(
              renderers.vitestConfig.render({
                variables: {
                  TPL_CONFIG: TsCodeUtils.mergeFragmentsAsObject({
                    plugins,
                    test: stringifyPrettyStable(configValues),
                  }),
                },
              }),
            );
            await builder.apply(renderers.testHelpersGroup.render({}));
          },
        };
      },
    }),
  }),
});
