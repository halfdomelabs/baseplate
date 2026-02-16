import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';

import type { TsCodeFragment } from '#src/renderers/index.js';

import { CORE_PACKAGES } from '#src/constants/core-packages.js';
import { packageInfoProvider } from '#src/providers/project.js';
import { packageScope } from '#src/providers/scopes.js';
import { TsCodeUtils } from '#src/renderers/index.js';
import { extractPackageVersions } from '#src/utils/extract-packages.js';

import { nodeProvider } from '../node/index.js';
import { typescriptFileProvider } from '../typescript/index.js';
import { NODE_ESLINT_GENERATED } from './generated/index.js';
import { REACT_ESLINT_RULES } from './react-rules.js';
import { TAILWIND_ESLINT_CONFIG } from './tailwind-rules.js';
import { VITEST_ESLINT_RULES } from './vitest-rules.js';

const [setupTask, eslintConfigProvider, eslintConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      react: t.scalar<boolean>(),
      eslintIgnore: t.array<string>([
        'dist',
        'node_modules',
        'build',
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
      enableVitest: t.scalar<boolean>(),
      tsDefaultProjectFiles: t.array<string>(),
      extraConfigs: t.map<string, TsCodeFragment>(),
    }),
    {
      prefix: 'eslint',
      configScope: packageScope,
    },
  );

export { eslintConfigProvider };

export const eslintGenerator = createGenerator({
  name: 'node/eslint',
  generatorFileUrl: import.meta.url,
  buildTasks: () => ({
    paths: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
        packageInfo: packageInfoProvider,
      },
      exports: {
        paths: NODE_ESLINT_GENERATED.paths.provider.export(),
      },
      run: ({ node, packageInfo }) => {
        const packageRoot = packageInfo.getPackageRoot();
        return {
          providers: {
            paths: {
              eslintConfig: `${packageRoot}/${
                node.isEsm ? 'eslint.config.js' : 'eslint.config.mjs'
              }`,
            },
          },
        };
      },
    }),
    setup: setupTask,
    node: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
        eslintConfigValues: eslintConfigValuesProvider,
      },
      run({ node, eslintConfigValues: { react, enableVitest } }) {
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
            'globals',
          ]),
          ...(react
            ? extractPackageVersions(CORE_PACKAGES, [
                'eslint-plugin-jsx-a11y',
                'eslint-plugin-react',
                'eslint-plugin-react-hooks',
                'eslint-plugin-better-tailwindcss',
                'tailwindcss',
              ])
            : {}),
          ...(enableVitest
            ? extractPackageVersions(CORE_PACKAGES, ['@vitest/eslint-plugin'])
            : {}),
        });
        node.scripts.mergeObj({
          lint: 'eslint .',
          'lint:fix': 'eslint . --fix',
        });
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
          enableVitest,
          devDependencies,
          extraConfigs,
        },
        typescriptFile,
        paths,
      }) {
        const defaultProjectFiles = [...tsDefaultProjectFiles];
        return {
          build: async (builder) => {
            // Combine built-in configs with extra configs from other generators
            const allConfigs: Record<string, TsCodeFragment | undefined> = {
              react: react ? REACT_ESLINT_RULES : undefined,
              vitest: enableVitest ? VITEST_ESLINT_RULES : undefined,
              ...Object.fromEntries(extraConfigs),
            };

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
                    allConfigs,
                    '\n\n',
                  ),
                  TPL_GLOBALS: react ? 'browser' : 'node',
                  TPL_TAILWIND_CONFIG: react ? TAILWIND_ESLINT_CONFIG : '',
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
