import {
  createProviderType,
  writeFormattedAction,
  createGeneratorWithChildren,
  NonOverwriteableMap,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import { nodeProvider } from '../node';
import { typescriptProvider } from '../typescript';
import { generateConfig } from './generateConfig';

interface EslintConfig {
  react?: boolean;
  eslintIgnore: string[];
}

export interface EslintProvider {
  getConfig(): NonOverwriteableMap<EslintConfig>;
}

export const eslintProvider = createProviderType<EslintProvider>('eslint');

const EslintGenerator = createGeneratorWithChildren({
  dependencies: {
    node: nodeProvider,
    typescript: typescriptProvider,
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
      },
      { name: 'eslint-config' }
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
        const eslintConfig = generateConfig({});

        const airbnbPackage: Record<string, string> = config.react
          ? {
              'eslint-config-airbnb': '^19.0.4',
              'eslint-plugin-jsx-a11y': '^6.5.1',
              'eslint-plugin-react': '^7.28.0',
              'eslint-plugin-react-hooks': '^4.3.0',
            }
          : { 'eslint-config-airbnb-base': '^15.0.0' };

        node.addDevPackages({
          '@typescript-eslint/eslint-plugin': '^5.9.0',
          '@typescript-eslint/parser': '^5.9.0',
          eslint: '^8.6.0',
          ...airbnbPackage,
          'eslint-config-airbnb-typescript': '^16.1.0',
          'eslint-config-prettier': '^8.3.0',
          'eslint-import-resolver-typescript': '^2.5.0',
          'eslint-plugin-import': '^2.25.4',
          'eslint-plugin-jest': '^25.3.4',
        });
        node.addScript('lint', 'eslint --ext .ts,.tsx,.js.,.jsx');

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
          '.eslintrcignore',
          `${config.eslintIgnore.join('\n')}\n`
        );
      },
    };
  },
});

export default EslintGenerator;
