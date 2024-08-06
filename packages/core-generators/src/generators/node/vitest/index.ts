import {
  createProviderType,
  createGeneratorWithChildren,
  NonOverwriteableMap,
  createNonOverwriteableMap,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { eslintProvider } from '../eslint/index.js';
import { nodeProvider } from '../node/index.js';
import { typescriptProvider } from '../typescript/index.js';
import {
  TypescriptCodeBlock,
  TypescriptCodeUtils,
} from '@src/writers/index.js';

const descriptorSchema = z.object({});

export interface VitestGeneratorConfig {
  customSetupBlocks: TypescriptCodeBlock[];
  setupFiles: string[];
}

export interface VitestProvider {
  getConfig(): NonOverwriteableMap<VitestGeneratorConfig>;
}

export const vitestProvider = createProviderType<VitestProvider>('vitest');

const VitestGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    typescript: typescriptProvider,
    eslint: eslintProvider,
  },
  exports: {
    vitest: vitestProvider,
  },
  createGenerator(descriptor, { node, typescript, eslint }) {
    const configMap = createNonOverwriteableMap<VitestGeneratorConfig>(
      {
        customSetupBlocks: [],
        setupFiles: [],
      },
      { name: 'vitest-config', mergeArraysUniquely: true },
    );

    node.addDevPackages({
      vitest: '2.0.3',
      'vite-tsconfig-paths': '4.3.2',
    });

    eslint.getConfig().appendUnique('eslintIgnore', ['vitest.config.ts']);

    return {
      getProviders: () => ({
        vitest: {
          getConfig: () => configMap,
        },
      }),
      build: async (builder) => {
        const config = configMap.value();

        const customSetupPath = 'src/tests/scripts/globalSetup.ts';
        if (config.customSetupBlocks.length) {
          const customSetupFile = typescript.createTemplate({
            CUSTOM_SETUP: { type: 'code-block' },
          });
          customSetupFile.addCodeEntries({
            CUSTOM_SETUP: config.customSetupBlocks,
          });
          await builder.apply(
            customSetupFile.renderToAction('globalSetup.ts', customSetupPath),
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
          ...(config.customSetupBlocks.length
            ? {
                globalSetup: `./${customSetupPath}`,
              }
            : {}),
          ...(config.setupFiles.length
            ? {
                setupFiles: config.setupFiles,
              }
            : {}),
        };

        const vitestConfig = {
          plugins: TypescriptCodeUtils.mergeExpressionsAsArray(plugins),
          test: TypescriptCodeUtils.createExpression(JSON.stringify(testMap)),
        };

        const vitestConfigFile = typescript.createTemplate({
          VITEST_CONFIG: { type: 'code-expression' },
        });

        vitestConfigFile.addCodeEntries({
          VITEST_CONFIG:
            TypescriptCodeUtils.mergeExpressionsAsObject(vitestConfig),
        });

        await builder.apply(
          vitestConfigFile.renderToAction('vitest.config.ts'),
        );
      },
    };
  },
});

export default VitestGenerator;
