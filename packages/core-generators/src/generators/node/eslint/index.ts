import {
  createProviderType,
  writeFormattedAction,
  createGeneratorWithChildren,
  NonOverwriteableMap,
  createNonOverwriteableMap,
} from '@halfdomelabs/sync';

import { generateConfig } from './generateConfig.js';
import { nodeProvider } from '../node/index.js';

interface EslintConfig {
  react?: boolean;
  eslintIgnore: string[];
  extraTsconfigProjects: string[];
  disableVitest?: boolean;
}

export interface EslintProvider {
  getConfig(): NonOverwriteableMap<EslintConfig>;
}

export const eslintProvider = createProviderType<EslintProvider>('eslint');

const EslintGenerator = createGeneratorWithChildren({
  dependencies: {
    node: nodeProvider,
  },
  exports: {
    eslint: eslintProvider,
  },
  createGenerator(descriptor, { node }) {
    const configMap = createNonOverwriteableMap<EslintConfig>(
      {
        eslintIgnore: ['/coverage', '/dist', '/lib', '/node_modules'],
        extraTsconfigProjects: [],
      },
      { name: 'eslint-config', mergeArraysUniquely: true },
    );
    return {
      getProviders: () => ({
        eslint: {
          getConfig: () => configMap,
        },
      }),
      build: async (builder) => {
        // build eslint configuration
        const config = configMap.value();
        const eslintConfig = generateConfig({
          react: config.react,
          extraTsconfigProjects: config.extraTsconfigProjects,
          disableVitest: config.disableVitest,
        });

        const reactPackages: Record<string, string> = config.react
          ? {
              'eslint-plugin-jsx-a11y': '6.7.1',
              'eslint-plugin-react': '7.33.2',
              'eslint-plugin-react-hooks': '4.6.0',
            }
          : {};

        node.addDevPackages({
          '@typescript-eslint/eslint-plugin': '6.11.0',
          '@typescript-eslint/parser': '6.11.0',
          eslint: '8.53.0',
          ...reactPackages,
          'eslint-config-prettier': '9.0.0',
          'eslint-import-resolver-typescript': '3.6.1',
          'eslint-plugin-import': '2.29.0',
          ...(config.disableVitest
            ? {}
            : {
                'eslint-plugin-vitest': '0.5.4',
                'eslint-plugin-vitest-globals': '1.5.0',
              }),
        });
        node.addScript('lint', 'eslint --ext .ts,.tsx,.js.,.jsx .');

        await builder.apply(
          writeFormattedAction({
            destination: config.react ? '.eslintrc.cjs' : '.eslintrc.js',
            contents: `module.exports = ${JSON.stringify(
              eslintConfig,
              null,
              2,
            )}`,
          }),
        );

        // generate ignore file
        builder.writeFile(
          '.eslintignore',
          `${config.eslintIgnore.join('\n')}\n`,
        );
      },
    };
  },
});

export default EslintGenerator;
