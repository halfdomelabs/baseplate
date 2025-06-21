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
import { createNodePackagesTask, nodeProvider } from '../node/index.js';
import { typescriptFileProvider } from '../typescript/index.js';

const descriptorSchema = z.object({});

import { stringifyPrettyStable } from '@baseplate-dev/utils';

import type { TsCodeFragment } from '#src/renderers/index.js';

import { packageInfoProvider } from '#src/providers/project.js';
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
    paths: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
        packageInfo: packageInfoProvider,
      },
      exports: {
        paths: NODE_VITEST_GENERATED.paths.provider.export(),
      },
      run: ({ node, packageInfo }) => {
        const srcRoot = packageInfo.getPackageSrcPath();
        const packageRoot = packageInfo.getPackageRoot();

        return {
          providers: {
            paths: {
              globalSetup: `${srcRoot}/tests/scripts/global-setup.ts`,
              vitestConfig: `${packageRoot}/${
                node.isEsm ? 'vitest.config.ts' : 'vitest.config.mts'
              }`,
            },
          },
        };
      },
    }),
    nodePackages: createNodePackagesTask({
      dev: extractPackageVersions(CORE_PACKAGES, [
        'vitest',
        'vite-tsconfig-paths',
      ]),
    }),
    setup: setupTask,
    main: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
        typescriptFile: typescriptFileProvider,
        eslintConfig: eslintConfigProvider,
        vitestConfigValues: vitestConfigValuesProvider,
        paths: NODE_VITEST_GENERATED.paths.provider,
      },
      run({
        node,
        typescriptFile,
        eslintConfig,
        vitestConfigValues: { globalSetupOperations, setupFiles },
        paths,
      }) {
        const vitestConfigFilename = node.isEsm
          ? 'vitest.config.ts'
          : 'vitest.config.mts';

        eslintConfig.tsDefaultProjectFiles.push(vitestConfigFilename);

        return {
          build: async (builder) => {
            const hasGlobalSetup = globalSetupOperations.size > 0;
            if (hasGlobalSetup) {
              await builder.apply(
                typescriptFile.renderTemplateFile({
                  template: NODE_VITEST_GENERATED.templates.globalSetup,
                  destination: paths.globalSetup,
                  variables: {
                    TPL_OPERATIONS: TsCodeUtils.mergeFragments(
                      globalSetupOperations,
                    ),
                  },
                  writeOptions: {
                    alternateFullIds: [
                      '@baseplate-dev/core-generators#node/vitest:src/tests/scripts/globalSetup.ts',
                    ],
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
            };

            const plugins = TsCodeUtils.mergeFragmentsAsArray({
              tsconfigPaths: tsCodeFragment('tsconfigPaths()', [
                tsImportBuilder()
                  .default('tsconfigPaths')
                  .from('vite-tsconfig-paths'),
              ]),
            });

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: NODE_VITEST_GENERATED.templates.vitestConfig,
                destination: vitestConfigFilename,
                variables: {
                  TPL_CONFIG: TsCodeUtils.mergeFragmentsAsObject({
                    plugins,
                    test: stringifyPrettyStable(configValues),
                  }),
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
