import type { NonOverwriteableMap } from '@halfdomelabs/sync';

import {
  createGenerator,
  createNonOverwriteableMap,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import type { TypescriptCodeBlock } from '@src/writers/index.js';

import { projectScope } from '@src/providers/scopes.js';
import { TypescriptCodeUtils } from '@src/writers/index.js';

import { eslintProvider } from '../eslint/index.js';
import { nodeProvider } from '../node/index.js';
import { typescriptProvider } from '../typescript/index.js';

const descriptorSchema = z.object({});

export interface VitestGeneratorConfig {
  customSetupBlocks: TypescriptCodeBlock[];
  setupFiles: string[];
}

export interface VitestProvider {
  getConfig(): NonOverwriteableMap<VitestGeneratorConfig>;
}

export const vitestProvider = createProviderType<VitestProvider>('vitest');

export const vitestGenerator = createGenerator({
  name: 'node/vitest',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        typescript: typescriptProvider,
        eslint: eslintProvider,
      },
      exports: {
        vitest: vitestProvider.export(projectScope),
      },
      run({ node, typescript, eslint }) {
        const configMap = createNonOverwriteableMap<VitestGeneratorConfig>(
          {
            customSetupBlocks: [],
            setupFiles: [],
          },
          { name: 'vitest-config', mergeArraysUniquely: true },
        );

        const vitestConfigFilename = node.isEsm()
          ? 'vitest.config.ts'
          : 'vitest.config.mts';

        node.addDevPackages({
          vitest: '3.0.3',
          'vite-tsconfig-paths': '5.1.4',
        });

        eslint.getConfig().appendUnique('eslintIgnore', [vitestConfigFilename]);

        return {
          providers: {
            vitest: {
              getConfig: () => configMap,
            },
          },
          build: async (builder) => {
            const config = configMap.value();

            const customSetupPath = 'src/tests/scripts/globalSetup.ts';
            if (config.customSetupBlocks.length > 0) {
              const customSetupFile = typescript.createTemplate({
                CUSTOM_SETUP: { type: 'code-block' },
              });
              customSetupFile.addCodeEntries({
                CUSTOM_SETUP: config.customSetupBlocks,
              });
              await builder.apply(
                customSetupFile.renderToAction(
                  'globalSetup.ts',
                  customSetupPath,
                ),
              );
            }

            const plugins = [
              TypescriptCodeUtils.createExpression('tsconfigPaths()', [
                "import tsconfigPaths from 'vite-tsconfig-paths'",
              ]),
            ];

            const testMap = {
              clearMocks: true,
              passWithNoTests: true,
              root: './src',
              ...(config.customSetupBlocks.length > 0
                ? {
                    globalSetup: `./${customSetupPath}`,
                  }
                : {}),
              ...(config.setupFiles.length > 0
                ? {
                    setupFiles: config.setupFiles,
                  }
                : {}),
            };

            const vitestConfig = {
              plugins: TypescriptCodeUtils.mergeExpressionsAsArray(plugins),
              test: TypescriptCodeUtils.createExpression(
                JSON.stringify(testMap),
              ),
            };

            const vitestConfigFile = typescript.createTemplate({
              VITEST_CONFIG: { type: 'code-expression' },
            });

            vitestConfigFile.addCodeEntries({
              VITEST_CONFIG:
                TypescriptCodeUtils.mergeExpressionsAsObject(vitestConfig),
            });

            await builder.apply(
              vitestConfigFile.renderToAction(
                'vitest.config.ts',
                vitestConfigFilename,
                {
                  id: 'vitest-config',
                  alternateFullIds: [
                    '@halfdomelabs/core-generators#node/vitest:vitest.config.ts',
                  ],
                },
              ),
            );
          },
        };
      },
    });
  },
});
