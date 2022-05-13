import {
  createProviderType,
  createGeneratorWithChildren,
  NonOverwriteableMap,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import * as yup from 'yup';
import { quot } from '@src/utils/string';
import { TypescriptCodeBlock, TypescriptCodeUtils } from '@src/writers';
import { eslintProvider } from '../eslint';
import { nodeProvider } from '../node';
import { typescriptProvider } from '../typescript';

const descriptorSchema = yup.object({});

export interface JestGeneratorConfig {
  testPathIgnorePatterns: string[];
  customSetupBlocks: TypescriptCodeBlock[];
}

export interface JestProvider {
  getConfig(): NonOverwriteableMap<JestGeneratorConfig>;
}

export const jestProvider = createProviderType<JestProvider>('jest');

const JestGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    typescript: typescriptProvider,
    eslint: eslintProvider,
  },
  exports: {
    jest: jestProvider,
  },
  createGenerator(descriptor, { node, typescript, eslint }) {
    const configMap = createNonOverwriteableMap<JestGeneratorConfig>(
      {
        testPathIgnorePatterns: [
          '<rootDir>/baseplate/',
          '<rootDir>/dist/',
          '<rootDir>/node_modules/',
        ],
        customSetupBlocks: [],
      },
      { name: 'jest-config', mergeArraysUniquely: true }
    );

    node.addDevPackages({
      jest: '^28.1.0',
      'ts-jest': '^28.0.2',
      '@types/jest': '^27.5.1',
    });

    eslint.getConfig().appendUnique('eslintIgnore', ['jest.config.ts']);

    return {
      getProviders: () => ({
        jest: {
          getConfig: () => configMap,
        },
      }),
      build: async (builder) => {
        const config = configMap.value();

        // TODO: Use base path from typescript module
        const moduleNameMapper = TypescriptCodeUtils.createExpression(
          "pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>'})",
          [
            "import { pathsToModuleNameMapper } from 'ts-jest'",
            "import { compilerOptions } from './tsconfig.json'",
          ]
        );

        const customSetupPath = 'src/tests/scripts/setup.ts';
        if (config.customSetupBlocks.length) {
          const customSetupFile = typescript.createTemplate({
            CUSTOM_SETUP: { type: 'code-block' },
          });
          customSetupFile.addCodeEntries({
            CUSTOM_SETUP: config.customSetupBlocks,
          });
          await builder.apply(
            customSetupFile.renderToAction('setup.ts', customSetupPath)
          );
        }

        const jestConfig = {
          preset: quot('ts-jest'),
          testEnvironment: quot('node'),
          clearMocks: 'true',
          moduleNameMapper,
          ...(config.customSetupBlocks.length
            ? {
                globalSetup: quot(`./${customSetupPath}`),
              }
            : {}),
          testPathIgnorePatterns: TypescriptCodeUtils.mergeExpressionsAsArray(
            config.testPathIgnorePatterns.map((str) => quot(str))
          ),
        };

        const jestConfigFile = typescript.createTemplate({
          JEST_CONFIG: { type: 'code-expression' },
        });
        jestConfigFile.addCodeEntries({
          JEST_CONFIG: TypescriptCodeUtils.mergeExpressionsAsObject(jestConfig),
        });
        await builder.apply(jestConfigFile.renderToAction('jest.config.ts'));
      },
    };
  },
});

export default JestGenerator;
