import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { CORE_PACKAGES } from '#src/constants/index.js';
import { projectScope } from '#src/providers/scopes.js';
import { extractPackageVersions } from '#src/utils/extract-packages.js';

import { eslintConfigProvider } from '../eslint/eslint.generator.js';
import {
  createNodePackagesTask,
  nodeProvider,
} from '../node/node.generator.js';
import { typescriptFileProvider } from '../typescript/typescript.generator.js';

const descriptorSchema = z.object({});

import { stringifyPrettyStable } from '@halfdomelabs/utils';

import {
  tsCodeFragment,
  type TsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
} from '#src/renderers/index.js';

import { NODE_VITEST_TS_TEMPLATES } from './generated/ts-templates.js';

const [setupTask, vitestConfigProvider, vitestConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      globalSetupOperations: t.map<string, TsCodeFragment>(),
      setupFiles: t.array<string>(),
    }),
    {
      prefix: 'vitest',
      configScope: projectScope,
    },
  );

export { vitestConfigProvider };

export const vitestGenerator = createGenerator({
  name: 'node/vitest',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
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
      },
      run({
        node,
        typescriptFile,
        eslintConfig,
        vitestConfigValues: { globalSetupOperations, setupFiles },
      }) {
        const vitestConfigFilename = node.isEsm
          ? 'vitest.config.ts'
          : 'vitest.config.mts';

        eslintConfig.tsDefaultProjectFiles.push(vitestConfigFilename);

        const globalSetupPath = 'tests/scripts/global-setup.ts';

        return {
          build: async (builder) => {
            const hasGlobalSetup = globalSetupOperations.size > 0;
            if (hasGlobalSetup) {
              await builder.apply(
                typescriptFile.renderTemplateFile({
                  template: NODE_VITEST_TS_TEMPLATES.globalSetup,
                  destination: `src/${globalSetupPath}`,
                  variables: {
                    TPL_OPERATIONS: TsCodeUtils.mergeFragments(
                      globalSetupOperations,
                    ),
                  },
                  writeOptions: {
                    alternateFullIds: [
                      '@halfdomelabs/core-generators#node/vitest:src/tests/scripts/globalSetup.ts',
                    ],
                  },
                }),
              );
            }

            const configValues = {
              clearMocks: true,
              passWithNoTests: true,
              root: './src',
              globalSetup: hasGlobalSetup ? `./${globalSetupPath}` : undefined,
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
                template: NODE_VITEST_TS_TEMPLATES.vitestConfig,
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
