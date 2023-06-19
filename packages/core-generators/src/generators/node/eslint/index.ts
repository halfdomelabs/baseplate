import {
  createProviderType,
  writeFormattedAction,
  createGeneratorWithChildren,
  NonOverwriteableMap,
  createNonOverwriteableMap,
} from '@halfdomelabs/sync';
import { nodeProvider } from '../node/index.js';
import { generateConfig } from './generateConfig.js';

interface EslintConfig {
  react?: boolean;
  eslintIgnore: string[];
  extraTsconfigProjects: string[];
  disableJest?: boolean;
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
        eslintIgnore: [
          '/coverage',
          '/dist',
          '/lib',
          '/node_modules',
          '.eslintrc.js',
        ],
        extraTsconfigProjects: [],
      },
      { name: 'eslint-config', mergeArraysUniquely: true }
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
          disableJest: config.disableJest,
        });

        const airbnbPackage: Record<string, string> = config.react
          ? {
              'eslint-config-airbnb': '19.0.4',
              'eslint-plugin-jsx-a11y': '6.7.1',
              'eslint-plugin-react': '7.32.2',
              'eslint-plugin-react-hooks': '4.6.0',
            }
          : { 'eslint-config-airbnb-base': '15.0.0' };

        node.addDevPackages({
          '@typescript-eslint/eslint-plugin': '5.54.0',
          '@typescript-eslint/parser': '5.54.0',
          eslint: '8.35.0',
          ...airbnbPackage,
          'eslint-config-airbnb-typescript': '17.0.0',
          'eslint-config-prettier': '8.6.0',
          'eslint-import-resolver-typescript': '3.4.2',
          'eslint-plugin-import': '2.27.5',
          ...(config.disableJest
            ? {}
            : {
                'eslint-plugin-jest': '27.2.1',
              }),
        });
        node.addScript('lint', 'eslint --ext .ts,.tsx,.js.,.jsx .');

        await builder.apply(
          writeFormattedAction({
            destination: '.eslintrc.js',
            contents: `module.exports = ${JSON.stringify(
              eslintConfig,
              null,
              2
            )}`,
          })
        );

        // generate ignore file
        builder.writeFile(
          '.eslintignore',
          `${config.eslintIgnore.join('\n')}\n`
        );
      },
    };
  },
});

export default EslintGenerator;
