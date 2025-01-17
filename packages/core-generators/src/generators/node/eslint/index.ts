import type { NonOverwriteableMap } from '@halfdomelabs/sync';

import {
  createGenerator,
  createNonOverwriteableMap,
  createProviderType,
  writeFormattedAction,
} from '@halfdomelabs/sync';

import { projectScope } from '@src/providers/scopes.js';

import { nodeProvider } from '../node/index.js';
import { generateConfig } from './generate-config.js';

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

export const eslintGenerator = createGenerator({
  name: 'node/eslint',
  generatorFileUrl: import.meta.url,
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
      },
      exports: {
        eslint: eslintProvider.export(projectScope),
      },
      run({ node }) {
        const configMap = createNonOverwriteableMap<EslintConfig>(
          {
            eslintIgnore: ['/coverage', '/dist', '/lib', '/node_modules'],
            extraTsconfigProjects: [],
          },
          { name: 'eslint-config', mergeArraysUniquely: true },
        );
        return {
          providers: {
            eslint: {
              getConfig: () => configMap,
            },
          },
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
                  'eslint-plugin-jsx-a11y': '6.9.0',
                  'eslint-plugin-react': '7.34.4',
                  'eslint-plugin-react-hooks': '4.6.2',
                }
              : {};

            node.addDevPackages({
              '@typescript-eslint/eslint-plugin': '7.16.1',
              '@typescript-eslint/parser': '7.16.1',
              eslint: '8.57.0',
              ...reactPackages,
              'eslint-config-prettier': '9.1.0',
              'eslint-import-resolver-typescript': '3.6.1',
              'eslint-plugin-import': '2.29.1',
              ...(config.disableVitest
                ? {}
                : {
                    'eslint-plugin-vitest': '0.4.1',
                  }),
            });
            node.addScript('lint', 'eslint --ext .ts,.tsx,.js.,.jsx .');

            const eslintDestination = node.isEsm()
              ? '.eslintrc.cjs'
              : '.eslintrc.js';

            await builder.apply(
              writeFormattedAction({
                destination: eslintDestination,
                contents: `module.exports = ${JSON.stringify(
                  eslintConfig,
                  null,
                  2,
                )}`,
              }),
            );

            // generate ignore file
            builder.writeFile({
              id: 'eslint-ignore',
              filePath: '.eslintignore',
              contents: `${config.eslintIgnore.join('\n')}\n`,
              options: {
                shouldFormat: true,
              },
            });
          },
        };
      },
    });
  },
});
