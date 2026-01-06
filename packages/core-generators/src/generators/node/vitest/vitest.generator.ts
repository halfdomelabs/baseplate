import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { CORE_PACKAGES } from '#src/constants/index.js';
import { packageScope } from '#src/providers/scopes.js';
import {
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
} from '#src/renderers/index.js';
import { extractPackageVersions } from '#src/utils/extract-packages.js';

import { eslintConfigProvider } from '../eslint/index.js';
import { createNodePackagesTask, createNodeTask } from '../node/index.js';
import { NODE_VITEST_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  includeTestHelpers: z.boolean().default(true),
});

const [setupTask, vitestConfigProvider, vitestConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      globalSetupFiles: t.array<string>(),
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
  buildTasks: ({ includeTestHelpers }) => ({
    paths: NODE_VITEST_GENERATED.paths.task,
    renderers: NODE_VITEST_GENERATED.renderers.task,
    nodePackages: createNodePackagesTask({
      dev: extractPackageVersions(CORE_PACKAGES, [
        'vitest',
        'vite',
        'vite-tsconfig-paths',
      ]),
    }),
    setup: setupTask,
    node: createNodeTask((node) => {
      node.scripts.mergeObj({
        test: 'vitest run',
      });
    }),
    main: createGeneratorTask({
      dependencies: {
        renderers: NODE_VITEST_GENERATED.renderers.provider,
        eslintConfig: eslintConfigProvider,
        vitestConfigValues: vitestConfigValuesProvider,
      },
      run({
        eslintConfig,
        vitestConfigValues: { globalSetupFiles, setupFiles },
        renderers,
      }) {
        eslintConfig.enableVitest.set(true);

        return {
          build: async (builder) => {
            const configValues = TsCodeUtils.mergeFragmentsAsObject({
              clearMocks: 'true',
              passWithNoTests: 'true',
              root: quot('./src'),
              globalSetup:
                globalSetupFiles.length > 0
                  ? JSON.stringify(globalSetupFiles.toSorted())
                  : undefined,
              setupFiles:
                setupFiles.length > 0
                  ? JSON.stringify(setupFiles.toSorted())
                  : undefined,
              maxWorkers: '1',
              env: tsCodeFragment(
                "loadEnv('development', process.cwd(), '')",
                tsImportBuilder(['loadEnv']).from('vite'),
              ),
            });

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
                    test: configValues,
                  }),
                },
              }),
            );
            if (includeTestHelpers) {
              await builder.apply(renderers.testHelpersGroup.render({}));
            }
          },
        };
      },
    }),
  }),
});
