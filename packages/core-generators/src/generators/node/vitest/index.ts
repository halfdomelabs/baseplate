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
import { quot } from '@src/utils/string.js';
import { TypescriptCodeUtils } from '@src/writers/index.js';

const descriptorSchema = z.object({});

export interface VitestGeneratorConfig {
  exclude: string[];
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
        exclude: ['baseplate/**', 'dist/**', 'node_modules/**'],
      },
      { name: 'vitest-config', mergeArraysUniquely: true },
    );

    node.addDevPackages({
      vitest: '1.6.0',
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

        const typescriptOptions = typescript.getCompilerOptions();

        const alias = Object.fromEntries(
          Object.entries(typescriptOptions.paths ?? {}).map(([key, value]) => [
            key.replace('/*', ''),
            value[0].replace('/*', ''),
          ]),
        );

        const vitestConfig = {
          environment: quot('node'),
          clearMocks: 'true',
          include: "['src/**/*.test.{js,ts}']",
          exclude: TypescriptCodeUtils.mergeExpressionsAsArray(
            config.exclude.map((str) => quot(str)),
          ),
          alias: Object.keys(alias ?? {}).length
            ? JSON.stringify(alias)
            : undefined,
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
