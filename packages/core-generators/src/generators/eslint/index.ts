import {
  createProviderType,
  writeFormattedAction,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import { nodeProvider } from '../node';
import { typescriptProvider } from '../typescript';
import { generateConfig } from './generateConfig';

export type EslintProvider = unknown;

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
    const ignores = [
      '/coverage',
      '/dist',
      '/lib',
      '/node_modules',
      '.eslintrc.js',
    ];

    node.addDevPackages({
      '@typescript-eslint/eslint-plugin': '^5.9.0',
      '@typescript-eslint/parser': '^5.9.0',
      eslint: '^8.6.0',
      'eslint-config-airbnb-base': '^15.0.0',
      'eslint-config-airbnb-typescript': '^16.1.0',
      'eslint-config-prettier': '^8.3.0',
      'eslint-import-resolver-typescript': '^2.5.0',
      'eslint-plugin-import': '^2.25.4',
      'eslint-plugin-jest': '^25.3.4',
    });
    node.addScript('lint', 'eslint --ext .ts,.tsx,.js.,.jsx');
    return {
      getProviders: () => ({
        eslint: {},
      }),
      build: async (builder) => {
        // build eslint configuration
        const config = generateConfig({});
        await builder.apply(
          writeFormattedAction({
            destination: '.eslintrc.js',
            contents: `module.exports = ${JSON.stringify(config, null, 2)}`,
          })
        );

        // generate ignore file
        builder.writeFile('.eslintrcignore', `${ignores.join('\n')}\n`);
      },
    };
  },
});

export default EslintGenerator;
