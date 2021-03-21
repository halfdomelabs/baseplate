import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
  writeFormattedAction,
  writeFileAction,
} from '@baseplate/sync';
import * as yup from 'yup';
import { nodeProvider } from '../node';
import { typescriptProvider } from '../typescript';
import { generateConfig } from './generateConfig';

interface EslintDescriptor extends GeneratorDescriptor {
  placeholder: string;
}

const descriptorSchema = {
  placeholder: yup.string(),
};

export type EslintProvider = unknown;

export const eslintProvider = createProviderType<EslintProvider>('eslint');

const EslintGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<EslintDescriptor>(
    descriptorSchema
  ),
  dependsOn: {
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
      '@typescript-eslint/eslint-plugin': '^4.4.1',
      '@typescript-eslint/parser': '^4.9.1',
      eslint: '^7.15.0',
      'eslint-config-airbnb-typescript': '^12.0.0',
      'eslint-config-prettier': '^7.0.0',
      'eslint-import-resolver-typescript': '^2.3.0',
      'eslint-plugin-import': '^2.22.0',
      'eslint-plugin-jest': '^24.1.3',
    });
    node.addScript('lint', 'eslint --ext .ts,.tsx,.js.,.jsx');
    return {
      getProviders: () => ({
        eslint: {},
      }),
      build: (context) => {
        // build eslint configuration
        const config = generateConfig({});
        context.addAction(
          writeFormattedAction({
            destination: '.eslintrc.js',
            contents: `module.exports = ${JSON.stringify(config, null, 2)}`,
          })
        );

        // generate ignore file
        context.addAction(
          writeFileAction({
            destination: '.eslintrcignore',
            contents: ignores.join('\n'),
          })
        );
      },
    };
  },
});

export default EslintGenerator;
