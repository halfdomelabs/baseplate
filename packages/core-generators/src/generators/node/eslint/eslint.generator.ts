import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';

import { CORE_PACKAGES } from '#src/constants/core-packages.js';
import { projectScope } from '#src/providers/scopes.js';
import { TsCodeUtils } from '#src/renderers/index.js';
import { extractPackageVersions } from '#src/utils/extract-packages.js';

import { nodeProvider } from '../node/node.generator.js';
import { typescriptFileProvider } from '../typescript/typescript.generator.js';
import { NODE_ESLINT_GENERATED } from './generated/index.js';
import { REACT_ESLINT_RULES } from './react-rules.js';
import { VITEST_ESLINT_RULES } from './vitest-rules.js';

const [setupTask, eslintConfigProvider, eslintConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      react: t.scalar<boolean>(),
      eslintIgnore: t.array<string>([
        'dist',
        'node_modules',
        'build',
        'src/generated/graphql.tsx',
        'baseplate',
      ]),
      devDependencies: t.array<string>([
        // allow dev dependencies for test files
        '**/*.test-helper.{js,ts,jsx,tsx}',
        '**/*.test.{js,ts,jsx,tsx}',
        '**/*.bench.{js,ts,jsx,tsx}',
        '**/tests/**/*',
        '**/__mocks__/**/*',
        // allow dev dependencies for config files at root level
        '*.{js,ts,mjs,mts,cjs,cts}',
        '.*.{js,ts,mjs,mts,cjs,cts}',
      ]),
      disableVitest: t.scalar<boolean>(),
      tsDefaultProjectFiles: t.array<string>(),
    }),
    {
      prefix: 'eslint',
      configScope: projectScope,
    },
  );

export { eslintConfigProvider };

export const eslintGenerator = createGenerator({
  name: 'node/eslint',
  generatorFileUrl: import.meta.url,
  buildTasks: () => ({
    paths: NODE_ESLINT_GENERATED.paths.task,
    setup: setupTask,
    node: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
        eslintConfigValues: eslintConfigValuesProvider,
      },
      run({ node, eslintConfigValues: { react, disableVitest } }) {
        node.packages.addDevPackages({
          ...extractPackageVersions(CORE_PACKAGES, [
            '@eslint/js',
            'eslint',
            'eslint-config-prettier',
            'eslint-import-resolver-typescript',
            'eslint-plugin-import-x',
            'eslint-plugin-perfectionist',
            'eslint-plugin-unicorn',
            'typescript-eslint',
          ]),
          ...(react
            ? extractPackageVersions(CORE_PACKAGES, [
                'eslint-plugin-jsx-a11y',
                'eslint-plugin-react',
                'eslint-plugin-react-hooks',
              ])
            : {}),
          ...(disableVitest
            ? {}
            : extractPackageVersions(CORE_PACKAGES, ['@vitest/eslint-plugin'])),
        });
        node.scripts.set('lint', 'eslint .');
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        eslintConfigValues: eslintConfigValuesProvider,
        typescriptFile: typescriptFileProvider,
        paths: NODE_ESLINT_GENERATED.paths.provider,
      },
      run({
        eslintConfigValues: {
          react,
          eslintIgnore,
          tsDefaultProjectFiles,
          disableVitest,
          devDependencies,
        },
        typescriptFile,
        paths,
      }) {
        const defaultProjectFiles = [...tsDefaultProjectFiles];
        if (!disableVitest) {
          defaultProjectFiles.push('vitest.config.ts');
        }
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: NODE_ESLINT_GENERATED.templates.eslintConfig,
                destination: paths.eslintConfig,
                variables: {
                  TPL_DEFAULT_PROJECT_FILES:
                    TsCodeUtils.mergeFragmentsAsArrayPresorted(
                      defaultProjectFiles.map(quot).toSorted(),
                    ),
                  TPL_DEV_DEPENDENCIES:
                    TsCodeUtils.mergeFragmentsAsArrayPresorted(
                      devDependencies.map(quot).toSorted(),
                    ),
                  TPL_IGNORE_FILES: TsCodeUtils.mergeFragmentsAsArrayPresorted(
                    eslintIgnore.map(quot).toSorted(),
                  ),
                  TPL_EXTRA_CONFIGS: TsCodeUtils.mergeFragments(
                    {
                      react: react ? REACT_ESLINT_RULES : undefined,
                      vitest: disableVitest ? undefined : VITEST_ESLINT_RULES,
                    },
                    '\n\n',
                  ),
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
