import type { NonOverwriteableMap } from '@halfdomelabs/sync';

import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
  createProviderType,
} from '@halfdomelabs/sync';

import { CORE_PACKAGES } from '@src/constants/core-packages.js';
import { projectScope } from '@src/providers/scopes.js';

import { nodeProvider } from '../node/node.generator.js';
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
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
      },
      exports: {
        eslint: eslintProvider.export(projectScope),
      },
      run({ node }, { taskId }) {
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
          build: (builder) => {
            // build eslint configuration
            const config = configMap.value();
            const eslintConfig = generateConfig({
              react: config.react,
              extraTsconfigProjects: config.extraTsconfigProjects,
              disableVitest: config.disableVitest,
            });

            const reactPackages: Record<string, string> = config.react
              ? {
                  'eslint-plugin-jsx-a11y':
                    CORE_PACKAGES['eslint-plugin-jsx-a11y'],
                  'eslint-plugin-react': CORE_PACKAGES['eslint-plugin-react'],
                  'eslint-plugin-react-hooks':
                    CORE_PACKAGES['eslint-plugin-react-hooks'],
                }
              : {};

            node.packages.addDevPackages({
              '@typescript-eslint/eslint-plugin':
                CORE_PACKAGES['@typescript-eslint/eslint-plugin'],
              '@typescript-eslint/parser':
                CORE_PACKAGES['@typescript-eslint/parser'],
              eslint: CORE_PACKAGES.eslint,
              ...reactPackages,
              'eslint-config-prettier': CORE_PACKAGES['eslint-config-prettier'],
              'eslint-import-resolver-typescript':
                CORE_PACKAGES['eslint-import-resolver-typescript'],
              'eslint-plugin-import': CORE_PACKAGES['eslint-plugin-import'],
              ...(config.disableVitest
                ? {}
                : {
                    'eslint-plugin-vitest':
                      CORE_PACKAGES['eslint-plugin-vitest'],
                  }),
            });
            node.scripts.set(
              'lint',
              'eslint --ext .ts,.tsx,.js.,.jsx .',
              taskId,
            );

            const eslintDestination = node.isEsm
              ? '.eslintrc.cjs'
              : '.eslintrc.js';

            builder.writeFile({
              id: 'eslint-config',
              destination: eslintDestination,
              contents: `module.exports = ${JSON.stringify(
                eslintConfig,
                null,
                2,
              )}`,
            });

            // generate ignore file
            builder.writeFile({
              id: 'eslint-ignore',
              destination: '.eslintignore',
              contents: `${config.eslintIgnore.join('\n')}\n`,
            });
          },
        };
      },
    }),
  }),
});
